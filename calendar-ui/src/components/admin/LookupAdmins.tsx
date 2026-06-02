/**
 * All Admin Lookup Components
 *
 * This file provides ready-to-use admin components for all lookup types
 * using the GenericLookupAdmin template.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { useCallback, useMemo } from 'react';

import api from '@/api/axios';
import {
  fetchActivityStatuses,
  fetchAllTags,
  fetchCategories,
  fetchCities,
  fetchCommsMaterials,
  fetchGovernmentRepresentatives,
  fetchMinistries,
  fetchMinistryGroups,
  fetchThemes,
  fetchVenuePresets,
  type LookupItem,
  type MinistryGroupListItem,
  type MinistryLookupItem,
  type ThemeLookupItem,
} from '@/api/lookupsApi';
import { fetchTeams } from '@/api/usersApi';
import type { FreeformComboboxOption } from '@/components/ui/freeform-combobox';
import { ClientValidationError } from '@/lib/error-toast';
import { lookupQueryKeys } from '@/lib/lookupQueryKeys';

import { NONE_SELECT_VALUE } from '.';
import { GenericLookupAdmin } from './GenericLookupAdmin';
import { FormField } from './LookupForm';
import {
  filterMinisterPickerReps,
  MinistryAdminModalForm,
  type MinisterFormSelection,
} from './MinistryAdminModalForm';
import { VenuePresetForm } from './VenuePresetForm';

// Type definitions - these extend the base LookupItem from the API
type Category = LookupItem & {
  name?: string;
  displayName?: string | null;
};

type City = LookupItem & {
  name?: string;
  displayName?: string | null;
  provinceOrState?: string | null;
  country?: string | null;
};

type CommsMaterial = LookupItem & {
  name?: string;
  displayName?: string | null;
};

type GovernmentRepresentative = LookupItem & {
  name?: string;
  displayName?: string | null;
  title?: string | null;
  ministryId?: number | null;
  representativeType?: string | null;
};

type Tag = LookupItem & {
  name?: string;
  displayName?: string | null;
  visibility?: 'global' | 'team';
  teamNames?: string[];
  teamIds?: number[];
};

/** Ministry list item from admin API (includes joined minister display name). */
type MinistryAdminItem = MinistryLookupItem & {
  ministerGovernmentRepId?: number | null;
  ministerDisplayName?: string | null;
  ministryGroupId?: number | null;
};

type ActivityStatus = LookupItem & {
  name?: string;
  displayName?: string | null;
};

type VenuePreset = LookupItem & {
  venueName?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  provinceOrState?: string | null;
  country?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  isPinned?: boolean;
  pinnedSortOrder?: number;
};

// Form field configurations
const categoryFields: FormField[] = [
  {
    name: 'name',
    label: 'Name',
    type: 'text',
    required: true,
    placeholder: 'Enter category name',
  },
  {
    name: 'displayName',
    label: 'Display name',
    type: 'text',
    placeholder: 'Optional display name',
  },
  { name: 'sortOrder', label: 'Sort order', type: 'number', placeholder: '0' },
  {
    name: 'isActive',
    label: 'Active',
    type: 'checkbox',
    placeholder: 'Item is active',
  },
];

const cityFields: FormField[] = [
  {
    name: 'name',
    label: 'Name',
    type: 'text',
    required: true,
    placeholder: 'Enter city name',
  },
  {
    name: 'displayName',
    label: 'Display name',
    type: 'text',
    placeholder: 'Optional display name',
  },
  {
    name: 'provinceOrState',
    label: 'Province / state',
    type: 'text',
    placeholder: 'BC',
  },
  {
    name: 'country',
    label: 'Country',
    type: 'text',
    placeholder: 'Canada',
  },
  { name: 'sortOrder', label: 'Sort order', type: 'number', placeholder: '0' },
  {
    name: 'isActive',
    label: 'Active',
    type: 'checkbox',
    placeholder: 'Item is active',
  },
];

const commsMaterialFields: FormField[] = [
  {
    name: 'name',
    label: 'Name',
    type: 'text',
    required: true,
    placeholder: 'Enter material name',
  },
  {
    name: 'displayName',
    label: 'Display name',
    type: 'text',
    placeholder: 'Optional display name',
  },
  { name: 'sortOrder', label: 'Sort order', type: 'number', placeholder: '0' },
  {
    name: 'isActive',
    label: 'Active',
    type: 'checkbox',
    placeholder: 'Item is active',
  },
];

const govRepFields: FormField[] = [
  {
    name: 'name',
    label: 'Name',
    type: 'text',
    required: true,
    placeholder: 'Enter representative name',
  },
  {
    name: 'displayName',
    label: 'Display name',
    type: 'text',
    placeholder: 'Optional display name',
  },
  {
    name: 'title',
    label: 'Title',
    type: 'text',
    placeholder: 'Minister, MLA, etc.',
  },
  { name: 'sortOrder', label: 'Sort order', type: 'number', placeholder: '0' },
  {
    name: 'isActive',
    label: 'Active',
    type: 'checkbox',
    placeholder: 'Item is active',
  },
];

const tagFields: FormField[] = [
  {
    name: 'name',
    label: 'Name',
    type: 'text',
    required: true,
    placeholder: 'Enter tag name',
  },
  {
    name: 'displayName',
    label: 'Display name',
    type: 'text',
    placeholder: 'Optional display name',
  },
  { name: 'sortOrder', label: 'Sort order', type: 'number', placeholder: '0' },
  {
    name: 'isActive',
    label: 'Active',
    type: 'checkbox',
    placeholder: 'Item is active',
  },
];

/** Ministry form fields handled by {@link MinistryAdminModalForm} (minister is a combobox). */
const ministryCoreFields: FormField[] = [
  {
    name: 'name',
    label: 'Name',
    type: 'text',
    required: true,
    placeholder: 'e.g., PREM, AGRI',
  },
  {
    name: 'displayName',
    label: 'Display Name',
    type: 'text',
    required: true,
    placeholder: 'Full ministry name',
  },
  {
    name: 'abbreviation',
    label: 'Abbreviation',
    type: 'text',
    required: true,
    placeholder: 'e.g., AG',
  },
  { name: 'sortOrder', label: 'Sort Order', type: 'number', placeholder: '0' },
  {
    name: 'isActive',
    label: 'Active',
    type: 'checkbox',
    placeholder: 'Item is active',
  },
];

function stringField(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value).trim();
  }
  return '';
}

async function persistMinistryWithMinister({
  formData,
  editingItem,
}: {
  formData: Record<string, unknown>;
  editingItem: MinistryAdminItem | null;
}): Promise<void> {
  const name = stringField(formData.name);
  const displayName = stringField(formData.displayName);
  const abbreviation = stringField(formData.abbreviation);
  if (!name || !displayName || !abbreviation) {
    toast.error('Name, display name, and abbreviation are required.');
    throw new ClientValidationError();
  }

  const ministerPick = (formData._ministerSelection as
    | MinisterFormSelection
    | undefined) ?? {
    mode: 'none',
  };

  const rawGid = formData.ministryGroupId;
  const ministryGroupId =
    rawGid === '__none__' || rawGid === '' || rawGid == null
      ? null
      : Number(rawGid);

  const coreBody = {
    name,
    displayName,
    abbreviation,
    sortOrder: Number(formData.sortOrder ?? 0),
    isActive: formData.isActive !== false,
    ministryGroupId,
  };

  let ministryId: number;
  if (editingItem) {
    ministryId = editingItem.id;
  } else {
    const res = await api.post<{ success?: boolean; data?: { id: number } }>(
      '/lookups/ministries',
      {
        ...coreBody,
        ministerGovernmentRepId: null,
      }
    );
    const created = res.data?.data ?? (res.data as { id?: number });
    if (created?.id == null) {
      throw new Error('Ministry create response missing id');
    }
    ministryId = created.id;
  }

  let designatedRepId: number | null = null;

  if (ministerPick.mode === 'none') {
    designatedRepId = null;
  } else if (ministerPick.mode === 'existing') {
    designatedRepId = ministerPick.repId;
  } else {
    const trimmed = ministerPick.name.trim();
    const postRes = await api.post<{
      success?: boolean;
      data?: { id: number };
    }>('/lookups/government-representatives', {
      name: trimmed,
      displayName: trimmed,
      title: 'Minister',
      sortOrder: 0,
      isActive: true,
      representativeType: 'minister',
    });
    const newRep = postRes.data?.data ?? (postRes.data as { id?: number });
    if (newRep?.id == null) {
      throw new Error('Government representative create response missing id');
    }
    designatedRepId = newRep.id;
  }

  await api.patch(`/lookups/ministries/${ministryId}`, {
    ...coreBody,
    ministerGovernmentRepId: designatedRepId,
  });
}

const ministryGroupFields: FormField[] = [
  {
    name: 'name',
    label: 'Name',
    type: 'text',
    required: true,
    placeholder: 'e.g., Social, Resource',
  },
  { name: 'sortOrder', label: 'Sort Order', type: 'number', placeholder: '0' },
];

const statusFields: FormField[] = [
  {
    name: 'name',
    label: 'Name',
    type: 'text',
    required: true,
    placeholder: 'Enter status name',
  },
  {
    name: 'displayName',
    label: 'Display Name',
    type: 'text',
    placeholder: 'Optional display name',
  },
  { name: 'sortOrder', label: 'Sort Order', type: 'number', placeholder: '0' },
  {
    name: 'isActive',
    label: 'Active',
    type: 'checkbox',
    placeholder: 'Item is active',
  },
];

const themeFields: FormField[] = [
  {
    name: 'name',
    label: 'Name',
    type: 'text',
    required: true,
    placeholder: 'Enter theme name',
  },
  {
    name: 'displayName',
    label: 'Display Name',
    type: 'text',
    placeholder: 'Optional display name',
  },
  { name: 'sortOrder', label: 'Sort Order', type: 'number', placeholder: '0' },
  {
    name: 'isActive',
    label: 'Active',
    type: 'checkbox',
    placeholder: 'Item is active',
  },
];

const venuePresetFields: FormField[] = [
  {
    name: 'venueName',
    label: 'Venue name',
    type: 'text',
    required: true,
    placeholder: 'Enter venue name',
  },
  { name: 'sortOrder', label: 'Sort order', type: 'number', placeholder: '0' },
  {
    name: 'pinnedSortOrder',
    label: 'Pinned sort order',
    type: 'number',
    placeholder: '0',
  },
  {
    name: 'isActive',
    label: 'Active',
    type: 'checkbox',
    placeholder: 'Item is active',
  },
  {
    name: 'isPinned',
    label: 'Pinned',
    type: 'checkbox',
    placeholder: 'Show as badge',
  },
];

// Component exports
export function CategoriesAdmin() {
  return (
    <GenericLookupAdmin<Category>
      title="Categories"
      description="Manage activity categories"
      entityType="Category"
      apiEndpoint="/lookups/categories"
      queryKey={lookupQueryKeys.categories()}
      queryFn={fetchCategories}
      formFields={categoryFields}
    />
  );
}

export function CitiesAdmin() {
  return (
    <GenericLookupAdmin<City>
      title="Cities"
      description="Manage city locations"
      entityType="city"
      apiEndpoint="/lookups/cities"
      queryKey={lookupQueryKeys.cities()}
      queryFn={fetchCities}
      formFields={cityFields}
      additionalColumns={[
        {
          accessorKey: 'provinceOrState',
          header: 'Province / state',
          cell: ({ row }) => (
            <span className="text-slate-600">
              {row.original.provinceOrState || '—'}
            </span>
          ),
        },
        {
          accessorKey: 'country',
          header: 'Country',
          cell: ({ row }) => (
            <span className="text-slate-600">
              {row.original.country || '—'}
            </span>
          ),
        },
      ]}
    />
  );
}

export function CommsMaterialsAdmin() {
  return (
    <GenericLookupAdmin<CommsMaterial>
      title="Communications materials"
      description="Manage communication material types"
      entityType="communications material"
      apiEndpoint="/lookups/comms-materials"
      queryKey={lookupQueryKeys.commsMaterials()}
      queryFn={fetchCommsMaterials}
      formFields={commsMaterialFields}
    />
  );
}

export function GovernmentRepresentativesAdmin() {
  return (
    <GenericLookupAdmin<GovernmentRepresentative>
      title="Government representatives"
      description="Manage government representatives. Ministers can be assigned from the ministries section when creating or editing a ministry."
      entityType="government representative"
      apiEndpoint="/lookups/government-representatives"
      queryKey={lookupQueryKeys.governmentRepresentatives()}
      queryFn={fetchGovernmentRepresentatives}
      formFields={govRepFields}
      additionalColumns={[
        {
          accessorKey: 'title',
          header: 'Title',
          cell: ({ row }) => (
            <span className="text-slate-600">{row.original.title || '—'}</span>
          ),
        },
      ]}
    />
  );
}

export function TagsAdmin() {
  const { data: teams = [] } = useQuery({
    queryKey: lookupQueryKeys.teams(),
    queryFn: fetchTeams,
  });

  const teamOptions = [
    { value: NONE_SELECT_VALUE, label: 'Global (no team restriction)' },
    ...teams.map((t) => ({
      value: String(t.id),
      label: t.displayName ?? t.name ?? String(t.id),
    })),
  ];

  const tagFormFields: FormField[] = [
    ...tagFields,
    {
      name: 'teamId',
      label: 'Visible to',
      type: 'select' as const,
      options: teamOptions,
      placeholder: 'Global (no team restriction)',
    },
  ];

  return (
    <GenericLookupAdmin<Tag>
      title="Tags"
      description="Manage activity tags"
      entityType="tag"
      apiEndpoint="/lookups/tags"
      queryKey={lookupQueryKeys.tagsAdmin()}
      queryFn={fetchAllTags}
      softDelete
      additionalInvalidateKeys={[lookupQueryKeys.tags()]}
      formFields={tagFormFields}
      getItemName={(item) => item.name ?? item.displayName ?? String(item.id)}
      getInitialData={(item) => ({
        ...item,
        teamId:
          item.teamIds?.[0] != null
            ? String(item.teamIds[0])
            : NONE_SELECT_VALUE,
      })}
      transformSubmitData={(data) => ({
        ...data,
        teamId:
          data.teamId == null || data.teamId === NONE_SELECT_VALUE
            ? null
            : Number(data.teamId),
      })}
      additionalColumns={[
        {
          accessorKey: 'visibility',
          header: 'Visibility',
          cell: ({ row }) => {
            const { visibility, teamNames } = row.original;
            if (visibility === 'team') {
              const label =
                teamNames && teamNames.length > 0
                  ? teamNames.join(', ')
                  : 'Team (unassigned)';
              return <span>{label}</span>;
            }
            return <span className="text-slate-500">Global</span>;
          },
        },
      ]}
    />
  );
}

export function MinistryGroupsAdmin() {
  return (
    <GenericLookupAdmin<MinistryGroupListItem>
      title="Ministry groups"
      description="Named groups for activity “shared with teams” shortcuts. Assign ministries to a group in the ministries section."
      entityType="ministry group"
      apiEndpoint="/lookups/ministry-groups"
      queryKey={lookupQueryKeys.ministryGroups()}
      queryFn={fetchMinistryGroups}
      formFields={ministryGroupFields}
      showStatusFilter={false}
      additionalInvalidateKeys={[lookupQueryKeys.activityTeamSharing()]}
      getItemName={(item) => item.name ?? String(item.id)}
    />
  );
}

export function MinistriesAdmin() {
  const queryClient = useQueryClient();
  const groupsQuery = useQuery({
    queryKey: lookupQueryKeys.ministryGroups(),
    queryFn: fetchMinistryGroups,
  });
  const repsQuery = useQuery({
    queryKey: lookupQueryKeys.governmentRepresentatives(),
    queryFn: fetchGovernmentRepresentatives,
  });

  const sharingGroupSelectOptions = useMemo(() => {
    return [
      { value: '__none__', label: 'None' },
      ...(groupsQuery.data ?? []).map((g) => ({
        value: String(g.id),
        label: g.name,
      })),
    ];
  }, [groupsQuery.data]);

  const ministryFields = useMemo((): FormField[] => {
    return [
      ...ministryCoreFields,
      {
        name: 'ministryGroupId',
        label: 'Sharing group',
        type: 'select',
        options: sharingGroupSelectOptions,
      },
    ];
  }, [sharingGroupSelectOptions]);

  const ministerRepOptions: FreeformComboboxOption[] = useMemo(() => {
    const reps = filterMinisterPickerReps(repsQuery.data ?? []);
    return reps.map((r) => ({
      value: String(r.id),
      label: r.displayName || r.name,
    }));
  }, [repsQuery.data]);

  const submitOverride = useCallback(
    async ({
      formData,
      editingItem,
    }: {
      formData: Record<string, unknown>;
      editingItem: MinistryAdminItem | null;
    }) => {
      await persistMinistryWithMinister({
        formData,
        editingItem,
      });
      await queryClient.invalidateQueries({
        queryKey: lookupQueryKeys.ministries(),
      });
      await queryClient.invalidateQueries({
        queryKey: lookupQueryKeys.governmentRepresentatives(),
      });
      await queryClient.invalidateQueries({
        queryKey: lookupQueryKeys.activityTeamSharing(),
      });
    },
    [queryClient]
  );

  const ministryExtraColumns = useMemo(
    (): ColumnDef<MinistryAdminItem>[] => [
      {
        accessorKey: 'abbreviation',
        header: 'Abbreviation',
        cell: ({ row }) => (
          <span className="font-mono text-sm text-slate-600">
            {row.original.abbreviation || '—'}
          </span>
        ),
      },
      {
        accessorKey: 'ministerDisplayName',
        header: 'Minister',
        cell: ({ row }) => (
          <span className="text-slate-600">
            {row.original.ministerDisplayName || '—'}
          </span>
        ),
      },
      {
        accessorKey: 'ministryGroupId',
        header: 'Group',
        cell: ({ row }) => {
          const gid = row.original.ministryGroupId;
          const name =
            gid == null
              ? null
              : (groupsQuery.data ?? []).find((g) => g.id === gid)?.name;
          return <span className="text-slate-600">{name ?? '—'}</span>;
        },
      },
    ],
    [groupsQuery.data]
  );

  return (
    <GenericLookupAdmin<MinistryAdminItem>
      title="Ministries"
      description="Manage BC government ministries. Choose a minister from existing government representatives or create a new one; the list below stays in sync."
      entityType="ministry"
      apiEndpoint="/lookups/ministries"
      queryKey={lookupQueryKeys.ministries()}
      queryFn={fetchMinistries}
      formFields={ministryFields}
      additionalColumns={ministryExtraColumns}
      additionalInvalidateKeys={[lookupQueryKeys.activityTeamSharing()]}
      getItemName={(item) => item.displayName ?? item.name ?? String(item.id)}
      renderModalContent={(props) => (
        <MinistryAdminModalForm
          {...props}
          sharingGroupSelectOptions={sharingGroupSelectOptions}
          ministerRepOptions={ministerRepOptions}
        />
      )}
      submitOverride={submitOverride}
    />
  );
}

export function ActivityStatusesAdmin() {
  return (
    <GenericLookupAdmin<ActivityStatus>
      title="Activity statuses"
      description="Manage activity status types"
      entityType="activity status"
      apiEndpoint="/lookups/activity-statuses"
      queryKey={lookupQueryKeys.activityStatuses()}
      queryFn={fetchActivityStatuses}
      formFields={statusFields}
    />
  );
}

export function ThemesAdmin() {
  return (
    <GenericLookupAdmin<ThemeLookupItem>
      title="Themes"
      description="Manage activity themes"
      entityType="theme"
      apiEndpoint="/lookups/themes"
      queryKey={lookupQueryKeys.themes()}
      queryFn={fetchThemes}
      formFields={themeFields}
      getItemName={(item) => item.displayName ?? item.label ?? String(item.id)}
    />
  );
}

const venuePresetAdditionalColumns: ColumnDef<VenuePreset>[] = [
  {
    accessorKey: 'addressLine1',
    header: 'Street Address',
    cell: ({ row }) => (
      <span className="text-slate-600">{row.original.addressLine1 || '—'}</span>
    ),
  },
  {
    accessorKey: 'addressLine2',
    header: 'Line 2',
    cell: ({ row }) => (
      <span className="text-slate-600">{row.original.addressLine2 || '—'}</span>
    ),
  },
  {
    accessorKey: 'city',
    header: 'City',
    cell: ({ row }) => (
      <span className="text-slate-600">{row.original.city || '—'}</span>
    ),
  },
  {
    accessorKey: 'isPinned',
    header: 'Pinned',
    cell: ({ row }) => (
      <span className="text-slate-600">
        {row.original.isPinned ? 'Yes' : '—'}
      </span>
    ),
  },
];

export function VenuePresetsAdmin() {
  return (
    <GenericLookupAdmin<VenuePreset>
      title="Venue presets"
      description="Manage venue presets for the activity form"
      entityType="venue preset"
      apiEndpoint="/lookups/venue-presets"
      queryKey={lookupQueryKeys.venuePresets()}
      queryFn={fetchVenuePresets as () => Promise<VenuePreset[]>}
      formFields={venuePresetFields}
      additionalColumns={venuePresetAdditionalColumns}
      getItemName={(item) =>
        (item.venueName as string) || String(item.id ?? '')
      }
      renderModalContent={({ initialData, onChange, isSubmitting }) => (
        <VenuePresetForm
          initialData={initialData}
          onChange={onChange}
          isSubmitting={isSubmitting}
        />
      )}
    />
  );
}
