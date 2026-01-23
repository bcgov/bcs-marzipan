import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from '../ui/form';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import {
  FreeformCombobox,
  type FreeformComboboxValue,
} from '../ui/freeform-combobox';
import { X } from 'lucide-react';
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
  eventPlannerOptions: Array<{ value: string; label: string }>;
  representativeOptions: Array<{
    id: number;
    name: string;
    displayName?: string;
    title?: string;
  }>;
};

export const ActivityEventSection: React.FC<ActivityEventSectionProps> = ({
  eventPlannerOptions,
  representativeOptions,
}) => {
  const form = useFormContext<FormData>();

  const representatives = form.watch('representatives') || [];
  const [representativeComboboxValue, setRepresentativeComboboxValue] =
    useState<FreeformComboboxValue>(null);

  // Convert representative options to FreeformCombobox format
  const representativeComboboxOptions = representativeOptions.map((rep) => ({
    value: rep.id.toString(),
    label: rep.displayName || rep.name,
  }));

  // Get a unique key for a representative (either ID or name)
  const getRepresentativeKey = (rep: RepresentativeFormData) => {
    if (rep.representativeId !== undefined) {
      return `id-${rep.representativeId}`;
    }
    return `name-${rep.representativeName}`;
  };

  // Check if a representative is already added
  const isRepresentativeAdded = (value: FreeformComboboxValue): boolean => {
    if (!value) return false;
    const current = form.getValues('representatives') || [];
    if (value.type === 'option') {
      const id = parseInt(value.value, 10);
      return current.some((r) => r.representativeId === id);
    } else {
      return current.some((r) => r.representativeName === value.value);
    }
  };

  const addRepresentative = (value: FreeformComboboxValue) => {
    if (!value || isRepresentativeAdded(value)) {
      return;
    }
    const current = form.getValues('representatives') || [];
    if (value.type === 'option') {
      const representativeId = parseInt(value.value, 10);
      form.setValue('representatives', [...current, { representativeId }]);
    } else {
      form.setValue('representatives', [
        ...current,
        {
          representativeName: value.value,
        },
      ]);
    }
    setRepresentativeComboboxValue(null);
  };

  const removeRepresentative = (rep: RepresentativeFormData) => {
    const current = form.getValues('representatives') || [];
    form.setValue(
      'representatives',
      current.filter((r) => {
        if (rep.representativeId !== undefined) {
          return r.representativeId !== rep.representativeId;
        }
        return r.representativeName !== rep.representativeName;
      })
    );
  };

  // Get display name for a representative
  const getRepresentativeDisplayName = (
    rep: RepresentativeFormData
  ): string => {
    if (rep.representativeId !== undefined) {
      const repInfo = representativeOptions.find(
        (r) => r.id === rep.representativeId
      );
      return repInfo?.displayName || repInfo?.name || 'Unknown';
    }
    return rep.representativeName || 'Unknown';
  };
  return (
    <ActivityFormSection title="Event">
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

      <FormField
        control={form.control}
        name="representatives"
        render={() => (
          <FormItem>
            <FormLabel>Representatives Attending</FormLabel>
            <div className="space-y-4">
              <FreeformCombobox
                options={representativeComboboxOptions}
                value={representativeComboboxValue}
                onChange={(value) => {
                  setRepresentativeComboboxValue(value);
                  if (value) {
                    addRepresentative(value);
                  }
                }}
                placeholder="Select or type a representative name"
                searchPlaceholder="Search representatives..."
                emptyMessage="No representatives found."
                freeformLabel="Add as"
                freeformDescription="Add custom representative name"
              />
              {representatives.length > 0 && (
                <div className="space-y-3 border-t pt-4">
                  <Label className="text-sm font-medium">
                    Selected Representatives
                  </Label>
                  <div className="mb-4 flex flex-wrap gap-2">
                    {representatives.map((rep) => (
                      <Badge
                        key={getRepresentativeKey(rep)}
                        variant="default"
                        className="flex items-center gap-2 px-3 py-1.5 text-sm"
                      >
                        {getRepresentativeDisplayName(rep)}
                        <button
                          type="button"
                          onClick={() => removeRepresentative(rep)}
                          className="hover:bg-background/20 ml-1 rounded-full p-0.5"
                          aria-label={`Remove ${getRepresentativeDisplayName(rep)}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <FormDescription className="mt-2">
              Select representatives from the list or type a custom name.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </ActivityFormSection>
  );
};
