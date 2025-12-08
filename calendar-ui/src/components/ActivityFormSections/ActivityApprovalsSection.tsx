import { UseFormReturn } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '../ui/form';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { mockPitchStatuses } from '../../data/mockLookups';
import type { CreateActivityRequest } from '@corpcal/shared/schemas';
import { ActivityFormSection } from './ActivityFormSection';

type FormData = CreateActivityRequest;

type ActivityApprovalsSectionProps = {
  form: UseFormReturn<FormData>;
};

export const ActivityApprovalsSection: React.FC<
  ActivityApprovalsSectionProps
> = ({ form }) => {
  return (
    <ActivityFormSection title="Approvals">
      <FormField
        control={form.control}
        name="significance"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Significance</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Enter significance"
                rows={4}
                {...field}
                value={field.value || ''}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="pitchStatusId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Pitch Status</FormLabel>
            <Select
              onValueChange={(value) => field.onChange(parseInt(value))}
              value={field.value?.toString()}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select pitch status" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {mockPitchStatuses.map((status) => (
                  <SelectItem key={status.id} value={status.id.toString()}>
                    {status.displayName || status.name}
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
        name="pitchComments"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Pitch and Approval Notes</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Enter pitch and approval notes"
                rows={4}
                {...field}
                value={field.value || ''}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </ActivityFormSection>
  );
};
