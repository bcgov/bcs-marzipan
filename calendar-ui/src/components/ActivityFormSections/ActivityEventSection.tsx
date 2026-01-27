import { useFormContext } from 'react-hook-form';
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
};

export const ActivityEventSection: React.FC<ActivityEventSectionProps> = ({
  representativeOptions,
  premierRequestedOptions,
}) => {
  const form = useFormContext<FormData>();

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
              onValueChange={(value) =>
                field.onChange(value ? parseInt(value, 10) : null)
              }
              value={field.value?.toString() || ''}
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
    </ActivityFormSection>
  );
};
