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
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
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
import {
  mockCategories,
  mockOrganizations,
  mockTags,
} from '../../data/mockLookups';
import { useMultiSelect } from '../../hooks/useMultiSelect';
import type { CreateActivityRequest } from '@corpcal/shared/schemas';
import { ActivityFormSection } from './ActivityFormSection';

type FormData = CreateActivityRequest & {
  categoryIds?: number[];
  relatedActivityIds?: number[];
  tagIds?: string[];
  jointOrganizationIds?: string[];
};

type ActivityOverviewSectionProps = {
  relatedActivityOptions: Array<{ value: string; label: string }>;
  jointOrganizationOptions: Array<{ value: string; label: string }>;
};

export const ActivityOverviewSection: React.FC<
  ActivityOverviewSectionProps
> = ({ relatedActivityOptions, jointOrganizationOptions }) => {
  const form = useFormContext<FormData>();
  const [showJointOrganizations, setShowJointOrganizations] = useState(false);

  // Move useMultiSelect hooks into the component
  const [selectedCategories, toggleCategory] = useMultiSelect<
    FormData,
    'categoryIds',
    number
  >(form, 'categoryIds');

  const [selectedTags, toggleTag] = useMultiSelect<FormData, 'tagIds', string>(
    form,
    'tagIds'
  );

  const [selectedRelatedActivities, toggleRelatedActivity] = useMultiSelect<
    FormData,
    'relatedActivityIds',
    number
  >(form, 'relatedActivityIds');

  const [selectedJointOrganizations, toggleJointOrganization] = useMultiSelect<
    FormData,
    'jointOrganizationIds',
    string
  >(form, 'jointOrganizationIds');
  return (
    <ActivityFormSection title="Overview" fieldsClassName="space-y-6">
      <div>
        <Label className="block">Category *</Label>
        <p className="text-muted-foreground mb-3 text-sm">
          Select all that apply
        </p>
        <div className="flex flex-wrap gap-2">
          {mockCategories.map((category) => (
            <Badge
              key={category.id}
              variant={
                selectedCategories.includes(category.id)
                  ? 'selected'
                  : 'outline'
              }
              className="cursor-pointer px-4 py-2 text-sm"
              onClick={() => toggleCategory(category.id)}
            >
              {category.displayName || category.name}
            </Badge>
          ))}
        </div>
      </div>

      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Title *</FormLabel>
            <FormControl>
              <Input
                placeholder="Enter activity title"
                {...field}
                value={field.value ?? ''}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="leadOrgId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Lead Organization</FormLabel>
            <Select onValueChange={field.onChange} value={field.value || ''}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select lead organization" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {mockOrganizations.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      {!showJointOrganizations && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setShowJointOrganizations(!showJointOrganizations)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add joint organization
          </Button>
        </div>
      )}
      {showJointOrganizations && (
        <div>
          <Label className="mb-3 block">Joint Organization</Label>
          <Combobox
            options={jointOrganizationOptions}
            selectedValues={selectedJointOrganizations}
            onSelect={toggleJointOrganization}
            placeholder="Search organizations..."
            searchPlaceholder="Search organizations..."
            emptyMessage="No organizations found."
          />
        </div>
      )}
      <FormField
        control={form.control}
        name="summary"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Summary</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Enter activity summary"
                rows={4}
                {...field}
                value={field.value || ''}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="isIssue"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-y-0 space-x-3">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Issue</FormLabel>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="oicRelated"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-y-0 space-x-3">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Order in Council Related</FormLabel>
              </div>
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="relatedActivityIds"
        render={({ field: _field }) => (
          <FormItem>
            <FormLabel>Related Activities</FormLabel>
            <FormControl>
              <Combobox
                options={relatedActivityOptions}
                selectedValues={selectedRelatedActivities.map((id) =>
                  id.toString()
                )}
                onSelect={(value) => {
                  const activityId = parseInt(value);
                  toggleRelatedActivity(activityId);
                }}
                placeholder="Select related activities"
                searchPlaceholder="Search activities..."
                emptyMessage="No activities found."
              />
            </FormControl>
            <FormDescription>
              Select related activities if applicable
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <div>
        <Label className="mb-3 block">Tags</Label>
        <div className="flex flex-wrap gap-2">
          {mockTags.map((tag) => (
            <Badge
              key={tag.id}
              variant={selectedTags.includes(tag.id) ? 'default' : 'outline'}
              className="cursor-pointer px-4 py-2 text-sm"
              onClick={() => toggleTag(tag.id)}
            >
              {tag.text}
              {selectedTags.includes(tag.id) && <X className="ml-2 h-3 w-3" />}
            </Badge>
          ))}
        </div>
        <FormDescription className="mt-2">
          Select tags to categorize this activity
        </FormDescription>
      </div>
    </ActivityFormSection>
  );
};
