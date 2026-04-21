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
  [key: string]: unknown; // Allow additional properties (e.g. abbreviation, ministerDisplayName)
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
  queryKey: string;
  queryFn: () => Promise<T[]>;
  formFields: FormField[];
  additionalColumns?: ColumnDef<T>[];
  getItemName?: (item: T) => string;
  /** When provided, renders custom modal body instead of LookupForm (e.g. for address search). */
  renderModalContent?: (props: RenderModalContentProps) => ReactNode;
  /** When false, hides active/inactive filter (entities without isActive). Default true. */
  showStatusFilter?: boolean;
  /** When true, invalidates the list query after create/update instead of merging cache. */
  refetchOnMutationSuccess?: boolean;
  /**
   * When set, runs instead of the default POST/PATCH mutations (e.g. multi-step saves).
   * Caller should invalidate relevant queries; this component only closes the modal on success.
   */
  submitOverride?: (args: {
    formData: Record<string, any>;
    editingItem: T | null;
  }) => Promise<void>;
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
  renderModalContent,
  showStatusFilter = true,
  refetchOnMutationSuccess = false,
  submitOverride,
}: GenericLookupAdminProps<T>) {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [submitOverridePending, setSubmitOverridePending] = useState(false);
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
    onSuccess: (newData: { success?: boolean; data?: T } | T) => {
      const item =
        newData != null &&
        typeof newData === 'object' &&
        'data' in newData &&
        (newData as { data?: T }).data != null
          ? (newData as { data: T }).data
          : (newData as T);
      if (refetchOnMutationSuccess) {
        void queryClient.invalidateQueries({ queryKey: [queryKey] });
      } else {
        queryClient.setQueryData([queryKey], (old: any) => {
          if (!old) return [item];
          return [...old, item];
        });
      }
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
    onSuccess: (updatedData: { success?: boolean; data?: T }) => {
      const next = updatedData?.data;
      if (refetchOnMutationSuccess) {
        void queryClient.invalidateQueries({ queryKey: [queryKey] });
      } else if (next) {
        queryClient.setQueryData([queryKey], (old: any) => {
          if (!old) return [next];
          return old.map((item: any) =>
            item.id === (next as { id: number }).id ? next : item
          );
        });
      }
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
    if (!showStatusFilter) return data;
    if (filter === 'active') return data.filter((item) => item.isActive);
    if (filter === 'inactive') return data.filter((item) => !item.isActive);
    return data;
  }, [data, filter, showStatusFilter]);

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

  const handleSubmit = async () => {
    const processedData = { ...formData };

    // Convert numeric fields
    formFields.forEach((field) => {
      if (field.type === 'number' && processedData[field.name]) {
        processedData[field.name] = Number(processedData[field.name]);
      }
      if (field.type === 'select' && field.name === 'ministryGroupId') {
        const v = processedData[field.name];
        processedData[field.name] =
          v === '__none__' || v === '' || v == null ? null : Number(v);
      }
    });

    if (submitOverride) {
      try {
        setSubmitOverridePending(true);
        await submitOverride({ formData: processedData, editingItem });
        setShowModal(false);
        setEditingItem(null);
        setFormData({});
      } finally {
        setSubmitOverridePending(false);
      }
      return;
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
        showStatusFilter ? (
          <Select
            value={filter}
            onValueChange={(value: any) => setFilter(value)}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        ) : undefined
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
        onConfirm={() => {
          void handleSubmit();
        }}
        confirmLabel={editingItem ? 'Update' : 'Create'}
        isLoading={
          createMutation.isPending ||
          updateMutation.isPending ||
          submitOverridePending
        }
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
            initialData={editingItem ?? EMPTY_INITIAL}
            onChange={setFormData}
          />
        )}
      </AdminModal>
    </AdminSection>
  );
}
