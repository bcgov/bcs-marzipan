/**
 * All Admin Lookup Components
 *
 * This file provides ready-to-use admin components for all lookup types
 * using the GenericLookupAdmin template.
 */

import type { ColumnDef } from '@tanstack/react-table';

import {
  fetchActivityStatuses,
  fetchCategories,
  fetchCities,
  fetchCommsMaterials,
  fetchGovernmentRepresentatives,
  fetchMinistries,
  fetchTags,
  fetchThemes,
  fetchVenueQuickPicks,
  type LookupItem,
  type MinistryLookupItem,
  type ThemeLookupItem,
} from '@/api/lookupsApi';

import { GenericLookupAdmin } from './GenericLookupAdmin';
import { FormField } from './LookupForm';
import { VenueQuickPickForm } from './VenueQuickPickForm';

// Type definitions - these extend the base LookupItem from the API
type Category = LookupItem & {
  name?: string;
  displayName?: string | null;
};

type City = LookupItem & {
  name?: string;
  displayName?: string | null;
  province?: string | null;
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
};

/** Ministry list item; API may include ministerName on list responses */
type MinistryAdminItem = MinistryLookupItem & {
  ministerName?: string | null;
};

type ActivityStatus = LookupItem & {
  name?: string;
  displayName?: string | null;
};

type VenueQuickPick = LookupItem & {
  venueName?: string | null;
  street?: string | null;
  city?: string | null;
  provinceOrState?: string | null;
  country?: string | null;
  sortOrder?: number;
  isActive?: boolean;
};

type VenueQuickPick = LookupItem & {
  venueName?: string | null;
  street?: string | null;
  city?: string | null;
  provinceOrState?: string | null;
  country?: string | null;
  sortOrder?: number;
  isActive?: boolean;
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
  { name: 'province', label: 'Province', type: 'text', placeholder: 'BC' },
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

const venueQuickPickFields: FormField[] = [
  {
    name: 'venueName',
    label: 'Venue Name',
    type: 'text',
    required: true,
    placeholder: 'Enter venue name',
  },
  { name: 'sortOrder', label: 'Sort Order', type: 'number', placeholder: '0' },
  {
    name: 'isActive',
    label: 'Active',
    type: 'checkbox',
    placeholder: 'Item is active',
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
      queryKey="categories"
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
      queryKey="cities"
      queryFn={fetchCities as () => Promise<City[]>}
      formFields={cityFields}
      additionalColumns={[
        {
          accessorKey: 'province',
          header: 'Province',
          cell: ({ row }) => (
            <span className="text-slate-600">
              {row.original.province || '—'}
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
      queryKey="commsMaterials"
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
      queryKey="governmentRepresentatives"
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
  return (
    <GenericLookupAdmin<Tag>
      title="Tags"
      description="Manage activity tags"
      entityType="Tag"
      apiEndpoint="/lookups/tags"
      queryKey="tags"
      queryFn={fetchTags as () => Promise<Tag[]>}
      formFields={tagFields}
      getItemName={(item) => item.name ?? item.displayName ?? String(item.id)}
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
      queryKey="ministries"
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
      queryKey="activityStatuses"
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
      queryKey="themes"
      queryFn={fetchThemes}
      formFields={themeFields}
      getItemName={(item) => item.displayName ?? item.label ?? String(item.id)}
    />
  );
}

const venueQuickPicksAdditionalColumns: ColumnDef<VenueQuickPick>[] = [
  {
    accessorKey: 'street',
    header: 'Street Address',
    cell: ({ row }) => (
      <span className="text-slate-600">{row.original.street || '—'}</span>
    ),
  },
  {
    accessorKey: 'city',
    header: 'City',
    cell: ({ row }) => (
      <span className="text-slate-600">{row.original.city || '—'}</span>
    ),
  },
];

export function VenueQuickPicksAdmin() {
  return (
    <GenericLookupAdmin<VenueQuickPick>
      title="Venue Quick Picks"
      description="Manage venue quick picks for the activity form"
      entityType="Venue Quick Pick"
      apiEndpoint="/lookups/venue-quick-picks"
      queryKey="venueQuickPicks"
      queryFn={fetchVenueQuickPicks as () => Promise<VenueQuickPick[]>}
      formFields={venueQuickPickFields}
      additionalColumns={venueQuickPicksAdditionalColumns}
      getItemName={(item) =>
        (item.venueName as string) || String(item.id ?? '')
      }
      renderModalContent={({ initialData, onChange, isSubmitting }) => (
        <VenueQuickPickForm
          initialData={initialData}
          onChange={onChange}
          isSubmitting={isSubmitting}
        />
      )}
    />
  );
}

const venueQuickPicksAdditionalColumns: ColumnDef<VenueQuickPick>[] = [
  {
    accessorKey: 'street',
    header: 'Street Address',
    cell: ({ row }) => (
      <span className="text-slate-600">{row.original.street || '—'}</span>
    ),
  },
  {
    accessorKey: 'city',
    header: 'City',
    cell: ({ row }) => (
      <span className="text-slate-600">{row.original.city || '—'}</span>
    ),
  },
];

export function VenueQuickPicksAdmin() {
  return (
    <GenericLookupAdmin<VenueQuickPick>
      title="Venue Quick Picks"
      description="Manage venue quick picks for the activity form"
      entityType="Venue Quick Pick"
      apiEndpoint="/lookups/venue-quick-picks"
      queryKey="venueQuickPicks"
      queryFn={fetchVenueQuickPicks as () => Promise<VenueQuickPick[]>}
      formFields={venueQuickPickFields}
      additionalColumns={venueQuickPicksAdditionalColumns}
      getItemName={(item) =>
        (item.venueName as string) || String(item.id ?? '')
      }
      renderModalContent={({ initialData, onChange, isSubmitting }) => (
        <VenueQuickPickForm
          initialData={initialData}
          onChange={onChange}
          isSubmitting={isSubmitting}
        />
      )}
    />
  );
}
