import { UseFormReturn } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '../ui/form';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
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
        name="pitchDate"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Pitch Date</FormLabel>
            <FormControl>
              <Input type="date" {...field} value={field.value || ''} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </ActivityFormSection>
  );
};
