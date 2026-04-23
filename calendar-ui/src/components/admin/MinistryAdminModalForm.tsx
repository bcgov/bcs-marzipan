import { useEffect, useMemo, useState } from 'react';

import { Checkbox } from '@/components/ui/checkbox';
import {
  FreeformCombobox,
  type FreeformComboboxOption,
  type FreeformComboboxValueWithLead,
} from '@/components/ui/freeform-combobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type { RenderModalContentProps } from './GenericLookupAdmin';

export type MinisterFormSelection =
  | { mode: 'none' }
  | { mode: 'existing'; repId: number }
  | { mode: 'new'; name: string };

export type GovernmentRepMinisterListItem = {
  id: number;
  name: string;
  displayName: string;
  representativeType: string | null;
  /** Present on list API: ministry that designates this rep as minister, if any */
  ministryId?: number | null;
};

function isMinisterPickerRep(rep: {
  representativeType: string | null;
}): boolean {
  return (
    rep.representativeType == null || rep.representativeType === 'minister'
  );
}

export function filterMinisterPickerReps(
  reps: GovernmentRepMinisterListItem[]
): GovernmentRepMinisterListItem[] {
  return reps.filter(isMinisterPickerRep);
}

function comboboxValueFromSelection(
  sel: MinisterFormSelection
): FreeformComboboxValueWithLead {
  if (sel.mode === 'none') return null;
  if (sel.mode === 'existing') {
    return { type: 'option', value: String(sel.repId) };
  }
  return { type: 'freeform', value: sel.name };
}

function selectionFromComboboxValue(
  v: FreeformComboboxValueWithLead
): MinisterFormSelection {
  if (v == null) return { mode: 'none' };
  if (v.type === 'option') {
    return { mode: 'existing', repId: Number(v.value) };
  }
  const name = v.value.trim();
  if (!name) return { mode: 'none' };
  return { mode: 'new', name };
}

function sortOrderToInputString(value: unknown): string {
  if (value == null) return '0';
  if (typeof value === 'number' || typeof value === 'string') {
    return String(value);
  }
  return '0';
}

function deriveInitialMinisterSelection(
  initial: Record<string, unknown>,
  ministerOptionIds: Set<string>
): MinisterFormSelection {
  const designatedId = initial.ministerGovernmentRepId as
    | number
    | null
    | undefined;
  if (designatedId != null && ministerOptionIds.has(String(designatedId))) {
    return { mode: 'existing', repId: designatedId };
  }
  return { mode: 'none' };
}

interface MinistryAdminModalFormProps extends RenderModalContentProps {
  sharingGroupSelectOptions: { value: string; label: string }[];
  ministerRepOptions: FreeformComboboxOption[];
}

/**
 * Ministry create/edit form with minister as a freeform combobox over government reps
 * (minister role / untyped legacy rows), plus inline creation of a new rep on save.
 */
export function MinistryAdminModalForm({
  initialData,
  onChange,
  isSubmitting,
  sharingGroupSelectOptions,
  ministerRepOptions,
}: MinistryAdminModalFormProps) {
  const ministerOptionIds = useMemo(
    () => new Set(ministerRepOptions.map((o) => o.value)),
    [ministerRepOptions]
  );

  const [name, setName] = useState(() => (initialData.name as string) ?? '');
  const [displayName, setDisplayName] = useState(
    () => (initialData.displayName as string) ?? ''
  );
  const [abbreviation, setAbbreviation] = useState(
    () => (initialData.abbreviation as string) ?? ''
  );
  const [sortOrder, setSortOrder] = useState(() =>
    sortOrderToInputString(initialData.sortOrder)
  );
  const [isActive, setIsActive] = useState(
    () => initialData.isActive !== false
  );
  const [ministryGroupId, setMinistryGroupId] = useState(() => {
    const gid = initialData.ministryGroupId as number | null | undefined;
    return gid == null ? '__none__' : String(gid);
  });
  const [ministerComboValue, setMinisterComboValue] =
    useState<FreeformComboboxValueWithLead>(() =>
      comboboxValueFromSelection(
        deriveInitialMinisterSelection(
          initialData,
          new Set(ministerRepOptions.map((o) => o.value))
        )
      )
    );

  useEffect(() => {
    setName((initialData.name as string) ?? '');
    setDisplayName((initialData.displayName as string) ?? '');
    setAbbreviation((initialData.abbreviation as string) ?? '');
    setSortOrder(sortOrderToInputString(initialData.sortOrder));
    setIsActive(initialData.isActive !== false);
    const gid = initialData.ministryGroupId as number | null | undefined;
    setMinistryGroupId(gid == null ? '__none__' : String(gid));
    setMinisterComboValue(
      comboboxValueFromSelection(
        deriveInitialMinisterSelection(initialData, ministerOptionIds)
      )
    );
  }, [initialData, ministerOptionIds]);

  useEffect(() => {
    const groupVal =
      ministryGroupId === '__none__' || ministryGroupId === ''
        ? '__none__'
        : ministryGroupId;
    onChange({
      name,
      displayName,
      abbreviation,
      sortOrder: sortOrder === '' ? 0 : Number(sortOrder),
      isActive,
      ministryGroupId: groupVal,
      _ministerSelection: selectionFromComboboxValue(ministerComboValue),
    });
  }, [
    name,
    displayName,
    abbreviation,
    sortOrder,
    isActive,
    ministryGroupId,
    ministerComboValue,
    onChange,
  ]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="ministry-name" className="text-sm font-medium">
          Name<span className="text-destructive ml-1">*</span>
        </Label>
        <Input
          id="ministry-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., PREM, AGRI"
          required
          disabled={isSubmitting}
          className="w-full"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="ministry-display-name" className="text-sm font-medium">
          Display Name<span className="text-destructive ml-1">*</span>
        </Label>
        <Input
          id="ministry-display-name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Full ministry name"
          required
          disabled={isSubmitting}
          className="w-full"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="ministry-abbr" className="text-sm font-medium">
          Abbreviation<span className="text-destructive ml-1">*</span>
        </Label>
        <Input
          id="ministry-abbr"
          value={abbreviation}
          onChange={(e) => setAbbreviation(e.target.value)}
          placeholder="e.g., AG"
          required
          disabled={isSubmitting}
          className="w-full"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="ministry-minister" className="text-sm font-medium">
          Minister
        </Label>
        <FreeformCombobox
          options={ministerRepOptions}
          value={ministerComboValue}
          onChange={(v) => {
            if (v == null || Array.isArray(v)) {
              setMinisterComboValue(null);
              return;
            }
            setMinisterComboValue(v);
          }}
          placeholder="Search ministers or type a new name…"
          searchPlaceholder="Search…"
          emptyMessage="No matching ministers."
          freeformLabel="Create new government representative"
          freeformDescription="Saves as a minister linked to this ministry."
          disabled={isSubmitting}
          className="w-full"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="ministry-sort" className="text-sm font-medium">
          Sort Order
        </Label>
        <Input
          id="ministry-sort"
          type="number"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          placeholder="0"
          disabled={isSubmitting}
          className="w-full"
        />
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox
          id="ministry-active"
          checked={isActive}
          onCheckedChange={(checked) => setIsActive(checked === true)}
          disabled={isSubmitting}
        />
        <label
          htmlFor="ministry-active"
          className="text-sm leading-none font-normal peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Active
        </label>
      </div>
      <div className="space-y-2">
        <Label htmlFor="ministry-group" className="text-sm font-medium">
          Ministry group
        </Label>
        <Select
          value={ministryGroupId}
          onValueChange={setMinistryGroupId}
          disabled={isSubmitting}
        >
          <SelectTrigger id="ministry-group" className="w-full">
            <SelectValue placeholder="None" />
          </SelectTrigger>
          <SelectContent>
            {sharingGroupSelectOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
