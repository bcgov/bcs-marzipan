import { ChevronDown } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import { useState } from 'react';

import type { CreateActivityRequest } from '@corpcal/shared/schemas';

import { useMultiSelect } from '../../hooks/useMultiSelect';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Label } from '../ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { ActivityFormSection } from './ActivityFormSection';

type FormData = CreateActivityRequest & {
  translationLanguageIds?: number[];
  newsReleaseOriginId?: number | null;
  newsReleaseDistributionId?: number | null;
};

type ActivityNewsReleaseSectionProps = {
  translationLanguageOptions: Array<{
    id: number;
    name: string;
    displayName?: string;
  }>;
  newsReleaseDistributionOptions: Array<{ value: string; label: string }>;
  newsReleaseOriginOptions: Array<{ value: string; label: string }>;
};

export const ActivityNewsReleaseSection: React.FC<
  ActivityNewsReleaseSectionProps
> = ({
  translationLanguageOptions,
  newsReleaseDistributionOptions,
  newsReleaseOriginOptions,
}) => {
  const form = useFormContext<FormData>();

  const [selectedTranslationLanguages, toggleTranslationLanguage] =
    useMultiSelect<FormData, 'translationLanguageIds', number>(
      form,
      'translationLanguageIds'
    );

  const [translationsOpen, setTranslationsOpen] = useState(false);

  return (
    <ActivityFormSection title="News release">
      <FormField
        control={form.control}
        name="newsReleaseOriginId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>News Release Origin</FormLabel>
            <Select
              onValueChange={(value) =>
                field.onChange(value ? parseInt(value, 10) : null)
              }
              value={field.value?.toString() || ''}
            >
              <FormControl>
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
              onValueChange={(value) =>
                field.onChange(value ? parseInt(value, 10) : null)
              }
              value={field.value?.toString() || ''}
            >
              <FormControl>
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
        <Popover open={translationsOpen} onOpenChange={setTranslationsOpen}>
          <PopoverTrigger asChild>
            <Button
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
