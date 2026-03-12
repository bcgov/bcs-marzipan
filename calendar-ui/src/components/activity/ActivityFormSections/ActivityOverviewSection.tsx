import { useFormContext, useFormState } from 'react-hook-form';

import type { TeamListItem } from '@corpcal/shared/api/types';
import type { ActivityFormData } from '@corpcal/shared/schemas';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from '@/components/ui/combobox';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  FreeformCombobox,
  type FreeformComboboxValue,
} from '@/components/ui/freeform-combobox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  usePitchRequiredStatuses,
  useTranslationRequiredStatuses,
} from '@/hooks/useLookups';
import { getActivityFormSectionLabel } from '@/lib/activity-form-section-labels';

import { ActivityFormSection } from './ActivityFormSection';

type ActivityOverviewSectionProps = {
  categories: Array<{
    id: number;
    name: string;
    displayName?: string;
  }>;
  organizations: Array<{
    value: number;
    label: string;
    ministryId?: number | null;
  }>;
  tags: Array<{ id: number; text: string }>;
  readOnly?: boolean;
  /** When provided, show Lead team combobox. Ministry is derived from the selected team. */
  leadTeamOptions?: TeamListItem[];
};

export const ActivityOverviewSection: React.FC<
  ActivityOverviewSectionProps
> = ({
  categories,
  organizations,
  tags,
  readOnly = false,
  leadTeamOptions,
}) => {
  const form = useFormContext<ActivityFormData>();
  const categoriesAnchorRef = useComboboxAnchor();
  const tagsAnchorRef = useComboboxAnchor();

  const categoryOptions = categories.map((c) => ({
    value: String(c.id),
    label: c.displayName ?? c.name,
  }));
  const tagOptions = tags.map((t) => ({
    value: String(t.id),
    label: t.text,
  }));

  const { data: pitchRequiredStatuses = [] } = usePitchRequiredStatuses();
  const { data: translationRequiredStatuses = [] } =
    useTranslationRequiredStatuses();

  // Track dirty fields to show change indicators
  const { dirtyFields } = useFormState({ control: form.control });
  const titleChanged = 'title' in dirtyFields && Boolean(dirtyFields.title);

  return (
    <ActivityFormSection
      title={getActivityFormSectionLabel('overview')}
      fieldsClassName="space-y-6"
    >
      <FormField
        control={form.control}
        name="categoryIds"
        render={({ field }) => {
          const selectedOptions = categoryOptions.filter((o) =>
            (field.value ?? []).includes(Number(o.value))
          );
          return (
            <FormItem>
              <FormLabel>
                Categories <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl data-field={field.name}>
                <Combobox
                  items={categoryOptions}
                  multiple
                  value={selectedOptions}
                  onValueChange={(selected) =>
                    field.onChange(selected.map((o) => Number(o.value)))
                  }
                  itemToStringValue={(o) => o.label}
                  disabled={readOnly}
                >
                  <ComboboxChips ref={categoriesAnchorRef} className="w-full">
                    <ComboboxValue>
                      {(values: Array<{ value: string; label: string }>) => (
                        <>
                          {values.map((option) => (
                            <ComboboxChip key={option.value}>
                              {option.label}
                            </ComboboxChip>
                          ))}
                          <ComboboxChipsInput placeholder="Select categories..." />
                        </>
                      )}
                    </ComboboxValue>
                  </ComboboxChips>
                  <ComboboxContent anchor={categoriesAnchorRef}>
                    <ComboboxEmpty>No categories found.</ComboboxEmpty>
                    <ComboboxList>
                      {(option: { value: string; label: string }) => (
                        <ComboboxItem key={option.value} value={option}>
                          {option.label}
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </FormControl>
              <FormDescription>Select all that apply</FormDescription>
              <FormMessage />
            </FormItem>
          );
        }}
      />

      {/* Title field with change indicator */}
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Title <span className="text-destructive">*</span>
              {titleChanged && (
                <Badge variant="warning" className="ml-2">
                  Changed
                </Badge>
              )}
            </FormLabel>
            <FormControl data-field={field.name}>
              <Input
                placeholder="Enter activity title"
                readOnly={readOnly}
                {...field}
                value={field.value ?? ''}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {leadTeamOptions ? (
        <FormField
          control={form.control}
          name="leadTeamId"
          render={({ field }) => {
            const comboboxValue: FreeformComboboxValue =
              field.value != null
                ? { type: 'option', value: String(field.value) }
                : null;

            const handleChange = (value: FreeformComboboxValue) => {
              const previousTeamId = field.value ?? null;
              const previousTeam =
                previousTeamId != null
                  ? leadTeamOptions.find((t) => t.id === previousTeamId)
                  : null;
              const syncedOrgId =
                previousTeam?.ministryId != null
                  ? (organizations.find(
                      (o) => o.ministryId === previousTeam.ministryId
                    )?.value ?? null)
                  : null;
              const currentLeadOrgId = form.getValues('leadOrgId') ?? null;
              const currentLeadOrgName = form.getValues('leadOrgName') ?? null;
              const leadOrgInSyncWithTeam =
                (syncedOrgId != null &&
                  currentLeadOrgId === syncedOrgId &&
                  (currentLeadOrgName == null || currentLeadOrgName === '')) ||
                (syncedOrgId == null &&
                  currentLeadOrgId == null &&
                  (currentLeadOrgName == null || currentLeadOrgName === ''));

              if (!value) {
                field.onChange(undefined);
                form.setValue('leadMinistryId', undefined);
                if (leadOrgInSyncWithTeam) {
                  form.setValue('leadOrgId', null);
                  form.setValue('leadOrgName', null);
                }
              } else if (value.type === 'option') {
                const teamId = Number(value.value);
                field.onChange(teamId);
                const team = leadTeamOptions.find((t) => t.id === teamId);
                form.setValue('leadMinistryId', team?.ministryId ?? undefined);
                if (leadOrgInSyncWithTeam && team) {
                  const orgForMinistry =
                    team.ministryId != null
                      ? organizations.find(
                          (o) => o.ministryId === team.ministryId
                        )
                      : undefined;
                  if (orgForMinistry) {
                    form.setValue('leadOrgId', orgForMinistry.value);
                    form.setValue('leadOrgName', null);
                  } else {
                    form.setValue('leadOrgId', null);
                    form.setValue('leadOrgName', null);
                  }
                }
              }
            };

            const options = leadTeamOptions.map((t) => ({
              value: String(t.id),
              label: t.ministryName
                ? `${t.displayName || t.name} (${t.ministryName})`
                : t.displayName || t.name,
            }));

            return (
              <FormItem>
                <FormLabel>
                  Lead team <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl data-field={field.name}>
                  <FreeformCombobox
                    disabled={readOnly}
                    options={options}
                    value={comboboxValue}
                    onChange={handleChange}
                    placeholder="Select lead team"
                    searchPlaceholder="Search teams..."
                    emptyMessage="No teams found."
                    freeformLabel="Other"
                    freeformDescription="Can't find the team?"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />
      ) : null}

      <FormField
        control={form.control}
        name="leadOrgId"
        render={({ field }) => {
          // Derive the combobox value from form state
          const leadOrgId = field.value;
          const leadOrgName = form.watch('leadOrgName');

          const comboboxValue: FreeformComboboxValue =
            leadOrgId != null
              ? { type: 'option', value: String(leadOrgId) }
              : leadOrgName
                ? { type: 'freeform', value: leadOrgName }
                : null;

          const handleChange = (value: FreeformComboboxValue) => {
            if (!value) {
              field.onChange(null);
              form.setValue('leadOrgName', null);
            } else if (value.type === 'option') {
              field.onChange(Number(value.value));
              form.setValue('leadOrgName', null);
            } else {
              field.onChange(null);
              form.setValue('leadOrgName', value.value);
            }
          };

          return (
            <FormItem>
              <FormLabel>Lead Organization</FormLabel>
              <FormControl data-field={field.name}>
                <FreeformCombobox
                  disabled={readOnly}
                  options={organizations.map((o) => ({
                    value: String(o.value),
                    label: o.label,
                  }))}
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
            <FormControl data-field={field.name}>
              <Textarea
                placeholder="Enter activity summary"
                readOnly={readOnly}
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
            <FormControl data-field={field.name}>
              <Checkbox
                checked={field.value}
                disabled={readOnly}
                onCheckedChange={(checked) => {
                  field.onChange(checked);
                  if (checked) {
                    form.setValue('visibility', 'team');
                    const executiveSummary = form.getValues('executiveSummary');
                    if (!executiveSummary?.trim()) {
                      const leadTeamId = form.getValues('leadTeamId');
                      const team =
                        leadTeamId != null && leadTeamOptions?.length
                          ? leadTeamOptions.find((t) => t.id === leadTeamId)
                          : undefined;
                      const holdFor = team
                        ? team.ministryName ||
                          team.displayName ||
                          team.name ||
                          'team'
                        : 'team';
                      form.setValue('executiveSummary', `Hold for ${holdFor}.`);
                    }
                  }
                }}
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
            <FormControl data-field={field.name}>
              <Checkbox
                checked={field.value}
                disabled={readOnly}
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
            <FormControl data-field={field.name}>
              <Textarea
                placeholder="Enter significance"
                readOnly={readOnly}
                rows={4}
                {...field}
                value={field.value || ''}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="my-6 border-t border-gray-300"></div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Pitch</h3>

        <FormField
          control={form.control}
          name="pitchRequiredStatusId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pitch required status</FormLabel>
              <Select
                disabled={readOnly}
                value={
                  field.value !== undefined && field.value !== null
                    ? String(field.value)
                    : ''
                }
                onValueChange={(value) =>
                  field.onChange(value === '' ? undefined : Number(value))
                }
              >
                <FormControl data-field={field.name}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {pitchRequiredStatuses.map((status) => (
                    <SelectItem key={status.id} value={String(status.id)}>
                      {status.displayName ?? status.name}
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
          name="pitchDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pitch Date</FormLabel>
              <FormControl data-field={field.name}>
                <Input
                  readOnly={readOnly}
                  type="date"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="my-6 border-t border-gray-300"></div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Translations</h3>

        <FormField
          control={form.control}
          name="translationsRequiredStatusId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Translations required status</FormLabel>
              <Select
                disabled={readOnly}
                value={
                  field.value !== undefined && field.value !== null
                    ? String(field.value)
                    : ''
                }
                onValueChange={(value) =>
                  field.onChange(value === '' ? undefined : Number(value))
                }
              >
                <FormControl data-field={field.name}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {translationRequiredStatuses.map((status) => (
                    <SelectItem key={status.id} value={String(status.id)}>
                      {status.displayName ?? status.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <FormControl data-field={field.name}>
              <Textarea
                placeholder="Enter notes"
                readOnly={readOnly}
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
        name="tagIds"
        render={({ field }) => {
          const selectedOptions = tagOptions.filter((o) =>
            (field.value ?? []).includes(Number(o.value))
          );
          return (
            <FormItem>
              <FormLabel>Tags</FormLabel>
              <FormControl data-field={field.name}>
                <Combobox
                  items={tagOptions}
                  multiple
                  value={selectedOptions}
                  onValueChange={(selected) =>
                    field.onChange(selected.map((o) => Number(o.value)))
                  }
                  itemToStringValue={(o) => o.label}
                  disabled={readOnly}
                >
                  <ComboboxChips ref={tagsAnchorRef} className="w-full">
                    <ComboboxValue>
                      {(values: Array<{ value: string; label: string }>) => (
                        <>
                          {values.map((option) => (
                            <ComboboxChip key={option.value}>
                              {option.label}
                            </ComboboxChip>
                          ))}
                          <ComboboxChipsInput placeholder="Select tags..." />
                        </>
                      )}
                    </ComboboxValue>
                  </ComboboxChips>
                  <ComboboxContent anchor={tagsAnchorRef}>
                    <ComboboxEmpty>No tags found.</ComboboxEmpty>
                    <ComboboxList>
                      {(option: { value: string; label: string }) => (
                        <ComboboxItem key={option.value} value={option}>
                          {option.label}
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </FormControl>
              <FormDescription>
                Select tags to categorize this activity
              </FormDescription>
              <FormMessage />
            </FormItem>
          );
        }}
      />
    </ActivityFormSection>
  );
};
