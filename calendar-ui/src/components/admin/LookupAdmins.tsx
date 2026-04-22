/**
 * All Admin Lookup Components
 *
 * This file provides ready-to-use admin components for all lookup types
 * using the GenericLookupAdmin template.
 */

import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';

import {
  fetchActivityStatuses,
  fetchAllTags,
  fetchCategories,
  fetchCities,
  fetchCommsMaterials,
  fetchGovernmentRepresentatives,
  fetchMinistries,
  fetchThemes,
  fetchVenuePresets,
  type LookupItem,
  type MinistryLookupItem,
  type ThemeLookupItem,
} from '@/api/lookupsApi';
import { fetchTeams } from '@/api/usersApi';
import { lookupQueryKeys } from '@/lib/lookupQueryKeys';

import { NONE_SELECT_VALUE } from '.';
import { GenericLookupAdmin } from './GenericLookupAdmin';
import { FormField } from './LookupForm';
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
};

type Tag = LookupItem & {
  name?: string;
  displayName?: string | null;
  visibility?: 'global' | 'team';
  teamNames?: string[];
  teamIds?: number[];
};

/** Ministry list item; API may include ministerName on list responses */
type MinistryAdminItem = MinistryLookupItem & {
  ministerName?: string | null;
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
    label: 'Display Name',
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
  { name: 'sortOrder', label: 'Sort Order', type: 'number', placeholder: '0' },
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
    label: 'Display Name',
    type: 'text',
    placeholder: 'Optional display name',
  },
  {
    name: 'title',
    label: 'Title',
    type: 'text',
    placeholder: 'Minister, MLA, etc.',
  },
  { name: 'sortOrder', label: 'Sort Order', type: 'number', placeholder: '0' },
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

const ministryFields: FormField[] = [
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
  {
    name: 'ministerName',
    label: 'Minister Name',
    type: 'text',
    placeholder: 'Current minister',
  },
  { name: 'sortOrder', label: 'Sort Order', type: 'number', placeholder: '0' },
  {
    name: 'isActive',
    label: 'Active',
    type: 'checkbox',
    placeholder: 'Item is active',
  },
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
    label: 'Venue Name',
    type: 'text',
    required: true,
    placeholder: 'Enter venue name',
  },
  { name: 'sortOrder', label: 'Sort Order', type: 'number', placeholder: '0' },
  {
    name: 'pinnedSortOrder',
    label: 'Pinned Sort Order',
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
      queryFn={fetchCategories as () => Promise<Category[]>}
      formFields={categoryFields}
    />
  );
}

export function CitiesAdmin() {
  return (
    <GenericLookupAdmin<City>
      title="Cities"
      description="Manage city locations"
      entityType="City"
      apiEndpoint="/lookups/cities"
      queryKey={lookupQueryKeys.cities()}
      queryFn={fetchCities as () => Promise<City[]>}
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
      title="Communications Materials"
      description="Manage communication material types"
      entityType="Communications Material"
      apiEndpoint="/lookups/comms-materials"
      queryKey={lookupQueryKeys.commsMaterials()}
      queryFn={fetchCommsMaterials as () => Promise<CommsMaterial[]>}
      formFields={commsMaterialFields}
    />
  );
}

export function GovernmentRepresentativesAdmin() {
  return (
    <GenericLookupAdmin<GovernmentRepresentative>
      title="Government Representatives"
      description="Manage government representatives"
      entityType="Government Representative"
      apiEndpoint="/lookups/government-representatives"
      queryKey={lookupQueryKeys.governmentRepresentatives()}
      queryFn={
        fetchGovernmentRepresentatives as () => Promise<
          GovernmentRepresentative[]
        >
      }
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
    queryKey: ['teams'],
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
      entityType="Tag"
      apiEndpoint="/lookups/tags"
      queryKey={lookupQueryKeys.tagsAdmin()}
      queryFn={fetchAllTags as () => Promise<Tag[]>}
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
        } as ColumnDef<Tag>,
      ]}
    />
  );
}

export function MinistriesAdmin() {
  return (
    <GenericLookupAdmin<MinistryAdminItem>
      title="Ministries"
      description="Manage BC government ministries"
      entityType="Ministry"
      apiEndpoint="/lookups/ministries"
      queryKey={lookupQueryKeys.ministries()}
      queryFn={fetchMinistries as () => Promise<MinistryAdminItem[]>}
      formFields={ministryFields}
      additionalColumns={[
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
          accessorKey: 'ministerName',
          header: 'Minister',
          cell: ({ row }) => (
            <span className="text-slate-600">
              {row.original.ministerName || '—'}
            </span>
          ),
        },
      ]}
      getItemName={(item) => item.displayName ?? item.name ?? String(item.id)}
    />
  );
}

export function ActivityStatusesAdmin() {
  return (
    <GenericLookupAdmin<ActivityStatus>
      title="Activity Statuses"
      description="Manage activity status types"
      entityType="Activity Status"
      apiEndpoint="/lookups/activity-statuses"
      queryKey={lookupQueryKeys.activityStatuses()}
      queryFn={fetchActivityStatuses as () => Promise<ActivityStatus[]>}
      formFields={statusFields}
    />
  );
}

export function ThemesAdmin() {
  return (
    <GenericLookupAdmin<ThemeLookupItem>
      title="Themes"
      description="Manage activity themes"
      entityType="Theme"
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
      title="Venue Presets"
      description="Manage venue presets for the activity form"
      entityType="Venue Preset"
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
