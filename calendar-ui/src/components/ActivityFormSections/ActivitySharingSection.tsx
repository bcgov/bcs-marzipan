import { useFormContext } from 'react-hook-form';

import {
  DEFAULT_VISIBILITY,
  VISIBILITY,
  type Visibility,
} from '@corpcal/shared/constants/constants';
import type { ActivityFormData } from '@corpcal/shared/schemas';

import { getActivityFormSectionLabel } from '../../lib/activity-form-section-labels';
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
} from '../ui/combobox';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { ActivityFormSection } from './ActivityFormSection';

type ActivitySharingSectionProps = {
  sharedWithTeamOptions: Array<{ value: string; label: string }>;
  readOnly?: boolean;
};

export const ActivitySharingSection: React.FC<ActivitySharingSectionProps> = ({
  sharedWithTeamOptions,
  readOnly = false,
}) => {
  const form = useFormContext<ActivityFormData>();
  const sharedWithAnchorRef = useComboboxAnchor();
  return (
    <ActivityFormSection title={getActivityFormSectionLabel('sharing')}>
      <FormField
        control={form.control}
        name="visibility"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Visibility</FormLabel>
            <Select
              disabled={readOnly}
              onValueChange={(value) => {
                const visibility: Visibility = (
                  VISIBILITY as readonly string[]
                ).includes(value)
                  ? (value as Visibility)
                  : DEFAULT_VISIBILITY;
                field.onChange(visibility);
              }}
              value={field.value || DEFAULT_VISIBILITY}
            >
              <FormControl data-field={field.name}>
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
          const selectedOptions = sharedWithTeamOptions.filter((o) =>
            currentValues.includes(o.value)
          );
          return (
            <FormItem>
              <FormLabel>Shared With Teams</FormLabel>
              <FormControl data-field={field.name}>
                <Combobox
                  items={sharedWithTeamOptions}
                  multiple
                  value={selectedOptions}
                  onValueChange={(selected) => {
                    field.onChange(selected.map((o) => parseInt(o.value, 10)));
                  }}
                  itemToStringValue={(o) => o.label}
                  disabled={readOnly}
                >
                  <ComboboxChips ref={sharedWithAnchorRef} className="w-full">
                    <ComboboxValue>
                      {(values: Array<{ value: string; label: string }>) => (
                        <>
                          {values.map((option) => (
                            <ComboboxChip key={option.value}>
                              {option.label}
                            </ComboboxChip>
                          ))}
                          <ComboboxChipsInput placeholder="Add teams" />
                        </>
                      )}
                    </ComboboxValue>
                  </ComboboxChips>
                  <ComboboxContent anchor={sharedWithAnchorRef}>
                    <ComboboxEmpty>No teams found.</ComboboxEmpty>
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
