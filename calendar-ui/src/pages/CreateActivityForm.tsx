import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import {
  createActivityRequestSchema,
  type CreateActivityRequest,
} from '@corpcal/shared/schemas';
import { DEFAULT_ACTIVITY_STATUS } from '@corpcal/shared/constants/constants';
import { createActivity } from '../api/activitiesApi';
import { Button } from '../components/ui/button';
import { Form } from '../components/ui/form';
import { useAutoSave } from '../hooks/useAutoSave';
import {
  normalizeVenueAddress,
  getMissingRequiredFields,
} from '../lib/form-utils';
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
import {
  ActivityOverviewSection,
  ActivityApprovalsSection,
  ActivityScheduleSection,
  ActivityCommsSection,
  ActivityEventSection,
  ActivityVenueSection,
  ActivityReportsSection,
  ActivitySharingSection,
} from '../components/ActivityFormSections';
import React from 'react';

type FormData = CreateActivityRequest & {
  categoryIds?: number[];
  tagIds?: number[];
  commsMaterialIds?: number[];
  translationLanguageIds?: number[];
  sharedWithMinistryIds?: string[];
};

// TODO: Replace with actual user from auth context once authentication is implemented
const TEMPORARY_USER_ID = 8;

export const CreateActivityForm: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMissingFieldsPopover, setShowMissingFieldsPopover] =
    useState(false);
  const [showDraftDialog, setShowDraftDialog] = useState(false);
  const [draftChecked, setDraftChecked] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(createActivityRequestSchema) as any,
    mode: 'onChange', // Validate on change to enable real-time validation
    defaultValues: {
      isAllDay: false,
      isIssue: false,
      notForLookAhead: false,
      planningReport: false,
      thirtySixtyNinetyReport: false,
      ownerId: TEMPORARY_USER_ID,
      commsLeadId: TEMPORARY_USER_ID,
      isConfidential: false,
      omittedReportIds: [],
      // TODO: Remove hardcoded user id 8 - this is temporary for development
      commsContactLeadId: 8,
      categoryIds: [],
      tagIds: [],
      commsMaterialIds: [],
      translationLanguageIds: [],
      representatives: [],
      sharedWithMinistryIds: [],
      reportSettings: [],
    } as Partial<FormData>,
  });

  // Get form values for autosave
  const formValues = form.watch();

  // Autosave integration
  const { existingDraft, isDraftLoading, isSaving, lastSaved, deleteDraft } =
    useAutoSave(
      TEMPORARY_USER_ID,
      'activity',
      formValues as Record<string, any>,
      undefined,
      {
        debounceMs: 3000, // Save 3 seconds after user stops typing
        enabled: !isSubmitting, // Disable during submission
      }
    );

  // Check for existing draft on mount and show dialog
  useEffect(() => {
    if (
      !draftChecked &&
      !isDraftLoading &&
      existingDraft?.draftData &&
      Object.keys(existingDraft.draftData).length > 0
    ) {
      setShowDraftDialog(true);
      setDraftChecked(true);
    } else if (!draftChecked && !isDraftLoading) {
      // No draft found, mark as checked so we don't show dialog
      setDraftChecked(true);
    }
  }, [existingDraft, isDraftLoading, draftChecked]);

  const handleContinueDraft = () => {
    if (existingDraft?.draftData) {
      form.reset(existingDraft.draftData as FormData);
    }
    setShowDraftDialog(false);
  };

  const handleStartFresh = () => {
    // Use the hook's delete function to handle draft deletion and cache cleanup
    deleteDraft();

    setShowDraftDialog(false);
    setDraftChecked(false);

    // Reset the form
    form.reset({
      isAllDay: false,
      oicRelated: false,
      isIssue: false,
      notForLookAhead: false,
      planningReport: false,
      thirtySixtyNinetyReport: false,
      ownerId: 8,
      commsLeadId: 8,
      categoryIds: [],
      relatedActivityIds: [],
      tagIds: [],
      jointOrganizationIds: [],
      commsMaterialIds: [],
      translationLanguageIds: [],
      jointEventOrganizationIds: [],
      representativeIds: [],
      sharedWithOrganizationIds: [],
      canEditUserIds: [],
      canViewUserIds: [],
    });
  };

  const handleCancel = () => {
    form.reset();
  };

  const onSubmit = async (data: FormData) => {
    console.log('onSubmit called with data:', data);
    setIsSubmitting(true);
    try {
      // Find the "New" activity status by name
      const newStatus = lookups.activityStatuses.find(
        (status) => status.name === DEFAULT_ACTIVITY_STATUS
      );

      if (!newStatus) {
        throw new Error(
          `Activity status "${DEFAULT_ACTIVITY_STATUS}" not found in lookups`
        );
      }

      // Prepare submit data with junction table arrays
      const formValues = form.getValues();
      const submitData = {
        ...data,
        activityStatusId: newStatus.id,
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
      deleteDraft();

      alert('Activity created successfully!');
      // TODO: Navigate to activity detail page or list
      form.reset();
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

  // Fetch all lookup data
  const lookups = useFormLookups();

  // Show loading state if lookups are still loading
  if (lookups.isLoading) {
    return (
      <div className="mx-auto max-w-200 px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">Create New Activity</h1>
          <p className="text-muted-foreground">Loading form data...</p>
        </div>
      </div>
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
    error: Error;
    resetErrorBoundary: () => void;
  }) => {
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
              {error.message}
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
            <Button variant="outline" onClick={handleStartFresh} type="button">
              Start Fresh
            </Button>
            <Button onClick={handleContinueDraft} type="button">
              Continue Draft
            </Button>
          </DialogFooter>
        </DialogContent>
      </ResumeDialog>

      <div className="mx-auto max-w-200 px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold">Create New Activity</h1>
            <p className="text-muted-foreground">
              Fill in the activity details below
            </p>
          </div>

          {/* Autosave indicator */}
          <div className="text-sm">
            {isSaving && (
              <span className="text-amber-600">💾 Saving draft...</span>
            )}
            {lastSaved && !isSaving && (
              <span className="text-green-600">
                ✓ Draft saved at {lastSaved.toLocaleTimeString()}
              </span>
            )}
            {isDraftLoading && (
              <span className="text-gray-500">Loading draft...</span>
            )}
          </div>
        </div>

        <Form {...form}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              console.log('Form submit event triggered');
              void form.handleSubmit(onSubmit, onError)(e);
            }}
            className="space-y-8"
          >
            <ActivityOverviewSection
              categories={lookups.categories}
              organizations={lookups.organizations}
              tags={lookups.tags}
            />

            <ActivityApprovalsSection form={form} />

            <ActivityScheduleSection form={form} />

            <ActivityCommsSection
              commsMaterialOptions={lookups.commsMaterials}
              translationLanguageOptions={lookups.translationLanguages}
              newsReleaseDistributionOptions={lookups.newsReleaseDistributions}
              premierRequestedOptions={lookups.premierRequested}
              newsReleaseOriginOptions={lookups.newsReleaseOrigins}
            />

            <ActivityEventSection
              eventPlannerOptions={lookups.eventPlanners}
              representativeOptions={lookups.governmentRepresentatives}
            />

            <ActivityVenueSection form={form} />

            <ActivityReportsSection form={form} />

            <ActivitySharingSection
              commsLeadOptions={commsLeadOptions}
              sharedWithTeamOptions={[]} // TODO: Fetch teams from API when available
            />

            {/* Form Actions */}
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
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
    </ErrorBoundary>
  );
};
