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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Button } from '../ui/button';
import { Combobox } from '../ui/combobox';
import {
  FreeformCombobox,
  type FreeformComboboxValue,
} from '../ui/freeform-combobox';
import { Plus, X } from 'lucide-react';
import { useMultiSelect } from '../../hooks/useMultiSelect';
import type { CreateActivityRequest } from '@corpcal/shared/schemas';
import { ActivityFormSection } from './ActivityFormSection';
import { ATTENDING_STATUS } from '@corpcal/shared';
import type { AttendingStatus } from '@corpcal/shared';

type RepresentativeFormData = {
  representativeId?: number;
  representativeName?: string;
  attendingStatus: string;
};

type FormData = Omit<CreateActivityRequest, 'representatives'> & {
  jointEventOrgIds?: string[];
  representatives?: RepresentativeFormData[];
};

type ActivityEventSectionProps = {
  jointOrgOptions: Array<{ value: string; label: string }>;
  eventLeadOrgOptions: Array<{ value: string; label: string }>;
  userOptions: Array<{ value: string; label: string }>;
  representativeOptions: Array<{
    id: number;
    name: string;
    displayName?: string;
    title?: string;
  }>;
};

export const ActivityEventSection: React.FC<ActivityEventSectionProps> = ({
  jointOrgOptions,
  eventLeadOrgOptions,
  userOptions,
  representativeOptions,
}) => {
  const form = useFormContext<FormData>();
  const [showjointEventOrgs, setShowjointEventOrgs] = useState(false);

  // Move useMultiSelect hooks into the component
  const [selectedjointEventOrgs, togglejointEventOrg] = useMultiSelect<
    FormData,
    'jointEventOrgIds',
    string
  >(form, 'jointEventOrgIds');

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
      form.setValue('representatives', [
        ...current,
        { representativeId, attendingStatus: 'requested' as AttendingStatus },
      ]);
    } else {
      form.setValue('representatives', [
        ...current,
        {
          representativeName: value.value,
          attendingStatus: 'requested' as AttendingStatus,
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

  const updateAttendingStatus = (
    rep: RepresentativeFormData,
    attendingStatus: string
  ) => {
    const current = form.getValues('representatives') || [];
    form.setValue(
      'representatives',
      current.map((r) => {
        const matches =
          rep.representativeId !== undefined
            ? r.representativeId === rep.representativeId
            : r.representativeName === rep.representativeName;
        return matches
          ? { ...r, attendingStatus: attendingStatus as AttendingStatus }
          : r;
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
        name="eventLeadOrgId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Event Lead Organization</FormLabel>
            <Select onValueChange={field.onChange} value={field.value || ''}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select event lead organization" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {eventLeadOrgOptions.map((org) => (
                  <SelectItem key={org.value} value={org.value}>
                    {org.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      {!showjointEventOrgs && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setShowjointEventOrgs(!showjointEventOrgs)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add joint organization
          </Button>
        </div>
      )}
      {showjointEventOrgs && (
        <div>
          <Label className="mb-3 block">Joint event organization</Label>
          <Combobox
            options={jointOrgOptions}
            selectedValues={selectedjointEventOrgs}
            onSelect={togglejointEventOrg}
            placeholder="Select"
            searchPlaceholder="Search organizations"
            emptyMessage="No organizations found."
          />
        </div>
      )}

      <FormField
        control={form.control}
        name="eventPlannerId"
        render={({ field }) => {
          // Derive the combobox value from form state
          const eventPlannerId = field.value;
          const eventPlannerName = form.watch('eventPlannerName');

          const comboboxValue: FreeformComboboxValue = eventPlannerId
            ? { type: 'option', value: eventPlannerId.toString() }
            : eventPlannerName
              ? { type: 'freeform', value: eventPlannerName }
              : null;

          const handleChange = (value: FreeformComboboxValue) => {
            if (!value) {
              field.onChange(null);
              form.setValue('eventPlannerName', null);
            } else if (value.type === 'option') {
              // Convert string value to integer for eventPlannerId
              field.onChange(parseInt(value.value, 10));
              form.setValue('eventPlannerName', null);
            } else {
              field.onChange(null);
              form.setValue('eventPlannerName', value.value);
            }
          };

          return (
            <FormItem>
              <FormLabel>Event Planner</FormLabel>
              <FormControl>
                <FreeformCombobox
                  options={userOptions}
                  value={comboboxValue}
                  onChange={handleChange}
                  placeholder="Select event planner"
                  searchPlaceholder="Search users..."
                  emptyMessage="No users found."
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
                  <Label className="text-sm font-medium">
                    Set Attending Status
                  </Label>
                  {representatives.map((rep) => (
                    <div
                      key={getRepresentativeKey(rep)}
                      className="flex items-center justify-between gap-4 rounded-md border p-3"
                    >
                      <span className="text-sm font-medium">
                        {getRepresentativeDisplayName(rep)}
                      </span>
                      <Select
                        value={rep.attendingStatus}
                        onValueChange={(value) =>
                          updateAttendingStatus(rep, value)
                        }
                      >
                        <FormControl>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ATTENDING_STATUS.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <FormDescription className="mt-2">
              Select representatives from the list or type a custom name. Set
              attending status for each representative.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </ActivityFormSection>
  );
};
