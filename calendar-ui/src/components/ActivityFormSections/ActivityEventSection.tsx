import { useFormContext } from 'react-hook-form';
import { useState } from 'react';
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
import { Input } from '../ui/input';
import { Switch } from '../ui/switch';
import {
  FreeformCombobox,
  type FreeformComboboxValue,
} from '../ui/freeform-combobox';
import {
  AddressAutocomplete,
  type AddressData,
} from '../ui/address-autocomplete';
import type { CreateActivityRequest } from '@corpcal/shared/schemas';
import { ActivityFormSection } from './ActivityFormSection';

type RepresentativeFormData = {
  representativeId?: number;
  representativeName?: string;
};

type FormData = Omit<CreateActivityRequest, 'representatives'> & {
  representatives?: RepresentativeFormData[];
};

type ActivityEventSectionProps = {
  representativeOptions: Array<{
    id: number;
    name: string;
    displayName?: string;
    title?: string;
  }>;
  premierRequestedOptions: Array<{ value: string; label: string }>;
  eventPlannerOptions: Array<{ value: string; label: string }>;
};

export const ActivityEventSection: React.FC<ActivityEventSectionProps> = ({
  representativeOptions,
  premierRequestedOptions,
  eventPlannerOptions,
}) => {
  const form = useFormContext<FormData>();
  const [isVenueTbd, setIsVenueTbd] = useState(false);

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

          return (
            <div className="space-y-4">
              <FormItem>
                <AddressAutocomplete
                  label="Street Address"
                  placeholder="Start typing an address..."
                  defaultValue={currentVenue.street || ''}
                  onAddressSelect={handleAddressSelect}
                  required={!isVenueTbd}
                  disabled={isVenueTbd}
                />
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
