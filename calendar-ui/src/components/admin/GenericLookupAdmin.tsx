import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { Edit, Trash2, XCircle } from 'lucide-react';
import api from '@/api/axios';
import {
  AdminSection,
  AdminModal,
  LookupForm,
  FormField,
} from '@/components/admin';
import { GenericDataTable } from '@/components/Table/GenericDataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface BaseLookupItem {
  id: number | string;
  name?: string;
  key?: string;
  displayName?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  [key: string]: any; // Allow additional properties
}

interface GenericLookupAdminProps<T extends BaseLookupItem> {
  title: string;
  description: string;
  entityType: string;
  apiEndpoint: string;
  queryKey: string;
  queryFn: () => Promise<T[]>;
  formFields: FormField[];
  additionalColumns?: ColumnDef<T>[];
  getItemName?: (item: T) => string;
}

/**
 * GenericLookupAdmin - Template component for admin lookup sections
 *
 * Provides a complete admin interface for CRUD operations on lookup data.
 * Can be used for Categories, Cities, Tags, Ministries, etc.
 */
export function GenericLookupAdmin<T extends BaseLookupItem>({
  title,
  description,
  entityType,
  apiEndpoint,
  queryKey,
  queryFn,
  formFields,
  additionalColumns = [],
  getItemName = (item) => item.name || item.key || String(item.id),
}: GenericLookupAdminProps<T>) {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<T | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});

  const { data, isLoading, error } = useQuery({
    queryKey: [queryKey],
    queryFn: queryFn,
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<T>) => {
      const response = await api.post(apiEndpoint, data);
      return response.data;
    },
    onSuccess: (newData) => {
      queryClient.setQueryData([queryKey], (old: any) => {
        if (!old) return [newData];
        return [...old, newData];
      });
      setShowModal(false);
      setEditingItem(null);
      setFormData({});
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: T) => {
      const { id, ...updateData } = data as any;
      const response = await api.patch(`${apiEndpoint}/${id}`, updateData);
      return response.data;
    },
    onSuccess: (updatedData) => {
      queryClient.setQueryData([queryKey], (old: any) => {
        if (!old) return [updatedData];
        return old.map((item: any) =>
          item.id === updatedData.data.id ? updatedData.data : item
        );
      });
      setShowModal(false);
      setEditingItem(null);
      setFormData({});
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number | string) => {
      await api.delete(`${apiEndpoint}/${id}`);
      return id;
    },
    onSuccess: (deletedId) => {
      queryClient.setQueryData([queryKey], (old: any) => {
        if (!old) return [];
        return old.filter((item: any) => item.id !== deletedId);
      });
    },
  });

  const filteredData = useMemo(() => {
    if (!data) return [];
    if (filter === 'active') return data.filter((item) => item.isActive);
    if (filter === 'inactive') return data.filter((item) => !item.isActive);
    return data;
  }, [data, filter]);

  const baseColumns: ColumnDef<T>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <span className="font-medium">{getItemName(row.original)}</span>
        ),
      },
      {
        accessorKey: 'displayName',
        header: 'Display Name',
        cell: ({ row }) => (
          <span className="text-slate-600">
            {row.original.displayName || '—'}
          </span>
        ),
      },
      ...additionalColumns,
      {
        accessorKey: 'sortOrder',
        header: 'Sort Order',
        cell: ({ row }) => (
          <span className="text-slate-600">{row.original.sortOrder}</span>
        ),
      },
      {
        accessorKey: 'isActive',
        header: 'Status',
        cell: ({ row }) =>
          row.original.isActive ? (
            <Badge className="border-transparent bg-blue-600 text-white hover:bg-blue-700">
              Active
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1">
              <XCircle className="h-3 w-3" />
              Inactive
            </Badge>
          ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingItem(row.original);
                setShowModal(true);
              }}
              className="gap-1.5"
            >
              <Edit className="h-4 w-4" />
              <span>Edit</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (
                  confirm(`Are you sure you want to delete this ${entityType}?`)
                ) {
                  deleteMutation.mutate(row.original.id);
                }
              }}
              className="gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete</span>
            </Button>
          </div>
        ),
      },
    ],
    [additionalColumns, deleteMutation, entityType, getItemName]
  );

  const handleSubmit = () => {
    const processedData = { ...formData };

    // Convert numeric fields
    formFields.forEach((field) => {
      if (field.type === 'number' && processedData[field.name]) {
        processedData[field.name] = Number(processedData[field.name]);
      }
    });

    if (editingItem) {
      updateMutation.mutate({ ...editingItem, ...processedData } as T);
    } else {
      createMutation.mutate(processedData as Partial<T>);
    }
  };

  const handleOpenModal = () => {
    setEditingItem(null);
    setFormData({});
    setShowModal(true);
  };

  return (
    <AdminSection
      title={title}
      description={description}
      onAdd={handleOpenModal}
      addButtonLabel={`Add ${entityType}`}
      isLoading={isLoading}
      headerAction={
        <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      }
    >
      {error && (
        <div className="text-destructive text-sm">
          Error loading {title.toLowerCase()}
        </div>
      )}
      {filteredData && filteredData.length > 0 && (
        <GenericDataTable data={filteredData} columns={baseColumns as any} />
      )}
      {filteredData && filteredData.length === 0 && (
        <div className="py-8 text-center text-slate-600">
          No {title.toLowerCase()} found
        </div>
      )}

      <AdminModal
        open={showModal}
        onOpenChange={setShowModal}
        title={editingItem ? `Edit ${entityType}` : `Add ${entityType}`}
        description={
          editingItem
            ? `Update ${entityType.toLowerCase()} details`
            : `Create a new ${entityType.toLowerCase()}`
        }
        onConfirm={handleSubmit}
        confirmLabel={editingItem ? 'Update' : 'Create'}
        isLoading={createMutation.isPending || updateMutation.isPending}
      >
        <LookupForm
          fields={formFields}
          initialData={editingItem || {}}
          onChange={setFormData}
        />
      </AdminModal>
    </AdminSection>
  );
}
