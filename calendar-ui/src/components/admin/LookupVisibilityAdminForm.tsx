import { useEffect, useRef, useState } from 'react';

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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { OptionItem } from '@/schemas/types';

import type { RenderModalContentProps } from './GenericLookupAdmin';
import { LookupForm, type FormField } from './LookupForm';

const VISIBILITY_GLOBAL = 'global';
const VISIBILITY_TEAM = 'team';

export interface LookupVisibilityAdminFormProps extends RenderModalContentProps {
  fields: FormField[];
  teamOptions: OptionItem[];
}

function normalizeTeamIds(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => (typeof v === 'number' ? v : Number(v)))
    .filter((n) => Number.isFinite(n));
}

export function LookupVisibilityAdminForm({
  fields,
  resetKey,
  initialData,
  onChange,
  isSubmitting: _isSubmitting,
  teamOptions,
  dialogContentRef,
  onNestedOverlayOpenChange,
}: LookupVisibilityAdminFormProps) {
  const teamsAnchorRef = useComboboxAnchor();
  const [coreData, setCoreData] = useState<Record<string, unknown>>(() => ({
    ...initialData,
  }));
  const [visibility, setVisibility] = useState<'global' | 'team'>(() =>
    initialData.visibility === VISIBILITY_TEAM
      ? VISIBILITY_TEAM
      : VISIBILITY_GLOBAL
  );
  const [teamIds, setTeamIds] = useState<number[]>(() =>
    normalizeTeamIds(initialData.teamIds)
  );

  const lastResetKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (lastResetKeyRef.current === null) {
      lastResetKeyRef.current = resetKey;
      return;
    }
    if (lastResetKeyRef.current === resetKey) {
      return;
    }
    lastResetKeyRef.current = resetKey;
    setCoreData({ ...initialData });
    setVisibility(
      initialData.visibility === VISIBILITY_TEAM
        ? VISIBILITY_TEAM
        : VISIBILITY_GLOBAL
    );
    setTeamIds(normalizeTeamIds(initialData.teamIds));
  }, [resetKey, initialData]);

  useEffect(() => {
    onChange({
      ...coreData,
      visibility,
      teamIds: visibility === VISIBILITY_TEAM ? teamIds : [],
    });
  }, [coreData, visibility, teamIds, onChange]);

  const selectedTeamOptions = teamOptions.filter((o) =>
    teamIds.includes(Number(o.value))
  );

  return (
    <div className="space-y-4">
      <LookupForm
        fields={fields}
        resetKey={resetKey}
        initialData={initialData}
        onChange={setCoreData}
      />

      <div className="space-y-2">
        <Label htmlFor="lookup-visibility" className="text-sm font-medium">
          Visibility
        </Label>
        <Select
          value={visibility}
          onValueChange={(value: 'global' | 'team') => setVisibility(value)}
        >
          <SelectTrigger id="lookup-visibility" className="w-full">
            <SelectValue placeholder="Select visibility" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={VISIBILITY_GLOBAL}>Global</SelectItem>
            <SelectItem value={VISIBILITY_TEAM}>Team</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {visibility === VISIBILITY_TEAM ? (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Teams</Label>
          <Combobox
            items={teamOptions}
            multiple
            value={selectedTeamOptions}
            onValueChange={(selected: OptionItem[]) => {
              setTeamIds(selected.map((o) => Number(o.value)));
            }}
            itemToStringValue={(o) => o.label}
            onOpenChange={(open: boolean) => onNestedOverlayOpenChange?.(open)}
          >
            <ComboboxChips ref={teamsAnchorRef} className="w-full">
              <ComboboxValue>
                {(values: OptionItem[]) => (
                  <>
                    {values.map((option) => (
                      <ComboboxChip key={option.value}>
                        {option.label}
                      </ComboboxChip>
                    ))}
                    <ComboboxChipsInput placeholder="Select teams..." />
                  </>
                )}
              </ComboboxValue>
            </ComboboxChips>
            <ComboboxContent
              anchor={teamsAnchorRef}
              container={dialogContentRef}
              className="max-h-72"
            >
              <ComboboxEmpty>No teams found.</ComboboxEmpty>
              <ComboboxList>
                {(option: OptionItem) => (
                  <ComboboxItem key={option.value} value={option}>
                    {option.label}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>
      ) : null}
    </div>
  );
}

export function transformLookupVisibilitySubmitData(
  data: Record<string, unknown>
): Record<string, unknown> {
  const visibility = data.visibility === VISIBILITY_TEAM ? 'team' : 'global';
  const teamIds = normalizeTeamIds(data.teamIds);
  if (visibility === 'team' && teamIds.length === 0) {
    throw new Error('At least one team is required when visibility is team');
  }
  const { teamIds: _omit, ...rest } = data;
  return {
    ...rest,
    visibility,
    ...(visibility === 'team' ? { teamIds } : {}),
  };
}

export function lookupVisibilityInitialData(
  item: Record<string, unknown>
): Record<string, unknown> {
  return {
    ...item,
    visibility: item.visibility === 'team' ? 'team' : 'global',
    teamIds: normalizeTeamIds(item.teamIds),
  };
}

export function renderLookupVisibilityColumn(row: {
  visibility?: string;
  teamNames?: string[];
}): string {
  if (row.visibility === 'team') {
    if (row.teamNames && row.teamNames.length > 0) {
      return row.teamNames.join(', ');
    }
    return 'Team (unassigned)';
  }
  return 'Global';
}
