import { zodResolver } from '@hookform/resolvers/zod';
import { ErrorBoundary } from 'react-error-boundary';
import { FormProvider, useForm, type Resolver } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useCallback, useEffect, useRef, useState } from 'react';

import { PERMISSIONS, SYSTEM_ROLES } from '@corpcal/shared/auth';
import {
  createActivityRequestSchema,
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
import { useCommsContactCandidates } from '../hooks/useCommsContactCandidates';
import { useCommsContactSync } from '../hooks/useCommsContactSync';
import { useFormLookups } from '../hooks/useFormLookups';
import { useLeadTeamOptions } from '../hooks/useLeadTeamOptions';
import { useDateStatuses } from '../hooks/useLookups';
import { getDefaultFormValues } from '../lib/activity-form-defaults';
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

  const lookups = useFormLookups();
  const canCreateActivity = hasPermission(PERMISSIONS.ACTIVITIES.CREATE);
  const apiCanEdit = (activity as ActivityResponse & { canEdit?: boolean })
    .canEdit;
  const canEditActivity =
    hasPermission(PERMISSIONS.ACTIVITIES.EDIT) && apiCanEdit !== false;
  const leadTeamFetchEnabled = canCreateActivity || canEditActivity;
  const {
    data: leadTeamOptions = [],
    isError: leadTeamOptionsError,
    isFetching: leadTeamOptionsFetching,
    refetch: refetchLeadTeamOptions,
  } = useLeadTeamOptions(leadTeamFetchEnabled);
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
  const [fieldToActivate, setFieldToActivate] = useState<string | null>(null);
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
  /** Same field key as last pointerdown inside the activity form (guards SPA ghost clicks after navigate). */
  const pointerDownFieldKeyRef = useRef<string | null>(null);

  const { data: dateStatuses } = useDateStatuses();
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

  const form = useForm<ActivityFormData>({
    resolver: zodResolver(
      createActivityRequestSchema
    ) as Resolver<ActivityFormData>,
    mode: 'onChange',
    defaultValues: getDefaultFormValues(),
  });

  const watchedLeadTeamId: number | undefined = form.watch('leadTeamId');
  const { data: commsContactCandidates } =
    useCommsContactCandidates(watchedLeadTeamId);

  useCommsContactSync({
    form,
    candidates: commsContactCandidates,
    userId: user?.id,
    isCreate: false,
  });

  const isDirty = form.formState.isDirty;
  const isFormValid = form.formState.isValid;
  const missingFields = getMissingRequiredFields(
    form.formState,
    getActivityFieldLabel
  );

  useEffect(() => {
    const mapped = activityToFormData(activity, lookups);
    form.reset(mapped);
    initialFormDataRef.current = mapped;
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

  const readOnly = !isEditing || lockState === 'locked-by-other';

  const clearFieldToActivate = useCallback(() => setFieldToActivate(null), []);

  const resolveDataFieldEl = useCallback((target: HTMLElement) => {
    const direct = target.closest('[data-field]');
    if (direct) return direct;
    if (target instanceof HTMLLabelElement && target.control) {
      return target.control.closest('[data-field]');
    }
    return null;
  }, []);

  useEffect(() => {
    pointerDownFieldKeyRef.current = null;
  }, [id]);

  const handleFormPointerDownCapture = useCallback(
    (e: React.PointerEvent<HTMLFormElement>) => {
      if (isEditing || !mayEdit) return;
      const el = resolveDataFieldEl(e.target as HTMLElement);
      pointerDownFieldKeyRef.current = el?.getAttribute('data-field') ?? null;
    },
    [isEditing, mayEdit, resolveDataFieldEl]
  );

  const beginEditFromField = useCallback(
    (fieldName: string | null) => {
      setIsEditing(true);
      setFieldToActivate(fieldName);
      void acquire().then((ok) => {
        if (!ok) {
          setIsEditing(false);
          setFieldToActivate(null);
          toast.error(
            'Cannot edit. Another user has started editing this activity.'
          );
        }
      });
    },
    [acquire, id]
  );

  const handleFieldClick = useCallback(
    (e: React.MouseEvent<HTMLFormElement>) => {
      if (isEditing || !mayEdit) return;

      const target = e.target as HTMLElement;
      const fieldEl = resolveDataFieldEl(target);
      if (!fieldEl) return;

      const field = fieldEl.getAttribute('data-field') ?? null;
      if (field == null || field !== pointerDownFieldKeyRef.current) {
        return;
      }
      pointerDownFieldKeyRef.current = null;
      beginEditFromField(field);
    },
    [isEditing, mayEdit, resolveDataFieldEl, beginEditFromField]
  );

  const handleFormKeyDownIntent = useCallback(
    (e: React.KeyboardEvent<HTMLFormElement>) => {
      if (isEditing || !mayEdit) return;
      if (e.key === 'Tab' || e.key === 'Escape' || e.repeat) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const t = e.target as HTMLElement;
      if (t.closest('button, a, [role="button"]')) return;

      const fieldEl = resolveDataFieldEl(t);
      if (!fieldEl) return;

      const active = document.activeElement;
      if (
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        active instanceof HTMLSelectElement
      ) {
        if (active.disabled) return;
      }

      const isPrintable = e.key.length === 1;
      const isEditKey =
        e.key === 'Enter' || e.key === 'Backspace' || e.key === 'Delete';
      if (!isPrintable && !isEditKey) return;

      e.preventDefault();
      const field = fieldEl.getAttribute('data-field');
      beginEditFromField(field);
    },
    [isEditing, mayEdit, resolveDataFieldEl, beginEditFromField]
  );

  // Focus / activate the target field after entering edit
  useEffect(() => {
    if (!isEditing || !fieldToActivate) return;
    requestAnimationFrame(() => {
      try {
        form.setFocus(fieldToActivate as keyof ActivityFormData);
      } catch {
        // field name may not be focusable via RHF
      }
    });
  }, [isEditing, fieldToActivate, form]);

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
      showErrorToast(err, 'Your changes could not be saved.');
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
        onHistoryClick={isEditing ? () => setHistoryOpen(true) : undefined}
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
      <FormProvider {...form}>
        <Form {...form}>
          <form
            onPointerDownCapture={handleFormPointerDownCapture}
            onSubmit={(e) => {
              e.preventDefault();
              if (isEditing) {
                void form.handleSubmit(onSubmit, onError)(e);
              }
            }}
            onClick={!isEditing ? handleFieldClick : undefined}
            onKeyDown={!isEditing ? handleFormKeyDownIntent : undefined}
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
              form={form}
              lookups={lookups}
              readOnly={readOnly}
              isEditing={isEditing}
              fieldToActivate={fieldToActivate}
              clearFieldToActivate={clearFieldToActivate}
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
            <div className="flex flex-wrap items-center justify-between gap-4 pt-6">
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
                    disabled={isSubmitting}
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
                    disabled={isSubmitting}
                  >
                    Delete
                  </Button>
                )}
              </div>
              <div className="flex gap-4">
                {isEditing ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void handleCancel()}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    {!isFormValid && missingFields.length > 0 ? (
                      <Popover open={showMissingFieldsPopover}>
                        <PopoverTrigger asChild>
                          <div
                            onMouseEnter={() =>
                              setShowMissingFieldsPopover(true)
                            }
                            onMouseLeave={() =>
                              setShowMissingFieldsPopover(false)
                            }
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
                          onMouseLeave={() =>
                            setShowMissingFieldsPopover(false)
                          }
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
                      <Button type="submit" disabled={isSubmitting || readOnly}>
                        {isSubmitting ? 'Updating...' : 'Update'}
                      </Button>
                    )}
                  </>
                ) : (
                  <Button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditing(true);
                      void acquire().then((ok) => {
                        if (!ok) {
                          setIsEditing(false);
                          toast.error(
                            'Cannot edit. Another user has started editing this activity.'
                          );
                        }
                      });
                    }}
                    disabled={!mayEdit}
                  >
                    Edit
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>
      </FormProvider>
      {isEditing && (
        <ActivityHistory
          activityId={id}
          open={historyOpen}
          onOpenChange={(v) => setHistoryOpen(!!v)}
          dateStatuses={dateStatuses}
        />
      )}
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
        dateStatuses={dateStatuses}
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
