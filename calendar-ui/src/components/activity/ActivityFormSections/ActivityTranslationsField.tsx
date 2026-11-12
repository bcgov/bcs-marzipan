import { useFormContext, useWatch } from 'react-hook-form';
import { useMemo } from 'react';

import type { TranslationRequiredStatusLookupItem } from '@corpcal/shared/api/types';
import type { ActivityFormData } from '@corpcal/shared/schemas';
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
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
import { getActivityFieldLabel } from '@/lib/activity-form-labels';
import { setActivityFormFieldValue } from '@/lib/activity-form-set-field';
import {
  comboboxValuesToTranslationFields,
  normalizeTranslationComboboxValues,
  resolveTranslationStatusLookupIds,
  TRANSLATION_COMBO_SENTINEL_NONE,
  translationFieldsToComboboxValues,
} from '@/lib/activity-form-translation-required';
import { optionItemsEqual } from '@/lib/combobox-option-utils';
import { cn } from '@/lib/utils';
import type { OptionItem } from '@/schemas/types';

import { useActivityEdit } from '../activity-edit-context';
import { ActivityFieldInfoIcon } from '../activity-info-icon-settings-context';

const IMPLICIT_TBD_PLACEHOLDER = 'Translations TBD';

const NO_TRANSLATIONS_ITEM: OptionItem = {
  value: TRANSLATION_COMBO_SENTINEL_NONE,
  label: 'No translations',
};

export type ActivityTranslationsFieldProps = {
  translationRequiredStatuses: TranslationRequiredStatusLookupItem[];
  translationLanguageOptions: Array<{
    id: number;
    name: string;
    displayName?: string;
  }>;
};

export function ActivityTranslationsField({
  translationRequiredStatuses,
  translationLanguageOptions,
}: ActivityTranslationsFieldProps) {
  const form = useFormContext<ActivityFormData>();
  const { readOnly } = useActivityEdit();
  const anchorRef = useComboboxAnchor();

  const lookupIds = useMemo(
    () => resolveTranslationStatusLookupIds(translationRequiredStatuses),
    [translationRequiredStatuses]
  );

  const translationsRequiredStatusId = useWatch({
    control: form.control,
    name: 'translationsRequiredStatusId',
  });
  const translationLanguageIds = useWatch({
    control: form.control,
    name: 'translationLanguageIds',
  });

  const languageItems = useMemo(
    (): OptionItem[] =>
      translationLanguageOptions.map((l) => ({
        value: String(l.id),
        label: l.displayName ?? l.name,
      })),
    [translationLanguageOptions]
  );

  const comboboxItems = useMemo(
    (): OptionItem[] => [NO_TRANSLATIONS_ITEM, ...languageItems],
    [languageItems]
  );

  const selectedValues = translationFieldsToComboboxValues(
    translationsRequiredStatusId,
    translationLanguageIds,
    lookupIds
  );
  const selectedOptions = comboboxItems.filter((o) =>
    selectedValues.includes(o.value)
  );

  return (
    <FormField
      control={form.control}
      name="translationLanguageIds"
      render={() => (
        <FormItem>
          <FormLabel>
            <>
              {getActivityFieldLabel('translationLanguageIds')}
              <ActivityFieldInfoIcon
                fieldKey="translationLanguageIds"
                ariaLabel="About translations"
              />
            </>
          </FormLabel>
          <FormControl data-field="translationLanguageIds">
            <Combobox
              items={comboboxItems}
              multiple
              value={selectedOptions}
              onValueChange={(selected) => {
                if (lookupIds == null) return;
                const normalized = normalizeTranslationComboboxValues(
                  selected.map((o) => o.value)
                );
                const fields = comboboxValuesToTranslationFields(
                  normalized,
                  lookupIds
                );
                setActivityFormFieldValue(
                  form,
                  'translationsRequiredStatusId',
                  fields.translationsRequiredStatusId
                );
                setActivityFormFieldValue(
                  form,
                  'translationLanguageIds',
                  fields.translationLanguageIds
                );
              }}
              itemToStringValue={(o) => o.label}
              isItemEqualToValue={optionItemsEqual}
              readOnly={readOnly}
            >
              <ComboboxChips ref={anchorRef} className="group/chips w-full">
                <ComboboxValue>
                  {(values: OptionItem[]) => {
                    const implicitTbd = values.length === 0;
                    return (
                      <>
                        {values.map((option) => (
                          <ComboboxChip key={option.value}>
                            {option.label}
                          </ComboboxChip>
                        ))}
                        {implicitTbd ? (
                          <div className="relative flex w-full min-w-0 flex-1 basis-full items-center">
                            <span
                              className={cn(
                                'text-muted-foreground max-w-full truncate',
                                readOnly
                                  ? 'px-0.5'
                                  : 'pointer-events-none absolute inset-y-0 left-0 flex items-center pr-1 group-focus-within/chips:hidden'
                              )}
                            >
                              {IMPLICIT_TBD_PLACEHOLDER}
                            </span>
                            <ComboboxChipsInput
                              placeholder=""
                              className={cn(
                                'min-w-0 flex-1',
                                readOnly
                                  ? 'sr-only h-px w-px overflow-hidden border-0 p-0 opacity-0'
                                  : 'w-full'
                              )}
                            />
                          </div>
                        ) : (
                          <ComboboxChipsInput placeholder="" />
                        )}
                      </>
                    );
                  }}
                </ComboboxValue>
              </ComboboxChips>
              <ComboboxContent anchor={anchorRef}>
                <ComboboxEmpty>No options found.</ComboboxEmpty>
                <ComboboxList>
                  <ComboboxGroup items={[NO_TRANSLATIONS_ITEM]}>
                    <ComboboxCollection>
                      {(option: OptionItem) => (
                        <ComboboxItem key={option.value} value={option}>
                          {option.label}
                        </ComboboxItem>
                      )}
                    </ComboboxCollection>
                  </ComboboxGroup>
                  {languageItems.length > 0 ? (
                    <>
                      <ComboboxSeparator />
                      <ComboboxGroup items={languageItems}>
                        <ComboboxCollection>
                          {(option: OptionItem) => (
                            <ComboboxItem key={option.value} value={option}>
                              {option.label}
                            </ComboboxItem>
                          )}
                        </ComboboxCollection>
                      </ComboboxGroup>
                    </>
                  ) : null}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
