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
          const getVenueValue = (): {
            street: string;
            city: string;
            provinceOrState: string;
            country: string;
          } => {
            if (
              typeof field.value === 'object' &&
              !Array.isArray(field.value) &&
              field.value !== null
            ) {
              const venue = field.value as {
                street?: string;
                city?: string;
                provinceOrState?: string;
                country?: string;
              };
              return {
                street: venue.street || '',
                city: venue.city || '',
                provinceOrState: venue.provinceOrState || '',
                country: venue.country || '',
              };
            }
            return {
              street: '',
              city: '',
              provinceOrState: '',
              country: '',
            };
          };

          const currentVenue = getVenueValue();

          return (
            <div className="space-y-4">
              <FormItem>
                <FormLabel>Street Address</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter street address"
                    value={currentVenue.street}
                    onChange={(e) => {
                      field.onChange({
                        ...currentVenue,
                        street: e.target.value,
                      });
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter city"
                    value={currentVenue.city}
                    onChange={(e) => {
                      field.onChange({
                        ...currentVenue,
                        city: e.target.value,
                      });
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
              <FormItem>
                <FormLabel>Province/State</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter province or state"
                    value={currentVenue.provinceOrState}
                    onChange={(e) => {
                      field.onChange({
                        ...currentVenue,
                        provinceOrState: e.target.value,
                      });
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
              <FormItem>
                <FormLabel>Country</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter country"
                    value={currentVenue.country}
                    onChange={(e) => {
                      field.onChange({
                        ...currentVenue,
                        country: e.target.value,
                      });
                    }}
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
