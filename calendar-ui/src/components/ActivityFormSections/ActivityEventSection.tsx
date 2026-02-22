import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import { useState } from 'react';

import type { VenueQuickPickItem } from '@corpcal/shared/api/types';
import type { ActivityFormData } from '@corpcal/shared/schemas';
import { fetchLastUsedAddresses, fetchVenueQuickPicks } from '@/api/lookupsApi';

import {
  AddressAutocomplete,
  type AddressData,
} from '../ui/address-autocomplete';
import { Badge } from '../ui/badge';
import { Combobox } from '../ui/combobox';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Switch } from '../ui/switch';
import { ActivityFormSection } from './ActivityFormSection';

const QUICK_PICK_MAX_TOTAL = 4;

type VenueFormValue = {
  venueName: string | null;
  street: string | null;
  city: string | null;
  provinceOrState: string | null;
  country: string | null;
};

function venueToFormValue(item: VenueQuickPickItem): VenueFormValue {
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

function addressMatchesQuickPick(
  currentVenue: VenueFormValue,
  item: VenueQuickPickItem
): boolean {
  const n = (v: string | null | undefined) => v ?? null;
  return (
    n(currentVenue.venueName) === n(item.venueName) &&
    n(currentVenue.street) === n(item.street) &&
    n(currentVenue.city) === n(item.city) &&
    n(currentVenue.provinceOrState) === n(item.provinceOrState) &&
    n(currentVenue.country) === n(item.country)
  );
}

type ActivityEventSectionProps = {
  representativeOptions: Array<{
    id: number;
    name: string;
    displayName?: string;
    title?: string;
  }>;
  premierRequestedOptions: Array<{ value: string; label: string }>;
  eventPlannerOptions: Array<{ value: string; label: string }>;
  readOnly?: boolean;
};

export const ActivityEventSection: React.FC<ActivityEventSectionProps> = ({
  representativeOptions,
  premierRequestedOptions,
  eventPlannerOptions,
  readOnly = false,
}) => {
  const form = useFormContext<ActivityFormData>();
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

  // Convert representative options to combobox format
  const representativeComboboxOptions = representativeOptions.map((rep) => ({
    value: rep.id.toString(),
    label: rep.displayName || rep.name,
  }));
  return (
    <ActivityFormSection title="Event">
      <FormField
        control={form.control}
        name="premierRequestedId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Premier</FormLabel>
            <Select
              disabled={readOnly}
              onValueChange={(value) => {
                const parsed = value ? parseInt(value, 10) : null;
                field.onChange(isNaN(parsed as number) ? null : parsed);
              }}
              value={field.value ? field.value.toString() : ''}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select premier requested option" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {premierRequestedOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="representatives"
        render={({ field }) => {
          const representatives = field.value || [];
          const selectedValues = representatives
            .filter((rep) => rep.representativeId !== undefined)
            .map((rep) => rep.representativeId!.toString());

          return (
            <FormItem>
              <FormLabel>Representatives</FormLabel>
              <FormControl>
                <Combobox
                  disabled={readOnly}
                  options={representativeComboboxOptions}
                  selectedValues={selectedValues}
                  onSelect={(value) => {
                    const representativeId = parseInt(value, 10);
                    const current = representatives || [];
                    const exists = current.some(
                      (r) => r.representativeId === representativeId
                    );

                    if (exists) {
                      // Remove if already selected
                      field.onChange(
                        current.filter(
                          (r) => r.representativeId !== representativeId
                        )
                      );
                    } else {
                      // Add if not selected
                      field.onChange([...current, { representativeId }]);
                    }
                  }}
                  placeholder="Select representatives"
                  searchPlaceholder="Search representatives..."
                  emptyMessage="No representatives found."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          );
        }}
      />

      <div className="my-6 border-t border-gray-300"></div>

      <h2 className="text-xl font-semibold">Venue</h2>

      {/* Venue TBD Toggle */}
      <div className="mb-4 flex items-center space-x-3">
        <Switch
          id="venue-tbd"
          checked={isVenueTbd}
          disabled={readOnly}
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
          const currentVenue: VenueFormValue = field.value || {
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
                <FormLabel>Venue</FormLabel>
                <FormControl>
                  <Input
                    value={currentVenue.venueName ?? ''}
                    readOnly={readOnly}
                    onChange={(e) =>
                      field.onChange({
                        ...currentVenue,
                        venueName: e.target.value || null,
                      })
                    }
                    placeholder="Venue name"
                    disabled={isVenueTbd}
                    className={isVenueTbd ? 'opacity-50' : ''}
                  />
                </FormControl>
                {quickPickTags.length > 0 && !isVenueTbd && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {quickPickTags.map((item) => {
                      const isSelected = addressMatchesQuickPick(
                        currentVenue,
                        item
                      );
                      return (
                        <Badge
                          key={item.id}
                          variant={isSelected ? 'selected' : 'outline'}
                          className={
                            readOnly
                              ? 'gap-1 font-normal'
                              : 'cursor-pointer gap-1 font-normal'
                          }
                          onClick={
                            readOnly
                              ? undefined
                              : () => handleQuickPickSelect(item)
                          }
                        >
                          <Plus className="h-3.5 w-3.5" />
                          {venueTagLabel(item)}
                        </Badge>
                      );
                    })}
                  </div>
                )}
                <FormMessage />
              </FormItem>

              <FormItem>
                <AddressAutocomplete
                  label="Street Address"
                  placeholder="Start typing an address..."
                  defaultValue={currentVenue.street || ''}
                  value={currentVenue.street ?? ''}
                  onAddressSelect={handleAddressSelect}
                  required={!isVenueTbd}
                  disabled={readOnly || isVenueTbd}
                />
                <FormMessage />
              </FormItem>

              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input
                    value={currentVenue.city ?? ''}
                    readOnly={readOnly}
                    onChange={(e) =>
                      field.onChange({
                        ...currentVenue,
                        city: e.target.value || null,
                      })
                    }
                    placeholder="City"
                    disabled={isVenueTbd}
                    className={isVenueTbd ? 'opacity-50' : ''}
                  />
                </FormControl>
              </FormItem>

              <FormItem>
                <FormLabel>Province/State</FormLabel>
                <FormControl>
                  <Input
                    value={currentVenue.provinceOrState ?? ''}
                    readOnly={readOnly}
                    onChange={(e) =>
                      field.onChange({
                        ...currentVenue,
                        provinceOrState: e.target.value || null,
                      })
                    }
                    placeholder="Province/State"
                    disabled={isVenueTbd}
                    className={isVenueTbd ? 'opacity-50' : ''}
                  />
                </FormControl>
              </FormItem>

              <FormItem>
                <FormLabel>Country</FormLabel>
                <FormControl>
                  <Input
                    value={currentVenue.country ?? ''}
                    readOnly={readOnly}
                    onChange={(e) =>
                      field.onChange({
                        ...currentVenue,
                        country: e.target.value || null,
                      })
                    }
                    placeholder="Country"
                    disabled={isVenueTbd}
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
                  disabled={readOnly}
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
