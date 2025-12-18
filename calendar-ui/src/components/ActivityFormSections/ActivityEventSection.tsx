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

type FormData = CreateActivityRequest & {
  jointEventOrganizationIds?: string[];
  representativeIds?: number[];
};

type ActivityEventSectionProps = {
  jointOrganizationOptions: Array<{ value: string; label: string }>;
  eventLeadOrgOptions: Array<{ value: string; label: string }>;
  eventPlannerOptions: Array<{ value: string; label: string }>;
  representativeOptions: Array<{
    id: number;
    name: string;
    displayName?: string;
    title?: string;
  }>;
};

export const ActivityEventSection: React.FC<ActivityEventSectionProps> = ({
  jointOrganizationOptions,
  eventLeadOrgOptions,
  eventPlannerOptions,
  representativeOptions,
}) => {
  const form = useFormContext<FormData>();
  const [showJointEventOrganizations, setShowJointEventOrganizations] =
    useState(false);

  // Move useMultiSelect hooks into the component
  const [selectedJointEventOrganizations, toggleJointEventOrganization] =
    useMultiSelect<FormData, 'jointEventOrganizationIds', string>(
      form,
      'jointEventOrganizationIds'
    );

  const [selectedRepresentatives, toggleRepresentative] = useMultiSelect<
    FormData,
    'representativeIds',
    number
  >(form, 'representativeIds');
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
      {!showJointEventOrganizations && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={() =>
              setShowJointEventOrganizations(!showJointEventOrganizations)
            }
            className="text-muted-foreground hover:text-foreground"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add joint organization
          </Button>
        </div>
      )}
      {showJointEventOrganizations && (
        <div>
          <Label className="mb-3 block">Joint event organization</Label>
          <Combobox
            options={jointOrganizationOptions}
            selectedValues={selectedJointEventOrganizations}
            onSelect={toggleJointEventOrganization}
            placeholder="Select"
            searchPlaceholder="Search organizations"
            emptyMessage="No organizations found."
          />
        </div>
      )}

      <FormField
        control={form.control}
        name="eventLeadId"
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
                {eventPlannerOptions.map((user) => (
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

      <div>
        <Label className="mb-3 block">Representatives Attending</Label>
        <div className="flex flex-wrap gap-2">
          {representativeOptions.map((rep) => (
            <Badge
              key={rep.id}
              variant={
                selectedRepresentatives.includes(rep.id) ? 'default' : 'outline'
              }
              className="cursor-pointer px-4 py-2 text-sm"
              onClick={() => toggleRepresentative(rep.id)}
            >
              {rep.displayName || rep.name}
              {selectedRepresentatives.includes(rep.id) && (
                <X className="ml-2 h-3 w-3" />
              )}
            </Badge>
          ))}
        </div>
        <FormDescription className="mt-2">
          Select representatives attending if applicable
        </FormDescription>
      </div>
    </ActivityFormSection>
  );
};
