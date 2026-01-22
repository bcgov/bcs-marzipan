import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import {
  createActivityRequestSchema,
  type CreateActivityRequest,
} from '@corpcal/shared/schemas';
import { DEFAULT_ACTIVITY_STATUS } from '@corpcal/shared/constants/constants';
import { createActivity } from '../api/activitiesApi';
import { Button } from '../components/ui/button';
import { Form } from '../components/ui/form';
import { getMissingRequiredFields } from '../lib/form-utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../components/ui/popover';
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

export const CreateActivityForm: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMissingFieldsPopover, setShowMissingFieldsPopover] =
    useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(createActivityRequestSchema) as any,
    mode: 'onChange', // Validate on change to enable real-time validation
    defaultValues: {
      isAllDay: false,
      isIssue: false,
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
      <div className="mx-auto max-w-full px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">New calendar entry</h1>
        </div>

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
                <div className="rounded-md border border-gray-300 p-6">
                  <ActivityOverviewSection
                    categories={lookups.categories}
                    organizations={lookups.organizations}
                    tags={lookups.tags}
                  />
                </div>

                {/* Schedule Section */}
                <div className="rounded-md border border-gray-300 p-6">
                  <ActivityScheduleSection form={form} />
                </div>

                {/* Comms Section */}
                <div className="rounded-md border border-gray-300 p-6">
                  <ActivityCommsSection
                    commsMaterialOptions={lookups.commsMaterials}
                    translationLanguageOptions={lookups.translationLanguages}
                    newsReleaseDistributionOptions={
                      lookups.newsReleaseDistributions
                    }
                    premierRequestedOptions={lookups.premierRequested}
                    newsReleaseOriginOptions={lookups.newsReleaseOrigins}
                  />
                </div>

                {/* Event Section */}
                <div className="rounded-md border border-gray-300 p-6">
                  <ActivityEventSection
                    eventPlannerOptions={lookups.eventPlanners}
                    representativeOptions={lookups.governmentRepresentatives}
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Reports Section */}
                <div className="rounded-md border border-gray-300 p-6">
                  <ActivityReportsSection form={form} />
                </div>

                {/* Approvals Section */}
                <div className="rounded-md border border-gray-300 p-6">
                  <ActivityApprovalsSection form={form} />
                </div>

                {/* Venue Section */}
                <div className="rounded-md border border-gray-300 p-6">
                  <ActivityVenueSection form={form} />
                </div>

                {/* Sharing Section */}
                <div className="rounded-md border border-gray-300 p-6">
                  <ActivitySharingSection
                    commsLeadOptions={commsLeadOptions}
                    sharedWithTeamOptions={[]} // TODO: Fetch teams from API when available
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-4 pt-6">
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
