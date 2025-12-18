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
import { calendarVisibilityOptions } from '../../data/mockLookups';
import { useMultiSelect } from '../../hooks/useMultiSelect';
import type { CreateActivityRequest } from '@corpcal/shared/schemas';
import { ActivityFormSection } from './ActivityFormSection';

type FormData = CreateActivityRequest & {
  canEditUserIds?: number[];
  sharedWithOrganizationIds?: string[];
};

type ActivitySharingSectionProps = {
  ownerOptions: Array<{ value: string; label: string }>;
  canEditUserOptions: Array<{ value: string; label: string }>;
  sharedWithOrgOptions: Array<{ value: string; label: string }>;
};

export const ActivitySharingSection: React.FC<ActivitySharingSectionProps> = ({
  ownerOptions,
  canEditUserOptions,
  sharedWithOrgOptions,
}) => {
  const form = useFormContext<FormData>();

  // Move useMultiSelect hook into the component
  const [selectedCanEdit, toggleCanEdit] = useMultiSelect<
    FormData,
    'canEditUserIds',
    number
  >(form, 'canEditUserIds');
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
        name="canEditUserIds"
        render={({ field: _field }) => (
          <FormItem>
            <FormLabel>Can Edit</FormLabel>
            <FormControl>
              <Combobox
                options={canEditUserOptions}
                selectedValues={selectedCanEdit.map((id) => id.toString())}
                onSelect={(value) => {
                  const userId = parseInt(value);
                  toggleCanEdit(userId);
                }}
                placeholder="Select users who can edit"
                searchPlaceholder="Search users..."
                emptyMessage="No users found."
              />
            </FormControl>
            <FormDescription>
              Select users who can edit this activity
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="sharedWithOrganizationIds"
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
                    <SelectValue placeholder="Select organization" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {sharedWithOrgOptions.map((org) => (
                    <SelectItem key={org.value} value={org.value}>
                      {org.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                These groups can view but not edit the entry
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
