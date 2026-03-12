import { useFormContext } from 'react-hook-form';

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
import { Textarea } from '@/components/ui/textarea';
import { getActivityFormSectionLabel } from '@/lib/activity-form-section-labels';

import { ActivityFormSection } from './ActivityFormSection';

type ActivityCommsSectionProps = {
  commsMaterialOptions: Array<{
    id: number;
    name: string;
    displayName?: string;
  }>;
  commsLeadOptions: Array<{ value: string; label: string }>;
  readOnly?: boolean;
};

export const ActivityCommsSection: React.FC<ActivityCommsSectionProps> = ({
  commsMaterialOptions,
  commsLeadOptions,
  readOnly = false,
}) => {
  const form = useFormContext<ActivityFormData>();
  const commsLeadAnchorRef = useComboboxAnchor();
  const commsMaterialsAnchorRef = useComboboxAnchor();

  const commsMaterialComboboxOptions = commsMaterialOptions.map((m) => ({
    value: String(m.id),
    label: m.displayName ?? m.name,
  }));

  return (
    <ActivityFormSection
      title={getActivityFormSectionLabel('comms')}
      variant="top"
    >
      <FormField
        control={form.control}
        name="commsContactLeadId"
        render={({ field }) => {
          const selectedOption =
            field.value != null
              ? commsLeadOptions.find((o) => o.value === String(field.value))
              : null;
          const selectedOptions = selectedOption ? [selectedOption] : [];
          return (
            <FormItem>
              <FormLabel>
                Comms Lead <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl data-field={field.name}>
                <Combobox
                  items={commsLeadOptions}
                  multiple
                  value={selectedOptions}
                  onValueChange={(selected) =>
                    field.onChange(
                      selected.length > 0
                        ? parseInt(selected[0].value, 10)
                        : null
                    )
                  }
                  itemToStringValue={(o) => o.label}
                  disabled={readOnly}
                >
                  <ComboboxChips ref={commsLeadAnchorRef} className="w-full">
                    <ComboboxValue>
                      {(values: Array<{ value: string; label: string }>) => (
                        <>
                          {values.map((option) => (
                            <ComboboxChip key={option.value}>
                              {option.label}
                            </ComboboxChip>
                          ))}
                          <ComboboxChipsInput placeholder="Select comms lead" />
                        </>
                      )}
                    </ComboboxValue>
                  </ComboboxChips>
                  <ComboboxContent anchor={commsLeadAnchorRef}>
                    <ComboboxEmpty>No comms leads found.</ComboboxEmpty>
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
              <FormMessage />
            </FormItem>
          );
        }}
      />

      <FormField
        control={form.control}
        name="strategy"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Strategy</FormLabel>
            <FormControl data-field={field.name}>
              <Textarea
                placeholder="Enter strategy"
                readOnly={readOnly}
                rows={4}
                {...field}
                value={field.value || ''}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="commsMaterialIds"
        render={({ field }) => {
          const selectedOptions = commsMaterialComboboxOptions.filter((o) =>
            (field.value ?? []).includes(Number(o.value))
          );
          return (
            <FormItem>
              <FormLabel>Comms Materials</FormLabel>
              <FormControl data-field={field.name}>
                <Combobox
                  items={commsMaterialComboboxOptions}
                  multiple
                  value={selectedOptions}
                  onValueChange={(selected) =>
                    field.onChange(selected.map((o) => Number(o.value)))
                  }
                  itemToStringValue={(o) => o.label}
                  disabled={readOnly}
                >
                  <ComboboxChips
                    ref={commsMaterialsAnchorRef}
                    className="w-full"
                  >
                    <ComboboxValue>
                      {(values: Array<{ value: string; label: string }>) => (
                        <>
                          {values.map((option) => (
                            <ComboboxChip key={option.value}>
                              {option.label}
                            </ComboboxChip>
                          ))}
                          <ComboboxChipsInput placeholder="Select comms materials" />
                        </>
                      )}
                    </ComboboxValue>
                  </ComboboxChips>
                  <ComboboxContent anchor={commsMaterialsAnchorRef}>
                    <ComboboxEmpty>No comms materials found.</ComboboxEmpty>
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
                Select comms materials if applicable
              </FormDescription>
              <FormMessage />
            </FormItem>
          );
        }}
      />
    </ActivityFormSection>
  );
};
