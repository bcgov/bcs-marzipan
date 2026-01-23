import { UseFormReturn } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';
import type { CreateActivityRequest } from '@corpcal/shared/schemas';
import { ActivityFormSection } from './ActivityFormSection';

type FormData = CreateActivityRequest;

type ActivityVenueSectionProps = {
  form: UseFormReturn<FormData>;
};

export const ActivityVenueSection: React.FC<ActivityVenueSectionProps> = ({
  form,
}) => {
  return (
    <ActivityFormSection title="Venue">
      <FormField
        control={form.control}
        name="venueAddress"
        render={({ field }) => {
          // Work directly with venueAddress object, using empty strings for form inputs
          const currentVenue = field.value || {
            venueName: null,
            street: null,
            city: null,
            provinceOrState: null,
            country: null,
          };

          const updateField = (
            fieldName: keyof typeof currentVenue,
            value: string
          ) => {
            const updated = {
              ...currentVenue,
              [fieldName]: value.trim() || null,
            };
            field.onChange(updated);
          };

          return (
            <div className="space-y-4">
              <FormItem>
                <FormLabel>Venue Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter venue name"
                    value={currentVenue.venueName || ''}
                    onChange={(e) => updateField('venueName', e.target.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
              <FormItem>
                <FormLabel>Street Address</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter street address"
                    value={currentVenue.street || ''}
                    onChange={(e) => updateField('street', e.target.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter city"
                    value={currentVenue.city || ''}
                    onChange={(e) => updateField('city', e.target.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
              <FormItem>
                <FormLabel>Province/State</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter province or state"
                    value={currentVenue.provinceOrState || ''}
                    onChange={(e) =>
                      updateField('provinceOrState', e.target.value)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
              <FormItem>
                <FormLabel>Country</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter country"
                    value={currentVenue.country || ''}
                    onChange={(e) => updateField('country', e.target.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </div>
          );
        }}
      />
    </ActivityFormSection>
  );
};
