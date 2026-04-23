import { CheckIcon } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import { useMemo, type FC } from 'react';

import {
  DEFAULT_VISIBILITY,
  VISIBILITY,
  type Visibility,
} from '@corpcal/shared/constants/constants';
import type { ActivityFormData } from '@corpcal/shared/schemas';
import { FormSelect, FormSelectTrigger } from '@/components/app/form-select';
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxSeparator,
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
import { SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { getActivityFieldLabel } from '@/lib/activity-form-labels';
import { ACTIVITY_FORM_SECTION_LABELS } from '@/lib/activity-form-section-labels';
import { cn } from '@/lib/utils';
import type { OptionItem } from '@/schemas/types';

import { useActivityEdit } from '../activity-edit-context';
import { ActivityFormSection } from './ActivityFormSection';

export type SharingTeamLookup = {
  id: number;
  name: string;
  displayName?: string;
  ministryId: number | null;
};

export type QuickShareGroupLookup = {
  id: number;
  name: string;
  sortOrder: number;
  ministryIds: number[];
};

function teamIdsForMinistries(
  ministryIds: number[],
  teams: SharingTeamLookup[]
): number[] {
  const set = new Set(ministryIds);
  return teams
    .filter((t) => t.ministryId != null && set.has(t.ministryId))
    .map((t) => t.id);
}

function setsEqualAsSets(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const sb = new Set(b);
  return a.every((id) => sb.has(id));
}

/** Quick-pick row label: "Share with all social" from group name "Social". */
function quickShareGroupLabel(groupName: string): string {
  return `Share with ${groupName.toLowerCase()}`;
}

type ShortcutRowProps = {
  label: string;
  checked: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  onToggle: () => void;
};

function SharingShortcutRow({
  label,
  checked,
  disabled,
  readOnly,
  onToggle,
}: ShortcutRowProps) {
  return (
    <button
      type="button"
      disabled={disabled || readOnly}
      className={cn(
        'relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50',
        !disabled && !readOnly && 'hover:bg-accent hover:text-accent-foreground'
      )}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled && !readOnly) onToggle();
      }}
    >
      <span className="flex-1 text-left">{label}</span>
      {checked ? (
        <CheckIcon
          className="text-foreground pointer-events-none absolute right-2 size-4 shrink-0"
          aria-hidden
        />
      ) : null}
    </button>
  );
}

type ActivitySharingSectionProps = {
  sharedWithTeams: SharingTeamLookup[];
  quickShareGroups: QuickShareGroupLookup[];
};

export const ActivitySharingSection: FC<ActivitySharingSectionProps> = ({
  sharedWithTeams,
  quickShareGroups,
}) => {
  const { readOnly } = useActivityEdit();
  const form = useFormContext<ActivityFormData>();
  const sharedWithAnchorRef = useComboboxAnchor();

  const sharedWithTeamOptions = useMemo<OptionItem[]>(
    () =>
      sharedWithTeams.map((t) => ({
        value: String(t.id),
        label: t.displayName ?? t.name,
      })),
    [sharedWithTeams]
  );

  const allTeamIds = useMemo(
    () => sharedWithTeams.map((t) => t.id),
    [sharedWithTeams]
  );

  const groupsWithTeamIds = useMemo(
    () =>
      quickShareGroups.map((g) => ({
        ...g,
        teamIds: teamIdsForMinistries(g.ministryIds, sharedWithTeams),
      })),
    [quickShareGroups, sharedWithTeams]
  );

  return (
    <ActivityFormSection title={ACTIVITY_FORM_SECTION_LABELS.sharing}>
      <FormField
        control={form.control}
        name="visibility"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{getActivityFieldLabel(field.name)}</FormLabel>
            <FormSelect
              readOnly={readOnly}
              onValueChange={(value) => {
                const visibility: Visibility = (
                  VISIBILITY as readonly string[]
                ).includes(value)
                  ? (value as Visibility)
                  : DEFAULT_VISIBILITY;
                field.onChange(visibility);
              }}
              value={field.value || DEFAULT_VISIBILITY}
            >
              <FormControl data-field={field.name}>
                <FormSelectTrigger readOnly={readOnly}>
                  <SelectValue placeholder="Select visibility" />
                </FormSelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="global">Everyone</SelectItem>
                <SelectItem value="team">My team only</SelectItem>
              </SelectContent>
            </FormSelect>
            <FormDescription>
              Activities are always visible to exec and admins.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="sharedWithTeamIds"
        render={({ field }) => {
          const currentValues = Array.isArray(field.value)
            ? field.value
                .filter((v): v is number => typeof v === 'number')
                .map((v) => String(v))
            : [];
          const selectedOptions = sharedWithTeamOptions.filter((o) =>
            currentValues.includes(o.value)
          );

          const selectedIds = selectedOptions.map((o) => parseInt(o.value, 10));

          const toggleIds = (targetIds: number[], remove: boolean) => {
            const target = new Set(targetIds);
            if (remove) {
              field.onChange(selectedIds.filter((id) => !target.has(id)));
            } else {
              field.onChange([...new Set([...selectedIds, ...targetIds])]);
            }
          };

          const shareAllChecked =
            allTeamIds.length > 0 && setsEqualAsSets(selectedIds, allTeamIds);

          return (
            <FormItem>
              <FormLabel>{getActivityFieldLabel(field.name)}</FormLabel>
              <FormControl data-field={field.name}>
                <Combobox
                  items={sharedWithTeamOptions}
                  multiple
                  value={selectedOptions}
                  onValueChange={(selected: OptionItem[]) => {
                    field.onChange(selected.map((o) => parseInt(o.value, 10)));
                  }}
                  itemToStringValue={(o: OptionItem) => o.label}
                  readOnly={readOnly}
                >
                  <ComboboxChips ref={sharedWithAnchorRef} className="w-full">
                    <ComboboxValue>
                      {(values: OptionItem[]) => (
                        <>
                          {values.map((option) => (
                            <ComboboxChip key={option.value}>
                              {option.label}
                            </ComboboxChip>
                          ))}
                          <ComboboxChipsInput placeholder="Add teams" />
                        </>
                      )}
                    </ComboboxValue>
                  </ComboboxChips>
                  <ComboboxContent
                    anchor={sharedWithAnchorRef}
                    className={cn(
                      'popover-list-scroll flex max-h-[min(var(--popover-list-max-height),24rem)] flex-col overflow-x-hidden overflow-y-auto p-0'
                    )}
                  >
                    <div className="bg-popover px-1 py-1">
                      <SharingShortcutRow
                        label="Share with all"
                        checked={shareAllChecked}
                        disabled={allTeamIds.length === 0}
                        readOnly={readOnly}
                        onToggle={() => {
                          toggleIds(allTeamIds, shareAllChecked);
                        }}
                      />
                      {groupsWithTeamIds.length > 0 ? (
                        <ComboboxSeparator className="my-1" />
                      ) : null}
                      {groupsWithTeamIds.map((g) => {
                        const empty = g.teamIds.length === 0;
                        const groupChecked =
                          !empty &&
                          g.teamIds.every((id) => selectedIds.includes(id));
                        return (
                          <SharingShortcutRow
                            key={g.id}
                            label={quickShareGroupLabel(g.name)}
                            checked={groupChecked}
                            disabled={empty}
                            readOnly={readOnly}
                            onToggle={() => {
                              toggleIds(g.teamIds, groupChecked);
                            }}
                          />
                        );
                      })}
                      {sharedWithTeamOptions.length > 0 ? (
                        <ComboboxSeparator className="my-1" />
                      ) : null}
                      <ComboboxEmpty>No teams found.</ComboboxEmpty>
                      <ComboboxList className="max-h-none scroll-py-1 overflow-visible p-0 data-empty:p-0">
                        {(option: OptionItem) => (
                          <ComboboxItem key={option.value} value={option}>
                            {option.label}
                          </ComboboxItem>
                        )}
                      </ComboboxList>
                    </div>
                  </ComboboxContent>
                </Combobox>
              </FormControl>
              <FormDescription>
                Teams selected will see this activity in their &apos;Shared
                with&apos; tab.
              </FormDescription>
              <FormMessage />
            </FormItem>
          );
        }}
      />
    </ActivityFormSection>
  );
};
