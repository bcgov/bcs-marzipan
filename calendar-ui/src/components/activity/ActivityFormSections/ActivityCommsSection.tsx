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

type CommsContactOption = { value: string; label: string };

type ActivityCommsSectionProps = {
  commsMaterialOptions: Array<{
    id: number;
    name: string;
    displayName?: string;
  }>;
  commsLeadOptions: Array<CommsContactOption>;
  readOnly?: boolean;
};

function buildCommsContactsFromSelection(
  selected: CommsContactOption[],
  currentContacts: Array<{ userId: number; isLead: boolean }> | undefined
): Array<{ userId: number; isLead: boolean }> {
  const newIds = selected.map((o) => parseInt(o.value, 10));
  if (newIds.length === 0) return [];

  const current = currentContacts ?? [];
  const currentLeadId = current.find((c) => c.isLead)?.userId ?? null;
  const leadStillPresent =
    currentLeadId != null && newIds.includes(currentLeadId);

  return newIds.map((userId, i) => ({
    userId,
    isLead: leadStillPresent ? userId === currentLeadId : i === 0,
  }));
}

export const ActivityCommsSection: React.FC<ActivityCommsSectionProps> = ({
  commsMaterialOptions,
  commsLeadOptions,
  readOnly = false,
}) => {
  const form = useFormContext<ActivityFormData>();
  const commsContactsAnchorRef = useComboboxAnchor();
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
        name="commsContacts"
        render={({ field }) => {
          const contacts = field.value ?? [];
          const leadFirst = [...contacts].sort((a, b) =>
            a.isLead ? -1 : b.isLead ? 1 : 0
          );
          const selectedOptions: CommsContactOption[] = leadFirst.map((c) => {
            const opt = commsLeadOptions.find(
              (o) => o.value === String(c.userId)
            );
            return {
              value: String(c.userId),
              label: opt?.label ?? String(c.userId),
            };
          });

          const handleValueChange = (selected: CommsContactOption[]) => {
            field.onChange(
              buildCommsContactsFromSelection(selected, field.value)
            );
          };

          const setLead = (userId: number) => {
            const next = (field.value ?? []).map((c) => ({
              ...c,
              isLead: c.userId === userId,
            }));
            field.onChange(next);
          };

          return (
            <FormItem>
              <FormLabel>
                Comms contacts <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl data-field={field.name}>
                <Combobox
                  items={commsLeadOptions}
                  multiple
                  value={selectedOptions}
                  onValueChange={handleValueChange}
                  itemToStringValue={(o) => o.label}
                  disabled={readOnly}
                >
                  <ComboboxChips
                    ref={commsContactsAnchorRef}
                    className="w-full"
                  >
                    <ComboboxValue>
                      {(values: CommsContactOption[]) => (
                        <>
                          {values.map((option) => {
                            const contact = contacts.find(
                              (c: { userId: number; isLead: boolean }) =>
                                String(c.userId) === option.value
                            );
                            const isLead = contact?.isLead ?? false;
                            const userId = parseInt(option.value, 10);
                            return (
                              <ComboboxChip key={option.value}>
                                <span className="flex items-center gap-1.5">
                                  <span>{option.label}</span>
                                  {isLead && (
                                    <span className="bg-primary/15 text-primary rounded px-1.5 py-0.5 text-[10px] font-medium">
                                      Lead
                                    </span>
                                  )}
                                  {!readOnly && !isLead && (
                                    <button
                                      type="button"
                                      className="text-muted-foreground hover:text-foreground focus:ring-ring ml-0.5 text-[10px] underline focus:ring-1 focus:outline-none"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setLead(userId);
                                      }}
                                    >
                                      Set as lead
                                    </button>
                                  )}
                                </span>
                              </ComboboxChip>
                            );
                          })}
                          <ComboboxChipsInput placeholder="Select contacts" />
                        </>
                      )}
                    </ComboboxValue>
                  </ComboboxChips>
                  <ComboboxContent anchor={commsContactsAnchorRef}>
                    <ComboboxEmpty>No contacts found.</ComboboxEmpty>
                    <ComboboxList>
                      {(option: CommsContactOption) => (
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
