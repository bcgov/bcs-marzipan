import { ErrorBoundary } from 'react-error-boundary';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useCallback, useEffect, useRef, useState } from 'react';

import { PERMISSIONS, SYSTEM_ROLES } from '@corpcal/shared/auth';
import {
  type ActivityFormData,
  type ActivityResponse,
  type UpdateActivityRequest,
} from '@corpcal/shared/schemas';
import {
  ActivityFormBody,
  ActivityPageHeader,
  ActivityStatusBanner,
} from '@/components/activity';
import ActivityHistory from '@/components/activity/activities/ActivityHistory';
import { DeleteActivityModal } from '@/components/activity/activities/DeleteActivityModal';
import { EditActivityConfirmModal } from '@/components/activity/activities/EditActivityConfirmModal';
import { RequestDeleteActivityModal } from '@/components/activity/activities/RequestDeleteActivityModal';
import {
  ActivityBreadcrumb,
  FormErrorFallback,
  LockBanner,
} from '@/components/shared';
import { normalizeActivityStatus } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';

import { fetchActivityHistory } from '../api/activitiesApi';
import { ApiError } from '../api/errors';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../components/ui/popover';
import { useActivityFormSetup } from '../hooks/useActivityFormSetup';
import { useActivityLock } from '../hooks/useActivityLock';
import { useActivityWebSocket } from '../hooks/useActivityWebSocket';
import { useAuth } from '../hooks/useAuth';
import {
  useDeleteActivity,
  useRequestDeleteActivity,
  useRestoreActivity,
  useSoftDeleteActivity,
  useUpdateActivity,
} from '../hooks/useCalendar';
import { getActivityFieldLabel } from '../lib/activity-form-labels';
import { activityToFormData } from '../lib/activity-form-mapper';
import { buildPayloadForUpdate } from '../lib/activity-form-payload';
import { computeFormChanges } from '../lib/activity-history-format';
import { getActivityUpdatedToastOptions } from '../lib/activity-toast-options';
import { showErrorToast } from '../lib/error-toast';
import { getMissingRequiredFields } from '../lib/form-utils';
import { createLogger } from '../lib/logger';

const logger = createLogger('ActivityPage');

const UNSAVED_MESSAGE = 'You have unsaved changes. Leave anyway?';

export type ActivityPageProps = {
  activity: ActivityResponse;
  refreshActivity: () => Promise<void>;
};

export function ActivityPage({
  activity,
  refreshActivity,
}: ActivityPageProps): React.ReactElement {
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const id = activity.id;

  const canCreateActivity = hasPermission(PERMISSIONS.ACTIVITIES.CREATE);
  const apiCanEdit = (activity as ActivityResponse & { canEdit?: boolean })
    .canEdit;
  const canEditActivity =
    hasPermission(PERMISSIONS.ACTIVITIES.EDIT) && apiCanEdit !== false;
  const leadTeamFetchEnabled = canCreateActivity || canEditActivity;

  const {
    form,
    lookups,
    leadTeamOptions,
    leadTeamOptionsError,
    leadTeamOptionsFetching,
    refetchLeadTeamOptions,
    commsContactCandidates,
  } = useActivityFormSetup({
    mode: 'edit',
    leadTeamFetchEnabled,
    userId: user?.id,
  });
  const canReviewActivities = hasPermission(PERMISSIONS.ACTIVITIES.REVIEW);
  const isAdminOrSysAdmin =
    user?.roleName === SYSTEM_ROLES.ADMIN ||
    user?.roleName === SYSTEM_ROLES.SYSTEM_ADMIN;
  const isCommsContact =
    activity.commsContacts?.some((c) => c.userId === user?.id) ?? false;
  const leadTeamId = activity.leadTeamId ?? null;
  const isLeadTeamMember =
    leadTeamId != null &&
    Array.isArray(user?.teamIds) &&
    user.teamIds.includes(leadTeamId);
  const activityStatusName = activity.activityStatus ?? '';
  const normalizedStatus = normalizeActivityStatus(activityStatusName);
  const isBlockedStatus =
    normalizedStatus === 'delete_requested' || normalizedStatus === 'deleted';
  const canDelete = hasPermission(PERMISSIONS.ACTIVITIES.DELETE);
  const canRequestDelete = hasPermission(PERMISSIONS.ACTIVITIES.REQUEST_DELETE);
  const canDeleteAny = hasPermission(PERMISSIONS.ACTIVITIES.DELETE_ANY);
  const canEditWhenBlocked = canDeleteAny;
  const canRestore =
    normalizedStatus === 'deleted'
      ? canDeleteAny
      : normalizedStatus === 'delete_requested'
        ? (canRequestDelete || canDelete || canDeleteAny) &&
          (isAdminOrSysAdmin || isCommsContact || isLeadTeamMember)
        : false;
  const showDeleteButton =
    canDelete && (canDeleteAny || isCommsContact || isLeadTeamMember);
  const showRequestDeleteButton =
    !isBlockedStatus &&
    (isCommsContact || isLeadTeamMember) &&
    canRequestDelete &&
    !canDelete;

  const {
    lockState,
    lockedByUsername,
    acquire,
    release,
    setLockedByOther,
    clearLockedByOther,
  } = useActivityLock(id);

  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showRequestDeleteModal, setShowRequestDeleteModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteModalInitialNotes, setDeleteModalInitialNotes] = useState<
    string | undefined
  >(undefined);
  const [showMissingFieldsPopover, setShowMissingFieldsPopover] =
    useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isRequestDeleteSubmitting, setIsRequestDeleteSubmitting] =
    useState(false);
  const [isDeleteSubmitting, setIsDeleteSubmitting] = useState(false);
  const [validatedData, setValidatedData] = useState<ActivityFormData | null>(
    null
  );
  const initialFormDataRef = useRef<ActivityFormData | null>(null);
  const [lockEnabled, setLockEnabled] = useState(false);
  const hasUserInteractedRef = useRef(false);
  const autoAcquireAttemptedRef = useRef(false);
  const resetHydrateDepsRef = useRef<{
    activity: ActivityResponse;
    lookups: unknown;
    form: unknown;
  } | null>(null);
  const resetEffectDepDeltaRef = useRef<{
    activityRefChanged: boolean;
    lookupsRefChanged: boolean;
    formRefChanged: boolean;
  } | null>(null);
  const resetEffectRunCountRef = useRef(0);

  const updateMutation = useUpdateActivity();
  const deleteMutation = useDeleteActivity();
  const restoreMutation = useRestoreActivity();
  const softDeleteMutation = useSoftDeleteActivity();
  const requestDeleteMutation = useRequestDeleteActivity();

  useActivityWebSocket(id, {
    onLockAcquired: (lockedBy) => {
      if (user?.id != null && lockedBy.userId === user?.id) {
        return;
      }
      if (lockState !== 'owned') {
        setLockedByOther(lockedBy.username);
      }
    },
    onLockReleased: () => {
      clearLockedByOther();
    },
    onDataUpdated: () => {
      void refreshActivity();
    },
  });

  const isDirty = form.formState.isDirty;
  const dirtyFieldsCount = Object.keys(form.formState.dirtyFields ?? {}).length;
  const dirtyFieldsSignature = JSON.stringify(form.formState.dirtyFields ?? {});
  const isFormValid = form.formState.isValid;
  const missingFields = getMissingRequiredFields(
    form.formState,
    getActivityFieldLabel
  );

  // #region agent log
  {
    const prev = resetHydrateDepsRef.current;
    const activityRefChanged = !prev || prev.activity !== activity;
    const lookupsRefChanged = !prev || prev.lookups !== lookups;
    const formRefChanged = !prev || prev.form !== form;
    resetEffectDepDeltaRef.current = {
      activityRefChanged,
      lookupsRefChanged,
      formRefChanged,
    };
    resetHydrateDepsRef.current = { activity, lookups, form };
    fetch('http://127.0.0.1:7242/ingest/1e76ab1c-9a8c-4cec-a557-b3c6516e9cba', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Debug-Session-Id': '92c8f7',
      },
      body: JSON.stringify({
        sessionId: '92c8f7',
        runId: 'pre-fix',
        hypothesisId: 'H1-H5',
        location: 'ActivityPage.tsx:render',
        message: 'reset effect deps reference check',
        data: {
          activityRefChanged,
          lookupsRefChanged,
          formRefChanged,
          isDirty,
          dirtyFieldsCount,
          activityId: activity.id,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
  }
  // #endregion

  useEffect(() => {
    // #region agent log
    resetEffectRunCountRef.current += 1;
    const d = resetEffectDepDeltaRef.current;
    fetch('http://127.0.0.1:7242/ingest/1e76ab1c-9a8c-4cec-a557-b3c6516e9cba', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Debug-Session-Id': '92c8f7',
      },
      body: JSON.stringify({
        sessionId: '92c8f7',
        runId: 'pre-fix',
        hypothesisId: 'H1',
        location: 'ActivityPage.tsx:resetHydrateEffect',
        message: 'reset/hydrate effect ran',
        data: {
          runCount: resetEffectRunCountRef.current,
          activityRefChanged: d?.activityRefChanged ?? null,
          lookupsRefChanged: d?.lookupsRefChanged ?? null,
          formRefChanged: d?.formRefChanged ?? null,
          activityId: activity.id,
          isDirtySnapshot: form.formState.isDirty,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    hasUserInteractedRef.current = false;
    autoAcquireAttemptedRef.current = false;
    setLockEnabled(false);
    const mapped = activityToFormData(activity, lookups);
    form.reset(mapped);
    initialFormDataRef.current = mapped;
    // Controlled components (Select, etc.) may fire onChange during their
    // first render after reset, spuriously marking the form as dirty.
    // A deferred second reset cleans up dirty state, then enables the lock
    // gate so the isDirty effect only responds to real user edits.
    const id = setTimeout(() => {
      if (initialFormDataRef.current) {
        form.reset(initialFormDataRef.current);
      }
      setLockEnabled(true);
    }, 0);
    return () => clearTimeout(id);
  }, [activity, lookups, form]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const mayEdit =
    canEditActivity &&
    lockState !== 'locked-by-other' &&
    (!isBlockedStatus || canEditWhenBlocked);

  const readOnly = lockState === 'locked-by-other';
  const hasEditLock = lockState === 'owned';
  const canSubmitWithoutValidationErrors =
    isFormValid || missingFields.length === 0;
  const canSubmitUpdate =
    hasEditLock &&
    canSubmitWithoutValidationErrors &&
    !isSubmitting &&
    !readOnly;

  // Optimistic lock: acquire on first user-initiated value change.
  // lockEnabled gates the effect so it only runs after initialization
  // stabilizes (controlled component side effects clear).
  useEffect(() => {
    if (
      !lockEnabled ||
      !isDirty ||
      dirtyFieldsCount === 0 ||
      isEditing ||
      !mayEdit ||
      !hasUserInteractedRef.current ||
      autoAcquireAttemptedRef.current
    ) {
      return;
    }
    autoAcquireAttemptedRef.current = true;
    setIsEditing(true);
    void acquire().then((ok) => {
      if (!ok) {
        setIsEditing(false);
        if (initialFormDataRef.current) {
          form.reset(initialFormDataRef.current);
        }
        toast.error(
          'Cannot edit. Another user has started editing this activity.'
        );
      } else {
        autoAcquireAttemptedRef.current = false;
      }
    });
  }, [
    lockEnabled,
    isDirty,
    dirtyFieldsCount,
    dirtyFieldsSignature,
    isEditing,
    mayEdit,
    form,
    acquire,
    lockState,
  ]);

  useEffect(() => {
    if (lockState === 'idle' && !isDirty) {
      autoAcquireAttemptedRef.current = false;
    }
  }, [lockState, isDirty]);

  const handleOpenDeleteModal = useCallback(async () => {
    if (normalizedStatus === 'delete_requested') {
      try {
        const history = await fetchActivityHistory(id);
        const deleteRequestedEntry = history.find(
          (e) => e.actionType === 'delete_requested'
        );
        const note =
          deleteRequestedEntry?.notes?.trim() &&
          deleteRequestedEntry.notes.trim().length > 0
            ? deleteRequestedEntry.notes.trim()
            : undefined;
        setDeleteModalInitialNotes(note);
      } catch (err) {
        logger.error('Failed to load activity history for delete modal', err);
        setDeleteModalInitialNotes(undefined);
      }
    } else {
      setDeleteModalInitialNotes(undefined);
    }
    setShowDeleteModal(true);
  }, [id, normalizedStatus]);

  const ensureEditThen = useCallback(
    (action: () => void) => {
      if (isEditing) {
        action();
        return;
      }
      setIsEditing(true);
      void acquire().then((ok) => {
        if (ok) {
          action();
        } else {
          setIsEditing(false);
          toast.error(
            'Cannot edit. Another user has started editing this activity.'
          );
        }
      });
    },
    [isEditing, acquire]
  );

  const handleCancel = async () => {
    if (isDirty) {
      setShowLeaveConfirm(true);
      return;
    }
    await release();
    setIsEditing(false);
    if (initialFormDataRef.current) {
      form.reset(initialFormDataRef.current);
    }
  };

  const handleConfirmLeave = async () => {
    setShowLeaveConfirm(false);
    await release();
    setIsEditing(false);
    if (initialFormDataRef.current) {
      form.reset(initialFormDataRef.current);
    }
  };

  const onSubmit = (data: ActivityFormData) => {
    setValidatedData(data);
    setShowConfirmModal(true);
  };

  const handleConfirmedSubmit = async (
    notes?: string,
    markAsReviewed?: boolean
  ) => {
    if (!validatedData) return;
    setIsSubmitting(true);
    try {
      const formValues = form.getValues();
      const submitData = {
        ...buildPayloadForUpdate(validatedData, formValues, {
          markAsReviewed: canReviewActivities ? markAsReviewed : undefined,
        }),
        ...(notes ? { activityHistoryNotes: notes } : {}),
      } as UpdateActivityRequest;
      await updateMutation.mutateAsync({ id, data: submitData });
      toast.success(
        'Activity updated',
        getActivityUpdatedToastOptions({
          id: String(id),
          title: validatedData.title ?? '',
          displayId: activity.displayId ?? undefined,
        })
      );
      await release();
      void navigate('/');
    } catch (err) {
      logger.error('Failed to update activity', err);
      const message =
        err instanceof ApiError && err.status === 409
          ? 'The entry is locked by another user. Your changes could not be saved.'
          : 'Your changes could not be saved.';
      showErrorToast(err, message);
    } finally {
      setIsSubmitting(false);
      setShowConfirmModal(false);
      setValidatedData(null);
    }
  };

  const onError = () => {
    logger.error('Form validation failed');
    const missing = getMissingRequiredFields(
      form.formState,
      getActivityFieldLabel
    );
    const detail =
      missing.length > 0
        ? `Required fields missing: ${missing.join(', ')}`
        : 'Please fix the validation errors and try again.';
    toast.error('Submission failed', {
      description: detail,
      duration: 6000,
    });
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      await restoreMutation.mutateAsync({ id });
      await refreshActivity();
      toast.success('Activity restored');
    } catch (err) {
      logger.error('Failed to restore activity', err);
      showErrorToast(err);
    } finally {
      setIsRestoring(false);
    }
  };

  const handleRequestDeleteConfirm = async (reason: string) => {
    setIsRequestDeleteSubmitting(true);
    try {
      await requestDeleteMutation.mutateAsync({ id, body: { reason } });
      await refreshActivity();
      setShowRequestDeleteModal(false);
      toast.success('Delete requested');
    } catch (err) {
      logger.error('Failed to request delete', err);
      showErrorToast(err);
    } finally {
      setIsRequestDeleteSubmitting(false);
    }
  };

  const handleSoftDelete = async (reason: string) => {
    setIsDeleteSubmitting(true);
    try {
      await softDeleteMutation.mutateAsync({ id, body: { reason } });
      await refreshActivity();
      setShowDeleteModal(false);
      toast.success('Activity soft deleted');
    } catch (err) {
      logger.error('Failed to soft delete activity', err);
      const message =
        err instanceof ApiError && err.status === 403
          ? 'You do not have permission to delete this activity'
          : undefined;
      showErrorToast(err, message);
    } finally {
      setIsDeleteSubmitting(false);
    }
  };

  const handleHardDelete = async (reason: string) => {
    setIsDeleteSubmitting(true);
    try {
      await deleteMutation.mutateAsync({
        id,
        body: reason.trim().length > 0 ? { reason: reason.trim() } : undefined,
      });
      setShowDeleteModal(false);
      toast.success('Activity permanently deleted');
      void navigate('/');
    } catch (err) {
      logger.error('Failed to delete activity', err);
      const message =
        err instanceof ApiError && err.status === 403
          ? 'You do not have permission to delete this activity'
          : undefined;
      showErrorToast(err, message);
    } finally {
      setIsDeleteSubmitting(false);
    }
  };

  const confirmModalChanges =
    showConfirmModal && initialFormDataRef.current
      ? computeFormChanges(initialFormDataRef.current, form.getValues())
      : [];

  const displayId = activity.displayId ?? `???-${activity.id}`;
  const categories = activity.category ?? [];

  return (
    <ErrorBoundary FallbackComponent={FormErrorFallback}>
      <ActivityBreadcrumb currentLabel={displayId} />
      <ActivityPageHeader
        displayId={displayId}
        title={activity.title ?? ''}
        categories={categories}
        leadOrg={activity.leadOrg ?? null}
        activityStatus={activity.activityStatus ?? null}
        lastUpdatedDateTime={activity.lastUpdatedDateTime ?? null}
        createdDateTime={activity.createdDateTime ?? null}
        onHistoryClick={() => setHistoryOpen(true)}
      />
      {lockState === 'locked-by-other' && (
        <LockBanner lockedByUsername={lockedByUsername} />
      )}
      {isBlockedStatus && (
        <ActivityStatusBanner
          status={activityStatusName}
          canRestore={canRestore}
          canEditWhenBlocked={canEditWhenBlocked}
          onRestore={handleRestore}
          isRestoring={isRestoring}
        />
      )}
      <Form {...form}>
        <form
          onPointerDownCapture={() => {
            hasUserInteractedRef.current = true;
          }}
          onKeyDownCapture={() => {
            hasUserInteractedRef.current = true;
          }}
          onSubmit={(e) => {
            e.preventDefault();
            if (hasEditLock) {
              void form.handleSubmit(onSubmit, onError)(e);
            }
          }}
        >
          {(canCreateActivity || canEditActivity) && leadTeamOptionsError && (
            <div className="border-destructive/50 bg-destructive/10 text-destructive mb-4 flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
              <span>Could not load lead team options.</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  void refetchLeadTeamOptions();
                }}
              >
                Retry
              </Button>
            </div>
          )}
          <ActivityFormBody
            lookups={lookups}
            commsContactCandidates={commsContactCandidates}
            readOnly={readOnly}
            leadTeamField={{
              options: leadTeamOptions,
              displayLabel:
                (
                  activity as ActivityResponse & {
                    leadTeamDisplayName?: string | null;
                  }
                ).leadTeamDisplayName ?? null,
              optionsFetching: leadTeamOptionsFetching,
            }}
          />
          <div className="bg-background/90 supports-backdrop-filter:bg-background/80 sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-4 py-4 backdrop-blur">
            <div className="flex gap-2">
              {showRequestDeleteButton && (
                <Button
                  type="button"
                  variant="outline"
                  className="text-destructive border-destructive hover:bg-destructive/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    ensureEditThen(() => setShowRequestDeleteModal(true));
                  }}
                  disabled={isSubmitting || !hasEditLock}
                >
                  Request delete
                </Button>
              )}
              {showDeleteButton && (
                <Button
                  type="button"
                  variant="outline"
                  className="text-destructive border-destructive hover:bg-destructive/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    ensureEditThen(() => void handleOpenDeleteModal());
                  }}
                  disabled={isSubmitting || !hasEditLock}
                >
                  Delete
                </Button>
              )}
            </div>
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleCancel()}
                disabled={isSubmitting || !hasEditLock}
              >
                Cancel
              </Button>
              {!canSubmitWithoutValidationErrors ? (
                <Popover open={showMissingFieldsPopover}>
                  <PopoverTrigger asChild>
                    <div
                      onMouseEnter={() => setShowMissingFieldsPopover(true)}
                      onMouseLeave={() => setShowMissingFieldsPopover(false)}
                    >
                      <Button
                        type="submit"
                        disabled={true}
                        className="cursor-not-allowed"
                      >
                        {isSubmitting ? 'Updating...' : 'Update'}
                      </Button>
                    </div>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-80"
                    onMouseEnter={() => setShowMissingFieldsPopover(true)}
                    onMouseLeave={() => setShowMissingFieldsPopover(false)}
                  >
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">
                        Required fields missing:
                      </h4>
                      <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
                        {missingFields.map((field) => (
                          <li key={field}>{field}</li>
                        ))}
                      </ul>
                    </div>
                  </PopoverContent>
                </Popover>
              ) : (
                <Button type="submit" disabled={!canSubmitUpdate}>
                  {isSubmitting ? 'Updating...' : 'Update'}
                </Button>
              )}
            </div>
          </div>
        </form>
      </Form>
      <ActivityHistory
        activityId={id}
        open={historyOpen}
        onOpenChange={(v) => setHistoryOpen(!!v)}
        dateStatuses={lookups.dateStatuses}
      />
      <Dialog open={showLeaveConfirm} onOpenChange={setShowLeaveConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unsaved changes</DialogTitle>
            <DialogDescription>{UNSAVED_MESSAGE}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowLeaveConfirm(false)}
            >
              Stay
            </Button>
            <Button type="button" onClick={() => void handleConfirmLeave()}>
              Leave
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <EditActivityConfirmModal
        open={showConfirmModal}
        onOpenChange={(open) => {
          setShowConfirmModal(open);
          if (!open) setValidatedData(null);
        }}
        changes={confirmModalChanges}
        dateStatuses={lookups.dateStatuses}
        onConfirm={(notes, markAsReviewed) =>
          void handleConfirmedSubmit(notes, markAsReviewed)
        }
        isSubmitting={isSubmitting}
        showMarkAsReviewed={canReviewActivities}
      />
      <RequestDeleteActivityModal
        open={showRequestDeleteModal}
        onOpenChange={setShowRequestDeleteModal}
        onConfirm={handleRequestDeleteConfirm}
        isSubmitting={isRequestDeleteSubmitting}
      />
      <DeleteActivityModal
        open={showDeleteModal}
        onOpenChange={(open) => {
          setShowDeleteModal(open);
          if (!open) setDeleteModalInitialNotes(undefined);
        }}
        activityId={id}
        displayId={displayId}
        onSoftDelete={handleSoftDelete}
        onHardDelete={handleHardDelete}
        isSubmitting={isDeleteSubmitting}
        initialNotes={deleteModalInitialNotes}
      />
    </ErrorBoundary>
  );
}
