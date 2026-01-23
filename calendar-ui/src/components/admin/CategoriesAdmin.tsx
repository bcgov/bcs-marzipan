import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { Edit, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { fetchCategories } from '@/api/lookupsApi';
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

type Category = {
  id: number;
  name: string;
  displayName: string | null;
  sortOrder: number;
  isActive: boolean;
};

const formFields: FormField[] = [
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
];

export function CategoriesAdmin() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Category | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});

  const { data, isLoading, error } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<Category>) => {
      const response = await api.post('/lookups/categories', data);
      return response.data;
    },
    onSuccess: (newData) => {
      queryClient.setQueryData(['categories'], (old: any) => {
        if (!old) return [newData];
        return [...old, newData];
      });
      setShowModal(false);
      setEditingItem(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Category) => {
      const { id, ...updateData } = data;
      const response = await api.patch(`/lookups/categories/${id}`, updateData);
      return response.data;
    },
    onSuccess: (updatedData) => {
      queryClient.setQueryData(['categories'], (old: any) => {
        if (!old) return [updatedData];
        return old.map((item: any) =>
          item.id === updatedData.data.id ? updatedData.data : item
        );
      });
      setShowModal(false);
      setEditingItem(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/lookups/categories/${id}`);
      return id;
    },
    onSuccess: (deletedId) => {
      queryClient.setQueryData(['categories'], (old: any) => {
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

  const columns: ColumnDef<Category>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
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
            <Badge variant="success" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
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
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditingItem(row.original);
                setShowModal(true);
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (confirm('Are you sure you want to delete this category?')) {
                  deleteMutation.mutate(row.original.id);
                }
              }}
            >
              <Trash2 className="text-destructive h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [deleteMutation]
  );

  const handleSubmit = () => {
    const processedData = { ...formData };

    // Convert sortOrder to number
    if (processedData.sortOrder) {
      processedData.sortOrder = Number(processedData.sortOrder);
    }

    if (editingItem) {
      updateMutation.mutate({ ...editingItem, ...processedData });
    } else {
      createMutation.mutate(processedData);
    }
  };

  const handleOpenModal = () => {
    setEditingItem(null);
    setFormData({});
    setShowModal(true);
  };

  return (
    <AdminSection
      title="Categories"
      description="Manage activity categories"
      onAdd={handleOpenModal}
      addButtonLabel="Add Category"
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
        <div className="text-destructive text-sm">Error loading categories</div>
      )}
      {filteredData && filteredData.length > 0 && (
        <GenericDataTable data={filteredData} columns={columns as any} />
      )}
      {filteredData && filteredData.length === 0 && (
        <div className="py-8 text-center text-slate-600">
          No categories found
        </div>
      )}

      <AdminModal
        open={showModal}
        onOpenChange={setShowModal}
        title={editingItem ? 'Edit Category' : 'Add Category'}
        description={
          editingItem ? 'Update category details' : 'Create a new category'
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
