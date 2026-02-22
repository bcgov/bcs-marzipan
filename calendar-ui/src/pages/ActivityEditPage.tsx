import { zodResolver } from '@hookform/resolvers/zod';
import { ErrorBoundary } from 'react-error-boundary';
import { FormProvider, useForm, type Resolver } from 'react-hook-form';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';

import {
  createActivityRequestSchema,
  type ActivityFormData,
} from '@corpcal/shared/schemas';

import { updateActivity } from '../api/activitiesApi';
import ActivityHistory from '../components/activities/ActivityHistory';
import { ActivityBreadcrumb } from '../components/ActivityBreadcrumb';
import { ActivityFormBody } from '../components/ActivityFormBody';
import { ActivityPageHeader } from '../components/ActivityPageHeader';
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
import { useActivityLock } from '../hooks/useActivityLock';
import { useFormLookups } from '../hooks/useFormLookups';
import { useDateStatuses } from '../hooks/useLookups';
import { getDefaultFormValues } from '../lib/activity-form-defaults';
import { activityToFormData } from '../lib/activity-form-mapper';
import { buildPayloadForUpdate } from '../lib/activity-form-payload';
import { getActivityUpdatedToastOptions } from '../lib/activity-toast-options';
import { showErrorToast } from '../lib/error-toast';
import { createLogger } from '../lib/logger';
import type { ActivityLayoutContext } from './ActivityLayout';

const logger = createLogger('ActivityEditPage');

const UNSAVED_MESSAGE = 'You have unsaved changes. Leave anyway?';

export function ActivityEditPage(): React.ReactElement {
  const { activity } = useOutletContext<ActivityLayoutContext>();
  const navigate = useNavigate();
  const id = activity.id;
  const lookups = useFormLookups();
  const { data: dateStatuses } = useDateStatuses();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

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

  useEffect(() => {
    if (
      lookups.governmentRepresentatives?.length &&
      lookups.categories?.length
    ) {
      form.reset(activityToFormData(activity, lookups));
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

  const onSubmit = async (data: ActivityFormData) => {
    setIsSubmitting(true);
    try {
      const formValues = form.getValues();
      const submitData = buildPayloadForUpdate(data, formValues) as Parameters<
        typeof updateActivity
      >[1];
      await updateActivity(id, submitData);
      toast.success(
        'Activity updated',
        getActivityUpdatedToastOptions({
          id: String(id),
          title: data.title ?? '',
          displayId: activity.displayId ?? undefined,
        })
      );
      await release();
      void navigate('/');
    } catch (err) {
      logger.error('Failed to update activity', err);
      showErrorToast(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onError = () => {
    logger.error('Form validation failed');
  };

  const displayId = activity.displayId ?? `ACT-${activity.id}`;
  const categories = activity.category ?? [];
  const readOnly = lockedByOther || lockLoading;

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
            <div className="flex justify-end gap-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleCancel()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || readOnly}>
                {isSubmitting ? 'Updating...' : 'Update'}
              </Button>
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
    </ErrorBoundary>
  );
}
