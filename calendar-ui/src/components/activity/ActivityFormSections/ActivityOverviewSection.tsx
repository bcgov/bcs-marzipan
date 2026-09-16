import { format } from 'date-fns';
import { useFormContext, useWatch, type FieldPathValue } from 'react-hook-form';
import { toast } from 'sonner';
import { useMemo } from 'react';

import { TEAM_PREFIX_FALLBACK } from '@corpcal/shared';
import type {
  PitchRequiredStatusLookupItem,
  TeamListItem,
} from '@corpcal/shared/api/types';
import {
  ACTIVITY_BRIEF_RICH_TEXT_MAX_LENGTH,
  ACTIVITY_OPTIONAL_TEXT_MAX_LENGTH,
  ACTIVITY_SUMMARY_MAX_LENGTH,
  type ActivityFormData,
} from '@corpcal/shared/schemas';
import {
  filterAllowedLookupIds,
  isActivityRichTextEffectivelyEmpty,
  isLookupSelectable,
  tipTapDocJsonFromPlainText,
  type LookupTeamScope,
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
import { ActivityFieldInfoIcon } from '../activity-info-icon-settings-context';
import {
  defaultActivityLeadTeamFieldConfig,
  type ActivityLeadTeamFieldConfig,
} from '../activity-lead-team-field-config';
import { useActivityFieldScopeControl } from '../use-activity-field-scope-control';
import { ActivityFormSection } from './ActivityFormSection';

type LookupScopeItem = {
  id: number;
  visibility?: string;
  teamIds?: number[];
};

function toLookupScope(
  visibility: string | undefined,
  teamIds?: number[]
): LookupTeamScope {
  return {
    visibility: visibility === 'team' ? 'team' : 'global',
    teamIds,
  };
}

function isLookupPickable(
  item: LookupScopeItem,
  userTeamIds: number[],
  hasCreateAny: boolean
): boolean {
  return (
    hasCreateAny ||
    isLookupSelectable(
      toLookupScope(item.visibility, item.teamIds),
      userTeamIds
    )
  );
}

function toLookupOption(id: number, label: string): OptionItem {
  return { value: String(id), label };
}

function buildSelectedLookupOptions(
  selectedIds: number[] | undefined,
  labelById: Map<number, string>
): OptionItem[] {
  return (selectedIds ?? []).map((id) =>
    toLookupOption(id, labelById.get(id) ?? `Unknown (${id})`)
  );
}

function mergeComboboxItems(
  pickable: OptionItem[],
  selected: OptionItem[]
): OptionItem[] {
  const pickableValues = new Set(pickable.map((option) => option.value));
  const grandfathered = selected.filter(
    (option) => !pickableValues.has(option.value)
  );
  return [...pickable, ...grandfathered];
}

function applyAllowedLookupSelection(
  submittedIds: number[],
  existingIds: number[] | undefined,
  userTeamIds: number[],
  scopeById: Map<number, LookupTeamScope>,
  onApply: (allowedIds: number[]) => void
): void {
  const allowedIds = filterAllowedLookupIds(
    submittedIds,
    existingIds,
    userTeamIds,
    scopeById
  );
  if (allowedIds.length !== submittedIds.length) {
    toast.warning('That category or tag is not available to your teams.');
  }
  onApply(allowedIds);
}

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
            <FormLabel>
              <>
                {getActivityFieldLabel(field.name)}
                <ActivityFieldInfoIcon
                  fieldKey="leadOrgId"
                  ariaLabel="About lead organization"
                />
              </>
            </FormLabel>
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
    teamIds?: number[];
    description?: string | null;
  }>;
  organizations: LeadOrganizationOption[];
  tags: Array<{
    id: number;
    text: string;
    visibility?: string;
    teamIds?: number[];
  }>;
  pitchRequiredStatuses: PitchRequiredStatusLookupItem[];
  leadTeamField?: ActivityLeadTeamFieldConfig;
  userTeamIds: number[];
  hasCreateAny?: boolean;
};

export const ActivityOverviewSection: React.FC<
  ActivityOverviewSectionProps
> = ({
  categories,
  organizations,
  tags,
  pitchRequiredStatuses,
  leadTeamField: leadTeamFieldProp,
  userTeamIds,
  hasCreateAny = false,
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

  const categoryScopeById = useMemo(
    () =>
      new Map<number, LookupTeamScope>(
        categories.map((c) => [c.id, toLookupScope(c.visibility, c.teamIds)])
      ),
    [categories]
  );
  const categoryLabelById = useMemo(
    () =>
      new Map(categories.map((c) => [c.id, c.displayName ?? c.name] as const)),
    [categories]
  );
  const pickableCategories = useMemo(
    () =>
      categories.filter((c) => isLookupPickable(c, userTeamIds, hasCreateAny)),
    [categories, userTeamIds, hasCreateAny]
  );
  const pickableTeamCategoryOptions = useMemo(
    () =>
      pickableCategories
        .filter((c) => c.visibility === 'team')
        .map((c) => toLookupOption(c.id, c.displayName ?? c.name)),
    [pickableCategories]
  );
  const pickableGlobalCategoryOptions = useMemo(
    () =>
      pickableCategories
        .filter((c) => c.visibility !== 'team')
        .map((c) => toLookupOption(c.id, c.displayName ?? c.name)),
    [pickableCategories]
  );
  const pickableCategoryOptions = useMemo(
    () => [...pickableTeamCategoryOptions, ...pickableGlobalCategoryOptions],
    [pickableTeamCategoryOptions, pickableGlobalCategoryOptions]
  );

  const tagScopeById = useMemo(
    () =>
      new Map<number, LookupTeamScope>(
        tags.map((t) => [t.id, toLookupScope(t.visibility, t.teamIds)])
      ),
    [tags]
  );
  const tagLabelById = useMemo(
    () => new Map(tags.map((t) => [t.id, t.text] as const)),
    [tags]
  );
  const pickableTags = useMemo(
    () => tags.filter((t) => isLookupPickable(t, userTeamIds, hasCreateAny)),
    [tags, userTeamIds, hasCreateAny]
  );
  const pickableTeamTagOptions = useMemo(
    () =>
      pickableTags
        .filter((t) => t.visibility === 'team')
        .map((t) => toLookupOption(t.id, t.text)),
    [pickableTags]
  );
  const pickableGlobalTagOptions = useMemo(
    () =>
      pickableTags
        .filter((t) => t.visibility !== 'team')
        .map((t) => toLookupOption(t.id, t.text)),
    [pickableTags]
  );
  const pickableTagOptions = useMemo(
    () => [...pickableTeamTagOptions, ...pickableGlobalTagOptions],
    [pickableTeamTagOptions, pickableGlobalTagOptions]
  );

  return (
    <ActivityFormSection title={ACTIVITY_FORM_SECTION_LABELS.overview}>
      <FormField
        control={form.control}
        name="categoryIds"
        render={({ field }) => {
          const selectedOptions = buildSelectedLookupOptions(
            field.value,
            categoryLabelById
          );
          const categoryComboboxItems = mergeComboboxItems(
            pickableCategoryOptions,
            selectedOptions
          );
          return (
            <FormItem>
              <FormLabel showRequired>
                <>
                  {getActivityFieldLabel(field.name)}
                  <ActivityFieldInfoIcon
                    fieldKey="categoryIds"
                    ariaLabel="About categories"
                  />
                </>
              </FormLabel>
              <FormControl data-field={field.name}>
                <Combobox
                  items={categoryComboboxItems}
                  multiple
                  value={selectedOptions}
                  onValueChange={(selected) => {
                    const submittedIds = selected.map((o) => Number(o.value));
                    applyAllowedLookupSelection(
                      submittedIds,
                      field.value ?? [],
                      userTeamIds,
                      categoryScopeById,
                      (allowedIds) => {
                        setActivityFormFieldValue(form, field.name, allowedIds);
                      }
                    );
                  }}
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
                      {pickableTeamCategoryOptions.length > 0 && (
                        <>
                          <ComboboxGroup items={pickableTeamCategoryOptions}>
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
                      <ComboboxGroup items={pickableGlobalCategoryOptions}>
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
              <>
                {getActivityFieldLabel(field.name)}
                <ActivityFieldInfoIcon
                  fieldKey="title"
                  ariaLabel="About title"
                />
              </>
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

      {/* Lead team/organization moved below Significance per layout changes */}
      <FormField
        control={form.control}
        name="summary"
        render={({ field }) => (
          <FormItem>
            <FormLabel showRequired>
              <>
                {getActivityFieldLabel(field.name)}
                <ActivityFieldInfoIcon
                  fieldKey="summary"
                  ariaLabel="About summary"
                />
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
                placeholder="Enter activity summary"
                maxLength={ACTIVITY_SUMMARY_MAX_LENGTH}
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
                  <ActivityFieldInfoIcon
                    fieldKey="isConfidential"
                    ariaLabel="About confidential"
                  />
                </>
              </FormLabel>
              <p className="text-muted-foreground text-xs">
                Details not for Look Ahead
              </p>
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
                  <ActivityFieldInfoIcon
                    fieldKey="isIssue"
                    ariaLabel="About issue"
                  />
                </>
              </FormLabel>
            </div>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="significance"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              <>
                {getActivityFieldLabel(field.name)}
                <ActivityFieldInfoIcon
                  fieldKey="significance"
                  ariaLabel="About significance"
                />
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
                maxLength={ACTIVITY_BRIEF_RICH_TEXT_MAX_LENGTH}
                readOnly={readOnly}
                data-field={field.name}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Lead team and lead organization moved below Significance */}
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

      <FormSectionDivider />

      {canViewPitchStatus ? (
        <FormField
          control={form.control}
          name="pitchRequiredStatusId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <>
                  {getActivityFieldLabel(field.name)}
                  <ActivityFieldInfoIcon
                    fieldKey="pitchRequiredStatusId"
                    ariaLabel="About pitch required"
                  />
                </>
              </FormLabel>
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
                <FormLabel>
                  <>
                    {getActivityFieldLabel(field.name)}
                    <ActivityFieldInfoIcon
                      fieldKey="pitchDate"
                      ariaLabel="About pitch date"
                    />
                  </>
                </FormLabel>
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
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <>
                    {getActivityFieldLabel(field.name)}
                    <ActivityFieldInfoIcon
                      fieldKey="notes"
                      ariaLabel="About notes"
                    />
                  </>
                </FormLabel>
                <ActivityFieldScopePermissionTooltip scope="notes">
                  <FormControl data-field={field.name}>
                    <Textarea
                      placeholder="Enter notes"
                      readOnly={notesScope.readOnly}
                      disabled={notesScope.fieldScopeDisabled}
                      rows={4}
                      maxLength={ACTIVITY_OPTIONAL_TEXT_MAX_LENGTH}
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
          const selectedOptions = buildSelectedLookupOptions(
            field.value,
            tagLabelById
          );
          const tagComboboxItems = mergeComboboxItems(
            pickableTagOptions,
            selectedOptions
          );
          return (
            <FormItem>
              <FormLabel>
                <>
                  {getActivityFieldLabel(field.name)}
                  <ActivityFieldInfoIcon
                    fieldKey="tagIds"
                    ariaLabel="About tags"
                  />
                </>
              </FormLabel>
              <FormControl data-field={field.name}>
                <Combobox
                  items={tagComboboxItems}
                  multiple
                  value={selectedOptions}
                  onValueChange={(selected) => {
                    const submittedIds = selected.map((o) => Number(o.value));
                    applyAllowedLookupSelection(
                      submittedIds,
                      field.value ?? [],
                      userTeamIds,
                      tagScopeById,
                      (allowedIds) => {
                        setActivityFormFieldValue(form, field.name, allowedIds);
                      }
                    );
                  }}
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
                      {pickableTeamTagOptions.length > 0 && (
                        <>
                          <ComboboxGroup items={pickableTeamTagOptions}>
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
                      <ComboboxGroup items={pickableGlobalTagOptions}>
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
