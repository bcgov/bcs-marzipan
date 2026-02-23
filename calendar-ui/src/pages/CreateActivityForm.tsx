import { zodResolver } from '@hookform/resolvers/zod';
import { ErrorBoundary } from 'react-error-boundary';
import { useForm, type Resolver } from 'react-hook-form';
import { toast } from 'sonner';
import React, { useEffect, useRef, useState, type FC } from 'react';

import { PERMISSIONS } from '@corpcal/shared/auth';
import { ActivityStatusName } from '@corpcal/shared/constants/constants';
import {
  createActivityRequestSchema,
  type ActivityFormData,
} from '@corpcal/shared/schemas';

import { createActivity } from '../api/activitiesApi';
import { CreateActivityConfirmModal } from '../components/activities/CreateActivityConfirmModal';
import { ActivityBreadcrumb } from '../components/ActivityBreadcrumb';
import { ActivityFormBody } from '../components/ActivityFormBody';
import { AutosaveIndicator } from '../components/AutosaveIndicator';
import { FormErrorFallback } from '../components/FormErrorFallback';
import { PageHeader } from '../components/PageHeader';
import { StatusMessage } from '../components/StatusMessage';
import { Button } from '../components/ui/button';
import { Form } from '../components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../components/ui/popover';
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  ResumeDialog,
} from '../components/ui/resumeDraftDialog';
import { useAuth } from '../hooks/useAuth';
import { useAutoSave } from '../hooks/useAutoSave';
import { useFormLookups } from '../hooks/useFormLookups';
import { useDateStatuses, useTimeStatuses } from '../hooks/useLookups';
import {
  DEFAULT_FORM_VALUES,
  getDefaultFormValues,
} from '../lib/activity-form-defaults';
import { getActivityFieldLabel } from '../lib/activity-form-labels';
import { buildPayloadForCreate } from '../lib/activity-form-payload';
import {
  ACCESS_DENIED_CREATE_ACTIVITY_MESSAGE,
  ACCESS_DENIED_TITLE,
} from '../lib/error-messages';
import { showErrorToast } from '../lib/error-toast';
import { getMissingRequiredFields } from '../lib/form-utils';
import { createLogger } from '../lib/logger';

// Key used to store draft dialog session state in sessionStorage
const DRAFT_DIALOG_SESSION_KEY = 'create-activity-draft-dialog';

const logger = createLogger('CreateActivityForm');

export const CreateActivityForm: FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMissingFieldsPopover, setShowMissingFieldsPopover] =
    useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [validatedData, setValidatedData] = useState<ActivityFormData | null>(
    null
  );
  const draftCheckedRef = useRef(false);

  // Check permissions and auth state (userId is used internally by useAutoSave)
  const {
    hasPermission,
    isLoading: isAuthLoading,
    isAuthenticated,
  } = useAuth();
  const canCreateActivity = hasPermission(PERMISSIONS.ACTIVITIES.CREATE);

  // Fetch date and time statuses
  const { data: dateStatuses } = useDateStatuses();
  const { data: timeStatuses } = useTimeStatuses();

  // Fetch all lookup data
  const lookups = useFormLookups();

  const form = useForm<ActivityFormData>({
    resolver: zodResolver(
      createActivityRequestSchema
    ) as Resolver<ActivityFormData>,
    mode: 'onChange', // Validate on change to enable real-time validation
    defaultValues: {
      ...getDefaultFormValues(),
    },
  });

  // Set default date and time statuses to "unknown" when they're loaded
  useEffect(() => {
    if (dateStatuses && !form.getValues('dateStatusId')) {
      const unknownStatus = dateStatuses.find((s) => s.name === 'unknown');
      if (unknownStatus) {
        form.setValue('dateStatusId', unknownStatus.id);
      }
    }
  }, [dateStatuses, form]);

  useEffect(() => {
    if (timeStatuses && !form.getValues('timeStatusId')) {
      const unknownStatus = timeStatuses.find((s) => s.name === 'unknown');
      if (unknownStatus) {
        form.setValue('timeStatusId', unknownStatus.id);
      }
    }
  }, [timeStatuses, form]);

  // Set default activityStatusId to "new" when lookups are loaded
  useEffect(() => {
    if (lookups.activityStatuses.length > 0) {
      const currentValue = form.getValues('activityStatusId');
      // Only set if not already set (undefined, null, or 0 are considered unset)
      if (currentValue === undefined || currentValue === null) {
        const newStatus = lookups.activityStatuses.find(
          (status) => status.name === ('new' satisfies ActivityStatusName)
        );
        if (newStatus) {
          form.setValue('activityStatusId', newStatus.id, {
            shouldValidate: true,
          });
        }
      }
    }
  }, [lookups.activityStatuses, form]);

  // Get form values for autosave - use subscription pattern to avoid infinite loops
  const [formValues, setFormValues] = useState<Partial<ActivityFormData>>(() =>
    form.getValues()
  );
  const previousValuesRef = useRef<string>('');

  useEffect(() => {
    // Subscribe to form changes and only update state when values actually change
    const subscription = form.watch((values) => {
      const newValues = values as Partial<ActivityFormData>;
      const newValuesStr = JSON.stringify(newValues);

      // Only update if values actually changed
      if (newValuesStr !== previousValuesRef.current) {
        previousValuesRef.current = newValuesStr;
        setFormValues(newValues);
      }
    });

    // Initialize previous values ref
    previousValuesRef.current = JSON.stringify(form.getValues());

    return () => subscription.unsubscribe();
  }, [form]);

  // Autosave integration: userId comes from auth context inside useAutoSave
  const initialDraftExistsRef = useRef(false);
  const [showDraftDialog, setShowDraftDialog] = useState(false);

  const {
    existingDraft,
    isDraftLoading,
    isSaving,
    lastSaved,
    deleteDraft,
    resetInitialFormData,
  } = useAutoSave(
    'activity',
    formValues,
    undefined,
    {
      debounceMs: 3000, // Save 3 seconds after user stops typing
      enabled: !isSubmitting, // Disable during submission
      onSaveError: (err) => {
        logger.error('Draft save failed', err);
        showErrorToast(err, 'Draft could not be saved.');
      },
    },
    DEFAULT_FORM_VALUES
  );

  // On first load, record if a draft existed at mount, and only ever show dialog if it did
  const didCheckInitialDraft = useRef(false);
  useEffect(() => {
    if (isDraftLoading || didCheckInitialDraft.current) return;
    didCheckInitialDraft.current = true;
    if (
      existingDraft?.draftData &&
      Object.keys(existingDraft.draftData).length > 0
    ) {
      initialDraftExistsRef.current = true;
      setShowDraftDialog(true);
    } else {
      initialDraftExistsRef.current = false;
    }
  }, [existingDraft, isDraftLoading]);

  // Prevent dialog from ever being shown if a draft did not exist at mount
  useEffect(() => {
    if (!isDraftLoading && !initialDraftExistsRef.current && showDraftDialog) {
      setShowDraftDialog(false);
    }
  }, [isDraftLoading, showDraftDialog]);

  // ...existing code...
  // Reset dialog session flag if user starts fresh or continues draft
  const handleContinueDraft = () => {
    if (existingDraft?.draftData) {
      form.reset(existingDraft.draftData as ActivityFormData);
    }
    setShowDraftDialog(false);
    sessionStorage.removeItem(DRAFT_DIALOG_SESSION_KEY);
  };

  const handleStartFresh = () => {
    if (existingDraft) {
      deleteDraft();
    }
    setShowDraftDialog(false);
    draftCheckedRef.current = false;
    form.reset(getDefaultFormValues(), {
      keepDirty: false,
      keepTouched: false,
    });
    resetInitialFormData();
    sessionStorage.removeItem(DRAFT_DIALOG_SESSION_KEY);
  };

  const handleCancel = () => {
    // Delete the draft if it exists (hook uses delete-by-form; no need to await for close)
    if (existingDraft) {
      try {
        deleteDraft();
      } catch (e) {
        logger.warn('Error deleting draft on cancel', e);
      }
    }

    sessionStorage.removeItem(DRAFT_DIALOG_SESSION_KEY);
    form.reset();
    window.close();
  };

  const onSubmit = (data: ActivityFormData) => {
    setValidatedData(data);
    setShowConfirmModal(true);
  };

  const handleConfirmedSubmit = async (notes?: string) => {
    if (!validatedData) return;
    setIsSubmitting(true);
    try {
      const formValues = form.getValues();
      const submitData = buildPayloadForCreate(validatedData, formValues);
      const payload = {
        ...submitData,
        ...(notes ? { activityHistoryNotes: notes } : {}),
      } as Parameters<typeof createActivity>[0];

      await createActivity(payload);

      if (existingDraft) {
        deleteDraft();
      }

      toast.success('Activity created', {
        id: 'activity-created',
        description: validatedData.title
          ? `${validatedData.title}`
          : 'Your activity has been created.',
        duration: 2500,
      });
      // Brief delay so the success toast is visible before the popup closes
      await new Promise((resolve) => setTimeout(resolve, 1500));
      window.close();
    } catch (error) {
      logger.error('Failed to create activity', error);
      showErrorToast(error);
      // User remains on the form so they can correct and retry; do not close/navigate
    } finally {
      setIsSubmitting(false);
      setShowConfirmModal(false);
      setValidatedData(null);
    }
  };

  const onError = () => {
    logger.error('Form validation failed');
  };

  const isFormValid = form.formState.isValid;
  const missingFields = getMissingRequiredFields(
    form.formState,
    getActivityFieldLabel
  );

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
      <ResumeDialog open={showDraftDialog} onOpenChange={setShowDraftDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Continue where you left off?</DialogTitle>
            <DialogDescription>
              You have a saved draft for this activity form. Would you like to
              continue editing it, or start with a fresh form?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleStartFresh} type="button">
              Start Fresh
            </Button>
            <Button onClick={handleContinueDraft} type="button">
              Continue Draft
            </Button>
          </DialogFooter>
        </DialogContent>
      </ResumeDialog>

      <ActivityBreadcrumb currentLabel="New activity" />
      <PageHeader
        title="Create New Activity"
        description="Fill in the activity details below"
        action={
          <AutosaveIndicator
            isAuthenticated={isAuthenticated}
            isSaving={isSaving}
            lastSaved={lastSaved}
            isLoading={isDraftLoading}
          />
        }
      />

      <Form {...form}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void form.handleSubmit(onSubmit, onError)(e);
          }}
        >
          <ActivityFormBody form={form} lookups={lookups} readOnly={false} />

          <div className="flex justify-end gap-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void handleCancel();
              }}
              disabled={isSubmitting}
              title="This will discard any draft data and close the page"
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
                      {isSubmitting ? 'Submitting...' : 'Submit'}
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
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </Button>
            )}
          </div>
        </form>
      </Form>

      <CreateActivityConfirmModal
        open={showConfirmModal}
        onOpenChange={(open) => {
          setShowConfirmModal(open);
          if (!open) setValidatedData(null);
        }}
        formData={form.getValues()}
        lookups={lookups}
        dateStatuses={dateStatuses}
        timeStatuses={timeStatuses}
        onConfirm={(notes) => void handleConfirmedSubmit(notes)}
        isSubmitting={isSubmitting}
      />
    </ErrorBoundary>
  );
};
