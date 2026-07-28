import { useFormContext } from 'react-hook-form';

import {
  ACTIVITY_OPTIONAL_TEXT_MAX_LENGTH,
  type ActivityFormData,
} from '@corpcal/shared/schemas';
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { InfoIconButton } from '@/components/ui/info-icon-button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { getActivityFieldLabel } from '@/lib/activity-form-labels';
import { ACTIVITY_FORM_SECTION_LABELS } from '@/lib/activity-form-section-labels';
import { setActivityFormFieldValue } from '@/lib/activity-form-set-field';
import type { OptionItem } from '@/schemas/types';

import { useActivityEdit } from '../activity-edit-context';
import { ActivityFormSection } from './ActivityFormSection';

type ActivityCommsSectionProps = {
  commsMaterialOptions: Array<{
    id: number;
    name: string;
    displayName?: string;
  }>;
  commsLeadOptions: OptionItem[];
};

function optionItemsEqual(a: OptionItem, b: OptionItem): boolean {
  return String(a.value) === String(b.value);
}

function buildCommsContactsFromSelection(
  selected: OptionItem[],
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
}) => {
  const { readOnly } = useActivityEdit();
  const form = useFormContext<ActivityFormData>();
  const commsContactsAnchorRef = useComboboxAnchor();
  const commsMaterialsAnchorRef = useComboboxAnchor();

  const commsMaterialComboboxOptions = commsMaterialOptions.map((m) => ({
    value: String(m.id),
    label: m.displayName ?? m.name,
  }));

  return (
    <ActivityFormSection title={ACTIVITY_FORM_SECTION_LABELS.comms}>
      <FormField
        control={form.control}
        name="commsContacts"
        render={({ field }) => {
          const contacts = field.value ?? [];
          const leadFirst = [...contacts].sort((a, b) =>
            a.isLead ? -1 : b.isLead ? 1 : 0
          );
          const selectedOptions: OptionItem[] = leadFirst.map((c) => {
            const opt = commsLeadOptions.find(
              (o) => o.value === String(c.userId)
            );
            return (
              opt ?? {
                value: String(c.userId),
                label: `User ${c.userId}`,
              }
            );
          });

          const handleValueChange = (selected: OptionItem[]) => {
            setActivityFormFieldValue(
              form,
              field.name,
              buildCommsContactsFromSelection(selected, field.value)
            );
          };

          const setLead = (userId: number) => {
            const next = (field.value ?? []).map((c) => ({
              ...c,
              isLead: c.userId === userId,
            }));
            setActivityFormFieldValue(form, field.name, next);
          };

          return (
            <FormItem>
              <FormLabel showRequired>
                {getActivityFieldLabel(field.name)}
              </FormLabel>
              <FormControl data-field={field.name}>
                <Combobox
                  items={commsLeadOptions}
                  multiple
                  value={selectedOptions}
                  onValueChange={handleValueChange}
                  itemToStringValue={(o) => o.value}
                  isItemEqualToValue={(item, value) =>
                    optionItemsEqual(item, value)
                  }
                  readOnly={readOnly}
                >
                  <ComboboxChips
                    ref={commsContactsAnchorRef}
                    className="w-full"
                  >
                    <ComboboxValue>
                      {(values: OptionItem[]) => (
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
                      {(option: OptionItem) => (
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
            <FormLabel>
              <>
                {getActivityFieldLabel(field.name)}
                <Popover>
                  <PopoverTrigger asChild>
                    <InfoIconButton aria-label="About strategy" />
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-80 max-w-[calc(100vw-2rem)] text-sm"
                    align="start"
                  >
                    <p>
                      Describe any promotion, digital content, or visuals
                      planned as part of the announcement vision.
                    </p>
                  </PopoverContent>
                </Popover>
              </>
            </FormLabel>
            <FormControl data-field={field.name}>
              <Textarea
                placeholder="Enter strategy"
                readOnly={readOnly}
                rows={4}
                maxLength={ACTIVITY_OPTIONAL_TEXT_MAX_LENGTH}
                {...field}
                value={field.value ?? ''}
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
              <FormLabel>{getActivityFieldLabel(field.name)}</FormLabel>
              <FormControl data-field={field.name}>
                <Combobox
                  items={commsMaterialComboboxOptions}
                  multiple
                  value={selectedOptions}
                  onValueChange={(selected) =>
                    setActivityFormFieldValue(
                      form,
                      field.name,
                      selected.map((o) => Number(o.value))
                    )
                  }
                  itemToStringValue={(o) => o.label}
                  readOnly={readOnly}
                >
                  <ComboboxChips
                    ref={commsMaterialsAnchorRef}
                    className="w-full"
                  >
                    <ComboboxValue>
                      {(values: OptionItem[]) => (
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
                      {(option: OptionItem) => (
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
    </ActivityFormSection>
  );
};
