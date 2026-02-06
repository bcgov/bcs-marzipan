import { useFormContext, useWatch, useFormState } from 'react-hook-form';
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
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  FreeformCombobox,
  type FreeformComboboxValue,
} from '../ui/freeform-combobox';
import { X } from 'lucide-react';
import { useMultiSelect } from '../../hooks/useMultiSelect';
import type { CreateActivityRequest } from '@corpcal/shared/schemas';
import { ActivityFormSection } from './ActivityFormSection';
import { useEffect } from 'react';

type FormData = CreateActivityRequest & {
  categoryIds?: number[];
  tagIds?: number[];
};

type ActivityOverviewSectionProps = {
  categories: Array<{
    id: number;
    name: string;
    displayName?: string;
    allowsPitch: boolean;
  }>;
  ministries: Array<{ id: string; name: string; displayName?: string }>;
  organizations: Array<{ value: string; label: string }>;
  tags: Array<{ id: number; text: string }>;
};

export const ActivityOverviewSection: React.FC<
  ActivityOverviewSectionProps
> = ({ categories, ministries, organizations, tags }) => {
  const form = useFormContext<FormData>();

  // const [categories, setCategories] = useState<any[]>([]);
  // Move useMultiSelect hooks into the component

  // useEffect(() => {
  //   const loadCategories = async () => {
  //     try {
  //       const response = await fetchCategories();
  //       if (response) {
  //         setCategories(response);
  //       }
  //     } catch (error) {
  //       console.error('Error fetching categories:', error);
  //     }
  //   };

  //   void loadCategories();
  // }, []);

  const [selectedCategories, toggleCategory] = useMultiSelect<
    FormData,
    'categoryIds',
    number
  >(form, 'categoryIds');

  const [selectedTags, toggleTag] = useMultiSelect<FormData, 'tagIds', number>(
    form,
    'tagIds'
  );

  // Watch categoryIds to determine if pitch is required
  const categoryIds = useWatch({
    control: form.control,
    name: 'categoryIds',
  });

  // Track dirty fields to show change indicators
  const { dirtyFields } = useFormState({ control: form.control });
  const titleChanged = !!(dirtyFields as any)?.title;

  // Calculate if pitch is required based on selected categories
  const isPitchRequired = (categoryIds || []).some((categoryId) => {
    const category = categories.find((c) => c.id === categoryId);
    return category?.allowsPitch === true;
  });

  // Update pitchRequired field when categories change
  useEffect(() => {
    form.setValue('pitchRequired', isPitchRequired);
  }, [isPitchRequired, form]);

  return (
    <ActivityFormSection title="Overview" fieldsClassName="space-y-6">
      <div>
        <Label className="block">
          Category <span className="text-destructive">*</span>
        </Label>
        <p className="text-muted-foreground mb-3 text-sm">
          Select all that apply
        </p>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
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

      {/* Title field with change indicator */}
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Title *
              {titleChanged && (
                <Badge variant="warning" className="ml-2">
                  Changed
                </Badge>
              )}
              Title <span className="text-destructive">*</span>
            </FormLabel>
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
        name="leadMinistryId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Lead Ministry <span className="text-destructive">*</span>
            </FormLabel>
            <Select
              onValueChange={(value) => field.onChange(value)}
              value={field.value || ''}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select lead ministry" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {ministries.map((ministry) => (
                  <SelectItem key={ministry.id} value={ministry.id}>
                    {ministry.displayName || ministry.name}
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
        name="leadOrgId"
        render={({ field }) => {
          // Derive the combobox value from form state
          const leadOrgId = field.value;
          const leadOrgName = form.watch('leadOrgName');

          const comboboxValue: FreeformComboboxValue = leadOrgId
            ? { type: 'option', value: leadOrgId }
            : leadOrgName
              ? { type: 'freeform', value: leadOrgName }
              : null;

          const handleChange = (value: FreeformComboboxValue) => {
            if (!value) {
              field.onChange(null);
              form.setValue('leadOrgName', null);
            } else if (value.type === 'option') {
              field.onChange(value.value);
              form.setValue('leadOrgName', null);
            } else {
              field.onChange(null);
              form.setValue('leadOrgName', value.value);
            }
          };

          return (
            <FormItem>
              <FormLabel>Lead Organization</FormLabel>
              <FormControl>
                <FreeformCombobox
                  options={organizations}
                  value={comboboxValue}
                  onChange={handleChange}
                  placeholder="Select lead organization"
                  searchPlaceholder="Search organizations..."
                  emptyMessage="No organizations found."
                  freeformLabel="Other"
                  freeformDescription="Can't find the organization?"
                />
              </FormControl>
              <FormDescription>
                Select an organization from the list, or type to enter a custom
                name
              </FormDescription>
              <FormMessage />
            </FormItem>
          );
        }}
      />
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

      <FormField
        control={form.control}
        name="isConfidential"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-y-0 space-x-3">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>Confidential</FormLabel>
            </div>
          </FormItem>
        )}
      />

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

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Pitch</h3>

        <FormField
          control={form.control}
          name="pitchRequired"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-y-0 space-x-3">
              <FormControl>
                <Switch checked={field.value ?? false} disabled />
              </FormControl>
              <div className="space-y-0.5">
                <FormLabel className="text-base">Pitch Required</FormLabel>
                <FormDescription>
                  Determined by selected category types
                </FormDescription>
              </div>
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
      </div>

      <FormField
        control={form.control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Notes</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Enter notes"
                rows={4}
                {...field}
                value={field.value || ''}
              />
            </FormControl>
            <FormDescription>
              General notes for admin change log and tracking
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <div>
        <Label className="mb-3 block">Tags</Label>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
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
