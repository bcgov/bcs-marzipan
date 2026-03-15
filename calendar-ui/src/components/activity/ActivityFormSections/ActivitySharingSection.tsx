import { useFormContext } from 'react-hook-form';

import {
  DEFAULT_VISIBILITY,
  VISIBILITY,
  type Visibility,
} from '@corpcal/shared/constants/constants';
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
  FormDescription,
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
import { getActivityFormSectionLabel } from '@/lib/activity-form-section-labels';

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
            <FormLabel>{getActivityFieldLabel(field.name)}</FormLabel>
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
                <SelectItem value="global">All ministries</SelectItem>
                <SelectItem value="team">My team only</SelectItem>
              </SelectContent>
            </Select>
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
              <FormLabel>{getActivityFieldLabel(field.name)}</FormLabel>
              <FormControl data-field={field.name}>
                <Combobox
                  items={sharedWithTeamOptions}
                  multiple
                  value={selectedOptions}
                  onValueChange={(
                    selected: Array<{ value: string; label: string }>
                  ) => {
                    field.onChange(selected.map((o) => parseInt(o.value, 10)));
                  }}
                  itemToStringValue={(o: { value: string; label: string }) =>
                    o.label
                  }
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
                Teams selected can see the activity in their Shared with tab.
              </FormDescription>
              <FormMessage />
            </FormItem>
          );
        }}
      />
    </ActivityFormSection>
  );
};
