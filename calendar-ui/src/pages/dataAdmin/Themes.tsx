import { useQuery } from '@tanstack/react-query';
import { fetchThemes } from '../../api/lookupsApi';
import { Spinner, Dropdown, Option } from '@fluentui/react-components';
import { Link } from 'react-router-dom';
import { ChevronLeft24Regular } from '@fluentui/react-icons';
import { ColumnDef } from '@tanstack/react-table';
import { GenericDataTable } from '../../components/Table/GenericDataTable';
import { useMemo, useState } from 'react';

type Theme = {
  id: string;
  key: string | null;
  displayName: string | null;
  sortOrder: number;
  isActive: boolean;
};

export const Themes = () => {
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const {
    data: themes,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['themes'],
    queryFn: fetchThemes,
  });

  const filteredData = useMemo(() => {
    if (!themes) return [];
    if (activeFilter === 'active') return themes.filter((t) => t.isActive);
    if (activeFilter === 'inactive') return themes.filter((t) => !t.isActive);
    return themes;
  }, [themes, activeFilter]);

  const columns = useMemo<ColumnDef<Theme>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        enableSorting: true,
      },
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
      {
        accessorKey: 'sortOrder',
        header: 'Sort Order',
        enableSorting: true,
      },
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

      <h2
        style={{
          margin: '0 0 16px 0',
          fontSize: '16px',
          fontWeight: 600,
          color: '#333',
        }}
      >
        Themes
      </h2>

      <Link
        to="/administration"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          color: '#0078d4',
          textDecoration: 'none',
          marginBottom: '24px',
          fontSize: '14px',
        }}
      >
        <ChevronLeft24Regular style={{ marginRight: '4px' }} />
        Back to administration
      </Link>

      <div
        style={{ backgroundColor: '#fff', padding: '24px', marginTop: '16px' }}
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
        {isLoading && <Spinner label="Loading themes..." />}
        {error && <div style={{ color: 'red' }}>Error loading themes</div>}
        {filteredData && filteredData.length > 0 && (
          <GenericDataTable data={filteredData} columns={columns as any} />
        )}
        {filteredData && filteredData.length === 0 && (
          <div>No themes found</div>
        )}
      </div>
    </div>
  );
};
