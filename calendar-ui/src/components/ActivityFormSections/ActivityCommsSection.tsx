import { useFormContext } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from '../ui/form';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

import { X } from 'lucide-react';
import { useMultiSelect } from '../../hooks/useMultiSelect';
import type { CreateActivityRequest } from '@corpcal/shared/schemas';
import { ActivityFormSection } from './ActivityFormSection';

type FormData = CreateActivityRequest & {
  commsMaterialIds?: number[];
  translationLanguageIds?: number[];
};

type ActivityCommsSectionProps = {
  commsMaterialOptions: Array<{
    id: number;
    name: string;
    displayName?: string;
  }>;
  translationLanguageOptions: Array<{
    id: number;
    name: string;
    displayName?: string;
  }>;
  organizations: Array<{ value: string; label: string }>;
};

export const ActivityCommsSection: React.FC<ActivityCommsSectionProps> = ({
  commsMaterialOptions,
  translationLanguageOptions,
  organizations,
}) => {
  const form = useFormContext<FormData>();

  // Move useMultiSelect hooks into the component
  const [selectedCommsMaterials, toggleCommsMaterial] = useMultiSelect<
    FormData,
    'commsMaterialIds',
    number
  >(form, 'commsMaterialIds');

  const [selectedTranslationLanguages, toggleTranslationLanguage] =
    useMultiSelect<FormData, 'translationLanguageIds', number>(
      form,
      'translationLanguageIds'
    );
  return (
    <ActivityFormSection title="Comms">
      <div>
        <Label className="mb-3 block">Comms Materials</Label>
        <div className="flex flex-wrap gap-2">
          {commsMaterialOptions.map((material) => (
            <Badge
              key={material.id}
              variant={
                selectedCommsMaterials.includes(material.id)
                  ? 'default'
                  : 'outline'
              }
              className="cursor-pointer px-4 py-2 text-sm"
              onClick={() => toggleCommsMaterial(material.id)}
            >
              {material.displayName || material.name}
              {selectedCommsMaterials.includes(material.id) && (
                <X className="ml-2 h-3 w-3" />
              )}
            </Badge>
          ))}
        </div>
        <FormDescription className="mt-2">
          Select comms materials if applicable
        </FormDescription>
      </div>

      <FormField
        control={form.control}
        name="newsReleaseId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>News Release</FormLabel>
            <FormControl>
              <Input
                placeholder="Enter news release ID (UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)"
                {...field}
                value={field.value || ''}
              />
            </FormControl>
            <FormDescription>
              Enter a valid UUID (e.g., 123e4567-e89b-12d3-a456-426614174001) or
              leave empty
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="newsReleaseOriginId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>News Release Origin Organization</FormLabel>
            <Select
              onValueChange={(value) => {
                field.onChange(value || null);
                // Clear freeform name when selecting from dropdown
                form.setValue('newsReleaseOriginName', null);
              }}
              value={field.value || undefined}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select organization" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {organizations.map((org) => (
                  <SelectItem key={org.value} value={org.value}>
                    {org.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormDescription>
              Select an organization from the list, or enter a freeform name
              below
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="newsReleaseOriginName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>News Release Origin Name (Freeform)</FormLabel>
            <FormControl>
              <Input
                placeholder="Enter organization name"
                {...field}
                value={field.value || ''}
                onChange={(e) => {
                  field.onChange(e.target.value || null);
                  // Clear organization ID when entering freeform name
                  if (e.target.value) {
                    form.setValue('newsReleaseOriginId', null);
                  }
                }}
              />
            </FormControl>
            <FormDescription>
              Enter a freeform organization name, or select from the dropdown
              above
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <div>
        <Label className="mb-3 block">Translations Required</Label>
        <div className="flex flex-wrap gap-2">
          {translationLanguageOptions.map((language) => (
            <Badge
              key={language.id}
              variant={
                selectedTranslationLanguages.includes(language.id)
                  ? 'default'
                  : 'outline'
              }
              className="cursor-pointer px-4 py-2 text-sm"
              onClick={() => toggleTranslationLanguage(language.id)}
            >
              {language.displayName || language.name}
              {selectedTranslationLanguages.includes(language.id) && (
                <X className="ml-2 h-3 w-3" />
              )}
            </Badge>
          ))}
        </div>
        <FormDescription className="mt-2">
          Select translation languages if applicable
        </FormDescription>
      </div>
    </ActivityFormSection>
  );
};
