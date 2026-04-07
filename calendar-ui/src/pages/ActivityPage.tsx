import { ErrorBoundary } from 'react-error-boundary';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { PERMISSIONS, SYSTEM_ROLES } from '@corpcal/shared/auth';
import {
  type ActivityFormData,
  type ActivityResponse,
  type UpdateActivityRequest,
} from '@corpcal/shared/schemas';
import {
  ActivityFormBody,
  ActivityFormStickyBack,
  ActivityPageHeader,
  ActivityStatusBanner,
} from '@/components/activity';
import ActivityHistory from '@/components/activity/activities/ActivityHistory';
import { DeleteActivityModal } from '@/components/activity/activities/DeleteActivityModal';
import { DiscardActivityChangesDialog } from '@/components/activity/activities/DiscardActivityChangesDialog';
import { EditActivityConfirmModal } from '@/components/activity/activities/EditActivityConfirmModal';
import { RequestDeleteActivityModal } from '@/components/activity/activities/RequestDeleteActivityModal';
import { ReviewActionButtonLabel } from '@/components/activity/activities/ReviewActionButtonLabel';
import { ReviewActivityModal } from '@/components/activity/activities/ReviewActivityModal';
import { FormErrorFallback, LockBanner } from '@/components/shared';
import { Badge, normalizeActivityStatus } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import {
  startLockHandoffCountdownToast,
  type LockHandoffToastHandle,
} from '@/lib/lock-handoff-toast';

import { fetchActivityHistory } from '../api/activitiesApi';
import { ApiError } from '../api/errors';
import { cancelForceHandoff, requestForceHandoff } from '../api/locksApi';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../components/ui/popover';
import { useActivityEditActions } from '../hooks/useActivityEditActions';
import { useActivityEditFormHydration } from '../hooks/useActivityEditFormHydration';
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
import {
  EDIT_LOCK_CONFLICT_TOAST,
  useEditLockIntent,
} from '../hooks/useEditLockIntent';
import { useEditLockSession } from '../hooks/useEditLockSession';
import { getActivityFieldLabel } from '../lib/activity-form-labels';
import {
  buildMarkReviewedOnlyPayload,
  buildPayloadForUpdate,
  type UpdatePayloadOptions,
} from '../lib/activity-form-payload';
import { computeFormChanges } from '../lib/activity-history-format';
import { getActivityUpdatedToastOptions } from '../lib/activity-toast-options';
import { showErrorToast } from '../lib/error-toast';
import { getMissingRequiredFields } from '../lib/form-utils';
import { createLogger } from '../lib/logger';

const logger = createLogger('ActivityPage');

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
  const hasCreateAny = hasPermission(PERMISSIONS.ACTIVITIES.CREATE_ANY);
  const apiCanEdit = (activity as ActivityResponse & { canEdit?: boolean })
    .canEdit;
  /** API omits canEdit only for unauthenticated responses; treat missing as not editable. */
  const canEditActivity =
    hasPermission(PERMISSIONS.ACTIVITIES.EDIT) && (apiCanEdit ?? false);
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
    userTeamIds: user?.teamIds,
    hasCreateAny,
  });
  const canReviewActivities = hasPermission(PERMISSIONS.ACTIVITIES.REVIEW);
  const reviewerChangedPaths = useMemo<ReadonlySet<string>>(() => {
    const paths = canReviewActivities
      ? activity.changedFieldsSinceReview
      : undefined;
    return paths ? new Set(paths) : new Set<string>();
  }, [canReviewActivities, activity.changedFieldsSinceReview]);
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
  const canForceHandoff = hasPermission(
    PERMISSIONS.ACTIVITIES.LOCK_FORCE_HANDOFF
  );
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
    lock,
    lockState,
    lockedByUsername,
    acquire,
    release,
    refreshLockFromServer,
    sendHeartbeat,
    applyExternalLockReleased,
    setLockedByOther,
    clearLockedByOther,
  } = useActivityLock(id, user?.id);

  const [isEditing, setIsEditing] = useState(false);
  const [forceHandoffPending, setForceHandoffPending] = useState(false);
  const [cancelHandoffPending, setCancelHandoffPending] = useState(false);
  const [handoffAwaitingCompletion, setHandoffAwaitingCompletion] =
    useState(false);
  const handoffToastHandleRef = useRef<LockHandoffToastHandle | null>(null);

  useEffect(() => {
    setHandoffAwaitingCompletion(false);
    return () => {
      handoffToastHandleRef.current?.dispose();
      handoffToastHandleRef.current = null;
    };
  }, [id]);

  useEditLockSession({
    form,
    activityId: id,
    lockState,
    lock,
    isEditing,
    sendHeartbeat,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
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
  const { isFormHydrated, hydrationGeneration, initialFormDataRef } =
    useActivityEditFormHydration(activity, lookups, form);

  const updateMutation = useUpdateActivity();
  const deleteMutation = useDeleteActivity();
  const restoreMutation = useRestoreActivity();
  const softDeleteMutation = useSoftDeleteActivity();
  const requestDeleteMutation = useRequestDeleteActivity();

  const handleRequestForceHandoff = useCallback(async () => {
    setForceHandoffPending(true);
    try {
      await requestForceHandoff(id);
      setHandoffAwaitingCompletion(true);
    } catch (err) {
      showErrorToast(err, 'Could not request lock transfer');
    } finally {
      setForceHandoffPending(false);
    }
  }, [id]);

  const handleCancelForceHandoff = useCallback(async () => {
    setCancelHandoffPending(true);
    try {
      await cancelForceHandoff(id);
      handoffToastHandleRef.current?.notifyHandoffCancelled();
      setHandoffAwaitingCompletion(false);
    } catch (err) {
      showErrorToast(err, 'Could not cancel unlock request');
    } finally {
      setCancelHandoffPending(false);
    }
  }, [id]);

  useActivityWebSocket(id, {
    onLockAcquired: (lockedBy) => {
      if (user?.id != null && lockedBy.userId === user?.id) {
        setHandoffAwaitingCompletion(false);
        handoffToastHandleRef.current?.notifyLockAcquired();
        void refreshLockFromServer();
        return;
      }
      if (lockState !== 'owned') {
        setLockedByOther(lockedBy.username);
      }
    },
    onLockReleased: () => {
      clearLockedByOther();
      applyExternalLockReleased();
      setIsEditing((editing) => {
        if (editing && initialFormDataRef.current) {
          form.reset(initialFormDataRef.current);
        }
        return false;
      });
      void refreshActivity();
    },
    onDataUpdated: () => {
      void refreshActivity();
    },
    onLockHandoffPending: (payload) => {
      handoffToastHandleRef.current?.dispose();
      handoffToastHandleRef.current = startLockHandoffCountdownToast(payload);
      if (payload.role === 'requester') {
        setHandoffAwaitingCompletion(true);
      }
    },
    onLockHandoffCancelled: () => {
      handoffToastHandleRef.current?.notifyHandoffCancelled();
      setHandoffAwaitingCompletion(false);
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

  const handleGoBack = useCallback(() => {
    // New tab / direct loads have no prior history entry; send users to the activity list.
    if (window.history.length > 1) {
      void navigate(-1);
    } else {
      void navigate('/');
    }
  }, [navigate]);

  const mayEditFormFields =
    canEditActivity && (!isBlockedStatus || canEditWhenBlocked);
  /** True when the user cannot edit for permission/status reasons (not merely waiting on a lock). */
  const isViewOnlyByPermission = !mayEditFormFields;
  const readOnly = lockState === 'locked-by-other' || !mayEditFormFields;
  const hasEditLock = lockState === 'owned';
  const canSubmitWithoutValidationErrors =
    isFormValid || missingFields.length === 0;

  const actionFlags = useActivityEditActions({
    lockState,
    mayEditFormFields,
    canReviewActivities,
    hasEditLock,
    canSubmitWithoutValidationErrors,
    isSubmitting,
    readOnly,
    isDirty,
  });

  const onEditLockAcquireConflict = useCallback(() => {
    toast.error(EDIT_LOCK_CONFLICT_TOAST);
  }, []);

  useEditLockIntent({
    formHydrated: isFormHydrated,
    hydrationGeneration,
    isDirty,
    dirtyFieldsCount,
    dirtyFieldsSignature,
    mayEdit,
    isEditing,
    setIsEditing,
    acquire,
    lockState,
    form,
    initialFormDataRef,
    onAcquireConflict: onEditLockAcquireConflict,
  });

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
          toast.error(EDIT_LOCK_CONFLICT_TOAST);
        }
      });
    },
    [isEditing, acquire]
  );

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

  type SubmitActivityMode =
    | { kind: 'update'; validatedData: ActivityFormData; notes?: string }
    | { kind: 'reviewOnly'; notes?: string }
    | {
        kind: 'reviewWithSave';
        validatedData: ActivityFormData;
        notes?: string;
      };

  const runSubmitUpdate = useCallback(
    async (mode: SubmitActivityMode) => {
      setIsSubmitting(true);
      try {
        let submitData: UpdateActivityRequest;

        if (mode.kind === 'reviewOnly') {
          submitData = {
            ...buildMarkReviewedOnlyPayload(mode.notes),
          } as UpdateActivityRequest;
        } else {
          const opts: UpdatePayloadOptions =
            mode.kind === 'reviewWithSave' ? { markAsReviewed: true } : {};
          submitData = {
            ...buildPayloadForUpdate(
              mode.validatedData,
              form.getValues(),
              opts
            ),
            ...(mode.notes ? { activityHistoryNotes: mode.notes } : {}),
          } as UpdateActivityRequest;
        }

        await updateMutation.mutateAsync({ id, data: submitData });
        const titleForToast =
          mode.kind === 'reviewOnly'
            ? (activity.title ?? '')
            : (mode.validatedData.title ?? '');
        toast.success(
          'Activity updated',
          getActivityUpdatedToastOptions({
            id: String(id),
            title: titleForToast,
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
        setShowReviewModal(false);
        setValidatedData(null);
      }
    },
    [
      id,
      updateMutation,
      form,
      activity.title,
      activity.displayId,
      release,
      navigate,
    ]
  );

  const handleConfirmedSubmit = async (notes?: string) => {
    if (!validatedData) return;
    await runSubmitUpdate({ kind: 'update', validatedData, notes });
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

  const handleReviewConfirm = async (notes?: string) => {
    if (isDirty) {
      await form.handleSubmit(async (data) => {
        await runSubmitUpdate({
          kind: 'reviewWithSave',
          validatedData: data,
          notes,
        });
      }, onError)();
    } else {
      await runSubmitUpdate({ kind: 'reviewOnly', notes });
    }
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

  const discardModalChanges =
    showLeaveConfirm && initialFormDataRef.current
      ? computeFormChanges(initialFormDataRef.current, form.getValues())
      : [];

  const displayId = activity.displayId ?? `???-${activity.id}`;
  const categories = activity.category ?? [];

  return (
    <ErrorBoundary FallbackComponent={FormErrorFallback}>
      <ActivityFormStickyBack onBack={handleGoBack} />
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
        <LockBanner
          lockedByUsername={lockedByUsername}
          onRequestTakeLock={
            canForceHandoff ? () => void handleRequestForceHandoff() : undefined
          }
          requestTakeLockPending={forceHandoffPending}
          handoffActive={handoffAwaitingCompletion}
          onCancelHandoff={
            canForceHandoff ? () => void handleCancelForceHandoff() : undefined
          }
          cancelHandoffPending={cancelHandoffPending}
        />
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
            reviewerChangedPaths={reviewerChangedPaths}
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
          <div className="bg-background sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-4 py-4">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-2">
              {isViewOnlyByPermission && (
                <div className="text-muted-foreground flex min-w-0 flex-wrap items-center gap-2 text-sm">
                  <Badge variant="secondary">View-only</Badge>
                  <span>You cannot edit this activity.</span>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {showRequestDeleteButton && (
                  <Button
                    type="button"
                    variant="outline"
                    className="text-destructive border-destructive hover:bg-destructive/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      ensureEditThen(() => setShowRequestDeleteModal(true));
                    }}
                    disabled={isSubmitting || actionFlags.isLockedByOther}
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
                    disabled={isSubmitting || actionFlags.isLockedByOther}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </div>
            <div className="flex shrink-0 gap-4">
              {isDirty && (
                <Button
                  type="button"
                  variant="ghost"
                  className="animate-in fade-in duration-200"
                  onClick={() => setShowLeaveConfirm(true)}
                  disabled={isSubmitting}
                >
                  Discard changes
                </Button>
              )}
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
                        variant={canReviewActivities ? 'outline' : 'default'}
                        className="cursor-not-allowed"
                      >
                        {isSubmitting ? 'Saving...' : 'Save'}
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
                <Button
                  type="submit"
                  variant={canReviewActivities ? 'outline' : 'default'}
                  disabled={!actionFlags.canSubmitUpdate}
                >
                  {isSubmitting ? 'Saving...' : 'Save'}
                </Button>
              )}
              {actionFlags.showReviewAction && (
                <Button
                  type="button"
                  aria-label={isDirty ? 'Save and Review' : 'Review'}
                  disabled={!actionFlags.reviewActionEnabled}
                  onClick={() => ensureEditThen(() => setShowReviewModal(true))}
                >
                  <ReviewActionButtonLabel isDirty={isDirty} />
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
        venueStatuses={lookups.venueStatuses}
      />
      <DiscardActivityChangesDialog
        open={showLeaveConfirm}
        onOpenChange={setShowLeaveConfirm}
        changes={discardModalChanges}
        dateStatuses={lookups.dateStatuses}
        venueStatuses={lookups.venueStatuses}
        onReturnToEdit={() => setShowLeaveConfirm(false)}
        onDiscard={() => void handleConfirmLeave()}
      />
      <EditActivityConfirmModal
        open={showConfirmModal}
        onOpenChange={(open) => {
          setShowConfirmModal(open);
          if (!open) setValidatedData(null);
        }}
        changes={confirmModalChanges}
        dateStatuses={lookups.dateStatuses}
        venueStatuses={lookups.venueStatuses}
        onConfirm={(notes) => void handleConfirmedSubmit(notes)}
        isSubmitting={isSubmitting}
      />
      <ReviewActivityModal
        open={showReviewModal}
        onOpenChange={setShowReviewModal}
        isDirty={isDirty}
        isSubmitting={isSubmitting}
        onConfirm={(notes) => void handleReviewConfirm(notes)}
        displayId={displayId}
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
