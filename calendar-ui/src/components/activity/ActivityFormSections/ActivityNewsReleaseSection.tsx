import { useFormContext } from 'react-hook-form';

import type { ActivityFormData } from '@corpcal/shared/schemas';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getActivityFieldLabel } from '@/lib/activity-form-labels';
import { ACTIVITY_FORM_SECTION_LABELS } from '@/lib/activity-form-section-labels';

import { ActivityFormSection } from './ActivityFormSection';

type ActivityNewsReleaseSectionProps = {
  translationLanguageOptions: Array<{
    id: number;
    name: string;
    displayName?: string;
  }>;
  newsReleaseDistributionOptions: Array<{ value: string; label: string }>;
  newsReleaseOriginOptions: Array<{ value: string; label: string }>;
  readOnly?: boolean;
};

export const ActivityNewsReleaseSection: React.FC<
  ActivityNewsReleaseSectionProps
> = ({
  translationLanguageOptions,
  newsReleaseDistributionOptions,
  newsReleaseOriginOptions,
  readOnly = false,
}) => {
  const form = useFormContext<ActivityFormData>();
  const translationsAnchorRef = useComboboxAnchor();

  const translationLanguageComboboxOptions = translationLanguageOptions.map(
    (l) => ({
      value: String(l.id),
      label: l.displayName ?? l.name,
    })
  );

  return (
    <ActivityFormSection
      title={ACTIVITY_FORM_SECTION_LABELS.newsRelease}
      variant="bottom-no-divider"
    >
      <FormField
        control={form.control}
        name="newsReleaseOriginId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{getActivityFieldLabel(field.name)}</FormLabel>
            <Select
              disabled={readOnly}
              onValueChange={(value) =>
                field.onChange(value ? parseInt(value, 10) : null)
              }
              value={field.value?.toString() || ''}
            >
              <FormControl data-field={field.name}>
                <SelectTrigger>
                  <SelectValue placeholder="Select news release origin" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {newsReleaseOriginOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="newsReleaseDistributionId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{getActivityFieldLabel(field.name)}</FormLabel>
            <Select
              disabled={readOnly}
              onValueChange={(value) =>
                field.onChange(value ? parseInt(value, 10) : null)
              }
              value={field.value?.toString() || ''}
            >
              <FormControl data-field={field.name}>
                <SelectTrigger>
                  <SelectValue placeholder="Select news release distribution" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {newsReleaseDistributionOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="translationLanguageIds"
        render={({ field }) => {
          const selectedOptions = translationLanguageComboboxOptions.filter(
            (o) => (field.value ?? []).includes(Number(o.value))
          );
          return (
            <FormItem>
              <FormLabel>{getActivityFieldLabel(field.name)}</FormLabel>
              <FormControl data-field={field.name}>
                <Combobox
                  items={translationLanguageComboboxOptions}
                  multiple
                  value={selectedOptions}
                  onValueChange={(selected) =>
                    field.onChange(selected.map((o) => Number(o.value)))
                  }
                  itemToStringValue={(o) => o.label}
                  disabled={readOnly}
                >
                  <ComboboxChips ref={translationsAnchorRef} className="w-full">
                    <ComboboxValue>
                      {(values: Array<{ value: string; label: string }>) => (
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
                      {(option: { value: string; label: string }) => (
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
