import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect, JSX } from 'react';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';
import { useNavigate, useParams } from 'react-router-dom';
import {
  createActivityRequestSchema,
  type CreateActivityRequest,
} from '@corpcal/shared/schemas';
import { createLogger } from '../lib/logger';
import { fetchActivity, updateActivity } from '../api/activitiesApi';
import { Button } from '../components/ui/button';
import { Form } from '../components/ui/form';
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
import React from 'react';

type FormData = CreateActivityRequest & {
  categoryIds?: number[];
  tagIds?: number[];
  commsMaterialIds?: number[];
  translationLanguageIds?: number[];
  sharedWithMinistryIds?: string[];
};

const logger = createLogger('EditActivityForm');

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
  dateStatusId: 1,
  timeStatusId: 1,
  pitchRequired: false,
});

export default function EditActivityForm(): JSX.Element {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const lookups = useFormLookups();
  const { data: dateStatuses } = useDateStatuses();
  const { data: timeStatuses } = useTimeStatuses();

  const form = useForm<FormData>({
    resolver: zodResolver(createActivityRequestSchema) as any,
    mode: 'onChange',
    defaultValues: {
      ...getDefaultFormValues(),
    },
  });

  // Set default date/time status when lookups arrive
  useEffect(() => {
    if (dateStatuses && !form.getValues('dateStatusId')) {
      const unknown = dateStatuses.find((s) => s.name === 'unknown');
      if (unknown) form.setValue('dateStatusId', unknown.id as number);
    }
  }, [dateStatuses, form]);

  useEffect(() => {
    if (timeStatuses && !form.getValues('timeStatusId')) {
      const unknown = timeStatuses.find((s) => s.name === 'unknown');
      if (unknown) form.setValue('timeStatusId', unknown.id as number);
    }
  }, [timeStatuses, form]);

  // Load activity on mount
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!id) {
        setLoadError('No activity id provided');
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const activity = await fetchActivity(Number(id));
        if (!mounted) return;
        // Reset the form with the activity data. Cast to any since the shape
        // should be compatible but may include extra fields from the API.
        form.reset(activity as any);
      } catch (err: any) {
        logger.error('Failed to load activity', err);
        setLoadError(err?.message || String(err));
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, [id]);

  const onSubmit = async (data: FormData) => {
    if (!id) return;
    setIsSubmitting(true);
    try {
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
      } as any;

      await updateActivity(Number(id), submitData);
      // Navigate back to previous page (list or details)
      void navigate(-1);
    } catch (err) {
      logger.error('Failed to update activity', err);
      alert('Failed to save activity. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onError = (errors: any) => {
    console.error('Form validation errors:', errors);
  };

  const ErrorFallback = ({ error, resetErrorBoundary }: FallbackProps) => {
    const message = error instanceof Error ? error.message : String(error);

    return (
      <div className="mx-auto max-w-200 px-4 py-8" role="alert">
        <div className="mb-8">
          <h1 className="text-destructive mb-2 text-3xl font-bold">
            Something went wrong
          </h1>
          <p className="text-muted-foreground mb-4">
            An error occurred while rendering the edit form. Please try again.
          </p>
          <details className="mb-4">
            <summary className="cursor-pointer text-sm font-medium">
              Error details
            </summary>
            <pre className="bg-muted mt-2 overflow-auto rounded p-4 text-sm">
              {message}
            </pre>
          </details>
          <Button onClick={resetErrorBoundary} variant="default">
            Try again
          </Button>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-200 px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">Edit Activity</h1>
          <p className="text-muted-foreground">Loading activity...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-200 px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">Edit Activity</h1>
          <p className="text-destructive">
            Failed to load activity: {loadError}
          </p>
        </div>
        <Button
          onClick={() => {
            void navigate(-1);
          }}
        >
          Back
        </Button>
      </div>
    );
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className="mx-auto max-w-full px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">Edit Activity</h1>

          <div className="mx-auto max-w-200 px-4 py-8">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="mb-2 text-3xl font-bold">Edit Activity</h1>
                <p className="text-muted-foreground">
                  Update the activity details below
                </p>
              </div>
            </div>

            <Form {...form}>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void form.handleSubmit(onSubmit, onError)(e);
                }}
              >
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <div className="space-y-6">
                    <ActivityOverviewSection
                      categories={lookups.categories}
                      ministries={lookups.ministries}
                      organizations={lookups.organizations}
                      tags={lookups.tags}
                    />

                    <ActivityCommsSection
                      commsMaterialOptions={lookups.commsMaterials}
                      commsLeadOptions={lookups.users}
                    />

                    <ActivityNewsReleaseSection
                      translationLanguageOptions={lookups.translationLanguages}
                      newsReleaseDistributionOptions={
                        lookups.newsReleaseDistributions
                      }
                      newsReleaseOriginOptions={lookups.newsReleaseOrigins}
                    />
                  </div>

                  <div className="space-y-6">
                    <ActivityReportsSection form={form} />

                    <ActivityScheduleSection form={form} />

                    <ActivityEventSection
                      representativeOptions={lookups.governmentRepresentatives}
                      premierRequestedOptions={lookups.premierRequested}
                      eventPlannerOptions={lookups.eventPlanners}
                    />

                    <ActivitySharingSection sharedWithTeamOptions={[]} />
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void navigate(-1)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
