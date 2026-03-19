import { useFormContext } from 'react-hook-form';

import type { TranslationRequiredStatusLookupItem } from '@corpcal/shared/api/types';
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
import { Textarea } from '@/components/ui/textarea';
import { getActivityFieldLabel } from '@/lib/activity-form-labels';
import { ACTIVITY_FORM_SECTION_LABELS } from '@/lib/activity-form-section-labels';
import type { OptionItem } from '@/schemas/types';

import { ActivityFormSection } from './ActivityFormSection';

type ActivityCommsSectionProps = {
  commsMaterialOptions: Array<{
    id: number;
    name: string;
    displayName?: string;
  }>;
  commsLeadOptions: OptionItem[];
  translationRequiredStatuses: TranslationRequiredStatusLookupItem[];
  readOnly?: boolean;
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
  translationRequiredStatuses,
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
      title={ACTIVITY_FORM_SECTION_LABELS.comms}
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
                {getActivityFieldLabel(field.name)}{' '}
                <span className="text-destructive">*</span>
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
                  disabled={readOnly}
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
            <FormLabel>{getActivityFieldLabel(field.name)}</FormLabel>
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
              <FormLabel>{getActivityFieldLabel(field.name)}</FormLabel>
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

      <FormField
        control={form.control}
        name="translationsRequiredStatusId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{getActivityFieldLabel(field.name)}</FormLabel>
            <Select
              disabled={readOnly}
              value={
                field.value !== undefined && field.value !== null
                  ? String(field.value)
                  : ''
              }
              onValueChange={(value) =>
                field.onChange(value === '' ? undefined : Number(value))
              }
            >
              <FormControl data-field={field.name}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {translationRequiredStatuses.map((status) => (
                  <SelectItem key={status.id} value={String(status.id)}>
                    {status.displayName ?? status.name}
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
