import { useFormContext, useWatch } from 'react-hook-form';
import { useMemo } from 'react';

import type { TranslationRequiredStatusLookupItem } from '@corpcal/shared/api/types';
import type { ActivityFormData } from '@corpcal/shared/schemas';
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
import type { OptionItem } from '@/schemas/types';

import { useActivityEdit } from '../activity-edit-context';
import { ActivityFieldScopePermissionTooltip } from '../activity-field-scope-permission-tooltip';
import { ActivityFieldInfoIcon } from '../activity-info-icon-settings-context';
import { useActivityFieldScopeControl } from '../use-activity-field-scope-control';
import { ActivityFormSection } from './ActivityFormSection';

type ActivityReleaseSectionProps = {
  newsReleaseDistributionOptions: OptionItem[];
  newsReleaseOriginOptions: OptionItem[];
  translationRequiredStatuses: TranslationRequiredStatusLookupItem[];
  translationLanguageOptions: Array<{
    id: number;
    name: string;
    displayName?: string;
  }>;
};

/**
 * Isolated so `useWatch('translationsRequiredStatusId')` only re-renders this
 * subtree when that field changes, not the entire release section.
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
                          <ComboboxChipsInput placeholder="Select translation languages" />
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

export const ActivityReleaseSection: React.FC<ActivityReleaseSectionProps> = ({
  newsReleaseDistributionOptions,
  newsReleaseOriginOptions,
  translationRequiredStatuses,
  translationLanguageOptions,
}) => {
  const form = useFormContext<ActivityFormData>();
  const { readOnly } = useActivityEdit();
  const translationsScope = useActivityFieldScopeControl('translations');

  const requiredTranslationStatusId = useMemo(
    () => resolveTranslationRequiredStatusId(translationRequiredStatuses),
    [translationRequiredStatuses]
  );

  const translationLanguageComboboxOptions: OptionItem[] =
    translationLanguageOptions.map((l) => ({
      value: String(l.id),
      label: l.displayName ?? l.name,
    }));

  return (
    <ActivityFormSection title={ACTIVITY_FORM_SECTION_LABELS.newsRelease}>
      <FormField
        control={form.control}
        name="newsReleaseOriginId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              <>
                {getActivityFieldLabel(field.name)}
                <ActivityFieldInfoIcon
                  fieldKey="newsReleaseOriginId"
                  ariaLabel="About news release origin"
                />
              </>
            </FormLabel>
            <FormSelectSafe
              readOnly={readOnly}
              optionValues={newsReleaseOriginOptions.map((o) => o.value)}
              value={optionalIdSelectDisplayValue(field.value)}
              onValueChange={(value) =>
                setActivityFormFieldValue(
                  form,
                  field.name,
                  optionalSelectIdValue(value)
                )
              }
            >
              <FormControl data-field={field.name}>
                <FormSelectTrigger readOnly={readOnly}>
                  <SelectValue placeholder="Select news release origin" />
                </FormSelectTrigger>
              </FormControl>
              <SelectContent>
                {newsReleaseOriginOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </FormSelectSafe>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="newsReleaseDistributionId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              <>
                {getActivityFieldLabel(field.name)}
                <ActivityFieldInfoIcon
                  fieldKey="newsReleaseDistributionId"
                  ariaLabel="About news release distribution"
                />
              </>
            </FormLabel>
            <FormSelectSafe
              readOnly={readOnly}
              optionValues={newsReleaseDistributionOptions.map((o) => o.value)}
              value={optionalIdSelectDisplayValue(field.value)}
              onValueChange={(value) =>
                setActivityFormFieldValue(
                  form,
                  field.name,
                  optionalSelectIdValue(value)
                )
              }
            >
              <FormControl data-field={field.name}>
                <FormSelectTrigger readOnly={readOnly}>
                  <SelectValue placeholder="Select news release distribution" />
                </FormSelectTrigger>
              </FormControl>
              <SelectContent>
                {newsReleaseDistributionOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </FormSelectSafe>
            <FormMessage />
          </FormItem>
        )}
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
                  setActivityFormFieldValue(form, 'translationLanguageIds', []);
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
                    <SelectValue placeholder="Select status" />
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
        translationLanguageComboboxOptions={translationLanguageComboboxOptions}
      />
    </ActivityFormSection>
  );
};

// Use named export only
