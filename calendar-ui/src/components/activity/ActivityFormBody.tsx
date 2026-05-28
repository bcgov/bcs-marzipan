import { useFormContext, useWatch } from 'react-hook-form';
import { useCallback, useMemo, type ReactElement } from 'react';

import {
  canEditActivityFieldScope,
  canViewActivityFieldScope,
  type ActivityFieldScope,
} from '@corpcal/shared';
import type { CommsContactCandidate } from '@corpcal/shared/api/types';
import type { ActivityFormData } from '@corpcal/shared/schemas';
import { FormDisplayOptionsProvider } from '@/components/ui/form';
import { useAuth } from '@/hooks/useAuth';
import type { FormLookupData } from '@/hooks/useFormLookups';
import { cn } from '@/lib/utils';
import type { OptionItem } from '@/schemas/types';

import {
  ActivityEditProvider,
  type ActivityEditContextValue,
} from './activity-edit-context';
import {
  defaultActivityLeadTeamFieldConfig,
  type ActivityLeadTeamFieldConfig,
} from './activity-lead-team-field-config';
import {
  ActivityCommsSection,
  ActivityEventSection,
  ActivityOverviewSection,
  ActivityReleaseSection,
  ActivityReportsSection,
  ActivityScheduleSection,
  ActivitySharingSection,
} from './ActivityFormSections';

/** Strip default `shadow-xs` / outline-button shadow on form controls inside the activity form only. */
const ACTIVITY_FORM_FIELD_SHADOW_RESET = cn(
  '[&_[data-slot=input]]:shadow-none',
  '[&_[data-slot=textarea]]:shadow-none',
  '[&_[data-slot=combobox-chips]]:shadow-none',
  '[&_[data-slot=input-group]]:shadow-none',
  '[&_[data-slot=freeform-combobox-chips]]:shadow-none',
  '[&_button[data-variant=outline]]:shadow-none',
  '[&_[data-slot=switch]]:shadow-none'
);

type ActivityFormBodyProps = {
  lookups: FormLookupData;
  /** From parent `useCommsContactCandidates` -- avoids a duplicate query and stale option lists. */
  commsContactCandidates: CommsContactCandidate[] | undefined;
  readOnly?: boolean;
  /** When false, FormLabel "Changed" badges are hidden (e.g. on create form). Default true for edit/view. */
  showChangedBadges?: boolean;
  /** Dotted field paths changed since last review (reviewer-only). */
  reviewerChangedPaths?: ReadonlySet<string>;
  leadTeamField?: ActivityLeadTeamFieldConfig;
};

/**
 * Shared two-column form body used by create, view, and edit activity pages.
 */
export function ActivityFormBody({
  lookups,
  commsContactCandidates,
  readOnly = false,
  showChangedBadges = true,
  reviewerChangedPaths,
  leadTeamField: leadTeamFieldProp,
}: ActivityFormBodyProps): ReactElement {
  const form = useFormContext<ActivityFormData>();
  const leadTeamField = {
    ...defaultActivityLeadTeamFieldConfig,
    ...leadTeamFieldProp,
  };

  const commsContacts = useWatch({
    control: form.control,
    name: 'commsContacts',
  });

  const commsLeadOptions = useMemo<OptionItem[]>(() => {
    const candidateOptions: OptionItem[] = (commsContactCandidates ?? []).map(
      (c) => ({
        value: String(c.id),
        label: c.label,
      })
    );
    const candidateIds = new Set(candidateOptions.map((o) => o.value));
    const currentContacts: Array<{ userId: number }> = commsContacts ?? [];
    const fallbacks = currentContacts
      .filter((c) => !candidateIds.has(String(c.userId)))
      .map((c) => {
        const userOption = lookups.users.find(
          (opt) => opt.value === String(c.userId)
        );
        return {
          value: String(c.userId),
          label: userOption?.label ?? `User ${c.userId}`,
        };
      });
    return [...candidateOptions, ...fallbacks];
  }, [commsContactCandidates, commsContacts, lookups.users]);

  const { user } = useAuth();

  const canViewScope = useCallback(
    (scope: ActivityFieldScope) =>
      user
        ? canViewActivityFieldScope(
            { permissions: user.permissions, roleName: user.roleName },
            scope
          )
        : false,
    [user]
  );

  const canEditScope = useCallback(
    (scope: ActivityFieldScope) =>
      user
        ? canEditActivityFieldScope(
            { permissions: user.permissions, roleName: user.roleName },
            scope
          )
        : false,
    [user]
  );

  const editContextValue = useMemo<ActivityEditContextValue>(
    () => ({
      readOnly,
      canViewFieldScope: canViewScope,
      canEditFieldScope: canEditScope,
    }),
    [readOnly, canViewScope, canEditScope]
  );

  return (
    <ActivityEditProvider value={editContextValue}>
      <FormDisplayOptionsProvider
        showChangedBadges={showChangedBadges}
        reviewerChangedPaths={reviewerChangedPaths}
      >
        <div
          className={cn(
            'grid grid-cols-1 gap-12 lg:grid-cols-2',
            ACTIVITY_FORM_FIELD_SHADOW_RESET
          )}
        >
          <div className="space-y-12">
            <ActivityOverviewSection
              categories={lookups.categories}
              organizations={lookups.organizations}
              tags={lookups.tags}
              pitchRequiredStatuses={lookups.pitchRequiredStatuses}
              leadTeamField={leadTeamField}
            />

            <ActivityCommsSection
              commsMaterialOptions={lookups.commsMaterials}
              commsLeadOptions={commsLeadOptions}
            />
          </div>

          <div className="space-y-12">
            <ActivityReportsSection />

            <ActivityScheduleSection
              dateStatuses={lookups.dateStatuses}
              timeStatuses={lookups.timeStatuses}
            />

            <ActivityReleaseSection
              newsReleaseDistributionOptions={lookups.newsReleaseDistributions}
              newsReleaseOriginOptions={lookups.newsReleaseOrigins}
              translationRequiredStatuses={lookups.translationRequiredStatuses}
              translationLanguageOptions={lookups.translationLanguages}
            />

            <ActivityEventSection
              venueStatuses={lookups.venueStatuses}
              representativeOptions={lookups.governmentRepresentatives}
              premierRequestedOptions={lookups.premierRequested}
              eventPlannerOptions={lookups.eventPlanners}
            />

            <ActivitySharingSection
              sharedWithTeams={lookups.sharedWithTeams}
              quickShareGroups={lookups.quickShareGroups}
            />
          </div>
        </div>
      </FormDisplayOptionsProvider>
    </ActivityEditProvider>
  );
}
