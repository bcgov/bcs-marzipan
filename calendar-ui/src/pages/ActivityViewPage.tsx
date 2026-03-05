import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm, type Resolver } from 'react-hook-form';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { toast } from 'sonner';
import { useEffect, useRef, useState } from 'react';

import { PERMISSIONS, SYSTEM_ROLES } from '@corpcal/shared/auth';
import {
  createActivityRequestSchema,
  type ActivityFormData,
} from '@corpcal/shared/schemas';

import { fetchActivityHistory } from '../api/activitiesApi';
import { ApiError } from '../api/errors';
import { DeleteActivityModal } from '../components/activities/DeleteActivityModal';
import { ActivityBreadcrumb } from '../components/ActivityBreadcrumb';
import { ActivityFormBody } from '../components/ActivityFormBody';
import { ActivityPageHeader } from '../components/ActivityPageHeader';
import { ActivityStatusBanner } from '../components/ActivityStatusBanner';
import { normalizeActivityStatus } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Form } from '../components/ui/form';
import { useAuth } from '../hooks/useAuth';
import {
  useDeleteActivity,
  useRestoreActivity,
  useSoftDeleteActivity,
} from '../hooks/useCalendar';
import { useFormLookups } from '../hooks/useFormLookups';
import { useLeadTeamOptions } from '../hooks/useLeadTeamOptions';
import { getDefaultFormValues } from '../lib/activity-form-defaults';
import { activityToFormData } from '../lib/activity-form-mapper';
import { showErrorToast } from '../lib/error-toast';
import { createLogger } from '../lib/logger';
import type { ActivityLayoutContext } from './ActivityLayout';

const logger = createLogger('ActivityViewPage');

/**
 * View-only activity page. Clicking/focusing any field navigates to edit (replace) so back goes to list.
 */
export function ActivityViewPage(): React.ReactElement {
  const { activity, refreshActivity } =
    useOutletContext<ActivityLayoutContext>();
  const navigate = useNavigate();
  const { hasPermission, user } = useAuth();
  const canEdit = hasPermission(PERMISSIONS.ACTIVITIES.EDIT);
  const lookups = useFormLookups();
  const { data: leadTeamOptions = [] } = useLeadTeamOptions(true);
  const hasNavigatedRef = useRef(false);
  const readyRef = useRef(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteModalInitialNotes, setDeleteModalInitialNotes] = useState<
    string | undefined
  >(undefined);
  const [isDeleteSubmitting, setIsDeleteSubmitting] = useState(false);

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
  const canRestore = isCommsContact || isLeadTeamMember || isAdminOrSysAdmin;

  // Delete button only for users with activities.delete (e.g. Admin, System Admin)
  const canDelete = hasPermission(PERMISSIONS.ACTIVITIES.DELETE);
  const canRequestDelete = hasPermission(PERMISSIONS.ACTIVITIES.REQUEST_DELETE);
  const showDeleteButton = canDelete;
  const showRequestDeleteButton =
    !isBlockedStatus &&
    (isCommsContact || isLeadTeamMember) &&
    canRequestDelete &&
    !canDelete;
  const restoreMutation = useRestoreActivity();
  const deleteMutation = useDeleteActivity();
  const softDeleteMutation = useSoftDeleteActivity();

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      await restoreMutation.mutateAsync({ id: activity.id });
      await refreshActivity();
      toast.success('Activity restored');
    } catch (err) {
      logger.error('Failed to restore activity', err);
      showErrorToast(err);
    } finally {
      setIsRestoring(false);
    }
  };

  const handleOpenDeleteModal = async () => {
    if (normalizedStatus === 'delete_requested') {
      try {
        const history = await fetchActivityHistory(activity.id);
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
  };

  const handleSoftDelete = async (reason: string) => {
    setIsDeleteSubmitting(true);
    try {
      await softDeleteMutation.mutateAsync({
        id: activity.id,
        body: { reason },
      });
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
        id: activity.id,
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

  const form = useForm<ActivityFormData>({
    resolver: zodResolver(
      createActivityRequestSchema
    ) as Resolver<ActivityFormData>,
    mode: 'onChange',
    defaultValues: getDefaultFormValues(),
  });

  useEffect(() => {
    readyRef.current = false;
    form.reset(activityToFormData(activity, lookups));
    requestAnimationFrame(() => {
      readyRef.current = true;
    });
  }, [activity, lookups, form]);

  const handleEnterEdit = () => {
    if (!canEdit || !readyRef.current || hasNavigatedRef.current) return;
    // When status is delete_requested or deleted, only admins may go to edit
    if (isBlockedStatus && !isAdminOrSysAdmin) return;
    hasNavigatedRef.current = true;
    void navigate('edit', { replace: true });
  };

  const displayId = activity.displayId ?? `ACT-${activity.id}`;
  const categories = activity.category ?? [];

  return (
    <>
      <ActivityBreadcrumb currentLabel={displayId} />
      <ActivityPageHeader
        displayId={displayId}
        title={activity.title ?? ''}
        categories={categories}
        leadOrg={activity.leadOrg ?? null}
        activityStatus={activity.activityStatus ?? null}
        lastUpdatedDateTime={activity.lastUpdatedDateTime ?? null}
        createdDateTime={activity.createdDateTime ?? null}
        onHistoryClick={undefined}
      />
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
            className="cursor-pointer"
            onSubmit={(e) => e.preventDefault()}
            onFocus={() => handleEnterEdit()}
            onClick={() => handleEnterEdit()}
          >
            <ActivityFormBody
              form={form}
              lookups={lookups}
              readOnly={true}
              leadTeamOptions={leadTeamOptions}
            />
            <div className="flex flex-wrap items-center justify-between gap-4 pt-6">
              <div className="flex gap-2">
                {showRequestDeleteButton && (
                  <Button
                    type="button"
                    variant="outline"
                    className="text-destructive border-destructive hover:bg-destructive/10"
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
                      void handleOpenDeleteModal();
                    }}
                  >
                    Delete
                  </Button>
                )}
              </div>
              <div className="flex gap-4">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
                <Button type="button">Edit</Button>
              </div>
            </div>
          </form>
        </Form>
      </FormProvider>
      <DeleteActivityModal
        open={showDeleteModal}
        onOpenChange={(open) => {
          setShowDeleteModal(open);
          if (!open) setDeleteModalInitialNotes(undefined);
        }}
        activityId={activity.id}
        displayId={displayId}
        onSoftDelete={handleSoftDelete}
        onHardDelete={handleHardDelete}
        isSubmitting={isDeleteSubmitting}
        initialNotes={deleteModalInitialNotes}
      />
    </>
  );
}
