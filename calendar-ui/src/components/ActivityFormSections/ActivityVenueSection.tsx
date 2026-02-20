import { useQuery } from '@tanstack/react-query';
import { UseFormReturn } from 'react-hook-form';
import { useState } from 'react';

import type { VenueQuickPickItem } from '@corpcal/shared/api/types';
import type { ActivityFormData } from '@corpcal/shared/schemas';
import { fetchLastUsedAddresses, fetchVenueQuickPicks } from '@/api/lookupsApi';

import {
  AddressAutocomplete,
  type AddressData,
} from '../ui/address-autocomplete';
import { Badge } from '../ui/badge';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import {
  FreeformCombobox,
  type FreeformComboboxValue,
} from '../ui/freeform-combobox';
import { Input } from '../ui/input';
import { Switch } from '../ui/switch';
import { ActivityFormSection } from './ActivityFormSection';

const QUICK_PICK_MAX_TOTAL = 4;

type ActivityVenueSectionProps = {
  form: UseFormReturn<ActivityFormData>;
  eventPlannerOptions: Array<{ value: string; label: string }>;
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
    <ActivityFormSection title="Venue" variant="bottom-no-divider">
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
            <div className="space-y-4">
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

              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input
                    value={currentVenue.city || ''}
                    disabled
                    placeholder="City will be populated from address"
                    className={isVenueTbd ? 'opacity-50' : ''}
                  />
                </FormControl>
              </FormItem>

              <FormItem>
                <FormLabel>Province/State</FormLabel>
                <FormControl>
                  <Input
                    value={currentVenue.provinceOrState || ''}
                    disabled
                    placeholder="Province will be populated from address"
                    className={isVenueTbd ? 'opacity-50' : ''}
                  />
                </FormControl>
              </FormItem>

              <FormItem>
                <FormLabel>Country</FormLabel>
                <FormControl>
                  <Input
                    value={currentVenue.country || ''}
                    disabled
                    placeholder="Country will be populated from address"
                    className={isVenueTbd ? 'opacity-50' : ''}
                  />
                </FormControl>
              </FormItem>
            </div>
          );
        }}
      />

      <FormField
        control={form.control}
        name="eventPlannerLeadId"
        render={({ field }) => {
          // Derive the combobox value from form state
          const eventPlannerLeadId = field.value;
          const eventPlannerLeadName = form.watch('eventPlannerLeadName');

          const comboboxValue: FreeformComboboxValue = eventPlannerLeadId
            ? { type: 'option', value: eventPlannerLeadId.toString() }
            : eventPlannerLeadName
              ? { type: 'freeform', value: eventPlannerLeadName }
              : null;

          const handleChange = (value: FreeformComboboxValue) => {
            if (!value) {
              field.onChange(null);
              form.setValue('eventPlannerLeadName', null);
            } else if (value.type === 'option') {
              // Convert string value to integer for eventPlannerLeadId
              field.onChange(parseInt(value.value, 10));
              form.setValue('eventPlannerLeadName', null);
            } else {
              field.onChange(null);
              form.setValue('eventPlannerLeadName', value.value);
            }
          };

          return (
            <FormItem>
              <FormLabel>Event Planner</FormLabel>
              <FormControl>
                <FreeformCombobox
                  options={eventPlannerOptions}
                  value={comboboxValue}
                  onChange={handleChange}
                  placeholder="Select event planner"
                  searchPlaceholder="Search event planners..."
                  emptyMessage="No event planners found."
                  freeformLabel="Other"
                  freeformDescription="Can't find the event planner?"
                />
              </FormControl>
              <FormDescription>
                Select an event planner from the list, or type to enter a custom
                name
              </FormDescription>
              <FormMessage />
            </FormItem>
          );
        }}
      />
    </ActivityFormSection>
  );
};
