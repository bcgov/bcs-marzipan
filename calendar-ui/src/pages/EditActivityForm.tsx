import { zodResolver } from '@hookform/resolvers/zod';
import { History } from 'lucide-react';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';
import { useForm, type Resolver } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import React, { useEffect, useState } from 'react';

import {
  createActivityRequestSchema,
  type ActivityFormData,
  type ActivityResponse,
} from '@corpcal/shared/schemas';
import {
  mapResponseToFormData,
  normalizeReportSettings,
} from '@corpcal/shared/utils';

import { fetchActivity, updateActivity } from '../api/activitiesApi';
import ActivityHistory from '../components/activities/ActivityHistory';
import {
  ActivityCommsSection,
  ActivityEventSection,
  ActivityNewsReleaseSection,
  ActivityOverviewSection,
  ActivityReportsSection,
  ActivityScheduleSection,
  ActivitySharingSection,
} from '../components/ActivityFormSections';
import { ErrorState } from '../components/ErrorState';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Form } from '../components/ui/form';
import { useFormLookups, type FormLookupData } from '../hooks/useFormLookups';
import { useDateStatuses, useTimeStatuses } from '../hooks/useLookups';
import {
  ERROR_DETAILS_LABEL,
  LOAD_ACTIVITY_NO_ID,
  LOAD_ACTIVITY_TITLE,
  RENDER_FORM_ERROR_TITLE,
  TRY_AGAIN_LABEL,
} from '../lib/error-messages';
import { getFriendlyErrorMessage, showErrorToast } from '../lib/error-toast';
import { formatDisplayValue } from '../lib/formatDisplayValue';
import { createLogger } from '../lib/logger';
import {
  findStatusByName,
  formatLongDate,
  formatTime,
  isSameDay,
  timeAgo,
  UNCONFIRMED_STATUS_NAMES,
} from '../lib/utils';

const logger = createLogger('EditActivityForm');

function buildFormLookups(
  lookups: Pick<
    FormLookupData,
    'categories' | 'commsMaterials' | 'translationLanguages'
  >
): Parameters<typeof mapResponseToFormData>[1] {
  return {
    categoryNameToId: (name: string) =>
      lookups.categories.find((c) => c.name === name || c.displayName === name)
        ?.id,
    commsMaterialNameToId: (name: string) =>
      lookups.commsMaterials.find(
        (m) => m.name === name || m.displayName === name
      )?.id,
    translationLanguageNameToId: (name: string) =>
      lookups.translationLanguages.find(
        (l) => l.name === name || l.displayName === name
      )?.id,
  };
}

function activityToFormData(
  activity: ActivityResponse,
  lookups: FormLookupData
): ActivityFormData {
  const base = mapResponseToFormData(activity, buildFormLookups(lookups));
  const reps = lookups.governmentRepresentatives;
  if (!reps?.length) {
    return {
      ...base,
      commsContactLeadId:
        activity.commsContacts?.find((c) => c.isLead)?.userId ?? null,
    };
  }
  const repNameToIdMap = new Map<string, number>();
  reps.forEach((rep) => {
    const name = rep.displayName || rep.name;
    repNameToIdMap.set(name.toLowerCase(), rep.id);
  });
  const representatives =
    activity.representativesAttending?.map((representative) => {
      const repId = repNameToIdMap.get(representative.toLowerCase());
      if (repId != null) return { representativeId: repId };
      return { representativeName: representative };
    }) ?? [];
  const commsContactLeadId =
    activity.commsContacts?.find((c) => c.isLead)?.userId ?? null;
  return {
    ...base,
    representatives:
      representatives.length > 0 ? representatives : base.representatives,
    commsContactLeadId,
  };
}

const getDefaultFormValues = (): Partial<ActivityFormData> => ({
  isAllDay: false,
  isIssue: false,
  isConfidential: false,
  categoryIds: [],
  tagIds: [],
  commsMaterialIds: [],
  translationLanguageIds: [],
  representatives: [],
  sharedWithTeamIds: [],
  reportSettings: [],
  dateStatusId: 1,
  timeStatusId: 1,
  pitchRequiredStatusId: undefined,
  translationsRequiredStatusId: undefined,
});

export function EditActivityForm(): React.ReactElement {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadedActivity, setLoadedActivity] = useState<ActivityResponse | null>(
    null
  );
  const [historyOpen, setHistoryOpen] = useState(false);

  const lookups = useFormLookups();
  const { data: dateStatuses } = useDateStatuses();
  const { data: timeStatuses } = useTimeStatuses();

  const form = useForm<ActivityFormData>({
    resolver: zodResolver(
      createActivityRequestSchema
    ) as Resolver<ActivityFormData>,
    mode: 'onChange',
    defaultValues: {
      ...getDefaultFormValues(),
    },
  });

  // Set default date/time status when lookups arrive
  useEffect(() => {
    if (dateStatuses && !form.getValues('dateStatusId')) {
      const unknown = findStatusByName(dateStatuses, UNCONFIRMED_STATUS_NAMES);
      if (unknown?.id != null) {
        const id = Number(unknown.id);
        if (!Number.isNaN(id)) form.setValue('dateStatusId', id);
      }
    }
  }, [dateStatuses, form]);

  useEffect(() => {
    if (timeStatuses && !form.getValues('timeStatusId')) {
      const unknown = findStatusByName(timeStatuses, UNCONFIRMED_STATUS_NAMES);
      if (unknown?.id != null) {
        const id = Number(unknown.id);
        if (!Number.isNaN(id)) form.setValue('timeStatusId', id);
      }
    }
  }, [timeStatuses, form]);

  // Load activity on mount
  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout | null = null;

    const load = async () => {
      if (!id) {
        setLoadError(LOAD_ACTIVITY_NO_ID);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const activity = await fetchActivity(Number(id));
        if (!mounted) return;

        // Wait for lookups to be available before transforming data
        // This is needed to map representative names back to IDs and category names to IDs
        if (!lookups.governmentRepresentatives || !lookups.categories) {
          // Retry after a short delay if lookups aren't ready yet
          timeoutId = setTimeout(() => {
            void load();
          }, 100);
          return;
        }

        const formData: ActivityFormData = activityToFormData(
          activity,
          lookups
        );
        form.reset(formData);
        setLoadedActivity(activity);
      } catch (err: unknown) {
        logger.error('Failed to load activity', err);
        setLoadError(getFriendlyErrorMessage(err));
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    void load();
    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
    // Granular lookups deps intentional: full lookups is a new ref each render; we only re-run when these arrays change.
  }, [
    id,
    form,
    lookups,
    lookups.governmentRepresentatives,
    lookups.categories,
    lookups.commsMaterials,
    lookups.translationLanguages,
  ]);

  const onSubmit = async (data: ActivityFormData) => {
    if (!id) return;
    setIsSubmitting(true);
    try {
      const formValues = form.getValues();
      const rawReportSettings = formValues.reportSettings;
      const normalizedReportSettings =
        normalizeReportSettings(rawReportSettings);
      if (
        rawReportSettings?.length != null &&
        rawReportSettings.length > 0 &&
        (normalizedReportSettings?.length ?? 0) < rawReportSettings.length
      ) {
        logger.warn(
          'Skipping invalid reportSettings entry (missing numeric reportId)'
        );
      }

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
        sharedWithTeamIds:
          formValues.sharedWithTeamIds &&
          formValues.sharedWithTeamIds.length > 0
            ? formValues.sharedWithTeamIds
            : undefined,
        // Transform commsContactLeadId back to commsContacts array format
        commsContacts: formValues.commsContactLeadId
          ? [{ userId: Number(formValues.commsContactLeadId), isLead: true }]
          : undefined,
        // attach normalized report settings if present
        reportSettings: normalizedReportSettings,
      };

      await updateActivity(Number(id), submitData);
      // Show success toast
      toast.success('Activity updated', {
        description: `${loadedActivity?.displayId || `ACT-${id}`}: ${data.title || ''}`,
        duration: 5000,
      });
      // Navigate back to the entries list view
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

  const ErrorFallback = ({ error, resetErrorBoundary }: FallbackProps) => {
    const friendlyMessage = getFriendlyErrorMessage(error);
    const rawMessage = error instanceof Error ? error.message : String(error);

    return (
      <div className="mx-auto max-w-200 px-4 py-8" role="alert">
        <div className="mb-8">
          <h1 className="text-destructive mb-2 text-3xl font-bold">
            {RENDER_FORM_ERROR_TITLE}
          </h1>
          <p className="text-muted-foreground mb-4">{friendlyMessage}</p>
          <details className="mb-4">
            <summary className="cursor-pointer text-sm font-medium">
              {ERROR_DETAILS_LABEL}
            </summary>
            <pre className="bg-muted mt-2 overflow-auto rounded p-4 text-sm">
              {rawMessage}
            </pre>
          </details>
          <Button onClick={resetErrorBoundary} variant="default">
            {TRY_AGAIN_LABEL}
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
    const handleRetry = () => {
      setLoadError(null);
      setIsLoading(true);
      if (!id) return;
      fetchActivity(Number(id))
        .then((activity) => {
          form.reset(activityToFormData(activity, lookups));
          setLoadedActivity(activity);
        })
        .catch((err: unknown) => {
          logger.error('Failed to load activity', err);
          setLoadError(getFriendlyErrorMessage(err));
        })
        .finally(() => setIsLoading(false));
    };
    return (
      <div className="mx-auto max-w-200 px-4 py-8">
        <ErrorState
          title={LOAD_ACTIVITY_TITLE}
          message={loadError}
          onRetry={handleRetry}
          action={
            <Button
              variant="outline"
              onClick={() => {
                void navigate(-1);
              }}
            >
              Back
            </Button>
          }
        />
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
                            <Badge
                              key={idx}
                              variant="default"
                              className="mr-2"
                              style={{
                                backgroundColor: '#0F6CBD',
                                color: '#ffffff',
                              }}
                            >
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
                        {formatDisplayValue(loadedActivity.activityStatus)}
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
                        {isSameDay(
                          new Date(loadedActivity.lastUpdatedDateTime),
                          new Date()
                        )
                          ? `today at ${formatTime(
                              new Date(loadedActivity.lastUpdatedDateTime)
                            )}`
                          : `${timeAgo(
                              new Date(loadedActivity.lastUpdatedDateTime)
                            )} ago`}
                      </div>
                    ) : null}
                    <div>
                      Created{' '}
                      {loadedActivity.createdDateTime
                        ? formatLongDate(
                            new Date(loadedActivity.createdDateTime)
                          )
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

                    <div>
                      <ActivityCommsSection
                        commsMaterialOptions={lookups.commsMaterials}
                        commsLeadOptions={lookups.users}
                        activityStatusOptions={lookups.activityStatuses}
                      />

                      <div className="mx-6 border-t border-gray-300"></div>

                      <ActivityNewsReleaseSection
                        translationLanguageOptions={
                          lookups.translationLanguages
                        }
                        newsReleaseDistributionOptions={
                          lookups.newsReleaseDistributions
                        }
                        newsReleaseOriginOptions={lookups.newsReleaseOrigins}
                      />
                    </div>
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
        dateStatuses={dateStatuses}
      />
    </ErrorBoundary>
  );
}
