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
  commsLeadOptions: Array<{ value: string; label: string }>;
  sharedWithTeamOptions: Array<{ value: string; label: string }>;
};

export const ActivitySharingSection: React.FC<ActivitySharingSectionProps> = ({
  commsLeadOptions,
  sharedWithTeamOptions,
}) => {
  const form = useFormContext<FormData>();
  return (
    <ActivityFormSection title="Sharing">
      <FormField
        control={form.control}
        name="commsContacts"
        render={({ field }) => {
          // Find the lead contact from the array
          const leadContact = Array.isArray(field.value)
            ? field.value.find((c) => c.isLead)
            : undefined;
          const selectedValues = leadContact ? [`${leadContact.userId}`] : [];

          return (
            <FormItem>
              <FormLabel>Comms Lead</FormLabel>
              <FormControl>
                <Combobox
                  options={commsLeadOptions}
                  selectedValues={selectedValues}
                  onSelect={(value) => {
                    const userId = parseInt(value);
                    const currentContacts = Array.isArray(field.value)
                      ? field.value
                      : [];

                    // If clicking the same user, remove them as lead
                    if (leadContact?.userId === userId) {
                      field.onChange(
                        currentContacts.filter((c) => c.userId !== userId)
                      );
                    } else {
                      // Remove existing lead and add new one
                      const nonLeadContacts = currentContacts.filter(
                        (c) => !c.isLead
                      );
                      field.onChange([
                        ...nonLeadContacts,
                        { userId, isLead: true },
                      ]);
                    }
                  }}
                  placeholder="Select lead comms contact"
                  searchPlaceholder="Search users..."
                  emptyMessage="No users found."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          );
        }}
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
