import { useFormContext, type FieldPathValue } from 'react-hook-form';

import { TEAM_PREFIX_FALLBACK } from '@corpcal/shared';
import type { TeamListItem } from '@corpcal/shared/api/types';
import type { ActivityFormData } from '@corpcal/shared/schemas';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { optionalSelectIdValue } from '@/lib/activity-form-coerce-value';
import { getActivityFieldLabel } from '@/lib/activity-form-labels';
import { setActivityFormFieldValue } from '@/lib/activity-form-set-field';
import type { OptionItem } from '@/schemas/types';

import { ActivityFieldInfoIcon } from '../activity-info-icon-settings-context';

export type LeadOrganizationOptionForLeadTeam = {
  value: number;
  label: string;
  ministryId?: number | null;
};

/**
 * Isolated lead-team field using a value-controlled Combobox (single-select
 * with search). Unlike Radix Select, the Combobox does not emit phantom
 * onValueChange events when options reconcile during async loading.
 */
export function ActivityLeadTeamField({
  leadTeamOptions,
  leadTeamDisplayLabel,
  leadTeamOptionsFetching,
  organizations,
  readOnly,
}: {
  leadTeamOptions: TeamListItem[];
  leadTeamDisplayLabel: string | null | undefined;
  leadTeamOptionsFetching: boolean;
  organizations: LeadOrganizationOptionForLeadTeam[];
  readOnly: boolean;
}) {
  const form = useFormContext<ActivityFormData>();

  return (
    <FormField
      control={form.control}
      name="leadTeamId"
      render={({ field }) => {
        const mergedTeams: TeamListItem[] = (() => {
          const list = [...leadTeamOptions];
          const lid = field.value;
          if (lid != null && lid > 0 && !list.some((t) => t.id === lid)) {
            const label = leadTeamDisplayLabel?.trim() || `Team ${lid}`;
            list.unshift({
              id: lid,
              name: label,
              displayName: leadTeamDisplayLabel ?? null,
              abbreviation: TEAM_PREFIX_FALLBACK,
              description: null,
              sortOrder: 0,
              isActive: true,
              appearsInShareWith: true,
              roleId: null,
              memberCount: 0,
              ministryId: null,
              ministryName: null,
            });
          }
          return list;
        })();

        const options: OptionItem[] = mergedTeams.map((t) => ({
          value: String(t.id),
          label: t.ministryName
            ? `${t.displayName || t.name} (${t.ministryName})`
            : t.displayName || t.name,
        }));

        const selectedOption: OptionItem | null =
          field.value != null && field.value > 0
            ? (options.find((o) => o.value === String(field.value)) ?? null)
            : null;

        const handleTeamChange = (option: OptionItem | null) => {
          const previousTeamId = field.value ?? null;
          const previousTeam =
            previousTeamId != null
              ? mergedTeams.find((t) => t.id === previousTeamId)
              : null;
          const syncedOrgId =
            previousTeam?.ministryId != null
              ? (organizations.find(
                  (o) => o.ministryId === previousTeam.ministryId
                )?.value ?? null)
              : null;
          const currentLeadOrgId = form.getValues('leadOrgId') ?? null;
          const currentLeadOrgName = form.getValues('leadOrgName') ?? null;
          const leadOrgInSyncWithTeam =
            (syncedOrgId != null &&
              currentLeadOrgId === syncedOrgId &&
              (currentLeadOrgName == null || currentLeadOrgName === '')) ||
            (syncedOrgId == null &&
              currentLeadOrgId == null &&
              (currentLeadOrgName == null || currentLeadOrgName === ''));

          const teamId = option
            ? optionalSelectIdValue(option.value)
            : undefined;
          setActivityFormFieldValue(
            form,
            field.name,
            teamId as FieldPathValue<ActivityFormData, typeof field.name>
          );

          if (teamId == null) {
            setActivityFormFieldValue(form, 'leadMinistryId', undefined);
            if (leadOrgInSyncWithTeam) {
              setActivityFormFieldValue(form, 'leadOrgId', null);
              setActivityFormFieldValue(form, 'leadOrgName', null);
            }
          } else {
            const team = mergedTeams.find((t) => t.id === teamId);
            setActivityFormFieldValue(
              form,
              'leadMinistryId',
              team?.ministryId ?? undefined
            );
            if (leadOrgInSyncWithTeam && team) {
              const orgForMinistry =
                team.ministryId != null
                  ? organizations.find((o) => o.ministryId === team.ministryId)
                  : undefined;
              if (orgForMinistry) {
                setActivityFormFieldValue(
                  form,
                  'leadOrgId',
                  orgForMinistry.value
                );
                setActivityFormFieldValue(form, 'leadOrgName', null);
              } else {
                setActivityFormFieldValue(form, 'leadOrgId', null);
                setActivityFormFieldValue(form, 'leadOrgName', null);
              }
            }
          }
        };

        const showOptionsLoading =
          leadTeamOptionsFetching && leadTeamOptions.length === 0;

        return (
          <FormItem>
            <FormLabel showRequired>
              <>
                {getActivityFieldLabel(field.name)}
                <ActivityFieldInfoIcon
                  fieldKey="leadTeamId"
                  ariaLabel="About lead team"
                />
              </>
            </FormLabel>
            <FormControl data-field={field.name}>
              <Combobox
                items={options}
                value={selectedOption}
                onValueChange={handleTeamChange}
                itemToStringValue={(o: OptionItem) => o.label}
                readOnly={readOnly}
              >
                <ComboboxInput placeholder="" disabled={showOptionsLoading} />
                <ComboboxContent>
                  <ComboboxEmpty>
                    {showOptionsLoading
                      ? 'Loading teams...'
                      : 'No teams found.'}
                  </ComboboxEmpty>
                  <ComboboxList>
                    {(option: OptionItem) => (
                      <ComboboxItem key={option.value} value={option}>
                        {option.label}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </FormControl>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
