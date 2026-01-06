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
import { Plus, X } from 'lucide-react';
import { useMultiSelect } from '../../hooks/useMultiSelect';
import type { CreateActivityRequest } from '@corpcal/shared/schemas';
import { ActivityFormSection } from './ActivityFormSection';
import { ATTENDING_STATUS } from '@corpcal/shared';
import type { AttendingStatus } from '@corpcal/shared';

type FormData = CreateActivityRequest & {
  jointEventOrgIds?: string[];
  representatives?: Array<{
    representativeId: number;
    attendingStatus: string;
  }>;
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

  const addRepresentative = (representativeId: number) => {
    const current = form.getValues('representatives') || [];
    // Check if already added
    if (current.some((r) => r.representativeId === representativeId)) {
      return;
    }
    form.setValue('representatives', [
      ...current,
      { representativeId, attendingStatus: 'requested' },
    ]);
  };

  const removeRepresentative = (representativeId: number) => {
    const current = form.getValues('representatives') || [];
    form.setValue(
      'representatives',
      current.filter((r) => r.representativeId !== representativeId)
    );
  };

  const updateAttendingStatus = (
    representativeId: number,
    attendingStatus: string
  ) => {
    const current = form.getValues('representatives') || [];
    form.setValue(
      'representatives',
      current.map((r) =>
        r.representativeId === representativeId
          ? { ...r, attendingStatus: attendingStatus as AttendingStatus }
          : r
      )
    );
  };

  const selectedRepresentativeIds = representatives.map(
    (r) => r.representativeId
  );
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
        render={({ field }) => (
          <FormItem>
            <FormLabel>Event Planner</FormLabel>
            <Select
              onValueChange={(value) => field.onChange(parseInt(value))}
              value={field.value?.toString()}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select event planner" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {userOptions.map((user) => (
                  <SelectItem key={user.value} value={user.value}>
                    {user.label}
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
        render={() => (
          <FormItem>
            <FormLabel>Representatives Attending</FormLabel>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {representativeOptions.map((rep) => (
                  <Badge
                    key={rep.id}
                    variant={
                      selectedRepresentativeIds.includes(rep.id)
                        ? 'default'
                        : 'outline'
                    }
                    className="cursor-pointer px-4 py-2 text-sm"
                    onClick={() => {
                      if (selectedRepresentativeIds.includes(rep.id)) {
                        removeRepresentative(rep.id);
                      } else {
                        addRepresentative(rep.id);
                      }
                    }}
                  >
                    {rep.displayName || rep.name}
                    {selectedRepresentativeIds.includes(rep.id) && (
                      <X className="ml-2 h-3 w-3" />
                    )}
                  </Badge>
                ))}
              </div>
              {representatives.length > 0 && (
                <div className="space-y-3 border-t pt-4">
                  <Label className="text-sm font-medium">
                    Set Attending Status
                  </Label>
                  {representatives.map((rep) => {
                    const repInfo = representativeOptions.find(
                      (r) => r.id === rep.representativeId
                    );
                    if (!repInfo) return null;
                    return (
                      <div
                        key={rep.representativeId}
                        className="flex items-center justify-between gap-4 rounded-md border p-3"
                      >
                        <span className="text-sm font-medium">
                          {repInfo.displayName || repInfo.name}
                        </span>
                        <Select
                          value={rep.attendingStatus}
                          onValueChange={(value) =>
                            updateAttendingStatus(rep.representativeId, value)
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
                                {status.charAt(0).toUpperCase() +
                                  status.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <FormDescription className="mt-2">
              Select representatives and set their attending status
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </ActivityFormSection>
  );
};
