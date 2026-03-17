import { useFormContext } from 'react-hook-form';

import type { TeamListItem } from '@corpcal/shared/api/types';
import type { ActivityFormData } from '@corpcal/shared/schemas';
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
import { usePitchRequiredStatuses } from '@/hooks/useLookups';
import { getActivityFieldLabel } from '@/lib/activity-form-labels';
import { ACTIVITY_FORM_SECTION_LABELS } from '@/lib/activity-form-section-labels';

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

  return (
    <ActivityFormSection title={ACTIVITY_FORM_SECTION_LABELS.overview}>
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
                {getActivityFieldLabel(field.name)}{' '}
                <span className="text-destructive">*</span>
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
              <FormMessage />
            </FormItem>
          );
        }}
      />

      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {getActivityFieldLabel(field.name)}{' '}
              <span className="text-destructive">*</span>
            </FormLabel>
            <FormControl data-field={field.name}>
              <Textarea
                rows={2}
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
            const handleValueChange = (value: string) => {
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

              const teamId =
                value === '' || value == null ? undefined : Number(value);
              field.onChange(teamId);

              if (teamId == null) {
                form.setValue('leadMinistryId', undefined);
                if (leadOrgInSyncWithTeam) {
                  form.setValue('leadOrgId', null);
                  form.setValue('leadOrgName', null);
                }
              } else {
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
                  {getActivityFieldLabel(field.name)}{' '}
                  <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl data-field={field.name}>
                  <Select
                    disabled={readOnly}
                    value={
                      field.value !== undefined && field.value !== null
                        ? String(field.value)
                        : undefined
                    }
                    onValueChange={handleValueChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select lead team" />
                    </SelectTrigger>
                    <SelectContent>
                      {options.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

          const handleChange = (
            value: FreeformComboboxValue | FreeformComboboxValue[] | null
          ) => {
            const single =
              value == null
                ? null
                : Array.isArray(value)
                  ? (value[0] ?? null)
                  : value;
            if (!single) {
              field.onChange(null);
              form.setValue('leadOrgName', null);
            } else if (single.type === 'option') {
              field.onChange(Number(single.value));
              form.setValue('leadOrgName', null);
            } else {
              field.onChange(null);
              form.setValue('leadOrgName', single.value);
            }
          };

          return (
            <FormItem>
              <FormLabel>{getActivityFieldLabel(field.name)}</FormLabel>
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
                  freeformLabel="New org"
                  freeformDescription=""
                />
              </FormControl>
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
            <FormLabel>{getActivityFieldLabel(field.name)}</FormLabel>
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
              <FormLabel>{getActivityFieldLabel(field.name)}</FormLabel>
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
              <FormLabel>{getActivityFieldLabel(field.name)}</FormLabel>
            </div>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="significance"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{getActivityFieldLabel(field.name)}</FormLabel>
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

      <div className="space-y-4">
        <FormField
          control={form.control}
          name="pitchRequiredStatusId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{getActivityFieldLabel(field.name)}</FormLabel>
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
              <FormLabel>{getActivityFieldLabel(field.name)}</FormLabel>
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

      <FormField
        control={form.control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{getActivityFieldLabel(field.name)}</FormLabel>
            <FormControl data-field={field.name}>
              <Textarea
                placeholder="Enter notes"
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
        name="tagIds"
        render={({ field }) => {
          const selectedOptions = tagOptions.filter((o) =>
            (field.value ?? []).includes(Number(o.value))
          );
          return (
            <FormItem>
              <FormLabel>{getActivityFieldLabel(field.name)}</FormLabel>
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
              <FormMessage />
            </FormItem>
          );
        }}
      />
    </ActivityFormSection>
  );
};
