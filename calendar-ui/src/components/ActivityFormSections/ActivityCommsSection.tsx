import { ChevronDown } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import { useState } from 'react';

import type { ActivityFormData } from '@corpcal/shared/schemas';

import { useMultiSelect } from '../../hooks/useMultiSelect';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Label } from '../ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Textarea } from '../ui/textarea';
import { ActivityFormSection } from './ActivityFormSection';

type ActivityCommsSectionProps = {
  commsMaterialOptions: Array<{
    id: number;
    name: string;
    displayName?: string;
  }>;
  commsLeadOptions: Array<{ value: string; label: string }>;
  activityStatusOptions: Array<{
    id: number;
    name: string;
    displayName?: string;
  }>;
};

export const ActivityCommsSection: React.FC<ActivityCommsSectionProps> = ({
  commsMaterialOptions,
  commsLeadOptions,
  activityStatusOptions,
}) => {
  const form = useFormContext<ActivityFormData>();

  // Move useMultiSelect hooks into the component
  const [selectedCommsMaterials, toggleCommsMaterial] = useMultiSelect<
    ActivityFormData,
    'commsMaterialIds',
    number
  >(form, 'commsMaterialIds');

  const [commsMaterialsOpen, setCommsMaterialsOpen] = useState(false);

  // activityStatusOptions is now received as a prop
  return (
    <ActivityFormSection title="Comms" variant="top">
      {/* Activity Status Input */}
      <FormField
        control={form.control}
        name="activityStatusId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Activity Status <span className="text-destructive">*</span>
            </FormLabel>
            <Select
              onValueChange={(value) =>
                field.onChange(value ? parseInt(value, 10) : null)
              }
              value={field.value != null ? String(field.value) : ''}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {activityStatusOptions.map((option) => (
                  <SelectItem key={option.id} value={String(option.id)}>
                    {option.displayName || option.name}
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
        name="commsContactLeadId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Comms Lead <span className="text-destructive">*</span>
            </FormLabel>
            <Select
              onValueChange={(value) =>
                field.onChange(value ? parseInt(value, 10) : null)
              }
              value={field.value != null ? String(field.value) : ''}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select comms lead" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {commsLeadOptions.map((option) => (
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
        name="strategy"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Strategy</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Enter strategy"
                rows={4}
                {...field}
                value={field.value || ''}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div>
        <Label className="mb-3 block">Comms Materials</Label>
        <Popover open={commsMaterialsOpen} onOpenChange={setCommsMaterialsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className="w-full justify-between"
            >
              {selectedCommsMaterials.length > 0
                ? `${selectedCommsMaterials.length} selected`
                : 'Select comms materials'}
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <div className="max-h-60 overflow-auto p-4">
              <div className="space-y-2">
                {commsMaterialOptions.map((material) => (
                  <div
                    key={material.id}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox
                      id={`comms-material-${material.id}`}
                      checked={selectedCommsMaterials.includes(material.id)}
                      onCheckedChange={() => toggleCommsMaterial(material.id)}
                    />
                    <label
                      htmlFor={`comms-material-${material.id}`}
                      className="cursor-pointer text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {material.displayName || material.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
        <FormDescription className="mt-2">
          Select comms materials if applicable
        </FormDescription>
      </div>
    </ActivityFormSection>
  );
};
