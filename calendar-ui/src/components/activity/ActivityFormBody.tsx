import type { UseFormReturn } from 'react-hook-form';
import { useMemo, type ReactElement } from 'react';

import type { TeamListItem } from '@corpcal/shared/api/types';
import type { ActivityFormData } from '@corpcal/shared/schemas';
import { FormDisplayOptionsProvider } from '@/components/ui/form';
import type { FormLookupData } from '@/hooks/useFormLookups';

import {
  ActivityEditProvider,
  type ActivityEditContextValue,
} from './activity-edit-context';
import {
  ActivityCommsSection,
  ActivityEventSection,
  ActivityNewsReleaseSection,
  ActivityOverviewSection,
  ActivityReportsSection,
  ActivityScheduleSection,
  ActivitySharingSection,
} from './ActivityFormSections';

const clearNoop = () => {};

type ActivityFormBodyProps = {
  form: UseFormReturn<ActivityFormData>;
  lookups: FormLookupData;
  readOnly?: boolean;
  isEditing?: boolean;
  fieldToActivate?: string | null;
  clearFieldToActivate?: () => void;
  /** When false, FormLabel "Changed" badges are hidden (e.g. on create form). Default true for edit/view. */
  showChangedBadges?: boolean;
  /** Teams for lead team dropdown (create/edit). When provided, overview shows lead team field instead of lead ministry only. */
  leadTeamOptions?: TeamListItem[];
  /** True until form is reset for activity and options ready; avoids Select before correct leadTeamId (SPA) or empty options (reload). */
  leadTeamSelectDeferred?: boolean;
};

/**
 * Shared two-column form body used by create, view, and edit activity pages.
 */
export function ActivityFormBody({
  form,
  lookups,
  readOnly = false,
  isEditing = false,
  fieldToActivate = null,
  clearFieldToActivate = clearNoop,
  showChangedBadges = true,
  leadTeamOptions,
  leadTeamSelectDeferred = false,
}: ActivityFormBodyProps): ReactElement {
  const commsLeadOptions = lookups.users.map((u) => ({
    value: u.value,
    label: u.label,
  }));

  const editContextValue = useMemo<ActivityEditContextValue>(
    () => ({
      isEditing,
      readOnly,
      fieldToActivate,
      clearFieldToActivate,
    }),
    [isEditing, readOnly, fieldToActivate, clearFieldToActivate]
  );

  return (
    <ActivityEditProvider value={editContextValue}>
      <FormDisplayOptionsProvider showChangedBadges={showChangedBadges}>
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          <div className="space-y-12">
            <ActivityOverviewSection
              categories={lookups.categories}
              organizations={lookups.organizations}
              tags={lookups.tags}
              readOnly={readOnly}
              leadTeamOptions={leadTeamOptions}
              leadTeamSelectDeferred={leadTeamSelectDeferred}
            />

            <div>
              <ActivityCommsSection
                commsMaterialOptions={lookups.commsMaterials}
                commsLeadOptions={commsLeadOptions}
                readOnly={readOnly}
              />
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

          <div className="space-y-12">
            <ActivityReportsSection form={form} readOnly={readOnly} />

            <ActivityScheduleSection form={form} readOnly={readOnly} />

            <ActivityEventSection
              representativeOptions={lookups.governmentRepresentatives}
              premierRequestedOptions={lookups.premierRequested}
              eventPlannerOptions={lookups.eventPlanners}
              readOnly={readOnly}
            />

            <ActivitySharingSection
              sharedWithTeamOptions={lookups.sharedWithTeams.map((t) => ({
                value: String(t.id),
                label: t.displayName ?? t.name,
              }))}
              readOnly={readOnly}
            />
          </div>
        </div>
      </FormDisplayOptionsProvider>
    </ActivityEditProvider>
  );
}
