import type { UseFormReturn } from 'react-hook-form';
import type { ReactElement } from 'react';

import type { ActivityFormData } from '@corpcal/shared/schemas';

import type { FormLookupData } from '../hooks/useFormLookups';
import {
  ActivityCommsSection,
  ActivityEventSection,
  ActivityNewsReleaseSection,
  ActivityOverviewSection,
  ActivityReportsSection,
  ActivityScheduleSection,
  ActivitySharingSection,
} from './ActivityFormSections';

type ActivityFormBodyProps = {
  form: UseFormReturn<ActivityFormData>;
  lookups: FormLookupData;
  readOnly?: boolean;
};

/**
 * Shared two-column form body used by create, view, and edit activity pages.
 */
export function ActivityFormBody({
  form,
  lookups,
  readOnly = false,
}: ActivityFormBodyProps): ReactElement {
  const commsLeadOptions = lookups.users.map((u) => ({
    value: u.value,
    label: u.label,
  }));

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="space-y-6">
        <ActivityOverviewSection
          categories={lookups.categories}
          ministries={lookups.ministries}
          organizations={lookups.organizations}
          tags={lookups.tags}
          readOnly={readOnly}
        />

        <div>
          <ActivityCommsSection
            commsMaterialOptions={lookups.commsMaterials}
            commsLeadOptions={commsLeadOptions}
            activityStatusOptions={lookups.activityStatuses}
            readOnly={readOnly}
          />

          <div className="my-6 border-t border-gray-300" />

          <ActivityNewsReleaseSection
            translationLanguageOptions={lookups.translationLanguages}
            newsReleaseDistributionOptions={
              lookups.newsReleaseDistributions
            }
            newsReleaseOriginOptions={lookups.newsReleaseOrigins}
            readOnly={readOnly}
          />
        </div>
      </div>

      <div className="space-y-6">
        <ActivityReportsSection form={form} readOnly={readOnly} />

        <ActivityScheduleSection form={form} readOnly={readOnly} />

        <ActivityEventSection
          representativeOptions={lookups.governmentRepresentatives}
          premierRequestedOptions={lookups.premierRequested}
          eventPlannerOptions={lookups.eventPlanners}
          readOnly={readOnly}
        />

        <ActivitySharingSection
          sharedWithTeamOptions={[]}
          readOnly={readOnly}
        />
      </div>
    </div>
  );
}
