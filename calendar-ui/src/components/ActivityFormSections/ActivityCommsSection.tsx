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
import {
  mockSystemUsers,
  mockCommsMaterials,
  mockTranslationLanguages,
} from '../../data/mockLookups';
import { useMultiSelect } from '../../hooks/useMultiSelect';
import type { CreateActivityRequest } from '@corpcal/shared/schemas';
import { ActivityFormSection } from './ActivityFormSection';

type FormData = CreateActivityRequest & {
  commsMaterialIds?: number[];
  translationLanguageIds?: number[];
};

type ActivityCommsSectionProps = Record<string, never>;

export const ActivityCommsSection: React.FC<ActivityCommsSectionProps> = () => {
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
      <FormField
        control={form.control}
        name="commsLeadId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Comms Lead</FormLabel>
            <Select
              onValueChange={(value) => field.onChange(parseInt(value))}
              value={field.value?.toString()}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select comms lead" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {mockSystemUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <div>
        <Label className="mb-3 block">Comms Materials</Label>
        <div className="flex flex-wrap gap-2">
          {mockCommsMaterials.map((material) => (
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

      <div>
        <Label className="mb-3 block">Translations Required</Label>
        <div className="flex flex-wrap gap-2">
          {mockTranslationLanguages.map((language) => (
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
