import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect } from 'react';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';
import { useNavigate, useParams } from 'react-router-dom';
import {
  createActivityRequestSchema,
  type CreateActivityRequest,
} from '@corpcal/shared/schemas';
import { createLogger } from '../lib/logger';
import { fetchActivity, updateActivity } from '../api/activitiesApi';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
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
import { History } from 'lucide-react';
import ActivityHistory from '../components/activities/ActivityHistory';
import {
  UNCONFIRMED_STATUS_NAMES,
  findStatusByName,
  timeAgo,
} from '../lib/utils';

type FormData = CreateActivityRequest & {
  categoryIds?: number[];
  tagIds?: number[];
  commsMaterialIds?: number[];
  translationLanguageIds?: number[];
  sharedWithMinistryIds?: string[];
  commsContactLeadId?: string | null;
};

type LoadedActivity = {
  id?: number;
  displayId?: string;
  title?: string;
  category?: string[];
  leadOrg?: string;
  activityStatus?: string | number | Record<string, unknown>;
  lastUpdatedDateTime?: string;
  createdDateTime?: string;
  [key: string]: unknown;
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

export default function EditActivityForm(): React.ReactElement {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadedActivity, setLoadedActivity] = useState<LoadedActivity | null>(
    null
  );
  const [historyOpen, setHistoryOpen] = useState(false);

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
      const unknown = findStatusByName(dateStatuses, UNCONFIRMED_STATUS_NAMES);
      if (unknown) form.setValue('dateStatusId', unknown.id as number);
    }
  }, [dateStatuses, form]);

  useEffect(() => {
    if (timeStatuses && !form.getValues('timeStatusId')) {
      const unknown = findStatusByName(timeStatuses, UNCONFIRMED_STATUS_NAMES);
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

        // Wait for lookups to be available before transforming data
        // This is needed to map representative names back to IDs
        if (!lookups.governmentRepresentatives) {
          // Retry after a short delay if lookups aren't ready yet
          setTimeout(() => {
            void load();
          }, 100);
          return;
        }

        // Create a map of representative names to IDs for lookup
        const repNameToIdMap = new Map<string, number>();
        lookups.governmentRepresentatives.forEach((rep) => {
          const name = rep.displayName || rep.name;
          repNameToIdMap.set(name.toLowerCase(), rep.id);
        });

        // Transform API response to form data structure
        const formData: any = {
          ...activity,
          // Convert representativesAttending (API response) to representatives (form format)
          // Try to match names to IDs from the lookup table
          representatives:
            activity.representativesAttending?.map((rep: any) => {
              const repId = repNameToIdMap.get(
                rep.representative.toLowerCase()
              );
              if (repId) {
                return { representativeId: repId };
              } else {
                // Keep as free-text if not found in lookup
                return { representativeName: rep.representative };
              }
            }) || [],
          // Extract the lead contact from commsContacts array
          commsContactLeadId:
            activity.commsContacts?.find((c: any) => c.isLead)?.userId || null,
        };

        // Reset the form with the transformed activity data
        form.reset(formData);
        setLoadedActivity(activity as LoadedActivity);
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
  }, [id, form, lookups.governmentRepresentatives]);

  const onSubmit = async (data: FormData) => {
    if (!id) return;
    setIsSubmitting(true);
    try {
      const formValues = form.getValues();
      // Normalize reportSettings so each entry has a numeric reportId as expected by the API/schema
      const normalizeReportSettings = (items: any[] | undefined) => {
        if (!items || !Array.isArray(items)) return undefined;
        const normalized: { reportId: number; omitted: boolean }[] = [];
        for (const it of items) {
          const reportId =
            (it && typeof it.reportId === 'number' && it.reportId) ||
            (it && typeof it.id === 'number' && it.id) ||
            (it &&
              it.report &&
              typeof it.report.id === 'number' &&
              it.report.id);
          const omitted = !!(it && typeof it.omitted === 'boolean'
            ? it.omitted
            : it?.omitted);
          if (typeof reportId === 'number') {
            normalized.push({ reportId, omitted });
          } else {
            console.warn(
              'Skipping invalid reportSettings entry (missing numeric reportId):',
              it
            );
          }
        }
        return normalized.length > 0 ? normalized : undefined;
      };

      const normalizedReportSettings = normalizeReportSettings(
        formValues.reportSettings as any
      );

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
        // Transform commsContactLeadId back to commsContacts array format
        commsContacts: formValues.commsContactLeadId
          ? [{ userId: Number(formValues.commsContactLeadId), isLead: true }]
          : undefined,
        // attach normalized report settings if present
        reportSettings: normalizedReportSettings,
      };

      await updateActivity(Number(id), submitData);
      // Navigate back to the entries list view
      void navigate('/');
    } catch (err) {
      logger.error('Failed to update activity', err);
      alert('Failed to save activity. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onError = (errors: any) => {
    console.error('Form validation errors:', errors);
    console.error('Form values:', form.getValues());
    const keys = Object.keys(errors || {});
    if (keys.length > 0) {
      const friendly = keys.map(
        (k) => `${k}: ${errors[k]?.message || JSON.stringify(errors[k])}`
      );
      console.error('Validation summary:', friendly);
    }
  };

  const formatActivityStatus = (s: unknown) => {
    if (s == null) return '';
    if (typeof s === 'string' || typeof s === 'number') return String(s);
    if (typeof s === 'object') {
      const obj = s as any;
      if (typeof obj.name === 'string') return obj.name;
      if (typeof obj.label === 'string') return obj.label;
      try {
        return JSON.stringify(obj);
      } catch {
        return String(obj);
      }
    }
    return String(JSON.stringify(s));
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
          <p className="text-muted-foreground">Loading activity...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-200 px-4 py-8">
        <div className="mb-8">
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
          <div className="mx-auto max-w-200 px-4 py-8">
            {/* Header: displayId, title, categories on left; status and timestamps on right */}
            {loadedActivity ? (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 24,
                  marginTop: 8,
                }}
              >
                <div style={{ flex: '1 1 auto' }}>
                  <div style={{ color: '#6b6b6b', marginBottom: 6 }}>
                    {loadedActivity.displayId || `ACT-${loadedActivity.id}`}
                  </div>
                  <h1 className="text-lg font-bold">{loadedActivity.title}</h1>
                  <div style={{ marginTop: 8 }}>
                    {loadedActivity.category &&
                    loadedActivity.category.length > 0
                      ? loadedActivity.category.map(
                          (cat: string, idx: number) => (
                            <Badge key={idx} variant="default" className="mr-2">
                              {cat}
                            </Badge>
                          )
                        )
                      : null}
                  </div>
                  {loadedActivity.leadOrg ? (
                    <div style={{ marginTop: 12, color: '#6b6b6b' }}>
                      {loadedActivity.leadOrg}
                    </div>
                  ) : null}
                </div>

                <div style={{ textAlign: 'right', minWidth: 180 }}>
                  {loadedActivity.activityStatus ? (
                    <div style={{ marginBottom: 8 }}>
                      <Badge variant="default">
                        {formatActivityStatus(loadedActivity.activityStatus)}
                      </Badge>
                    </div>
                  ) : null}
                  <div style={{ color: '#6b6b6b', fontSize: 13 }}>
                    {loadedActivity.lastUpdatedDateTime &&
                    loadedActivity.createdDateTime &&
                    loadedActivity.lastUpdatedDateTime !==
                      loadedActivity.createdDateTime ? (
                      <div>
                        Updated{' '}
                        {timeAgo(new Date(loadedActivity.lastUpdatedDateTime))}{' '}
                        ago
                      </div>
                    ) : null}
                    <div>
                      Created{' '}
                      {loadedActivity.createdDateTime
                        ? new Date(
                            loadedActivity.createdDateTime
                          ).toLocaleDateString()
                        : ''}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', marginTop: 8 }}>
                    <button
                      title="this is not yet functional"
                      className="mr-2 rounded border px-2 py-1"
                      type="button"
                    >
                      ☆
                    </button>
                    <button
                      title="View history"
                      className="rounded border px-2 py-1"
                      type="button"
                      onClick={() => setHistoryOpen(true)}
                    >
                      <History className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">
                Update the activity details below
              </p>
            )}
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
                      activityStatusOptions={lookups.activityStatuses}
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
                    {isSubmitting ? 'Updating...' : 'Update'}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
      <ActivityHistory
        activityId={Number(id)}
        open={historyOpen}
        onOpenChange={(v) => setHistoryOpen(!!v)}
      />
    </ErrorBoundary>
  );
}
