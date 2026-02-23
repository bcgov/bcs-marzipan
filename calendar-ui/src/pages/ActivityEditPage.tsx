import { zodResolver } from '@hookform/resolvers/zod';
import { ErrorBoundary } from 'react-error-boundary';
import { FormProvider, useForm, type Resolver } from 'react-hook-form';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { toast } from 'sonner';
import { useEffect, useRef, useState } from 'react';

import { SYSTEM_ROLES } from '@corpcal/shared/auth';
import {
  createActivityRequestSchema,
  type ActivityFormData,
} from '@corpcal/shared/schemas';

import {
  deleteActivity,
  requestDeleteActivity,
  restoreActivity,
  softDeleteActivity,
  updateActivity,
} from '../api/activitiesApi';
import ActivityHistory from '../components/activities/ActivityHistory';
import { DeleteActivityModal } from '../components/activities/DeleteActivityModal';
import { EditActivityConfirmModal } from '../components/activities/EditActivityConfirmModal';
import { RequestDeleteActivityModal } from '../components/activities/RequestDeleteActivityModal';
import { ActivityBreadcrumb } from '../components/ActivityBreadcrumb';
import { ActivityFormBody } from '../components/ActivityFormBody';
import { ActivityPageHeader } from '../components/ActivityPageHeader';
import { ActivityStatusBanner } from '../components/ActivityStatusBanner';
import { FormErrorFallback } from '../components/FormErrorFallback';
import { LockBanner } from '../components/LockBanner';
import { Button } from '../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Form } from '../components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../components/ui/popover';
import { useActivityLock } from '../hooks/useActivityLock';
import { useAuth } from '../hooks/useAuth';
import { useFormLookups } from '../hooks/useFormLookups';
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
import type { ActivityLayoutContext } from './ActivityLayout';

const logger = createLogger('ActivityEditPage');

const UNSAVED_MESSAGE = 'You have unsaved changes. Leave anyway?';

export function ActivityEditPage(): React.ReactElement {
  const { activity, refreshActivity } =
    useOutletContext<ActivityLayoutContext>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const id = activity.id;
  const lookups = useFormLookups();
  const isAdminOrSysAdmin =
    user?.roleName === SYSTEM_ROLES.ADMIN ||
    user?.roleName === SYSTEM_ROLES.SYSTEM_ADMIN;
  const isCommsContact =
    activity.commsContacts?.some((c) => c.userId === user?.id) ?? false;
  const activityStatusName = activity.activityStatus ?? '';
  const isBlockedStatus =
    activityStatusName === 'delete_requested' ||
    activityStatusName === 'deleted';
  const canRestore = isCommsContact || isAdminOrSysAdmin;

  const { data: dateStatuses } = useDateStatuses();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showRequestDeleteModal, setShowRequestDeleteModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
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

  const {
    lock: _lock,
    isOwnLock: _isOwnLock,
    lockedByOther,
    lockedByUsername,
    isLoading: lockLoading,
    release,
  } = useActivityLock(id);

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
    if (
      lookups.governmentRepresentatives?.length &&
      lookups.categories?.length
    ) {
      const mapped = activityToFormData(activity, lookups);
      form.reset(mapped);
      initialFormDataRef.current = mapped;
    }
  }, [activity, lookups, form]);

  // Warn on tab close/refresh when there are unsaved changes (in-app navigation is guarded by Cancel dialog; full back/link blocking would require createBrowserRouter + useBlocker)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const viewPath = `/activity/${id}`;

  const handleCancel = async () => {
    if (isDirty) {
      setShowLeaveConfirm(true);
      return;
    }
    await release();
    void navigate(viewPath);
  };

  const handleConfirmLeave = async () => {
    setShowLeaveConfirm(false);
    await release();
    void navigate(viewPath);
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
          markAsReviewed: isAdminOrSysAdmin ? markAsReviewed : undefined,
        }),
        ...(notes ? { activityHistoryNotes: notes } : {}),
      } as Parameters<typeof updateActivity>[1];
      await updateActivity(id, submitData);
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
      await restoreActivity(id);
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
      await requestDeleteActivity(id, { reason });
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
      await softDeleteActivity(id, { reason });
      await refreshActivity();
      setShowDeleteModal(false);
      toast.success('Activity soft deleted');
    } catch (err) {
      logger.error('Failed to soft delete activity', err);
      showErrorToast(err);
    } finally {
      setIsDeleteSubmitting(false);
    }
  };

  const handleHardDelete = async (reason: string) => {
    setIsDeleteSubmitting(true);
    try {
      await deleteActivity(id);
      setShowDeleteModal(false);
      toast.success('Activity permanently deleted');
      void navigate('/');
    } catch (err) {
      logger.error('Failed to delete activity', err);
      showErrorToast(err);
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
  const readOnly = lockedByOther || lockLoading || isBlockedStatus;

  const showRequestDeleteButton =
    !isBlockedStatus && isCommsContact && !isAdminOrSysAdmin;
  const showDeleteButton = !isBlockedStatus && isAdminOrSysAdmin;

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
      {lockedByOther && <LockBanner lockedByUsername={lockedByUsername} />}
      {isBlockedStatus && (
        <ActivityStatusBanner
          status={activityStatusName}
          canRestore={canRestore}
          onRestore={handleRestore}
          isRestoring={isRestoring}
        />
      )}
      <FormProvider {...form}>
        <Form {...form}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void form.handleSubmit(onSubmit, onError)(e);
            }}
          >
            <ActivityFormBody
              form={form}
              lookups={lookups}
              readOnly={readOnly}
            />
            <div className="flex flex-wrap items-center justify-between gap-4 pt-6">
              <div className="flex gap-2">
                {showRequestDeleteButton && (
                  <Button
                    type="button"
                    variant="outline"
                    className="text-destructive border-destructive hover:bg-destructive/10"
                    onClick={() => setShowRequestDeleteModal(true)}
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
                    onClick={() => setShowDeleteModal(true)}
                    disabled={isSubmitting}
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
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                {!isFormValid && missingFields.length > 0 ? (
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
                  <Button
                    type="submit"
                    disabled={isSubmitting || readOnly}
                  >
                    {isSubmitting ? 'Updating...' : 'Update'}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>
      </FormProvider>
      <ActivityHistory
        activityId={id}
        open={historyOpen}
        onOpenChange={(v) => setHistoryOpen(!!v)}
        dateStatuses={dateStatuses}
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
        dateStatuses={dateStatuses}
        onConfirm={(notes, markAsReviewed) =>
          void handleConfirmedSubmit(notes, markAsReviewed)
        }
        isSubmitting={isSubmitting}
        showMarkAsReviewed={isAdminOrSysAdmin}
      />
      <RequestDeleteActivityModal
        open={showRequestDeleteModal}
        onOpenChange={setShowRequestDeleteModal}
        onConfirm={handleRequestDeleteConfirm}
        isSubmitting={isRequestDeleteSubmitting}
      />
      <DeleteActivityModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        onSoftDelete={handleSoftDelete}
        onHardDelete={handleHardDelete}
        isSubmitting={isDeleteSubmitting}
      />
    </ErrorBoundary>
  );
}
