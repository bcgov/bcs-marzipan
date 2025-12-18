import { UseFormReturn } from 'react-hook-form';
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
} from '../../data/mockLookups';
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
      <div className="grid grid-cols-3 gap-4">
        <FormField
          control={form.control}
          name="thirtySixtyNinetyReport"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-y-0 space-x-3">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>30-60-90</FormLabel>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="planningReport"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-y-0 space-x-3">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Planning Report</FormLabel>
              </div>
            </FormItem>
          )}
        />

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
      </div>

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

      <div>
        <Label className="mb-3 block">Section</Label>
        <div className="flex flex-wrap gap-2">
          {lookAheadSectionOptions.map((option) => (
            <Badge
              key={option.value}
              variant={
                form.watch('lookAheadSection') === option.value
                  ? 'default'
                  : 'outline'
              }
              className="cursor-pointer px-4 py-2 text-sm"
              onClick={() =>
                form.setValue('lookAheadSection', option.value as any)
              }
            >
              {option.label}
            </Badge>
          ))}
        </div>
        <FormDescription className="mt-2">
          Select the look ahead section
        </FormDescription>
      </div>
    </ActivityFormSection>
  );
};
