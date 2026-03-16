import { zodResolver } from '@hookform/resolvers/zod';
import { ErrorBoundary } from 'react-error-boundary';
import { FormProvider, useForm, type Resolver } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
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
import { useAuth } from '../hooks/useAuth';
import {
  useDeleteActivity,
  useRequestDeleteActivity,
  useRestoreActivity,
  useSoftDeleteActivity,
  useUpdateActivity,
} from '../hooks/useCalendar';
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

/**
 * Grace period (ms) after entering view mode during which form focus/click do not trigger edit.
 * Necessary because on load the browser or React often focuses the form, which would otherwise
 * fire onFocus -> enterEdit and immediately redirect to the edit URL.
 */
const VIEW_MODE_GRACE_MS = 400;

type PendingAction = 'delete' | 'requestDelete' | undefined;

export type ActivityPageProps = {
  activity: ActivityResponse;
  refreshActivity: () => Promise<void>;
};

export function ActivityPage({
  activity,
  refreshActivity,
}: ActivityPageProps): React.ReactElement {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const id = activity.id;
  const viewPath = `/activity/${id}`;
  const editPath = `/activity/${id}/edit`;

  const isEditMode = location.pathname.endsWith('/edit');

  const lookups = useFormLookups();
  const canCreateActivity = hasPermission(PERMISSIONS.ACTIVITIES.CREATE);
  const apiCanEdit = (activity as ActivityResponse & { canEdit?: boolean })
    .canEdit;
  const canEditActivity =
    hasPermission(PERMISSIONS.ACTIVITIES.EDIT) && apiCanEdit !== false;
  const {
    data: leadTeamOptions = [],
    isError: leadTeamOptionsError,
    refetch: refetchLeadTeamOptions,
  } = useLeadTeamOptions(canCreateActivity || canEditActivity);
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
  /** Users with delete.any may open/edit when status is delete_requested or deleted. */
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
    lockedByOther,
    lockedByUsername,
    isLoading: lockLoading,
    release,
  } = useActivityLock(isEditMode ? id : null);

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
  const [pendingAction, setPendingAction] = useState<PendingAction>(undefined);
  const pendingFocusFieldRef = useRef<string | undefined>(undefined);
  const initialFormDataRef = useRef<ActivityFormData | null>(null);
  /** Timestamp when we last entered view mode; used to ignore spurious focus/click on load. */
  const viewModeEnteredAtRef = useRef<number>(0);

  const { data: dateStatuses } = useDateStatuses();
  const updateMutation = useUpdateActivity();
  const deleteMutation = useDeleteActivity();
  const restoreMutation = useRestoreActivity();
  const softDeleteMutation = useSoftDeleteActivity();
  const requestDeleteMutation = useRequestDeleteActivity();

  const form = useForm<ActivityFormData>({
    resolver: zodResolver(
      createActivityRequestSchema
    ) as Resolver<ActivityFormData>,
    mode: 'onChange',
    defaultValues: getDefaultFormValues(),
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

  // Redirect: edit mode without EDIT permission -> view
  useEffect(() => {
    if (isEditMode && !canEditActivity) {
      void navigate(viewPath, { replace: true });
    }
  }, [isEditMode, canEditActivity, navigate, viewPath]);

  // Redirect: edit mode + blocked status and no permission to edit when blocked -> view
  useEffect(() => {
    if (isEditMode && isBlockedStatus && !canEditWhenBlocked) {
      void navigate(viewPath, { replace: true });
    }
  }, [isEditMode, isBlockedStatus, canEditWhenBlocked, navigate, viewPath]);

  // When entering view mode, record time so handleFormInteraction can ignore events within grace period
  useEffect(() => {
    if (!isEditMode) {
      viewModeEnteredAtRef.current = Date.now();
    }
  }, [isEditMode]);

  // Release edit lock when leaving edit mode (e.g. Back button or URL change to view). Cancel/Save already call release() before navigating.
  useEffect(() => {
    if (!isEditMode) {
      void release();
    }
  }, [isEditMode, release]);

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

  // Pending action/focus after entering edit mode
  useEffect(() => {
    if (!isEditMode) return;
    const field = pendingFocusFieldRef.current;
    if (field) {
      pendingFocusFieldRef.current = undefined;
      requestAnimationFrame(() => {
        try {
          form.setFocus(field as keyof ActivityFormData);
        } catch {
          // ignore invalid field names
        }
      });
    }
    if (pendingAction === 'delete') {
      setPendingAction(undefined);
      void handleOpenDeleteModal();
    } else if (pendingAction === 'requestDelete') {
      setPendingAction(undefined);
      setShowRequestDeleteModal(true);
    }
  }, [isEditMode, pendingAction, form, handleOpenDeleteModal]);

  // Warn on tab close/refresh when there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const readOnly =
    !isEditMode ||
    lockedByOther ||
    lockLoading ||
    (isBlockedStatus && !canEditWhenBlocked);

  const enterEdit = useCallback(
    (focusField?: string, action?: PendingAction) => {
      if (!canEditActivity) return;
      if (isBlockedStatus && !canEditWhenBlocked) return;
      if (focusField) pendingFocusFieldRef.current = focusField;
      if (action) setPendingAction(action);
      void navigate(editPath, { replace: true });
    },
    [canEditActivity, isBlockedStatus, canEditWhenBlocked, navigate, editPath]
  );

  const handleFormInteraction = useCallback(
    (
      e: React.FocusEvent<HTMLFormElement> | React.MouseEvent<HTMLFormElement>
    ) => {
      const mayEnterEdit = !isBlockedStatus || canEditWhenBlocked;
      if (!isEditMode && canEditActivity && mayEnterEdit) {
        // Skip if still in grace period after entering view mode (avoids redirect on load)
        if (Date.now() - viewModeEnteredAtRef.current < VIEW_MODE_GRACE_MS) {
          return;
        }
        const target = e.target as HTMLElement;
        const field = target
          .closest('[data-field]')
          ?.getAttribute('data-field');
        enterEdit(field ?? undefined);
      }
    },
    [
      isEditMode,
      canEditActivity,
      isBlockedStatus,
      canEditWhenBlocked,
      enterEdit,
    ]
  );

  const handleCancel = async () => {
    if (isDirty) {
      setShowLeaveConfirm(true);
      return;
    }
    await release();
    void navigate(viewPath, { replace: true });
  };

  const handleConfirmLeave = async () => {
    setShowLeaveConfirm(false);
    await release();
    void navigate(viewPath, { replace: true });
  };

  const handleDeleteFromView = (e: React.MouseEvent) => {
    e.stopPropagation();
    enterEdit(undefined, 'delete');
  };

  const handleRequestDeleteFromView = (e: React.MouseEvent) => {
    e.stopPropagation();
    enterEdit(undefined, 'requestDelete');
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

  const displayId = activity.displayId ?? `ACT-${activity.id}`;
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
        onHistoryClick={isEditMode ? () => setHistoryOpen(true) : undefined}
      />
      {isEditMode && lockedByOther && (
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
            className={!isEditMode ? 'cursor-pointer' : undefined}
            onSubmit={(e) => {
              e.preventDefault();
              if (isEditMode) {
                void form.handleSubmit(onSubmit, onError)(e);
              }
            }}
            onFocus={!isEditMode ? handleFormInteraction : undefined}
            onClick={!isEditMode ? handleFormInteraction : undefined}
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
              leadTeamOptions={leadTeamOptions}
            />
            <div className="flex flex-wrap items-center justify-between gap-4 pt-6">
              <div className="flex gap-2">
                {showRequestDeleteButton && (
                  <Button
                    type="button"
                    variant="outline"
                    className="text-destructive border-destructive hover:bg-destructive/10"
                    onClick={
                      isEditMode
                        ? () => setShowRequestDeleteModal(true)
                        : handleRequestDeleteFromView
                    }
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
                    onClick={
                      isEditMode
                        ? () => void handleOpenDeleteModal()
                        : handleDeleteFromView
                    }
                    disabled={isSubmitting}
                  >
                    Delete
                  </Button>
                )}
              </div>
              <div className="flex gap-4">
                {isEditMode ? (
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
                  <>
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={() => enterEdit()}
                      disabled={
                        !canEditActivity ||
                        (isBlockedStatus && !canEditWhenBlocked)
                      }
                    >
                      Edit
                    </Button>
                  </>
                )}
              </div>
            </div>
          </form>
        </Form>
      </FormProvider>
      {isEditMode && (
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
