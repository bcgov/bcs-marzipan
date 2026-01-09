import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import {
  createActivityRequestSchema,
  type CreateActivityRequest,
} from '@corpcal/shared/schemas';
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
  relatedActivityIds?: number[];
  tagIds?: string[];
  jointOrganizationIds?: string[];
  commsMaterialIds?: number[];
  translationLanguageIds?: number[];
  jointEventOrganizationIds?: string[];
  representativeIds?: number[];
  sharedWithOrganizationIds?: string[];
  canEditUserIds?: number[];
  canViewUserIds?: number[];
};

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
      oicRelated: false,
      isIssue: false,
      notForLookAhead: false,
      planningReport: false,
      thirtySixtyNinetyReport: false,
      // TODO: Remove hardcoded user id 8 - this is temporary for development
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
    } as FormData,
  });

  // Get form values for autosave
  const formValues = form.watch();

  // Autosave integration
  // TODO: Replace hardcoded userId with actual user from auth context
  const { existingDraft, isDraftLoading, isSaving, lastSaved, deleteDraft } =
    useAutoSave(
      8, // userId (temporary hardcoded)
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
    if (!draftChecked && !isDraftLoading && existingDraft?.draftData) {
      setShowDraftDialog(true);
      setDraftChecked(true);
    }
  }, [existingDraft, isDraftLoading, draftChecked]);

  const handleContinueDraft = () => {
    if (existingDraft?.draftData) {
      console.log('Loading existing draft');
      form.reset(existingDraft.draftData as FormData);
    }
    setShowDraftDialog(false);
  };

  const handleStartFresh = () => {
    console.log('Starting fresh - deleting draft');
    deleteDraft();
    setShowDraftDialog(false);
  };

  const handleCancel = () => {
    form.reset();
  };

  const onSubmit = async (data: FormData) => {
    console.log('onSubmit called with data:', data);
    setIsSubmitting(true);
    try {
      // Transform venueAddress to ensure it's a proper object or null
      const venueAddress = normalizeVenueAddress(data.venueAddress);

      // Prepare submit data with junction table arrays
      const formValues = form.getValues();
      const submitData = {
        ...data,
        startDate: data.startDate || null,
        endDate: data.endDate || null,
        startTime: data.startTime || null,
        endTime: data.endTime || null,
        venueAddress: venueAddress,
        categoryIds:
          formValues.categoryIds && formValues.categoryIds.length > 0
            ? formValues.categoryIds
            : undefined,
        tagIds:
          formValues.tagIds && formValues.tagIds.length > 0
            ? formValues.tagIds
            : undefined,
        relatedActivityIds:
          formValues.relatedActivityIds &&
          formValues.relatedActivityIds.length > 0
            ? formValues.relatedActivityIds
            : undefined,
        jointOrganizationIds:
          formValues.jointOrganizationIds &&
          formValues.jointOrganizationIds.length > 0
            ? formValues.jointOrganizationIds
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
        jointEventOrganizationIds:
          formValues.jointEventOrganizationIds &&
          formValues.jointEventOrganizationIds.length > 0
            ? formValues.jointEventOrganizationIds
            : undefined,
        representativeIds:
          formValues.representativeIds &&
          formValues.representativeIds.length > 0
            ? formValues.representativeIds
            : undefined,
        sharedWithOrganizationIds:
          formValues.sharedWithOrganizationIds &&
          formValues.sharedWithOrganizationIds.length > 0
            ? formValues.sharedWithOrganizationIds
            : undefined,
        canEditUserIds:
          formValues.canEditUserIds && formValues.canEditUserIds.length > 0
            ? formValues.canEditUserIds
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
      eventLeadOrgId: 'Event Lead Organization',
      ownerId: 'Owner',
      commsLeadId: 'Comms Lead',
      eventLeadId: 'Event Planner',
      schedulingStatusId: 'Scheduling Status',
      pitchStatusId: 'Pitch Status',
      activityStatusId: 'Activity Status',
      contactMinistryId: 'Contact Ministry',
      cityId: 'City',
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
  const jointOrganizationOptions = lookups.organizations;
  const ownerOptions = lookups.users;
  const canEditUserOptions = lookups.users;
  const relatedActivityOptions = lookups.relatedActivities;

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
              relatedActivityOptions={relatedActivityOptions}
              jointOrganizationOptions={jointOrganizationOptions}
              categories={lookups.categories}
              organizations={lookups.organizations}
              tags={lookups.tags}
            />

            <ActivityApprovalsSection
              form={form}
              pitchStatusOptions={lookups.pitchStatuses}
            />

            <ActivityScheduleSection
              form={form}
              schedulingStatusOptions={lookups.schedulingStatuses}
            />

            <ActivityCommsSection
              commsLeadOptions={lookups.users}
              commsMaterialOptions={lookups.commsMaterials}
              translationLanguageOptions={lookups.translationLanguages}
            />

            <ActivityEventSection
              jointOrganizationOptions={jointOrganizationOptions}
              eventLeadOrgOptions={lookups.organizations}
              eventPlannerOptions={lookups.users}
              representativeOptions={lookups.governmentRepresentatives}
            />

            <ActivityVenueSection form={form} />

            <ActivityReportsSection form={form} />

            <ActivitySharingSection
              ownerOptions={ownerOptions}
              canEditUserOptions={canEditUserOptions}
              sharedWithOrgOptions={lookups.organizations}
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
