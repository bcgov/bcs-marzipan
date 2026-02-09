import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import {
  Spinner,
  Dropdown,
  Option,
  Link,
  Button,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Field,
  Input,
} from '@fluentui/react-components';
import { Add20Regular } from '@fluentui/react-icons';
import { ColumnDef } from '@tanstack/react-table';
import { GenericDataTable } from '../components/Table/GenericDataTable';
import { useMemo, useState } from 'react';
import api from '../api/axios';

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

type AddModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  title: string;
  fields: Array<{
    name: string;
    label: string;
    type: 'text' | 'number';
    required?: boolean;
  }>;
};

const AddModal = ({
  open,
  onClose,
  onSubmit,
  title,
  fields,
}: AddModalProps) => {
  const [formData, setFormData] = useState<Record<string, any>>({
    isActive: true,
  });

  const handleSubmit = () => {
    onSubmit(formData);
    setFormData({ isActive: true });
    onClose();
  };

  const handleCancel = () => {
    setFormData({ isActive: true });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>{title}</DialogTitle>
          <DialogContent
            style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            {fields.map((field) => (
              <Field
                key={field.name}
                label={field.label}
                required={field.required}
              >
                <Input
                  type={field.type}
                  value={formData[field.name] || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      [field.name]: e.target.value,
                    }))
                  }
                />
              </Field>
            ))}
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={handleCancel}>
              Cancel
            </Button>
            <Button appearance="primary" onClick={handleSubmit}>
              Submit
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
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
  entityType,
  data,
  columns,
  isLoading,
  error,
  activeFilter,
  setActiveFilter,
  onAdd,
}: {
  title: string;
  entityType: string;
  data: any[];
  columns: ColumnDef<any>[];
  isLoading: boolean;
  error: any;
  activeFilter: string;
  setActiveFilter: (value: string) => void;
  onAdd: () => void;
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
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          <div style={{ maxWidth: '200px' }}>
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

          <Button
            appearance="primary"
            icon={<Add20Regular />}
            onClick={onAdd}
            style={{ backgroundColor: '#5b69c3' }}
          >
            Add {entityType}
          </Button>
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

export const Administration = () => {
  const queryClient = useQueryClient();

  const [categoriesFilter, setCategoriesFilter] = useState('all');
  const [citiesFilter, setCitiesFilter] = useState('all');
  const [commsMaterialsFilter, setCommsMaterialsFilter] = useState('all');
  const [govRepsFilter, setGovRepsFilter] = useState('all');
  const [tagsFilter, setTagsFilter] = useState('all');
  const [ministriesFilter, setMinistriesFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [themesFilter, setThemesFilter] = useState('all');

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  const [showCommsMaterialModal, setShowCommsMaterialModal] = useState(false);
  const [showGovRepModal, setShowGovRepModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [showMinistryModal, setShowMinistryModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);

  // Mutation for creating categories
  const createCategoryMutation = useMutation({
    mutationFn: async (data: Partial<Category>) => {
      const response = await api.post('/lookups/categories', data);
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  const createCityMutation = useMutation({
    mutationFn: async (data: Partial<City>) => {
      const response = await api.post('/lookups/cities', data);
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['cities'] });
    },
  });

  const createCommsMaterialMutation = useMutation({
    mutationFn: async (data: Partial<CommsMaterial>) => {
      const response = await api.post('/lookups/comms-materials', data);
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['commsMaterials'] });
    },
  });

  const createGovRepMutation = useMutation({
    mutationFn: async (data: Partial<GovernmentRepresentative>) => {
      const response = await api.post(
        '/lookups/government-representatives',
        data
      );
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['governmentRepresentatives'],
      });
    },
  });

  const createTagMutation = useMutation({
    mutationFn: async (data: Partial<Tag>) => {
      const response = await api.post('/lookups/tags', data);
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });

  const createMinistryMutation = useMutation({
    mutationFn: async (data: Partial<Ministry>) => {
      const response = await api.post('/lookups/ministries', data);
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['ministries'] });
    },
  });

  const createStatusMutation = useMutation({
    mutationFn: async (data: Partial<ActivityStatus>) => {
      const response = await api.post('/lookups/activity-statuses', data);
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['activityStatuses'] });
    },
  });

  const createThemeMutation = useMutation({
    mutationFn: async (data: Partial<Theme>) => {
      const response = await api.post('/lookups/themes', data);
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['themes'] });
    },
  });

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

      <AddModal
        open={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        onSubmit={(data) => createCategoryMutation.mutate(data)}
        title="Add Category"
        fields={[
          { name: 'name', label: 'Name', type: 'text', required: true },
          { name: 'displayName', label: 'Display Name', type: 'text' },
          {
            name: 'sortOrder',
            label: 'Sort Order',
            type: 'number',
            required: true,
          },
        ]}
      />

      <LookupSection
        title="Categories"
        entityType="Category"
        data={categories || []}
        columns={categoriesColumns}
        isLoading={categoriesLoading}
        error={categoriesError}
        activeFilter={categoriesFilter}
        setActiveFilter={setCategoriesFilter}
        onAdd={() => setShowCategoryModal(true)}
      />

      <AddModal
        open={showCityModal}
        onClose={() => setShowCityModal(false)}
        onSubmit={(data) => createCityMutation.mutate(data)}
        title="Add City"
        fields={[
          { name: 'name', label: 'Name', type: 'text', required: true },
          { name: 'displayName', label: 'Display Name', type: 'text' },
          { name: 'province', label: 'Province', type: 'text' },
          {
            name: 'sortOrder',
            label: 'Sort Order',
            type: 'number',
            required: true,
          },
        ]}
      />

      <LookupSection
        title="Cities"
        entityType="City"
        data={cities || []}
        columns={citiesColumns}
        isLoading={citiesLoading}
        error={citiesError}
        activeFilter={citiesFilter}
        setActiveFilter={setCitiesFilter}
        onAdd={() => setShowCityModal(true)}
      />

      <AddModal
        open={showCommsMaterialModal}
        onClose={() => setShowCommsMaterialModal(false)}
        onSubmit={(data) => createCommsMaterialMutation.mutate(data)}
        title="Add Communication Material"
        fields={[
          { name: 'name', label: 'Name', type: 'text', required: true },
          { name: 'displayName', label: 'Display Name', type: 'text' },
          {
            name: 'sortOrder',
            label: 'Sort Order',
            type: 'number',
            required: true,
          },
        ]}
      />

      <LookupSection
        title="Communication Materials"
        entityType="Communication Material"
        data={commsMaterials || []}
        columns={commsMaterialsColumns}
        isLoading={commsMaterialsLoading}
        error={commsMaterialsError}
        activeFilter={commsMaterialsFilter}
        setActiveFilter={setCommsMaterialsFilter}
        onAdd={() => setShowCommsMaterialModal(true)}
      />

      <AddModal
        open={showGovRepModal}
        onClose={() => setShowGovRepModal(false)}
        onSubmit={(data) => createGovRepMutation.mutate(data)}
        title="Add Government Representative"
        fields={[
          { name: 'name', label: 'Name', type: 'text', required: true },
          { name: 'displayName', label: 'Display Name', type: 'text' },
          { name: 'title', label: 'Title', type: 'text' },
          {
            name: 'sortOrder',
            label: 'Sort Order',
            type: 'number',
            required: true,
          },
        ]}
      />

      <LookupSection
        title="Government Representatives"
        entityType="Government Representative"
        data={governmentRepresentatives || []}
        columns={govRepsColumns}
        isLoading={govRepsLoading}
        error={govRepsError}
        activeFilter={govRepsFilter}
        setActiveFilter={setGovRepsFilter}
        onAdd={() => setShowGovRepModal(true)}
      />

      <AddModal
        open={showTagModal}
        onClose={() => setShowTagModal(false)}
        onSubmit={(data) => createTagMutation.mutate(data)}
        title="Add HQ Tag"
        fields={[
          { name: 'key', label: 'Key', type: 'text', required: true },
          { name: 'displayName', label: 'Display Name', type: 'text' },
          {
            name: 'sortOrder',
            label: 'Sort Order',
            type: 'number',
            required: true,
          },
        ]}
      />

      <LookupSection
        title="HQ Tags"
        entityType="HQ Tag"
        data={tags || []}
        columns={tagsColumns}
        isLoading={tagsLoading}
        error={tagsError}
        activeFilter={tagsFilter}
        setActiveFilter={setTagsFilter}
        onAdd={() => setShowTagModal(true)}
      />

      <AddModal
        open={showMinistryModal}
        onClose={() => setShowMinistryModal(false)}
        onSubmit={(data) => createMinistryMutation.mutate(data)}
        title="Add Ministry"
        fields={[
          {
            name: 'displayName',
            label: 'Display Name',
            type: 'text',
            required: true,
          },
          { name: 'abbreviation', label: 'Abbreviation', type: 'text' },
          { name: 'ministerName', label: 'Minister Name', type: 'text' },
          {
            name: 'sortOrder',
            label: 'Sort Order',
            type: 'number',
            required: true,
          },
        ]}
      />

      <LookupSection
        title="Ministries"
        entityType="Ministry"
        data={ministries || []}
        columns={ministriesColumns}
        isLoading={ministriesLoading}
        error={ministriesError}
        activeFilter={ministriesFilter}
        setActiveFilter={setMinistriesFilter}
        onAdd={() => setShowMinistryModal(true)}
      />

      <AddModal
        open={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        onSubmit={(data) => createStatusMutation.mutate(data)}
        title="Add Status"
        fields={[
          { name: 'name', label: 'Name', type: 'text', required: true },
          { name: 'displayName', label: 'Display Name', type: 'text' },
          {
            name: 'sortOrder',
            label: 'Sort Order',
            type: 'number',
            required: true,
          },
        ]}
      />

      <LookupSection
        title="Status"
        entityType="Status"
        data={statuses || []}
        columns={statusColumns}
        isLoading={statusLoading}
        error={statusError}
        activeFilter={statusFilter}
        setActiveFilter={setStatusFilter}
        onAdd={() => setShowStatusModal(true)}
      />

      <AddModal
        open={showThemeModal}
        onClose={() => setShowThemeModal(false)}
        onSubmit={(data) => createThemeMutation.mutate(data)}
        title="Add Theme"
        fields={[
          { name: 'key', label: 'Key', type: 'text', required: true },
          { name: 'displayName', label: 'Display Name', type: 'text' },
          {
            name: 'sortOrder',
            label: 'Sort Order',
            type: 'number',
            required: true,
          },
        ]}
      />

      <LookupSection
        title="Themes"
        entityType="Theme"
        data={themes || []}
        columns={themesColumns}
        isLoading={themesLoading}
        error={themesError}
        activeFilter={themesFilter}
        setActiveFilter={setThemesFilter}
        onAdd={() => setShowThemeModal(true)}
      />
    </div>
  );
};
