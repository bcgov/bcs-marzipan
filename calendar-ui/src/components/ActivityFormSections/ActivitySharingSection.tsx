import { useFormContext } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from '../ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Combobox } from '../ui/combobox';
import { calendarVisibilityOptions } from '../../constants/form-options';
import type { CreateActivityRequest } from '@corpcal/shared/schemas';
import { ActivityFormSection } from './ActivityFormSection';

type FormData = CreateActivityRequest & {
  sharedWithMinistryIds?: string[];
};

type ActivitySharingSectionProps = {
  ownerOptions: Array<{ value: string; label: string }>;
  sharedWithMinistryOptions: Array<{ value: string; label: string }>;
};

export const ActivitySharingSection: React.FC<ActivitySharingSectionProps> = ({
  ownerOptions,
  sharedWithMinistryOptions,
}) => {
  const form = useFormContext<FormData>();
  return (
    <ActivityFormSection title="Sharing">
      <FormField
        control={form.control}
        name="ownerId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Owner</FormLabel>
            <FormControl>
              <Combobox
                options={ownerOptions}
                selectedValues={field.value ? [field.value.toString()] : []}
                onSelect={(value) => {
                  const userId = parseInt(value);
                  if (field.value === userId) {
                    field.onChange(undefined);
                  } else {
                    field.onChange(userId);
                  }
                }}
                placeholder="Select owner"
                searchPlaceholder="Search users..."
                emptyMessage="No users found."
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="sharedWithMinistryIds"
        render={({ field }) => {
          const currentValue = Array.isArray(field.value)
            ? field.value[0] || ''
            : field.value || '';
          return (
            <FormItem>
              <FormLabel>Shared With</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value ? [value] : []);
                }}
                value={currentValue}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select ministry" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {sharedWithMinistryOptions.map((ministry) => (
                    <SelectItem key={ministry.value} value={ministry.value}>
                      {ministry.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                These ministries can view but not edit the entry
              </FormDescription>
              <FormMessage />
            </FormItem>
          );
        }}
      />

      <FormField
        control={form.control}
        name="calendarVisibility"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Calendar Visibility</FormLabel>
            <Select onValueChange={field.onChange} value={field.value || ''}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select calendar visibility" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {calendarVisibilityOptions.map((option) => (
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
    </ActivityFormSection>
  );
};
