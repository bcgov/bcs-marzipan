import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { Edit, Trash2, XCircle } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';

import api from '@/api/axios';
import {
  AdminModal,
  AdminSection,
  FormField,
  LookupForm,
} from '@/components/admin';
import { GenericDataTable } from '@/components/table/GenericDataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const EMPTY_INITIAL: Record<string, unknown> = {};

interface BaseLookupItem {
  id: number;
  name?: string;
  displayName?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  [key: string]: unknown; // Allow additional properties (e.g. abbreviation, ministerName)
}

export interface RenderModalContentProps {
  initialData: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
  isSubmitting: boolean;
}

interface GenericLookupAdminProps<T extends BaseLookupItem> {
  title: string;
  description: string;
  entityType: string;
  apiEndpoint: string;
  /**
   * React Query key for the list query. Prefer a key from `lookupQueryKeys`
   * so admin and consumer caches stay aligned and type-safe.
   */
  queryKey: readonly unknown[];
  queryFn: () => Promise<T[]>;
  formFields: FormField[];
  additionalColumns?: ColumnDef<T>[];
  getItemName?: (item: T) => string;
  /** Transform an item into its initial form data (e.g. to derive computed fields). */
  getInitialData?: (item: T) => Record<string, unknown>;
  /** Transform form data before submitting (e.g. convert sentinel values to null). */
  transformSubmitData?: (data: Record<string, any>) => Record<string, any>;
  /** When provided, renders custom modal body instead of LookupForm (e.g. for address search). */
  renderModalContent?: (props: RenderModalContentProps) => ReactNode;
  /** Additional query keys to invalidate on create/update (e.g. to bust related caches). */
  additionalInvalidateKeys?: readonly (readonly unknown[])[];
  /** When true, "delete" sets isActive=false via PATCH instead of issuing a DELETE request.
   * Use for entities that may be referenced by other records (e.g. tags on activities). */
  softDelete?: boolean;
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
  getItemName = (item) => {
    const v = item.name ?? item.displayName ?? item.label ?? item.id;
    return typeof v === 'string' ? v : String(item.id);
  },
  getInitialData,
  transformSubmitData,
  renderModalContent,
  additionalInvalidateKeys,
  softDelete,
}: GenericLookupAdminProps<T>) {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<T | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});

  // Memoized only on editingItem to avoid re-creating the object every render,
  // which would cause an infinite loop via LookupForm's initialData useEffect.

  const resolvedInitialData = useMemo(() => {
    if (!editingItem) return EMPTY_INITIAL;
    return getInitialData ? getInitialData(editingItem) : editingItem;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingItem]);

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: queryFn,
    // Always refetch when an admin section mounts so Settings reflects any
    // mutation or seed/schema change from another tab or the backend.
    refetchOnMount: 'always',
  });

  const invalidateListCaches = () => {
    void queryClient.invalidateQueries({ queryKey });
    for (const key of additionalInvalidateKeys ?? []) {
      void queryClient.invalidateQueries({ queryKey: key });
    }
  };

  const createMutation = useMutation({
    mutationFn: async (data: Partial<T>) => {
      const response = await api.post(apiEndpoint, data);
      return response.data;
    },
    onSuccess: () => {
      invalidateListCaches();
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
    onSuccess: () => {
      invalidateListCaches();
      setShowModal(false);
      setEditingItem(null);
      setFormData({});
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number | string) => {
      if (softDelete) {
        await api.patch(`${apiEndpoint}/${id}`, { isActive: false });
      } else {
        await api.delete(`${apiEndpoint}/${id}`);
      }
      return id;
    },
    onSuccess: () => {
      invalidateListCaches();
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
            <Badge variant="primary">Active</Badge>
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
    let processedData = { ...formData };

    // Convert numeric fields
    formFields.forEach((field) => {
      if (field.type === 'number' && processedData[field.name]) {
        processedData[field.name] = Number(processedData[field.name]);
      }
    });

    if (transformSubmitData) {
      processedData = transformSubmitData(processedData);
    }

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
        {renderModalContent ? (
          renderModalContent({
            initialData: editingItem ?? EMPTY_INITIAL,
            onChange: setFormData as (data: Record<string, unknown>) => void,
            isSubmitting: createMutation.isPending || updateMutation.isPending,
          })
        ) : (
          <LookupForm
            fields={formFields}
            initialData={resolvedInitialData}
            onChange={setFormData}
          />
        )}
      </AdminModal>
    </AdminSection>
  );
}
