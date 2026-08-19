import { ErrorBoundary } from 'react-error-boundary';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useMemo, useState, type FC } from 'react';

import { PERMISSIONS } from '@corpcal/shared/auth';
import {
  createActivityRequestSchema,
  type ActivityFormData,
  type CreateActivityRequest,
} from '@corpcal/shared/schemas';
import {
  ActivityFormBody,
  ActivityFormMissingFieldsHint,
  ActivityFormStickyHeader,
} from '@/components/activity';
import { CreateActivityConfirmModal } from '@/components/activity/activities/CreateActivityConfirmModal';
import { PageHeader } from '@/components/layout';
import { FormErrorFallback, StatusMessage } from '@/components/shared';
import { Button } from '@/components/ui/button';

import { Form } from '../components/ui/form';
import { useActivityFormSetup } from '../hooks/useActivityFormSetup';
import { useActivityFormSubmitState } from '../hooks/useActivityFormSubmitState';
import { useAuth } from '../hooks/useAuth';
import { useCreateActivity } from '../hooks/useCalendar';
import { getActivityFieldLabel } from '../lib/activity-form-labels';
import { getActivityFormBackTarget } from '../lib/activity-form-navigation-state';
import { buildPayloadForCreate } from '../lib/activity-form-payload';
import { resolveTranslationRequiredStatusId } from '../lib/activity-form-translation-required';
import { showActivityMutationSuccessToast } from '../lib/activity-mutation-success-toast';
import { resolveActivityToastDisplayId } from '../lib/activity-toast-options';
import {
  ACCESS_DENIED_CREATE_ACTIVITY_MESSAGE,
  ACCESS_DENIED_TITLE,
} from '../lib/error-messages';
import { showErrorToast } from '../lib/error-toast';
import {
  focusFirstMissingRequiredField,
  focusRequiredField,
} from '../lib/form-utils';
import { createLogger } from '../lib/logger';

const logger = createLogger('CreateActivityForm');

/** Create flow: navigates back to the list (or `location.state.from`) after submit/cancel; same-tab as Activity list. */
export const CreateActivityForm: FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const listOrBackPath = getActivityFormBackTarget(location.state) ?? '/';

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [validatedData, setValidatedData] = useState<ActivityFormData | null>(
    null
  );

  const createMutation = useCreateActivity();
  const { hasPermission, isLoading: isAuthLoading, user } = useAuth();
  const canCreateActivity = hasPermission(PERMISSIONS.ACTIVITIES.CREATE);
  const hasCreateAny = hasPermission(PERMISSIONS.ACTIVITIES.CREATE_ANY);
  const canReviewActivities = hasPermission(PERMISSIONS.ACTIVITIES.REVIEW);
  const canViewActivity = hasPermission(PERMISSIONS.ACTIVITIES.VIEW);

  const {
    form,
    lookups,
    leadTeamOptions,
    leadTeamOptionsError,
    leadTeamOptionsFetching,
    refetchLeadTeamOptions,
    commsContactCandidates,
  } = useActivityFormSetup({
    mode: 'create',
    leadTeamFetchEnabled: canCreateActivity,
    userId: user?.id,
    userTeamIds: user?.teamIds,
    hasCreateAny,
  });

  const {
    isFormValid,
    missingFields,
    missingFieldItems,
    missingFieldsHelperText,
  } = useActivityFormSubmitState(form, {
    getFieldLabel: getActivityFieldLabel,
    schema: createActivityRequestSchema,
  });

  const requiredTranslationStatusId = useMemo(
    () =>
      resolveTranslationRequiredStatusId(lookups.translationRequiredStatuses),
    [lookups.translationRequiredStatuses]
  );

  const handleCancel = () => {
    void form.reset();
    void navigate(listOrBackPath);
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
    const titleForToast = validatedData.title;
    setIsSubmitting(true);
    try {
      const formValues = form.getValues();
      const submitData = buildPayloadForCreate(validatedData, formValues, {
        markAsReviewed: canReviewActivities ? markAsReviewed : undefined,
        requiredTranslationStatusId,
      });
      const payload = {
        ...submitData,
        ...(notes ? { activityHistoryNotes: notes } : {}),
      } as CreateActivityRequest;

      const created = await createMutation.mutateAsync(payload);
      const newActivityId = created.id;

      // Close the dialog before toast/navigation so we are not animating the portal while the route tears down.
      setShowConfirmModal(false);
      setValidatedData(null);
      setIsSubmitting(false);

      const toastId = `activity-created-${newActivityId}`;
      const subtitleTitle =
        (titleForToast ?? '').trim().length > 0
          ? (titleForToast ?? '')
          : (created.title ?? '');
      showActivityMutationSuccessToast({
        toastId,
        kind: 'created',
        displayId: resolveActivityToastDisplayId(
          created.displayId,
          newActivityId
        ),
        title: subtitleTitle,
        activityId: newActivityId,
        showViewButton: canViewActivity,
        onViewNavigate: (aid) => {
          void navigate(`/activity/${aid}`);
        },
      });

      void navigate(listOrBackPath, { replace: true });
    } catch (error) {
      logger.error('Failed to create activity', error);
      showErrorToast(
        error,
        'Your activity could not be created. If the problem persists, please contact calendar admins.'
      );
      setIsSubmitting(false);
    }
  };

  const onError = () => {
    logger.error('Form validation failed');
    focusFirstMissingRequiredField(missingFieldItems);
    const detail =
      missingFields.length > 0
        ? `Required fields missing: ${missingFields.join(', ')}`
        : 'Please fix the validation errors and try again.';
    toast.error('Submission failed', {
      description: detail,
      duration: 6000,
    });
  };

  // Show loading state while checking auth
  if (isAuthLoading) {
    return (
      <StatusMessage
        title="Create New Activity"
        message="Loading..."
        variant="loading"
      />
    );
  }

  // Show access denied if user doesn't have permission to create activities
  if (!canCreateActivity) {
    return (
      <StatusMessage
        title={ACCESS_DENIED_TITLE}
        message={ACCESS_DENIED_CREATE_ACTIVITY_MESSAGE}
        variant="error"
      />
    );
  }

  // Show loading state if lookups are still loading
  if (lookups.isLoading) {
    return (
      <StatusMessage
        title="Create New Activity"
        message="Loading form data..."
        variant="loading"
      />
    );
  }

  // Show error state if lookups failed (but still allow form to be used with empty dropdowns)
  if (lookups.hasError) {
    logger.warn(
      'Failed to load some lookup data. Form may have empty dropdowns.'
    );
  }

  return (
    <ErrorBoundary FallbackComponent={FormErrorFallback}>
      <ActivityFormStickyHeader />
      <PageHeader title="Create New Activity" />

      <Form {...form}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void form.handleSubmit(onSubmit, onError)(e);
          }}
        >
          {canCreateActivity && leadTeamOptionsError && (
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
            readOnly={false}
            showChangedBadges={false}
            leadTeamField={{
              options: leadTeamOptions,
              displayLabel: null,
              optionsFetching: leadTeamOptionsFetching,
            }}
          />

          <div className="bg-background sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-4 py-4">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  void handleCancel();
                }}
                disabled={isSubmitting}
                title="Close the create window without saving"
              >
                Cancel
              </Button>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-4">
              {missingFieldsHelperText != null && (
                <ActivityFormMissingFieldsHint
                  helperText={missingFieldsHelperText}
                  fields={missingFieldItems}
                  onFieldSelect={focusRequiredField}
                />
              )}
              <Button
                type="submit"
                variant="default"
                disabled={isSubmitting}
                className={!isFormValid ? 'cursor-not-allowed' : undefined}
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </Button>
            </div>
          </div>
        </form>
      </Form>

      {showConfirmModal ? (
        <CreateActivityConfirmModal
          open
          onOpenChange={(open) => {
            if (!open) {
              setShowConfirmModal(false);
              setValidatedData(null);
            }
          }}
          formData={form.getValues()}
          lookups={lookups}
          dateStatuses={lookups.dateStatuses}
          timeStatuses={lookups.timeStatuses}
          leadTeamOptions={leadTeamOptions}
          onConfirm={(notes, markAsReviewed) =>
            void handleConfirmedSubmit(notes, markAsReviewed)
          }
          showMarkAsReviewed={canReviewActivities}
          isSubmitting={isSubmitting}
        />
      ) : null}
    </ErrorBoundary>
  );
};
