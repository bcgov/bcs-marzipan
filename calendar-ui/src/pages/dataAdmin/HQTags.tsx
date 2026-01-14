import { useQuery } from '@tanstack/react-query';
import { fetchTags } from '../../api/lookupsApi';
import { Spinner, Dropdown, Option } from '@fluentui/react-components';
import { Link } from 'react-router-dom';
import { ChevronLeft24Regular } from '@fluentui/react-icons';
import { ColumnDef } from '@tanstack/react-table';
import { GenericDataTable } from '../../components/Table/GenericDataTable';
import { useMemo, useState } from 'react';

type Tag = {
  id: string;
  key: string | null;
  displayName: string | null;
  sortOrder: number;
  isActive: boolean;
};

export const HQTags = () => {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  
  const {
    data: tags,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['tags'],
    queryFn: fetchTags,
  });

  const filteredData = useMemo(() => {
    if (!tags) return [];
    if (activeFilter === 'active') return tags.filter(t => t.isActive);
    if (activeFilter === 'inactive') return tags.filter(t => !t.isActive);
    return tags;
  }, [tags, activeFilter]);

  const columns = useMemo<ColumnDef<Tag>[]>(
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
        HQ Tags
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
            value={activeFilter === 'all' ? 'All' : activeFilter === 'active' ? 'Active' : 'Inactive'}
            onOptionSelect={(_, data) => setActiveFilter(data.optionValue as string)}
          >
            <Option value="all">All</Option>
            <Option value="active">Active</Option>
            <Option value="inactive">Inactive</Option>
          </Dropdown>
        </div>
        {isLoading && <Spinner label="Loading HQ tags..." />}
        {error && <div style={{ color: 'red' }}>Error loading HQ tags</div>}
        {filteredData && filteredData.length > 0 && (
          <GenericDataTable data={filteredData} columns={columns} />
        )}
        {filteredData && filteredData.length === 0 && <div>No HQ tags found</div>}
      </div>
    </div>
  );
};
