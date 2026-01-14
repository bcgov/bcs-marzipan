import { useQuery } from '@tanstack/react-query';
import {
  fetchCategories,
  fetchCities,
  fetchCommsMaterials,
  fetchGovernmentRepresentatives,
  fetchTags,
  fetchMinistries,
  fetchActivityStatuses,
  fetchThemes,
} from '../api/lookupsApi';
import { Spinner, Dropdown, Option, Link } from '@fluentui/react-components';
import { ColumnDef } from '@tanstack/react-table';
import { GenericDataTable } from '../components/Table/GenericDataTable';
import { useMemo, useState } from 'react';

type Category = {
  id: number;
  name: string;
  displayName: string | null;
  sortOrder: number;
  isActive: boolean;
};

type City = {
  id: number;
  name: string;
  displayName: string | null;
  province: string | null;
  sortOrder: number;
  isActive: boolean;
};

type CommsMaterial = {
  id: number;
  name: string;
  displayName: string | null;
  sortOrder: number;
  isActive: boolean;
};

type GovernmentRepresentative = {
  id: number;
  name: string;
  displayName: string | null;
  title: string | null;
  sortOrder: number;
  isActive: boolean;
};

type Tag = {
  id: string;
  key: string | null;
  displayName: string | null;
  sortOrder: number;
  isActive: boolean;
};

type Ministry = {
  id: string;
  displayName: string | null;
  abbreviation: string | null;
  ministerName: string | null;
  sortOrder: number;
  isActive: boolean;
};

type ActivityStatus = {
  id: number;
  name: string;
  displayName: string | null;
  sortOrder: number;
  isActive: boolean;
};

type Theme = {
  id: string;
  key: string | null;
  displayName: string | null;
  sortOrder: number;
  isActive: boolean;
};

const LookupSection = ({
  title,
  data,
  columns,
  isLoading,
  error,
  activeFilter,
  setActiveFilter,
}: {
  title: string;
  data: any[];
  columns: ColumnDef<any>[];
  isLoading: boolean;
  error: any;
  activeFilter: string;
  setActiveFilter: (value: string) => void;
}) => {
  const filteredData = useMemo(() => {
    if (!data) return [];
    if (activeFilter === 'active') return data.filter((item) => item.isActive);
    if (activeFilter === 'inactive')
      return data.filter((item) => !item.isActive);
    return data;
  }, [data, activeFilter]);

  return (
    <div style={{ marginBottom: '48px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '16px',
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: 600,
            color: '#333',
          }}
        >
          {title}
        </h2>
      </div>

      <div
        style={{
          backgroundColor: '#fff',
          padding: '16px',
          borderRadius: '4px',
          border: '1px solid #e0e0e0',
        }}
      >
        <div style={{ marginBottom: '16px', maxWidth: '200px' }}>
          <Dropdown
            placeholder="Filter by status"
            value={
              activeFilter === 'all'
                ? 'All'
                : activeFilter === 'active'
                  ? 'Active'
                  : 'Inactive'
            }
            onOptionSelect={(_, data) =>
              setActiveFilter(data.optionValue as string)
            }
          >
            <Option value="all">All</Option>
            <Option value="active">Active</Option>
            <Option value="inactive">Inactive</Option>
          </Dropdown>
        </div>

        {isLoading && <Spinner label={`Loading ${title.toLowerCase()}...`} />}
        {error && (
          <div style={{ color: 'red' }}>
            Error loading {title.toLowerCase()}
          </div>
        )}
        {filteredData && filteredData.length > 0 && (
          <GenericDataTable data={filteredData} columns={columns as any} />
        )}
        {filteredData && filteredData.length === 0 && (
          <div>No {title.toLowerCase()} found</div>
        )}
      </div>
    </div>
  );
};

export const Settings = () => {
  const [categoriesFilter, setCategoriesFilter] = useState('all');
  const [citiesFilter, setCitiesFilter] = useState('all');
  const [commsMaterialsFilter, setCommsMaterialsFilter] = useState('all');
  const [govRepsFilter, setGovRepsFilter] = useState('all');
  const [tagsFilter, setTagsFilter] = useState('all');
  const [ministriesFilter, setMinistriesFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [themesFilter, setThemesFilter] = useState('all');

  const {
    data: categories,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const {
    data: cities,
    isLoading: citiesLoading,
    error: citiesError,
  } = useQuery({
    queryKey: ['cities'],
    queryFn: fetchCities,
  });

  const {
    data: commsMaterials,
    isLoading: commsMaterialsLoading,
    error: commsMaterialsError,
  } = useQuery({
    queryKey: ['commsMaterials'],
    queryFn: fetchCommsMaterials,
  });

  const {
    data: governmentRepresentatives,
    isLoading: govRepsLoading,
    error: govRepsError,
  } = useQuery({
    queryKey: ['governmentRepresentatives'],
    queryFn: fetchGovernmentRepresentatives,
  });

  const {
    data: tags,
    isLoading: tagsLoading,
    error: tagsError,
  } = useQuery({
    queryKey: ['tags'],
    queryFn: fetchTags,
  });

  const {
    data: ministries,
    isLoading: ministriesLoading,
    error: ministriesError,
  } = useQuery({
    queryKey: ['ministries'],
    queryFn: fetchMinistries,
  });

  const {
    data: statuses,
    isLoading: statusLoading,
    error: statusError,
  } = useQuery({
    queryKey: ['activityStatuses'],
    queryFn: fetchActivityStatuses,
  });

  const {
    data: themes,
    isLoading: themesLoading,
    error: themesError,
  } = useQuery({
    queryKey: ['themes'],
    queryFn: fetchThemes,
  });

  const categoriesColumns = useMemo<ColumnDef<Category>[]>(
    () => [
      { accessorKey: 'id', header: 'ID', enableSorting: true },
      { accessorKey: 'name', header: 'Name', enableSorting: true },
      {
        accessorKey: 'displayName',
        header: 'Display Name',
        cell: (info) => info.getValue() || '-',
        enableSorting: true,
      },
      { accessorKey: 'sortOrder', header: 'Sort Order', enableSorting: true },
    ],
    []
  );

  const citiesColumns = useMemo<ColumnDef<City>[]>(
    () => [
      { accessorKey: 'id', header: 'ID', enableSorting: true },
      { accessorKey: 'name', header: 'Name', enableSorting: true },
      {
        accessorKey: 'displayName',
        header: 'Display Name',
        cell: (info) => info.getValue() || '-',
        enableSorting: true,
      },
      {
        accessorKey: 'province',
        header: 'Province',
        cell: (info) => info.getValue() || '-',
        enableSorting: true,
      },
      { accessorKey: 'sortOrder', header: 'Sort Order', enableSorting: true },
    ],
    []
  );

  const commsMaterialsColumns = useMemo<ColumnDef<CommsMaterial>[]>(
    () => [
      { accessorKey: 'id', header: 'ID', enableSorting: true },
      { accessorKey: 'name', header: 'Name', enableSorting: true },
      {
        accessorKey: 'displayName',
        header: 'Display Name',
        cell: (info) => info.getValue() || '-',
        enableSorting: true,
      },
      { accessorKey: 'sortOrder', header: 'Sort Order', enableSorting: true },
    ],
    []
  );

  const govRepsColumns = useMemo<ColumnDef<GovernmentRepresentative>[]>(
    () => [
      { accessorKey: 'id', header: 'ID', enableSorting: true },
      { accessorKey: 'name', header: 'Name', enableSorting: true },
      {
        accessorKey: 'displayName',
        header: 'Display Name',
        cell: (info) => info.getValue() || '-',
        enableSorting: true,
      },
      {
        accessorKey: 'title',
        header: 'Title',
        cell: (info) => info.getValue() || '-',
        enableSorting: true,
      },
      { accessorKey: 'sortOrder', header: 'Sort Order', enableSorting: true },
    ],
    []
  );

  const tagsColumns = useMemo<ColumnDef<Tag>[]>(
    () => [
      { accessorKey: 'id', header: 'ID', enableSorting: true },
      {
        accessorKey: 'key',
        header: 'Key',
        cell: (info) => info.getValue() || '-',
        enableSorting: true,
      },
      {
        accessorKey: 'displayName',
        header: 'Display Name',
        cell: (info) => info.getValue() || '-',
        enableSorting: true,
      },
      { accessorKey: 'sortOrder', header: 'Sort Order', enableSorting: true },
    ],
    []
  );

  const ministriesColumns = useMemo<ColumnDef<Ministry>[]>(
    () => [
      { accessorKey: 'id', header: 'ID', enableSorting: true },
      {
        accessorKey: 'displayName',
        header: 'Display Name',
        cell: (info) => info.getValue() || '-',
        enableSorting: true,
      },
      {
        accessorKey: 'abbreviation',
        header: 'Abbreviation',
        cell: (info) => info.getValue() || '-',
        enableSorting: true,
      },
      {
        accessorKey: 'ministerName',
        header: 'Minister Name',
        cell: (info) => info.getValue() || '-',
        enableSorting: true,
      },
      { accessorKey: 'sortOrder', header: 'Sort Order', enableSorting: true },
    ],
    []
  );

  const statusColumns = useMemo<ColumnDef<ActivityStatus>[]>(
    () => [
      { accessorKey: 'id', header: 'ID', enableSorting: true },
      { accessorKey: 'name', header: 'Name', enableSorting: true },
      {
        accessorKey: 'displayName',
        header: 'Display Name',
        cell: (info) => info.getValue() || '-',
        enableSorting: true,
      },
      { accessorKey: 'sortOrder', header: 'Sort Order', enableSorting: true },
    ],
    []
  );

  const themesColumns = useMemo<ColumnDef<Theme>[]>(
    () => [
      { accessorKey: 'id', header: 'ID', enableSorting: true },
      {
        accessorKey: 'key',
        header: 'Key',
        cell: (info) => info.getValue() || '-',
        enableSorting: true,
      },
      {
        accessorKey: 'displayName',
        header: 'Display Name',
        cell: (info) => info.getValue() || '-',
        enableSorting: true,
      },
      { accessorKey: 'sortOrder', header: 'Sort Order', enableSorting: true },
    ],
    []
  );

  return (
    <div
      style={{
        padding: '24px',
        backgroundColor: '#f5f5f5',
        minHeight: '100vh',
      }}
    >
      <h1
        style={{
          margin: '0 0 8px 0',
          fontSize: '20px',
          fontWeight: 400,
          color: '#666',
          letterSpacing: '0.5px',
        }}
      >
        Corporate Calendar Data Administration
      </h1>

      <div style={{ marginBottom: '32px' }}>
        <Link
          href="/manage-users"
          style={{
            display: 'inline-block',
            color: '#0078d4',
            textDecoration: 'underline',
            marginRight: '16px',
            fontSize: '14px',
          }}
        >
          Manage Users
        </Link>
        <Link
          href="/transfer-activities"
          style={{
            display: 'inline-block',
            color: '#0078d4',
            textDecoration: 'underline',
            fontSize: '14px',
          }}
        >
          Transfer Activities
        </Link>
      </div>

      <LookupSection
        title="Categories"
        data={categories || []}
        columns={categoriesColumns}
        isLoading={categoriesLoading}
        error={categoriesError}
        activeFilter={categoriesFilter}
        setActiveFilter={setCategoriesFilter}
      />

      <LookupSection
        title="Cities"
        data={cities || []}
        columns={citiesColumns}
        isLoading={citiesLoading}
        error={citiesError}
        activeFilter={citiesFilter}
        setActiveFilter={setCitiesFilter}
      />

      <LookupSection
        title="Communication Materials"
        data={commsMaterials || []}
        columns={commsMaterialsColumns}
        isLoading={commsMaterialsLoading}
        error={commsMaterialsError}
        activeFilter={commsMaterialsFilter}
        setActiveFilter={setCommsMaterialsFilter}
      />

      <LookupSection
        title="Government Representatives"
        data={governmentRepresentatives || []}
        columns={govRepsColumns}
        isLoading={govRepsLoading}
        error={govRepsError}
        activeFilter={govRepsFilter}
        setActiveFilter={setGovRepsFilter}
      />

      <LookupSection
        title="HQ Tags"
        data={tags || []}
        columns={tagsColumns}
        isLoading={tagsLoading}
        error={tagsError}
        activeFilter={tagsFilter}
        setActiveFilter={setTagsFilter}
      />

      <LookupSection
        title="Ministries"
        data={ministries || []}
        columns={ministriesColumns}
        isLoading={ministriesLoading}
        error={ministriesError}
        activeFilter={ministriesFilter}
        setActiveFilter={setMinistriesFilter}
      />

      <LookupSection
        title="Status"
        data={statuses || []}
        columns={statusColumns}
        isLoading={statusLoading}
        error={statusError}
        activeFilter={statusFilter}
        setActiveFilter={setStatusFilter}
      />

      <LookupSection
        title="Themes"
        data={themes || []}
        columns={themesColumns}
        isLoading={themesLoading}
        error={themesError}
        activeFilter={themesFilter}
        setActiveFilter={setThemesFilter}
      />
    </div>
  );
};
