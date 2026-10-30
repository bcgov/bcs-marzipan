import { useFormContext, useWatch } from 'react-hook-form';
import { useMemo } from 'react';

import type { TranslationRequiredStatusLookupItem } from '@corpcal/shared/api/types';
import type { ActivityFormData } from '@corpcal/shared/schemas';
import {
  isLookupSelectable,
  type LookupTeamScope,
} from '@corpcal/shared/utils';
import {
  FormSelectSafe,
  FormSelectTrigger,
} from '@/components/app/form-select';
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
import { SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import {
  optionalIdSelectDisplayValue,
  optionalSelectIdValue,
} from '@/lib/activity-form-coerce-value';
import { getActivityFieldLabel } from '@/lib/activity-form-labels';
import { ACTIVITY_FORM_SECTION_LABELS } from '@/lib/activity-form-section-labels';
import { setActivityFormFieldValue } from '@/lib/activity-form-set-field';
import { resolveTranslationRequiredStatusId } from '@/lib/activity-form-translation-required';
import {
  optionItemsEqual,
  uniqueNumericIdsFromOptions,
} from '@/lib/combobox-option-utils';
import type { OptionItem } from '@/schemas/types';

import { useActivityEdit } from '../activity-edit-context';
import { ActivityFieldScopePermissionTooltip } from '../activity-field-scope-permission-tooltip';
import { ActivityFieldInfoIcon } from '../activity-info-icon-settings-context';
import { useActivityFieldScopeControl } from '../use-activity-field-scope-control';
import { ActivityFormSection } from './ActivityFormSection';
import { OptionalLookupSelectField } from './OptionalLookupSelectField';

type CommsMaterialOption = {
  id: number;
  name: string;
  displayName?: string;
  visibility?: string;
  teamIds?: number[];
  releaseType?: {
    audience: 'media' | 'public';
    allowsTranslation: boolean;
    requiresNewsReleaseDetails: boolean;
  } | null;
};

type ActivityCommsSectionProps = {
  commsMaterialOptions: CommsMaterialOption[];
  newsReleaseDistributionOptions: OptionItem[];
  newsReleaseOriginOptions: OptionItem[];
  translationRequiredStatuses: TranslationRequiredStatusLookupItem[];
  translationLanguageOptions: Array<{
    id: number;
    name: string;
    displayName?: string;
  }>;
  userTeamIds: number[];
  hasCreateAny?: boolean;
};

type CommsMaterialOptionItem = OptionItem & {
  isRelease?: boolean;
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

/** Same styling as Comms Contacts “Lead” chip badges. */
const releaseBadgeClassName =
  'bg-primary/15 text-primary rounded px-1.5 py-0.5 text-[10px] font-medium shrink-0';

function CommsMaterialReleaseBadge() {
  return <span className={releaseBadgeClassName}>Release</span>;
}

function isMaterialPickable(
  item: CommsMaterialOption,
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

function CommsMaterialOptionLabel({
  label,
  isRelease,
}: {
  label: string;
  isRelease?: boolean;
}) {
  if (!isRelease) {
    return <span>{label}</span>;
  }
  return (
    <span className="flex items-center gap-1.5">
      <span>{label}</span>
      <CommsMaterialReleaseBadge />
    </span>
  );
}

/**
 * Isolated so `useWatch('translationsRequiredStatusId')` only re-renders this
 * subtree when that field changes, not the entire comms section.
 */
function TranslationLanguagesField({
  requiredTranslationStatusId,
  translationLanguageComboboxOptions,
}: {
  requiredTranslationStatusId: number | undefined;
  translationLanguageComboboxOptions: OptionItem[];
}) {
  const form = useFormContext<ActivityFormData>();
  const translationsScope = useActivityFieldScopeControl('translations');
  const translationsAnchorRef = useComboboxAnchor();
  const translationsRequiredStatusId = useWatch({
    control: form.control,
    name: 'translationsRequiredStatusId',
  });

  const showLanguages =
    requiredTranslationStatusId != null &&
    translationsRequiredStatusId === requiredTranslationStatusId;

  if (!showLanguages) {
    return null;
  }

  return (
    <FormField
      control={form.control}
      name="translationLanguageIds"
      render={({ field }) => {
        const selectedOptions = translationLanguageComboboxOptions.filter((o) =>
          (field.value ?? []).includes(Number(o.value))
        );
        return (
          <FormItem>
            <FormLabel>
              <>
                {getActivityFieldLabel(field.name)}
                <ActivityFieldInfoIcon
                  fieldKey="translationLanguageIds"
                  ariaLabel="About translation languages"
                />
              </>
            </FormLabel>
            <ActivityFieldScopePermissionTooltip scope="translations">
              <FormControl data-field={field.name}>
                <Combobox
                  items={translationLanguageComboboxOptions}
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
                  readOnly={
                    translationsScope.readOnly &&
                    !translationsScope.fieldScopeDisabled
                  }
                  disabled={translationsScope.fieldScopeDisabled}
                >
                  <ComboboxChips ref={translationsAnchorRef} className="w-full">
                    <ComboboxValue>
                      {(values: OptionItem[]) => (
                        <>
                          {values.map((option) => (
                            <ComboboxChip key={option.value}>
                              {option.label}
                            </ComboboxChip>
                          ))}
                          <ComboboxChipsInput placeholder="" />
                        </>
                      )}
                    </ComboboxValue>
                  </ComboboxChips>
                  <ComboboxContent anchor={translationsAnchorRef}>
                    <ComboboxEmpty>
                      No translation languages found.
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
            </ActivityFieldScopePermissionTooltip>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}

export const ActivityCommsSection: React.FC<ActivityCommsSectionProps> = ({
  commsMaterialOptions,
  newsReleaseDistributionOptions,
  newsReleaseOriginOptions,
  translationRequiredStatuses,
  translationLanguageOptions,
  userTeamIds,
  hasCreateAny = false,
}) => {
  const form = useFormContext<ActivityFormData>();
  const { readOnly } = useActivityEdit();
  const translationsScope = useActivityFieldScopeControl('translations');
  const commsMaterialsAnchorRef = useComboboxAnchor();
  const commsMaterialIds = useWatch({
    control: form.control,
    name: 'commsMaterialIds',
  });

  const requiredTranslationStatusId = useMemo(
    () => resolveTranslationRequiredStatusId(translationRequiredStatuses),
    [translationRequiredStatuses]
  );

  const materialById = useMemo(
    () => new Map(commsMaterialOptions.map((m) => [m.id, m] as const)),
    [commsMaterialOptions]
  );

  const pickableMaterials = useMemo(
    () =>
      commsMaterialOptions.filter((m) =>
        isMaterialPickable(m, userTeamIds, hasCreateAny)
      ),
    [commsMaterialOptions, userTeamIds, hasCreateAny]
  );

  const pickableTeamMaterials = useMemo(
    () =>
      pickableMaterials.filter(
        (m) =>
          m.visibility === 'team' &&
          isLookupSelectable(
            toLookupScope(m.visibility, m.teamIds),
            userTeamIds
          )
      ),
    [pickableMaterials, userTeamIds]
  );

  const pickableGlobalMaterials = useMemo(
    () => pickableMaterials.filter((m) => m.visibility !== 'team'),
    [pickableMaterials]
  );

  const otherTeamMaterials = useMemo(
    () =>
      hasCreateAny
        ? pickableMaterials.filter(
            (m) =>
              m.visibility === 'team' &&
              !isLookupSelectable(
                toLookupScope(m.visibility, m.teamIds),
                userTeamIds
              )
          )
        : [],
    [pickableMaterials, userTeamIds, hasCreateAny]
  );

  const toCommsOption = (m: CommsMaterialOption): CommsMaterialOptionItem => ({
    value: String(m.id),
    label: m.displayName ?? m.name,
    isRelease: m.releaseType != null,
  });

  const pickableComboboxOptions = useMemo(
    () =>
      [
        ...pickableTeamMaterials,
        ...pickableGlobalMaterials,
        ...otherTeamMaterials,
      ].map(toCommsOption),
    [pickableTeamMaterials, pickableGlobalMaterials, otherTeamMaterials]
  );

  const selectedFlags = useMemo(() => {
    const ids = commsMaterialIds ?? [];
    let requiresNewsReleaseDetails = false;
    let allowsTranslation = false;
    for (const id of ids) {
      const rt = materialById.get(id)?.releaseType;
      if (rt?.requiresNewsReleaseDetails) requiresNewsReleaseDetails = true;
      if (rt?.allowsTranslation) allowsTranslation = true;
    }
    return { requiresNewsReleaseDetails, allowsTranslation };
  }, [commsMaterialIds, materialById]);

  const translationLanguageComboboxOptions: OptionItem[] =
    translationLanguageOptions.map((l) => ({
      value: String(l.id),
      label: l.displayName ?? l.name,
    }));

  const mergeComboboxItems = (
    pickable: CommsMaterialOptionItem[],
    selected: CommsMaterialOptionItem[]
  ): CommsMaterialOptionItem[] => {
    const pickableValues = new Set(pickable.map((o) => o.value));
    const grandfathered = selected.filter((o) => !pickableValues.has(o.value));
    return [...pickable, ...grandfathered];
  };

  return (
    <ActivityFormSection title={ACTIVITY_FORM_SECTION_LABELS.comms}>
      <FormField
        control={form.control}
        name="commsMaterialIds"
        render={({ field }) => {
          const selectedOptions: CommsMaterialOptionItem[] = (
            field.value ?? []
          ).map((id) => {
            const m = materialById.get(id);
            return toCommsOption(
              m ?? {
                id,
                name: `Unknown (${id})`,
                displayName: `Unknown (${id})`,
              }
            );
          });
          const comboboxItems = mergeComboboxItems(
            pickableComboboxOptions,
            selectedOptions
          );

          return (
            <FormItem>
              <FormLabel>
                <>
                  {getActivityFieldLabel(field.name)}
                  <ActivityFieldInfoIcon
                    fieldKey="commsMaterialIds"
                    ariaLabel="About communications materials"
                  />
                </>
              </FormLabel>
              <p className="text-muted-foreground mb-2 text-sm">
                Selecting News release shows additional fields below. Materials
                with a Release badge may be published through the sister app.
              </p>
              <FormControl data-field={field.name}>
                <Combobox
                  items={comboboxItems}
                  multiple
                  value={selectedOptions}
                  onValueChange={(selected) =>
                    setActivityFormFieldValue(
                      form,
                      field.name,
                      uniqueNumericIdsFromOptions(selected)
                    )
                  }
                  itemToStringValue={(o) => o.label}
                  isItemEqualToValue={optionItemsEqual}
                  readOnly={readOnly}
                >
                  <ComboboxChips
                    ref={commsMaterialsAnchorRef}
                    className="w-full"
                  >
                    <ComboboxValue>
                      {(values: CommsMaterialOptionItem[]) => (
                        <>
                          {values.map((option) => (
                            <ComboboxChip key={option.value}>
                              <span className="flex items-center gap-1.5">
                                {option.label}
                                {option.isRelease ? (
                                  <CommsMaterialReleaseBadge />
                                ) : null}
                              </span>
                            </ComboboxChip>
                          ))}
                          <ComboboxChipsInput placeholder="" />
                        </>
                      )}
                    </ComboboxValue>
                  </ComboboxChips>
                  <ComboboxContent anchor={commsMaterialsAnchorRef}>
                    <ComboboxEmpty>No comms materials found.</ComboboxEmpty>
                    <ComboboxList>
                      {(option: CommsMaterialOptionItem) => (
                        <ComboboxItem key={option.value} value={option}>
                          <CommsMaterialOptionLabel
                            label={option.label}
                            isRelease={option.isRelease}
                          />
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

      {selectedFlags.requiresNewsReleaseDetails ? (
        <div className="space-y-6 rounded-md border border-gray-300 p-6">
          <p className="font-bold text-slate-800">News release details</p>
          <OptionalLookupSelectField
            control={form.control}
            name="newsReleaseOriginId"
            options={newsReleaseOriginOptions}
            readOnly={readOnly}
            infoAriaLabel="About news release origin"
          />
          <OptionalLookupSelectField
            control={form.control}
            name="newsReleaseDistributionId"
            options={newsReleaseDistributionOptions}
            readOnly={readOnly}
            infoAriaLabel="About news release distribution"
          />
          <FormField
            control={form.control}
            name="translationsRequiredStatusId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <>
                    {getActivityFieldLabel(field.name)}
                    <ActivityFieldInfoIcon
                      fieldKey="translationsRequiredStatusId"
                      ariaLabel="About translations required"
                    />
                  </>
                </FormLabel>
                <FormSelectSafe
                  readOnly={translationsScope.readOnly}
                  disabled={translationsScope.fieldScopeDisabled}
                  optionValues={translationRequiredStatuses.map((s) =>
                    String(s.id)
                  )}
                  value={optionalIdSelectDisplayValue(field.value)}
                  onValueChange={(value) => {
                    const nextStatusId = optionalSelectIdValue(value);
                    setActivityFormFieldValue(form, field.name, nextStatusId);
                    if (
                      requiredTranslationStatusId != null &&
                      nextStatusId !== requiredTranslationStatusId
                    ) {
                      setActivityFormFieldValue(
                        form,
                        'translationLanguageIds',
                        []
                      );
                    }
                  }}
                >
                  <ActivityFieldScopePermissionTooltip scope="translations">
                    <FormControl data-field={field.name}>
                      <FormSelectTrigger
                        readOnly={
                          translationsScope.readOnly &&
                          !translationsScope.fieldScopeDisabled
                        }
                      >
                        <SelectValue placeholder="" />
                      </FormSelectTrigger>
                    </FormControl>
                  </ActivityFieldScopePermissionTooltip>
                  <SelectContent>
                    {translationRequiredStatuses.map((status) => (
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
          <TranslationLanguagesField
            requiredTranslationStatusId={requiredTranslationStatusId}
            translationLanguageComboboxOptions={
              translationLanguageComboboxOptions
            }
          />
        </div>
      ) : null}

      {selectedFlags.allowsTranslation &&
      !selectedFlags.requiresNewsReleaseDetails ? (
        <div className="space-y-6">
          <FormField
            control={form.control}
            name="translationsRequiredStatusId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <>
                    {getActivityFieldLabel(field.name)}
                    <ActivityFieldInfoIcon
                      fieldKey="translationsRequiredStatusId"
                      ariaLabel="About translations required"
                    />
                  </>
                </FormLabel>
                <FormSelectSafe
                  readOnly={translationsScope.readOnly}
                  disabled={translationsScope.fieldScopeDisabled}
                  optionValues={translationRequiredStatuses.map((s) =>
                    String(s.id)
                  )}
                  value={optionalIdSelectDisplayValue(field.value)}
                  onValueChange={(value) => {
                    const nextStatusId = optionalSelectIdValue(value);
                    setActivityFormFieldValue(form, field.name, nextStatusId);
                    if (
                      requiredTranslationStatusId != null &&
                      nextStatusId !== requiredTranslationStatusId
                    ) {
                      setActivityFormFieldValue(
                        form,
                        'translationLanguageIds',
                        []
                      );
                    }
                  }}
                >
                  <ActivityFieldScopePermissionTooltip scope="translations">
                    <FormControl data-field={field.name}>
                      <FormSelectTrigger
                        readOnly={
                          translationsScope.readOnly &&
                          !translationsScope.fieldScopeDisabled
                        }
                      >
                        <SelectValue placeholder="" />
                      </FormSelectTrigger>
                    </FormControl>
                  </ActivityFieldScopePermissionTooltip>
                  <SelectContent>
                    {translationRequiredStatuses.map((status) => (
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
          <TranslationLanguagesField
            requiredTranslationStatusId={requiredTranslationStatusId}
            translationLanguageComboboxOptions={
              translationLanguageComboboxOptions
            }
          />
        </div>
      ) : null}
    </ActivityFormSection>
  );
};
