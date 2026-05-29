import { format } from 'date-fns';
import { useFormContext, useWatch, type FieldPathValue } from 'react-hook-form';

import { TEAM_PREFIX_FALLBACK } from '@corpcal/shared';
import type {
  PitchRequiredStatusLookupItem,
  TeamListItem,
} from '@corpcal/shared/api/types';
import type { ActivityFormData } from '@corpcal/shared/schemas';
import {
  isActivityRichTextEffectivelyEmpty,
  tipTapDocJsonFromPlainText,
} from '@corpcal/shared/utils';
import {
  FormSelectSafe,
  FormSelectTrigger,
} from '@/components/app/form-select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxSeparator,
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
import { InfoIconButton } from '@/components/ui/info-icon-button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { RichTextField } from '@/components/ui/rich-text-field';
import { ScheduledDatePopoverField } from '@/components/ui/scheduled-date-popover-field';
import { SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  optionalIdSelectDisplayValue,
  optionalSelectIdValue,
} from '@/lib/activity-form-coerce-value';
import { getActivityFieldLabel } from '@/lib/activity-form-labels';
import { ACTIVITY_FORM_SECTION_LABELS } from '@/lib/activity-form-section-labels';
import { setActivityFormFieldValue } from '@/lib/activity-form-set-field';
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
            setActivityFormFieldValue(form, field.name, null);
            setActivityFormFieldValue(form, 'leadOrgName', null);
          } else if (single.type === 'option') {
            setActivityFormFieldValue(
              form,
              field.name,
              optionalSelectIdValue(single.value) ?? null
            );
            setActivityFormFieldValue(form, 'leadOrgName', null);
          } else {
            setActivityFormFieldValue(form, field.name, null);
            setActivityFormFieldValue(form, 'leadOrgName', single.value);
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

/**
 * Isolated lead-team field using a value-controlled Combobox (single-select
 * with search). Unlike Radix Select, the Combobox does not emit phantom
 * onValueChange events when options reconcile during async loading.
 */
function LeadTeamField({
  leadTeamOptions,
  leadTeamDisplayLabel,
  leadTeamOptionsFetching,
  organizations,
  readOnly,
}: {
  leadTeamOptions: TeamListItem[];
  leadTeamDisplayLabel: string | null | undefined;
  leadTeamOptionsFetching: boolean;
  organizations: LeadOrganizationOption[];
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
              {getActivityFieldLabel(field.name)}
            </FormLabel>
            <FormControl data-field={field.name}>
              <Combobox
                items={options}
                value={selectedOption}
                onValueChange={handleTeamChange}
                itemToStringValue={(o: OptionItem) => o.label}
                readOnly={readOnly}
              >
                <ComboboxInput
                  placeholder="Select lead team"
                  disabled={showOptionsLoading}
                />
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

type ActivityOverviewSectionProps = {
  categories: Array<{
    id: number;
    name: string;
    displayName?: string;
    visibility?: string;
    description?: string | null;
  }>;
  organizations: LeadOrganizationOption[];
  tags: Array<{ id: number; text: string; visibility?: string }>;
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

  const teamCategoryOptions = categories
    .filter((c) => c.visibility === 'team')
    .map((c) => ({
      value: String(c.id),
      label: c.displayName ?? c.name,
    }));
  const globalCategoryOptions = categories
    .filter((c) => c.visibility !== 'team')
    .map((c) => ({
      value: String(c.id),
      label: c.displayName ?? c.name,
    }));
  const categoryOptions = [...teamCategoryOptions, ...globalCategoryOptions];
  const tagOptions = tags.map((t) => ({
    value: String(t.id),
    label: t.text,
  }));
  const teamTagOptions = tags
    .filter((t) => t.visibility === 'team')
    .map((t) => ({ value: String(t.id), label: t.text }));
  const globalTagOptions = tags
    .filter((t) => t.visibility !== 'team')
    .map((t) => ({ value: String(t.id), label: t.text }));

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
                <>
                  {getActivityFieldLabel(field.name)}
                  {categories.some((c) => c.description) ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <InfoIconButton aria-label="About categories" />
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-80 max-w-[calc(100vw-2rem)] space-y-1 text-sm"
                        align="start"
                      >
                        {categories
                          .filter((c) => c.description)
                          .map((c) => (
                            <p key={c.id}>
                              <strong>{c.displayName ?? c.name}</strong>:{' '}
                              {c.description}
                            </p>
                          ))}
                      </PopoverContent>
                    </Popover>
                  ) : null}
                </>
              </FormLabel>
              <FormControl data-field={field.name}>
                <Combobox
                  items={categoryOptions}
                  multiple
                  value={selectedOptions}
                  onValueChange={(selected) =>
                    setActivityFormFieldValue(
                      form,
                      field.name,
                      selected.map((o) => Number(o.value))
                    )
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
                      {teamCategoryOptions.length > 0 && (
                        <>
                          <ComboboxGroup items={teamCategoryOptions}>
                            <ComboboxCollection>
                              {(option: OptionItem) => (
                                <ComboboxItem key={option.value} value={option}>
                                  {option.label}
                                </ComboboxItem>
                              )}
                            </ComboboxCollection>
                          </ComboboxGroup>
                          <ComboboxSeparator />
                        </>
                      )}
                      <ComboboxGroup items={globalCategoryOptions}>
                        <ComboboxCollection>
                          {(option: OptionItem) => (
                            <ComboboxItem key={option.value} value={option}>
                              {option.label}
                            </ComboboxItem>
                          )}
                        </ComboboxCollection>
                      </ComboboxGroup>
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

      <LeadTeamField
        leadTeamOptions={leadTeamOptions}
        leadTeamDisplayLabel={leadTeamDisplayLabel}
        leadTeamOptionsFetching={leadTeamOptionsFetching}
        organizations={organizations}
        readOnly={readOnly}
      />

      <LeadOrganizationField
        organizations={organizations}
        readOnly={readOnly}
      />
      <FormField
        control={form.control}
        name="summary"
        render={({ field }) => (
          <FormItem>
            <FormLabel showRequired>
              {getActivityFieldLabel(field.name)}
            </FormLabel>
            <FormControl>
              <RichTextField
                name={field.name}
                value={field.value ?? ''}
                onChange={(json) =>
                  setActivityFormFieldValue(form, field.name, json)
                }
                onBlur={field.onBlur}
                placeholder="Enter activity summary"
                readOnly={readOnly}
                data-field={field.name}
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
                checked={!!field.value}
                readOnly={readOnly}
                onCheckedChange={(checked) => {
                  setActivityFormFieldValue(form, field.name, checked === true);
                  if (checked) {
                    setActivityFormFieldValue(form, 'visibility', 'team');
                    const executiveSummary = form.getValues('executiveSummary');
                    if (
                      isActivityRichTextEffectivelyEmpty(executiveSummary ?? '')
                    ) {
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
                      setActivityFormFieldValue(
                        form,
                        'executiveSummary',
                        tipTapDocJsonFromPlainText(`Hold for ${holdFor}.`)
                      );
                    }
                  }
                }}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>
                <>
                  {getActivityFieldLabel(field.name)}
                  <Popover>
                    <PopoverTrigger asChild>
                      <InfoIconButton aria-label="About confidential" />
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-80 max-w-[calc(100vw-2rem)] text-sm"
                      align="start"
                    >
                      <p>
                        Select if the activity is highly confidential or
                        sensitive. By default viewing the activity will be
                        restricted to your team. For Corporate Look Ahead, enter
                        placeholder executive-summary copy; other reports may
                        include summary fields as configured.
                      </p>
                      <p className="mt-2">Contact admin@email.com</p>
                    </PopoverContent>
                  </Popover>
                </>
              </FormLabel>
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
                checked={!!field.value}
                readOnly={readOnly}
                onCheckedChange={(checked) =>
                  setActivityFormFieldValue(form, field.name, checked === true)
                }
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>
                <>
                  {getActivityFieldLabel(field.name)}
                  <Popover>
                    <PopoverTrigger asChild>
                      <InfoIconButton aria-label="About issue" />
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-80 max-w-[calc(100vw-2rem)] text-sm"
                      align="start"
                    >
                      <p>
                        Select if this activity is a current or potential media
                        issue, or an issue for government in any way based on
                        topic.
                      </p>
                    </PopoverContent>
                  </Popover>
                </>
              </FormLabel>
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
            <FormLabel>
              <>
                {getActivityFieldLabel(field.name)}
                <Popover>
                  <PopoverTrigger asChild>
                    <InfoIconButton aria-label="About significance" />
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-80 max-w-[calc(100vw-2rem)] text-sm"
                    align="start"
                  >
                    <p>
                      Describe how this will impact people and why it is
                      important.
                    </p>
                  </PopoverContent>
                </Popover>
              </>
            </FormLabel>
            <FormControl>
              <RichTextField
                name={field.name}
                value={field.value ?? ''}
                onChange={(json) =>
                  setActivityFormFieldValue(form, field.name, json)
                }
                onBlur={field.onBlur}
                placeholder="Enter significance"
                readOnly={readOnly}
                data-field={field.name}
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
              <FormSelectSafe
                readOnly={pitchStatusScope.readOnly}
                disabled={pitchStatusScope.fieldScopeDisabled}
                optionValues={pitchRequiredStatuses.map((s) => String(s.id))}
                value={optionalIdSelectDisplayValue(field.value)}
                onValueChange={(value) =>
                  setActivityFormFieldValue(
                    form,
                    field.name,
                    optionalSelectIdValue(value)
                  )
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
              </FormSelectSafe>
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
                      onChange={(iso) =>
                        setActivityFormFieldValue(
                          form,
                          field.name,
                          iso || undefined
                        )
                      }
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
                            onClick={() =>
                              setActivityFormFieldValue(
                                form,
                                field.name,
                                undefined
                              )
                            }
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
                      {...field}
                      value={field.value ?? ''}
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
                    setActivityFormFieldValue(
                      form,
                      field.name,
                      selected.map((o) => Number(o.value))
                    )
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
                      {teamTagOptions.length > 0 && (
                        <>
                          <ComboboxGroup items={teamTagOptions}>
                            <ComboboxCollection>
                              {(option: OptionItem) => (
                                <ComboboxItem key={option.value} value={option}>
                                  {option.label}
                                </ComboboxItem>
                              )}
                            </ComboboxCollection>
                          </ComboboxGroup>
                          <ComboboxSeparator />
                        </>
                      )}
                      <ComboboxGroup items={globalTagOptions}>
                        <ComboboxCollection>
                          {(option: OptionItem) => (
                            <ComboboxItem key={option.value} value={option}>
                              {option.label}
                            </ComboboxItem>
                          )}
                        </ComboboxCollection>
                      </ComboboxGroup>
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
