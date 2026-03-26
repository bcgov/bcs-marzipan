import { useFormContext, useWatch } from 'react-hook-form';
import { useMemo, type ReactElement } from 'react';

import type { CommsContactCandidate } from '@corpcal/shared/api/types';
import type { ActivityFormData } from '@corpcal/shared/schemas';
import { FormDisplayOptionsProvider } from '@/components/ui/form';
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

  const editContextValue = useMemo<ActivityEditContextValue>(
    () => ({ readOnly }),
    [readOnly]
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
              translationLanguageOptions={lookups.translationLanguages}
              newsReleaseDistributionOptions={lookups.newsReleaseDistributions}
              newsReleaseOriginOptions={lookups.newsReleaseOrigins}
              translationRequiredStatuses={lookups.translationRequiredStatuses}
            />
          </div>

          <div className="space-y-12">
            <ActivityReportsSection />

            <ActivityScheduleSection
              dateStatuses={lookups.dateStatuses}
              timeStatuses={lookups.timeStatuses}
            />

            <ActivityEventSection
              venueStatuses={lookups.venueStatuses}
              representativeOptions={lookups.governmentRepresentatives}
              premierRequestedOptions={lookups.premierRequested}
              eventPlannerOptions={lookups.eventPlanners}
            />

            <ActivitySharingSection
              sharedWithTeamOptions={lookups.sharedWithTeams.map((t) => ({
                value: String(t.id),
                label: t.displayName ?? t.name,
              }))}
            />
          </div>
        </div>
      </FormDisplayOptionsProvider>
    </ActivityEditProvider>
  );
}
