import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect, useRef, type FC } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import {
  createActivityRequestSchema,
  type CreateActivityRequest,
} from '@corpcal/shared/schemas';
import { ActivityStatusName } from '@corpcal/shared/constants/constants';
import { PERMISSIONS } from '@corpcal/shared/auth';
import { createActivity } from '../api/activitiesApi';
import { Button } from '../components/ui/button';
import { Form } from '../components/ui/form';
import { useAutoSave } from '../hooks/useAutoSave';
import { useAuth } from '../hooks/useAuth';
import { getMissingRequiredFields } from '../lib/form-utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../components/ui/popover';
import {
  ResumeDialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/resumeDraftDialog';
import { useFormLookups } from '../hooks/useFormLookups';
import { useDateStatuses, useTimeStatuses } from '../hooks/useLookups';
import {
  ActivityOverviewSection,
  ActivityScheduleSection,
  ActivityCommsSection,
  ActivityNewsReleaseSection,
  ActivityEventSection,
  ActivityReportsSection,
  ActivitySharingSection,
} from '../components/ActivityFormSections';
import { AutosaveIndicator } from '../components/AutosaveIndicator';
import { PageHeader } from '../components/PageHeader';
import { StatusMessage } from '../components/StatusMessage';
import React from 'react';

type FormData = CreateActivityRequest & {
  categoryIds?: number[];
  tagIds?: number[];
  commsMaterialIds?: number[];
  translationLanguageIds?: number[];
  sharedWithMinistryIds?: string[];
};

/**
 * Default form values that match the FormData type.
 * Used for both form initialization and reset operations.
 */
const getDefaultFormValues = (): Partial<FormData> => ({
  isAllDay: false,
  isIssue: false,
  isConfidential: false,
  categoryIds: [],
  tagIds: [],
  commsMaterialIds: [],
  translationLanguageIds: [],
  representatives: [],
  sharedWithMinistryIds: [],
  reportSettings: [],
  // Set these to match what the effects set on mount
  dateStatusId: 1, // Default to 1, or whatever the 'unknown' status id is
  timeStatusId: 1, // Default to 1, or whatever the 'unknown' status id is
  pitchRequired: false,
});

/** Stable default values for autosave comparison and reset (e.g. start fresh). */
const DEFAULT_FORM_VALUES = getDefaultFormValues();

// Key used to store draft dialog session state in sessionStorage
const DRAFT_DIALOG_SESSION_KEY = 'create-activity-draft-dialog';

export const CreateActivityForm: FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMissingFieldsPopover, setShowMissingFieldsPopover] =
    useState(false);
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

  const form = useForm<FormData>({
    resolver: zodResolver(createActivityRequestSchema) as any,
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
        form.setValue('dateStatusId', unknownStatus.id as number);
      }
    }
  }, [dateStatuses, form]);

  useEffect(() => {
    if (timeStatuses && !form.getValues('timeStatusId')) {
      const unknownStatus = timeStatuses.find((s) => s.name === 'unknown');
      if (unknownStatus) {
        form.setValue('timeStatusId', unknownStatus.id as number);
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
  const [formValues, setFormValues] = useState<Partial<FormData>>(() =>
    form.getValues()
  );
  const previousValuesRef = useRef<string>('');

  useEffect(() => {
    // Subscribe to form changes and only update state when values actually change
    const subscription = form.watch((values) => {
      const newValues = values as Partial<FormData>;
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
      form.reset(existingDraft.draftData as FormData);
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
        console.warn('Error deleting draft on cancel:', e);
      }
    }

    sessionStorage.removeItem(DRAFT_DIALOG_SESSION_KEY);
    form.reset();
    window.close();
  };

  const onSubmit = async (data: FormData) => {
    console.log('onSubmit called with data:', data);
    setIsSubmitting(true);
    try {
      // Prepare submit data with junction table arrays
      const formValues = form.getValues();
      const submitData = {
        ...data,
        activityStatusId: data.activityStatusId,
        startDate: data.startDate || null,
        endDate: data.endDate || null,
        startTime: data.startTime || null,
        endTime: data.endTime || null,
        categoryIds:
          formValues.categoryIds && formValues.categoryIds.length > 0
            ? formValues.categoryIds
            : undefined,
        tagIds:
          formValues.tagIds && formValues.tagIds.length > 0
            ? formValues.tagIds
            : undefined,
        commsMaterialIds:
          formValues.commsMaterialIds && formValues.commsMaterialIds.length > 0
            ? formValues.commsMaterialIds
            : undefined,
        translationLanguageIds:
          formValues.translationLanguageIds &&
          formValues.translationLanguageIds.length > 0
            ? formValues.translationLanguageIds
            : undefined,
        representatives:
          formValues.representatives && formValues.representatives.length > 0
            ? formValues.representatives
            : undefined,
        sharedWithMinistryIds:
          formValues.sharedWithMinistryIds &&
          formValues.sharedWithMinistryIds.length > 0
            ? formValues.sharedWithMinistryIds
            : undefined,
      };

      console.log('Submitting data to API:', submitData);
      await createActivity(submitData);

      // Delete draft after successful creation
      if (existingDraft) {
        deleteDraft();
      }

      // Close the window after successful creation
      window.close();
    } catch (error) {
      console.error('Failed to create activity:', error);
      alert('Failed to create activity. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onError = (errors: any) => {
    console.error('Form validation errors:', errors);
    console.error('Form values:', form.getValues());
  };

  // Map field names to user-friendly labels
  const getFieldLabel = (fieldName: string): string => {
    const fieldLabelMap: Record<string, string> = {
      title: 'Title',
      categoryIds: 'Category',
      startDate: 'Start Date',
      endDate: 'End Date',
      startTime: 'Start Time',
      endTime: 'End Time',
      leadOrgId: 'Lead Organization',
      commsContactLeadId: 'Comms Contact',
      eventPlannerLeadId: 'Event Planner',
      activityStatusId: 'Activity Status',
      leadMinistryId: 'Lead Ministry',
      venueAddress: 'Venue Address',
      street: 'Street Address',
      city: 'City',
      provinceOrState: 'Province/State',
      country: 'Country',
    };
    return fieldLabelMap[fieldName] || fieldName;
  };
  // Check if form is valid - trigger validation if needed
  const isFormValid = form.formState.isValid;
  const missingFields = getMissingRequiredFields(form.formState, getFieldLabel);

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
        title="Access Denied"
        message="You do not have permission to create activities. Please contact your administrator if you believe this is an error."
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
    console.warn(
      'Failed to load some lookup data. Form may have empty dropdowns.'
    );
  }

  // Transform data for form sections
  const commsLeadOptions = lookups.users;

  const ErrorFallback = ({
    error,
    resetErrorBoundary,
  }: {
    error: unknown;
    resetErrorBoundary: () => void;
  }) => {
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred';
    return (
      <div className="mx-auto max-w-200 px-4 py-8" role="alert">
        <div className="mb-8">
          <h1 className="text-destructive mb-2 text-3xl font-bold">
            Something went wrong
          </h1>
          <p className="text-muted-foreground mb-4">
            An error occurred while rendering the form. Please try again.
          </p>
          <details className="mb-4">
            <summary className="cursor-pointer text-sm font-medium">
              Error details
            </summary>
            <pre className="bg-muted mt-2 overflow-auto rounded p-4 text-sm">
              {errorMessage}
            </pre>
          </details>
          <Button onClick={resetErrorBoundary} variant="default">
            Try again
          </Button>
        </div>
      </div>
    );
  };

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className="mx-auto max-w-full px-4 py-8">
        {/* Draft Recovery Dialog */}
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
              <Button
                variant="outline"
                onClick={handleStartFresh}
                type="button"
              >
                Start Fresh
              </Button>
              <Button onClick={handleContinueDraft} type="button">
                Continue Draft
              </Button>
            </DialogFooter>
          </DialogContent>
        </ResumeDialog>

        <div className="mx-auto max-w-7xl px-4 py-8">
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
                console.log('Form submit event triggered');
                void form.handleSubmit(onSubmit, onError)(e);
              }}
            >
              {/* Two Column Layout */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Overview Section */}
                  <ActivityOverviewSection
                    categories={lookups.categories}
                    ministries={lookups.ministries}
                    organizations={lookups.organizations}
                    tags={lookups.tags}
                  />

                  {/* Comms Section */}
                  <ActivityCommsSection
                    commsMaterialOptions={lookups.commsMaterials}
                    commsLeadOptions={commsLeadOptions}
                    activityStatusOptions={lookups.activityStatuses}
                  />

                  {/* News Release Section */}
                  <ActivityNewsReleaseSection
                    translationLanguageOptions={lookups.translationLanguages}
                    newsReleaseDistributionOptions={
                      lookups.newsReleaseDistributions
                    }
                    newsReleaseOriginOptions={lookups.newsReleaseOrigins}
                  />
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Reports Section */}
                  <ActivityReportsSection form={form} />

                  {/* Schedule Section */}
                  <ActivityScheduleSection form={form} />

                  {/* Event Section */}
                  <ActivityEventSection
                    representativeOptions={lookups.governmentRepresentatives}
                    premierRequestedOptions={lookups.premierRequested}
                    eventPlannerOptions={lookups.eventPlanners}
                  />

                  {/* Sharing Section */}
                  <ActivitySharingSection
                    sharedWithTeamOptions={[]} // TODO: Fetch teams from API when available
                  />
                </div>
              </div>

              {/* Form Actions */}
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
        </div>
      </div>
    </ErrorBoundary>
  );
};
