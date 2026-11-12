import {
  useFormContext,
  type ControllerFieldState,
  type ControllerRenderProps,
} from 'react-hook-form';
import { useMemo, useRef, useState } from 'react';

import type { ActivityFormData } from '@corpcal/shared/schemas';
import {
  buildOrganizationComboboxSections,
  mergeLeadAndJointOrganizations,
  splitOrganizationFormEntries,
  type OrganizationComboboxSourceOption,
  type OrganizationFormEntry,
} from '@corpcal/shared/utils';
import { Button } from '@/components/ui/button';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  FreeformCombobox,
  type FreeformComboboxItemWithLead,
  type FreeformComboboxValue,
} from '@/components/ui/freeform-combobox';
import { getActivityFieldLabel } from '@/lib/activity-form-labels';
import { setActivityFormFieldValue } from '@/lib/activity-form-set-field';

import { ActivityFieldInfoIcon } from '../activity-info-icon-settings-context';

function entryToComboboxValue(
  entry: OrganizationFormEntry
): FreeformComboboxValue | null {
  if (entry.organizationId != null && entry.organizationId > 0) {
    return { type: 'option', value: String(entry.organizationId) };
  }
  if (entry.organizationName?.trim()) {
    return { type: 'freeform', value: entry.organizationName.trim() };
  }
  return null;
}

function comboboxValueToEntry(
  v: NonNullable<FreeformComboboxValue>,
  isLead: boolean
): OrganizationFormEntry | null {
  if (v.type === 'option') {
    const id = parseInt(v.value, 10);
    if (!Number.isFinite(id) || id <= 0) return null;
    return { organizationId: id, isLead };
  }
  const name = v.value.trim();
  if (name.length === 0) return null;
  return { organizationName: name, isLead };
}

type OrganizationsFieldRenderProps = {
  field: ControllerRenderProps<ActivityFormData, 'organizations'>;
  fieldState: ControllerFieldState;
  comboboxSections: ReturnType<typeof buildOrganizationComboboxSections>;
  readOnly: boolean;
};

function ActivityOrganizationsFieldsInner({
  field,
  fieldState,
  comboboxSections,
  readOnly,
}: OrganizationsFieldRenderProps) {
  const form = useFormContext<ActivityFormData>();
  const { lead, joints } = splitOrganizationFormEntries(field.value);
  const hadJointsInitially = useRef(
    splitOrganizationFormEntries(field.value).joints.length > 0
  );
  const [jointExpanded, setJointExpanded] = useState(
    () => hadJointsInitially.current
  );

  const commitOrganizations = (next: OrganizationFormEntry[]) => {
    setActivityFormFieldValue(form, field.name, next);
  };

  const leadComboboxValue = lead ? entryToComboboxValue(lead) : null;

  const handleLeadChange = (
    value: FreeformComboboxValue | FreeformComboboxValue[] | null
  ) => {
    const single = Array.isArray(value) ? (value[0] ?? null) : value;
    if (single == null) {
      if (joints.length === 0) {
        commitOrganizations([]);
      }
      return;
    }
    const nextLead = comboboxValueToEntry(single, true);
    if (!nextLead) {
      if (joints.length === 0) {
        commitOrganizations([]);
      }
      return;
    }
    commitOrganizations(mergeLeadAndJointOrganizations(nextLead, joints));
  };

  const jointComboboxValue: FreeformComboboxItemWithLead[] = joints
    .map(entryToComboboxValue)
    .filter((v): v is FreeformComboboxItemWithLead => v != null);

  const handleJointChange = (
    value: FreeformComboboxValue | FreeformComboboxValue[] | null
  ) => {
    const arr =
      value == null
        ? []
        : Array.isArray(value)
          ? value.filter(
              (v): v is NonNullable<FreeformComboboxValue> => v != null
            )
          : [value];
    const nextJoints = arr
      .map((v) => comboboxValueToEntry(v, false))
      .filter((e): e is OrganizationFormEntry => e != null);
    if (nextJoints.length === 0) {
      setJointExpanded(false);
    }
    commitOrganizations(mergeLeadAndJointOrganizations(lead, nextJoints));
  };

  return (
    <div className="space-y-3">
      <FormItem>
        <FormLabel showRequired>
          <>
            {getActivityFieldLabel('leadOrganization')}
            <ActivityFieldInfoIcon
              fieldKey="leadOrganization"
              ariaLabel="About lead organization"
            />
          </>
        </FormLabel>
        <FormControl data-field={field.name}>
          <FreeformCombobox
            readOnly={readOnly}
            sections={comboboxSections}
            value={leadComboboxValue}
            onChange={handleLeadChange}
            placeholder=""
            searchPlaceholder=""
            emptyMessage="No organizations found."
            freeformBadgeLabel="Add custom organization"
            listFooterHint="Custom organization names allowed"
            aria-invalid={fieldState.invalid}
          />
        </FormControl>
        {fieldState.error ? <FormMessage /> : null}
      </FormItem>

      {jointExpanded ? (
        <FormItem>
          <FormLabel>
            <>
              {getActivityFieldLabel('jointOrganizations')}
              <ActivityFieldInfoIcon
                fieldKey="jointOrganizations"
                ariaLabel="About joint organizations"
              />
            </>
          </FormLabel>
          <FormControl data-field="jointOrganizations">
            <FreeformCombobox
              readOnly={readOnly}
              sections={comboboxSections}
              value={jointComboboxValue}
              onChange={handleJointChange}
              placeholder=""
              searchPlaceholder=""
              emptyMessage="No organizations found."
              freeformBadgeLabel="Add custom organization"
              listFooterHint="Custom organization names allowed"
              multiple
              useChips
            />
          </FormControl>
        </FormItem>
      ) : !readOnly ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-auto px-0"
          onClick={() => setJointExpanded(true)}
        >
          + Add joint organizations
        </Button>
      ) : joints.length > 0 ? (
        <FormItem>
          <FormLabel>{getActivityFieldLabel('jointOrganizations')}</FormLabel>
          <FormControl>
            <FreeformCombobox
              readOnly
              sections={comboboxSections}
              value={jointComboboxValue}
              onChange={() => undefined}
              placeholder=""
              searchPlaceholder=""
              emptyMessage="No organizations found."
              multiple
              useChips
            />
          </FormControl>
        </FormItem>
      ) : null}
    </div>
  );
}

export function ActivityOrganizationsFields({
  organizationOptions,
  readOnly,
}: {
  organizationOptions: OrganizationComboboxSourceOption[];
  readOnly: boolean;
}) {
  const form = useFormContext<ActivityFormData>();
  const comboboxSections = useMemo(
    () => buildOrganizationComboboxSections(organizationOptions),
    [organizationOptions]
  );

  return (
    <FormField
      control={form.control}
      name="organizations"
      render={({ field, fieldState }) => (
        <ActivityOrganizationsFieldsInner
          field={field}
          fieldState={fieldState}
          comboboxSections={comboboxSections}
          readOnly={readOnly}
        />
      )}
    />
  );
}
