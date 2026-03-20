import { useQuery } from '@tanstack/react-query';
import { UseFormReturn } from 'react-hook-form';
import { useState } from 'react';

import type { VenueQuickPickItem } from '@corpcal/shared/api/types';
import type { ActivityFormData } from '@corpcal/shared/schemas';
import { fetchLastUsedAddresses, fetchVenueQuickPicks } from '@/api/lookupsApi';
import {
  AddressAutocomplete,
  type AddressData,
} from '@/components/ui/address-autocomplete';
import { Badge } from '@/components/ui/badge';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  FreeformCombobox,
  type FreeformComboboxValue,
  type FreeformComboboxValueWithLead,
} from '@/components/ui/freeform-combobox';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { getActivityFieldLabel } from '@/lib/activity-form-labels';
import { ACTIVITY_FORM_SECTION_LABELS } from '@/lib/activity-form-section-labels';
import type { OptionItem } from '@/schemas/types';

import { useActivityEdit } from '../activity-edit-context';
import { ActivityFormSection } from './ActivityFormSection';

const QUICK_PICK_MAX_TOTAL = 4;

type ActivityVenueSectionProps = {
  form: UseFormReturn<ActivityFormData>;
  eventPlannerOptions: OptionItem[];
};

function venueToFormValue(item: VenueQuickPickItem): {
  venueName: string | null;
  street: string | null;
  city: string | null;
  provinceOrState: string | null;
  country: string | null;
} {
  return {
    venueName: item.venueName ?? null,
    street: item.street ?? null,
    city: item.city ?? null,
    provinceOrState: item.provinceOrState ?? null,
    country: item.country ?? null,
  };
}

function venueTagLabel(item: VenueQuickPickItem): string {
  if (item.venueName) return item.venueName;
  const parts = [item.street, item.city].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'Address';
}

export const ActivityVenueSection: React.FC<ActivityVenueSectionProps> = ({
  form,
  eventPlannerOptions,
}) => {
  const { readOnly } = useActivityEdit();
  const [isVenueTbd, setIsVenueTbd] = useState(false);

  const { data: fixedQuickPicks = [] } = useQuery({
    queryKey: ['venueQuickPicks'],
    queryFn: fetchVenueQuickPicks,
  });
  const { data: lastUsed = [] } = useQuery({
    queryKey: ['venueLastUsed'],
    queryFn: fetchLastUsedAddresses,
  });

  const lastUsedSlots = QUICK_PICK_MAX_TOTAL - fixedQuickPicks.length;
  const lastUsedDisplay =
    lastUsedSlots > 0 ? lastUsed.slice(0, lastUsedSlots) : [];
  const quickPickTags = [...fixedQuickPicks, ...lastUsedDisplay];

  return (
    <ActivityFormSection
      title={ACTIVITY_FORM_SECTION_LABELS.venue}
      variant="bottom-no-divider"
    >
      {/* Venue TBD Toggle */}
      <div className="mb-4 flex items-center space-x-3">
        <Switch
          id="venue-tbd"
          checked={isVenueTbd}
          onCheckedChange={setIsVenueTbd}
        />
        <label
          htmlFor="venue-tbd"
          className="cursor-pointer text-sm leading-none font-medium"
        >
          Venue TBD
        </label>
      </div>

      <FormField
        control={form.control}
        name="venueAddress"
        render={({ field }) => {
          const currentVenue = field.value || {
            venueName: null,
            street: null,
            city: null,
            provinceOrState: null,
            country: null,
          };

          const handleAddressSelect = (addressData: AddressData) => {
            const updated = {
              ...currentVenue,
              street: addressData.street,
              city: addressData.city,
              provinceOrState: addressData.province,
              country: addressData.country,
            };
            field.onChange(updated);
          };

          const handleQuickPickSelect = (item: VenueQuickPickItem) => {
            field.onChange(venueToFormValue(item));
          };

          return (
            <>
              <FormItem>
                <AddressAutocomplete
                  label="Street Address"
                  placeholder="Start typing an address..."
                  defaultValue={currentVenue.street || ''}
                  value={currentVenue.street ?? ''}
                  onAddressSelect={handleAddressSelect}
                  required={!isVenueTbd}
                  disabled={isVenueTbd}
                />
                {quickPickTags.length > 0 && !isVenueTbd && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {quickPickTags.map((item) => (
                      <Badge
                        key={item.id}
                        variant="secondary"
                        className="cursor-pointer font-normal"
                        onClick={() => handleQuickPickSelect(item)}
                      >
                        + {venueTagLabel(item)}
                      </Badge>
                    ))}
                  </div>
                )}
                <FormMessage />
              </FormItem>

              <FormItem className="mt-6">
                <FormLabel>{getActivityFieldLabel('city')}</FormLabel>
                <FormControl data-field={field.name}>
                  <Input
                    value={currentVenue.city || ''}
                    disabled
                    placeholder="City will be populated from address"
                    className={isVenueTbd ? 'opacity-50' : ''}
                  />
                </FormControl>
              </FormItem>

              <FormItem className="mt-6">
                <FormLabel>
                  {getActivityFieldLabel('provinceOrState')}
                </FormLabel>
                <FormControl data-field={field.name}>
                  <Input
                    value={currentVenue.provinceOrState || ''}
                    disabled
                    placeholder="Province will be populated from address"
                    className={isVenueTbd ? 'opacity-50' : ''}
                  />
                </FormControl>
              </FormItem>

              <FormItem className="mt-6">
                <FormLabel>{getActivityFieldLabel('country')}</FormLabel>
                <FormControl data-field={field.name}>
                  <Input
                    value={currentVenue.country || ''}
                    disabled
                    placeholder="Country will be populated from address"
                    className={isVenueTbd ? 'opacity-50' : ''}
                  />
                </FormControl>
              </FormItem>
            </>
          );
        }}
      />

      <FormField
        control={form.control}
        name="eventPlanners"
        render={({ field }) => {
          const list = field.value ?? [];
          const comboboxValue: FreeformComboboxValueWithLead[] = list.map(
            (p) => {
              const base: FreeformComboboxValueWithLead =
                p.eventPlannerId != null
                  ? { type: 'option', value: String(p.eventPlannerId) }
                  : p.eventPlannerName
                    ? { type: 'freeform', value: p.eventPlannerName }
                    : { type: 'freeform', value: '' };
              return { ...base, isLead: p.isLead ?? false };
            }
          );

          const handleChange = (
            value: FreeformComboboxValue | FreeformComboboxValue[] | null
          ) => {
            const arr =
              value == null
                ? []
                : Array.isArray(value)
                  ? value.filter(
                      (v): v is NonNullable<FreeformComboboxValue> => v != null
                    )
                  : [value];
            if (arr.length === 0) {
              field.onChange([]);
              return;
            }
            const current = field.value ?? [];
            const prevLead = current.find((p) => p.isLead);
            const leadKey =
              prevLead?.eventPlannerId != null
                ? `id:${prevLead.eventPlannerId}`
                : prevLead?.eventPlannerName != null
                  ? `name:${prevLead.eventPlannerName}`
                  : null;
            const next = arr.map((v, i) => {
              const key =
                v.type === 'option'
                  ? `id:${parseInt(v.value, 10)}`
                  : `name:${v.value}`;
              const isLead = leadKey != null ? key === leadKey : i === 0;
              if (v.type === 'option') {
                return {
                  eventPlannerId: parseInt(v.value, 10),
                  isLead,
                };
              }
              return { eventPlannerName: v.value, isLead };
            });
            if (next.length > 0 && !next.some((p) => p.isLead)) {
              next[0] = { ...next[0], isLead: true };
            }
            field.onChange(next);
          };

          const setLead = (index: number) => {
            const next = (field.value ?? []).map((p, i) => ({
              ...p,
              isLead: i === index,
            }));
            field.onChange(next);
          };

          return (
            <FormItem>
              <FormLabel>{getActivityFieldLabel(field.name)}</FormLabel>
              <FormControl data-field={field.name}>
                <FreeformCombobox
                  readOnly={readOnly}
                  options={eventPlannerOptions}
                  value={comboboxValue}
                  onChange={handleChange}
                  placeholder="Select event planners"
                  searchPlaceholder="Search event planners..."
                  emptyMessage="No event planners found."
                  freeformLabel="Other"
                  freeformDescription="Can't find the event planner?"
                  multiple
                  useChips
                  onSetLead={setLead}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          );
        }}
      />
    </ActivityFormSection>
  );
};
