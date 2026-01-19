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
  FreeformCombobox,
  type FreeformComboboxValue,
} from '../ui/freeform-combobox';
import { X } from 'lucide-react';
import { useMultiSelect } from '../../hooks/useMultiSelect';
import type { CreateActivityRequest } from '@corpcal/shared/schemas';
import { ActivityFormSection } from './ActivityFormSection';

type FormData = CreateActivityRequest & {
  categoryIds?: number[];
  tagIds?: number[];
};

type ActivityOverviewSectionProps = {
  categories: Array<{ id: number; name: string; displayName?: string }>;
  organizations: Array<{ value: string; label: string }>;
  tags: Array<{ id: number; text: string }>;
};

export const ActivityOverviewSection: React.FC<
  ActivityOverviewSectionProps
> = ({ categories, organizations, tags }) => {
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

  return (
    <ActivityFormSection title="Overview" fieldsClassName="space-y-6">
      <div>
        <Label className="block">Category *</Label>
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
