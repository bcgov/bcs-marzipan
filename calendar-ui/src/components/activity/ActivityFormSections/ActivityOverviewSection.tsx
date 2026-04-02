import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { useFormContext, useWatch } from 'react-hook-form';

import type {
  PitchRequiredStatusLookupItem,
  TeamListItem,
} from '@corpcal/shared/api/types';
import type { ActivityFormData } from '@corpcal/shared/schemas';
import { FormSelect, FormSelectTrigger } from '@/components/app/form-select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from '@/components/ui/combobox';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { FormSectionDivider } from '@/components/ui/form-section-divider';
import {
  FreeformCombobox,
  type FreeformComboboxValue,
} from '@/components/ui/freeform-combobox';
import { ScheduledDatePopoverField } from '@/components/ui/scheduled-date-popover-field';
import { SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { getActivityFieldLabel } from '@/lib/activity-form-labels';
import { ACTIVITY_FORM_SECTION_LABELS } from '@/lib/activity-form-section-labels';
import {
  getPresetAnchorToday,
  parseIsoDateLocal,
  PRESETS_FUTURE_SHORT,
} from '@/lib/scheduled-date-presets';
import type { OptionItem } from '@/schemas/types';

import { useActivityEdit } from '../activity-edit-context';
import { ActivityFieldScopePermissionTooltip } from '../activity-field-scope-permission-tooltip';
import {
  defaultActivityLeadTeamFieldConfig,
  type ActivityLeadTeamFieldConfig,
} from '../activity-lead-team-field-config';
import { useActivityFieldScopeControl } from '../use-activity-field-scope-control';
import { ActivityFormSection } from './ActivityFormSection';

/** Mark cascaded `setValue` updates as dirty so edit confirmation and PATCH diffs stay correct. */
const DIRTY_CASCADE = { shouldDirty: true } as const;

type LeadOrganizationOption = {
  value: number;
  label: string;
  ministryId?: number | null;
};

/**
 * Isolated so `useWatch('leadOrgName')` only re-renders this subtree when that
 * field changes, not the entire overview section.
 */
function LeadOrganizationField({
  organizations,
  readOnly,
}: {
  organizations: LeadOrganizationOption[];
  readOnly: boolean;
}) {
  const form = useFormContext<ActivityFormData>();
  const leadOrgName = useWatch({ control: form.control, name: 'leadOrgName' });

  return (
    <FormField
      control={form.control}
      name="leadOrgId"
      render={({ field }) => {
        const leadOrgId = field.value;

        const comboboxValue: FreeformComboboxValue =
          leadOrgId != null
            ? { type: 'option', value: String(leadOrgId) }
            : leadOrgName
              ? { type: 'freeform', value: leadOrgName }
              : null;

        const handleChange = (
          value: FreeformComboboxValue | FreeformComboboxValue[] | null
        ) => {
          const single =
            value == null
              ? null
              : Array.isArray(value)
                ? (value[0] ?? null)
                : value;
          if (!single) {
            field.onChange(null);
            form.setValue('leadOrgName', null, DIRTY_CASCADE);
          } else if (single.type === 'option') {
            field.onChange(Number(single.value));
            form.setValue('leadOrgName', null, DIRTY_CASCADE);
          } else {
            field.onChange(null);
            form.setValue('leadOrgName', single.value, DIRTY_CASCADE);
          }
        };

        return (
          <FormItem>
            <FormLabel>{getActivityFieldLabel(field.name)}</FormLabel>
            <FormControl data-field={field.name}>
              <FreeformCombobox
                readOnly={readOnly}
                options={organizations.map((o) => ({
                  value: String(o.value),
                  label: o.label,
                }))}
                value={comboboxValue}
                onChange={handleChange}
                placeholder="Select lead organization"
                searchPlaceholder="Search organizations..."
                emptyMessage="No organizations found."
                freeformLabel="New org"
                freeformDescription=""
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}

type ActivityOverviewSectionProps = {
  categories: Array<{
    id: number;
    name: string;
    displayName?: string;
  }>;
  organizations: LeadOrganizationOption[];
  tags: Array<{ id: number; text: string }>;
  pitchRequiredStatuses: PitchRequiredStatusLookupItem[];
  leadTeamField?: ActivityLeadTeamFieldConfig;
};

export const ActivityOverviewSection: React.FC<
  ActivityOverviewSectionProps
> = ({
  categories,
  organizations,
  tags,
  pitchRequiredStatuses,
  leadTeamField: leadTeamFieldProp,
}) => {
  const {
    options: leadTeamOptions,
    displayLabel: leadTeamDisplayLabel,
    optionsFetching: leadTeamOptionsFetching,
  } = {
    ...defaultActivityLeadTeamFieldConfig,
    ...leadTeamFieldProp,
  };
  const { readOnly, canViewFieldScope } = useActivityEdit();
  const canViewPitchStatus = canViewFieldScope?.('pitchStatus') ?? false;
  const canViewPitchDate = canViewFieldScope?.('pitchDate') ?? false;
  const canViewNotes = canViewFieldScope?.('notes') ?? false;
  const pitchStatusScope = useActivityFieldScopeControl('pitchStatus');
  const pitchDateScope = useActivityFieldScopeControl('pitchDate');
  const notesScope = useActivityFieldScopeControl('notes');
  const form = useFormContext<ActivityFormData>();
  const categoriesAnchorRef = useComboboxAnchor();
  const tagsAnchorRef = useComboboxAnchor();

  const categoryOptions = categories.map((c) => ({
    value: String(c.id),
    label: c.displayName ?? c.name,
  }));
  const tagOptions = tags.map((t) => ({
    value: String(t.id),
    label: t.text,
  }));

  return (
    <ActivityFormSection title={ACTIVITY_FORM_SECTION_LABELS.overview}>
      <FormField
        control={form.control}
        name="categoryIds"
        render={({ field }) => {
          const selectedOptions = categoryOptions.filter((o) =>
            (field.value ?? []).includes(Number(o.value))
          );
          return (
            <FormItem>
              <FormLabel showRequired>
                {getActivityFieldLabel(field.name)}
              </FormLabel>
              <FormControl data-field={field.name}>
                <Combobox
                  items={categoryOptions}
                  multiple
                  value={selectedOptions}
                  onValueChange={(selected) =>
                    field.onChange(selected.map((o) => Number(o.value)))
                  }
                  itemToStringValue={(o) => o.label}
                  readOnly={readOnly}
                >
                  <ComboboxChips ref={categoriesAnchorRef} className="w-full">
                    <ComboboxValue>
                      {(values: OptionItem[]) => (
                        <>
                          {values.map((option) => (
                            <ComboboxChip key={option.value}>
                              {option.label}
                            </ComboboxChip>
                          ))}
                          <ComboboxChipsInput placeholder="Select categories..." />
                        </>
                      )}
                    </ComboboxValue>
                  </ComboboxChips>
                  <ComboboxContent anchor={categoriesAnchorRef}>
                    <ComboboxEmpty>No categories found.</ComboboxEmpty>
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

      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel showRequired>
              {getActivityFieldLabel(field.name)}
            </FormLabel>
            <FormControl data-field={field.name}>
              <Textarea
                rows={2}
                placeholder="Enter activity title"
                readOnly={readOnly}
                {...field}
                value={field.value ?? ''}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

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
                displayName: leadTeamDisplayLabel,
                description: null,
                sortOrder: 0,
                isActive: true,
                roleId: null,
                memberCount: 0,
                ministryId: null,
                ministryName: null,
              });
            }
            return list;
          })();

          const handleValueChange = (value: string) => {
            // Radix may still call onValueChange with '' during option load/reset; never apply when view-only.
            if (readOnly) return;

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

            const teamId =
              value === '' || value == null ? undefined : Number(value);
            field.onChange(teamId);

            if (teamId == null) {
              form.setValue('leadMinistryId', undefined, DIRTY_CASCADE);
              if (leadOrgInSyncWithTeam) {
                form.setValue('leadOrgId', null, DIRTY_CASCADE);
                form.setValue('leadOrgName', null, DIRTY_CASCADE);
              }
            } else {
              const team = mergedTeams.find((t) => t.id === teamId);
              form.setValue(
                'leadMinistryId',
                team?.ministryId ?? undefined,
                DIRTY_CASCADE
              );
              if (leadOrgInSyncWithTeam && team) {
                const orgForMinistry =
                  team.ministryId != null
                    ? organizations.find(
                        (o) => o.ministryId === team.ministryId
                      )
                    : undefined;
                if (orgForMinistry) {
                  form.setValue(
                    'leadOrgId',
                    orgForMinistry.value,
                    DIRTY_CASCADE
                  );
                  form.setValue('leadOrgName', null, DIRTY_CASCADE);
                } else {
                  form.setValue('leadOrgId', null, DIRTY_CASCADE);
                  form.setValue('leadOrgName', null, DIRTY_CASCADE);
                }
              }
            }
          };

          const options = mergedTeams.map((t) => ({
            value: String(t.id),
            label: t.ministryName
              ? `${t.displayName || t.name} (${t.ministryName})`
              : t.displayName || t.name,
          }));

          const showOptionsLoading =
            leadTeamOptionsFetching && leadTeamOptions.length === 0;

          return (
            <FormItem>
              <FormLabel showRequired>
                {getActivityFieldLabel(field.name)}
              </FormLabel>
              <FormControl data-field={field.name}>
                <FormSelect
                  readOnly={readOnly}
                  value={
                    field.value !== undefined &&
                    field.value !== null &&
                    Number(field.value) > 0
                      ? String(field.value)
                      : ''
                  }
                  onValueChange={handleValueChange}
                >
                  <FormSelectTrigger readOnly={readOnly} className="w-full">
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      {showOptionsLoading ? (
                        <Loader2
                          className="text-muted-foreground h-4 w-4 shrink-0 animate-spin"
                          aria-hidden
                        />
                      ) : null}
                      <SelectValue placeholder="Select lead team" />
                    </div>
                  </FormSelectTrigger>
                  <SelectContent>
                    {options.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                    {showOptionsLoading ? (
                      <div className="text-muted-foreground flex items-center gap-2 px-2 py-1.5 text-sm">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading teams…
                      </div>
                    ) : null}
                  </SelectContent>
                </FormSelect>
              </FormControl>
              <FormMessage />
            </FormItem>
          );
        }}
      />

      <LeadOrganizationField
        organizations={organizations}
        readOnly={readOnly}
      />
      {/* summary is required `z.string()` on ActivityFormData; keep '' not undefined (optional fields use empty-to-undefined). */}
      <FormField
        control={form.control}
        name="summary"
        render={({ field }) => (
          <FormItem>
            <FormLabel showRequired>
              {getActivityFieldLabel(field.name)}
            </FormLabel>
            <FormControl data-field={field.name}>
              <Textarea
                placeholder="Enter activity summary"
                readOnly={readOnly}
                rows={4}
                name={field.name}
                ref={field.ref}
                onBlur={field.onBlur}
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="isConfidential"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-y-0 space-x-3">
            <FormControl data-field={field.name}>
              <Checkbox
                checked={field.value}
                readOnly={readOnly}
                onCheckedChange={(checked) => {
                  field.onChange(checked);
                  if (checked) {
                    form.setValue('visibility', 'team', DIRTY_CASCADE);
                    const executiveSummary = form.getValues('executiveSummary');
                    if (!executiveSummary?.trim()) {
                      const leadTeamId = form.getValues('leadTeamId');
                      const team =
                        leadTeamId != null && leadTeamOptions?.length
                          ? leadTeamOptions.find((t) => t.id === leadTeamId)
                          : undefined;
                      const holdFor = team
                        ? team.ministryName ||
                          team.displayName ||
                          team.name ||
                          'team'
                        : 'team';
                      form.setValue(
                        'executiveSummary',
                        `Hold for ${holdFor}.`,
                        DIRTY_CASCADE
                      );
                    }
                  }
                }}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>{getActivityFieldLabel(field.name)}</FormLabel>
            </div>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="isIssue"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-y-0 space-x-3">
            <FormControl data-field={field.name}>
              <Checkbox
                checked={field.value}
                readOnly={readOnly}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>{getActivityFieldLabel(field.name)}</FormLabel>
            </div>
          </FormItem>
        )}
      />
      <FormSectionDivider />
      <FormField
        control={form.control}
        name="significance"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{getActivityFieldLabel(field.name)}</FormLabel>
            <FormControl data-field={field.name}>
              <Textarea
                placeholder="Enter significance"
                readOnly={readOnly}
                rows={4}
                name={field.name}
                ref={field.ref}
                onBlur={field.onBlur}
                value={field.value ?? ''}
                onChange={(e) => {
                  const v = e.target.value;
                  field.onChange(v === '' ? undefined : v);
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {canViewPitchStatus ? (
        <FormField
          control={form.control}
          name="pitchRequiredStatusId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{getActivityFieldLabel(field.name)}</FormLabel>
              <FormSelect
                readOnly={pitchStatusScope.readOnly}
                disabled={pitchStatusScope.fieldScopeDisabled}
                value={
                  field.value !== undefined && field.value !== null
                    ? String(field.value)
                    : ''
                }
                onValueChange={(value) =>
                  field.onChange(value === '' ? undefined : Number(value))
                }
              >
                <ActivityFieldScopePermissionTooltip scope="pitchStatus">
                  <FormControl data-field={field.name}>
                    <FormSelectTrigger
                      readOnly={
                        pitchStatusScope.readOnly &&
                        !pitchStatusScope.fieldScopeDisabled
                      }
                    >
                      <SelectValue placeholder="Select status" />
                    </FormSelectTrigger>
                  </FormControl>
                </ActivityFieldScopePermissionTooltip>
                <SelectContent>
                  {pitchRequiredStatuses.map((status) => (
                    <SelectItem key={status.id} value={String(status.id)}>
                      {status.displayName ?? status.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </FormSelect>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : null}

      {canViewPitchDate ? (
        <FormField
          control={form.control}
          name="pitchDate"
          render={({ field }) => {
            const raw = field.value ?? '';
            const pitchLabel = raw
              ? format(parseIsoDateLocal(raw), 'MMM d, yyyy')
              : 'Select pitch date';
            return (
              <FormItem>
                <FormLabel>{getActivityFieldLabel(field.name)}</FormLabel>
                <ActivityFieldScopePermissionTooltip scope="pitchDate">
                  <FormControl className="w-full" data-field={field.name}>
                    <ScheduledDatePopoverField
                      triggerVariant="form"
                      value={raw}
                      onChange={(iso) => field.onChange(iso || undefined)}
                      label={pitchLabel}
                      triggerMuted={!raw}
                      readOnly={pitchDateScope.readOnly}
                      disabled={pitchDateScope.fieldScopeDisabled}
                      popoverTitle="Select pitch date"
                      presets={PRESETS_FUTURE_SHORT}
                      getPresetAnchor={getPresetAnchorToday}
                      headerRight={
                        raw &&
                        !pitchDateScope.readOnly &&
                        !pitchDateScope.fieldScopeDisabled ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-primary text-sm"
                            onClick={() => field.onChange(undefined)}
                          >
                            Clear
                          </Button>
                        ) : null
                      }
                    />
                  </FormControl>
                </ActivityFieldScopePermissionTooltip>
                <FormMessage />
              </FormItem>
            );
          }}
        />
      ) : null}

      {canViewNotes && (
        <>
          <FormSectionDivider />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{getActivityFieldLabel(field.name)}</FormLabel>
                <ActivityFieldScopePermissionTooltip scope="notes">
                  <FormControl data-field={field.name}>
                    <Textarea
                      placeholder="Enter notes"
                      readOnly={notesScope.readOnly}
                      disabled={notesScope.fieldScopeDisabled}
                      rows={4}
                      name={field.name}
                      ref={field.ref}
                      onBlur={field.onBlur}
                      value={field.value ?? ''}
                      onChange={(e) => {
                        const v = e.target.value;
                        field.onChange(v === '' ? undefined : v);
                      }}
                    />
                  </FormControl>
                </ActivityFieldScopePermissionTooltip>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      )}

      <FormField
        control={form.control}
        name="tagIds"
        render={({ field }) => {
          const selectedOptions = tagOptions.filter((o) =>
            (field.value ?? []).includes(Number(o.value))
          );
          return (
            <FormItem>
              <FormLabel>{getActivityFieldLabel(field.name)}</FormLabel>
              <FormControl data-field={field.name}>
                <Combobox
                  items={tagOptions}
                  multiple
                  value={selectedOptions}
                  onValueChange={(selected) =>
                    field.onChange(selected.map((o) => Number(o.value)))
                  }
                  itemToStringValue={(o) => o.label}
                  readOnly={readOnly}
                >
                  <ComboboxChips ref={tagsAnchorRef} className="w-full">
                    <ComboboxValue>
                      {(values: OptionItem[]) => (
                        <>
                          {values.map((option) => (
                            <ComboboxChip key={option.value}>
                              {option.label}
                            </ComboboxChip>
                          ))}
                          <ComboboxChipsInput placeholder="Select tags..." />
                        </>
                      )}
                    </ComboboxValue>
                  </ComboboxChips>
                  <ComboboxContent anchor={tagsAnchorRef}>
                    <ComboboxEmpty>No tags found.</ComboboxEmpty>
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
    </ActivityFormSection>
  );
};
