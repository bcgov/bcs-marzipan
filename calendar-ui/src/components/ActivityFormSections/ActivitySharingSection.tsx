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
import type { CreateActivityRequest } from '@corpcal/shared/schemas';
import type { Visibility } from '@corpcal/shared/constants/constants';
import { ActivityFormSection } from './ActivityFormSection';

type FormData = CreateActivityRequest;

type ActivitySharingSectionProps = {
  ownerOptions: Array<{ value: string; label: string }>;
  sharedWithTeamOptions: Array<{ value: string; label: string }>;
};

export const ActivitySharingSection: React.FC<ActivitySharingSectionProps> = ({
  ownerOptions,
  sharedWithTeamOptions,
}) => {
  const form = useFormContext<FormData>();
  return (
    <ActivityFormSection title="Sharing">
      <FormField
        control={form.control}
        name="commsContactLeadId"
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
        name="visibility"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Visibility</FormLabel>
            <Select
              onValueChange={(value) => {
                field.onChange(value as Visibility);
              }}
              value={field.value || 'global'}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select visibility" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="global">Global</SelectItem>
                <SelectItem value="team">Team Only</SelectItem>
              </SelectContent>
            </Select>
            <FormDescription>
              Global: visible to all teams. Team Only: visible only to your team
              and shared teams.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="sharedWithTeamIds"
        render={({ field }) => {
          const currentValues = Array.isArray(field.value)
            ? field.value
                .filter((v): v is number => typeof v === 'number')
                .map((v) => String(v))
            : [];
          return (
            <FormItem>
              <FormLabel>Shared With Teams</FormLabel>
              <FormControl>
                <Combobox
                  options={sharedWithTeamOptions}
                  selectedValues={currentValues}
                  onSelect={(value) => {
                    const teamId = parseInt(value);
                    const current = Array.isArray(field.value)
                      ? field.value
                      : [];
                    if (current.includes(teamId)) {
                      field.onChange(current.filter((id) => id !== teamId));
                    } else {
                      field.onChange([...current, teamId]);
                    }
                  }}
                  placeholder="Select teams"
                  searchPlaceholder="Search teams..."
                  emptyMessage="No teams found."
                />
              </FormControl>
              <FormDescription>
                These teams can see this activity and it will be marked as
                important for them. If visibility is Team Only, sharing grants
                access.
              </FormDescription>
              <FormMessage />
            </FormItem>
          );
        }}
      />
    </ActivityFormSection>
  );
};
