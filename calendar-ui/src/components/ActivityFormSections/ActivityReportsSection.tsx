import { UseFormReturn } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from '../ui/form';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  lookAheadStatusOptions,
  lookAheadSectionOptions,
} from '../../constants/form-options';
import type { CreateActivityRequest } from '@corpcal/shared/schemas';
import { ActivityFormSection } from './ActivityFormSection';

type FormData = CreateActivityRequest;

type ActivityReportsSectionProps = {
  form: UseFormReturn<FormData>;
};

export const ActivityReportsSection: React.FC<ActivityReportsSectionProps> = ({
  form,
}) => {
  return (
    <ActivityFormSection title="Reports">
      <FormField
        control={form.control}
        name="notForLookAhead"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-y-0 space-x-3">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>Not for Look Ahead</FormLabel>
            </div>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="lookAheadStatus"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Report Status</FormLabel>
            <Select onValueChange={field.onChange} value={field.value || ''}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select report status" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {lookAheadStatusOptions.map((option) => (
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
        name="lookAheadSection"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Section</FormLabel>
            <div className="flex flex-wrap gap-2">
              {lookAheadSectionOptions.map((option) => {
                const isSelected = field.value === option.value;
                return (
                  <Badge
                    key={option.value}
                    variant={isSelected ? 'default' : 'outline'}
                    className="cursor-pointer px-4 py-2 text-sm"
                    onClick={() => {
                      // Toggle: if already selected, set to null; otherwise set to the option value
                      const newValue = isSelected ? null : option.value;
                      field.onChange(newValue);
                    }}
                  >
                    {option.label}
                  </Badge>
                );
              })}
            </div>
            <FormDescription className="mt-2">
              Select the look ahead section
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </ActivityFormSection>
  );
};
