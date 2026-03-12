import { ChevronDown } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import { useState } from 'react';

import type { ActivityFormData } from '@corpcal/shared/schemas';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMultiSelect } from '@/hooks/useMultiSelect';
import { getActivityFormSectionLabel } from '@/lib/activity-form-section-labels';

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

  const [selectedTranslationLanguages, toggleTranslationLanguage] =
    useMultiSelect<ActivityFormData, 'translationLanguageIds', number>(
      form,
      'translationLanguageIds'
    );

  const [translationsOpen, setTranslationsOpen] = useState(false);

  return (
    <ActivityFormSection
      title={getActivityFormSectionLabel('newsRelease')}
      variant="bottom-no-divider"
    >
      <FormField
        control={form.control}
        name="newsReleaseOriginId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>News Release Origin</FormLabel>
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
            <FormLabel>News Release Distribution</FormLabel>
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

      <div>
        <Label className="mb-3 block">Translations Required</Label>
        <Popover
          open={readOnly ? false : translationsOpen}
          onOpenChange={readOnly ? () => {} : setTranslationsOpen}
        >
          <PopoverTrigger asChild>
            <Button
              disabled={readOnly}
              variant="outline"
              role="combobox"
              className="w-full justify-between"
            >
              {selectedTranslationLanguages.length > 0
                ? `${selectedTranslationLanguages.length} selected`
                : 'Select translation languages'}
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <div className="max-h-60 overflow-auto p-4">
              <div className="space-y-2">
                {translationLanguageOptions.map((language) => (
                  <div
                    key={language.id}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox
                      id={`translation-language-${language.id}`}
                      checked={selectedTranslationLanguages.includes(
                        language.id
                      )}
                      disabled={readOnly}
                      onCheckedChange={() =>
                        toggleTranslationLanguage(language.id)
                      }
                    />
                    <label
                      htmlFor={`translation-language-${language.id}`}
                      className="cursor-pointer text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {language.displayName || language.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
        <FormDescription className="mt-2">
          Select translation languages if applicable
        </FormDescription>
      </div>
    </ActivityFormSection>
  );
};
