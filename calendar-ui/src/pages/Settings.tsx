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
  Toast,
  ToastTitle,
  ToastBody,
  useToastController,
} from '@fluentui/react-components';
import {
  Add20Regular,
  Edit20Regular,
  Delete20Regular,
} from '@fluentui/react-icons';
import { ColumnDef } from '@tanstack/react-table';
import { GenericDataTable } from '../components/Table/GenericDataTable';
import { useMemo, useState, useEffect } from 'react';
import api from '../api/axios';

type ApiResponse<T> = {
  success: boolean;
  data: T;
};

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
  initialData?: Record<string, any>;
};

const AddModal = ({
  open,
  onClose,
  onSubmit,
  title,
  fields,
  initialData,
}: AddModalProps) => {
  const [formData, setFormData] = useState<Record<string, any>>({
    isActive: true,
    ...initialData,
  });

  // Update form data when initialData changes or modal opens
  useEffect(() => {
    if (open) {
      setFormData({ isActive: true, ...initialData });
    }
  }, [open, initialData]);

  const handleSubmit = () => {
    // Convert numeric fields from strings to numbers
    const processedData = { ...formData };
    fields.forEach((field) => {
      if (
        field.type === 'number' &&
        processedData[field.name] !== undefined &&
        processedData[field.name] !== ''
      ) {
        processedData[field.name] = Number(processedData[field.name]);
      }
    });

    // Only include fields that are defined in the form fields, plus isActive
    const filteredData: Record<string, any> = {
      isActive: processedData.isActive,
    };
    fields.forEach((field) => {
      if (processedData[field.name] !== undefined) {
        filteredData[field.name] = processedData[field.name];
      }
    });

    onSubmit(filteredData);
    setFormData({ isActive: true });
    onClose();
  };

  const handleCancel = () => {
    setFormData({ isActive: true, ...initialData });
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

export const Settings = () => {
  const queryClient = useQueryClient();
  const { dispatchToast } = useToastController();

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

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [editingCommsMaterial, setEditingCommsMaterial] =
    useState<CommsMaterial | null>(null);
  const [editingGovRep, setEditingGovRep] =
    useState<GovernmentRepresentative | null>(null);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [editingMinistry, setEditingMinistry] = useState<Ministry | null>(null);
  const [editingStatus, setEditingStatus] = useState<ActivityStatus | null>(
    null
  );
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);

  // Mutation for creating categories
  const createCategoryMutation = useMutation({
    mutationFn: async (data: Partial<Category>) => {
      const response = await api.post<ApiResponse<Category>>('/lookups/categories', data);
      return response.data;
    },
    onSuccess: (responseData) => {
      queryClient.setQueryData(['categories'], (old: any) => {
        if (!old) return [responseData.data];
        return [...old, responseData.data];
      });
    },
  });

  const createCityMutation = useMutation({
    mutationFn: async (data: Partial<City>) => {
      const response = await api.post<ApiResponse<City>>('/lookups/cities', data);
      return response.data;
    },
    onSuccess: (responseData) => {
      queryClient.setQueryData(['cities'], (old: any) => {
        if (!old) return [responseData.data];
        return [...old, responseData.data];
      });
    },
  });

  const createCommsMaterialMutation = useMutation({
    mutationFn: async (data: Partial<CommsMaterial>) => {
      const response = await api.post<ApiResponse<CommsMaterial>>('/lookups/comms-materials', data);
      return response.data;
    },
    onSuccess: (responseData) => {
      queryClient.setQueryData(['commsMaterials'], (old: any) => {
        if (!old) return [responseData.data];
        return [...old, responseData.data];
      });
    },
  });

  const createGovRepMutation = useMutation({
    mutationFn: async (data: Partial<GovernmentRepresentative>) => {
      const response = await api.post<ApiResponse<GovernmentRepresentative>>(
        '/lookups/government-representatives',
        data
      );
      return response.data;
    },
    onSuccess: (responseData) => {
      queryClient.setQueryData(['governmentRepresentatives'], (old: any) => {
        if (!old) return [responseData.data];
        return [...old, responseData.data];
      });
    },
  });

  const createTagMutation = useMutation({
    mutationFn: async (data: Partial<Tag>) => {
      const response = await api.post<ApiResponse<Tag>>('/lookups/tags', data);
      return response.data;
    },
    onSuccess: (responseData) => {
      queryClient.setQueryData(['tags'], (old: any) => {
        if (!old) return [responseData.data];
        return [...old, responseData.data];
      });
    },
  });

  const createMinistryMutation = useMutation({
    mutationFn: async (data: Partial<Ministry>) => {
      const response = await api.post<ApiResponse<Ministry>>('/lookups/ministries', data);
      return response.data;
    },
    onSuccess: (responseData) => {
      queryClient.setQueryData(['ministries'], (old: any) => {
        if (!old) return [responseData.data];
        return [...old, responseData.data];
      });
    },
  });

  const createStatusMutation = useMutation({
    mutationFn: async (data: Partial<ActivityStatus>) => {
      const response = await api.post<ApiResponse<ActivityStatus>>('/lookups/activity-statuses', data);
      return response.data;
    },
    onSuccess: (responseData) => {
      queryClient.setQueryData(['activityStatuses'], (old: any) => {
        if (!old) return [responseData.data];
        return [...old, responseData.data];
      });
    },
  });

  const createThemeMutation = useMutation({
    mutationFn: async (data: Partial<Theme>) => {
      const response = await api.post<ApiResponse<Theme>>('/lookups/themes', data);
      return response.data;
    },
    onSuccess: (responseData) => {
      queryClient.setQueryData(['themes'], (old: any) => {
        if (!old) return [responseData.data];
        return [...old, responseData.data];
      });
    },
  });

  // Update mutations
  const updateCategoryMutation = useMutation({
    mutationFn: async (data: Category) => {
      const { id, ...updateData } = data;
      const response = await api.patch<ApiResponse<Category>>(`/lookups/categories/${id}`, updateData);
      return response.data;
    },
    onSuccess: (responseData) => {
      queryClient.setQueryData(['categories'], (old: any) => {
        if (!old) return [responseData.data];
        return old.map((item: any) =>
          item.id === responseData.data.id ? responseData.data : item
        );
      });
      setEditingCategory(null);
    },
  });

  const updateCityMutation = useMutation({
    mutationFn: async (data: City) => {
      const { id, ...updateData } = data;
      const response = await api.patch<ApiResponse<City>>(`/lookups/cities/${id}`, updateData);
      return response.data;
    },
    onSuccess: (responseData) => {
      queryClient.setQueryData(['cities'], (old: any) => {
        if (!old) return [responseData.data];
        return old.map((item: any) =>
          item.id === responseData.data.id ? responseData.data : item
        );
      });
      setEditingCity(null);
    },
  });

  const updateCommsMaterialMutation = useMutation({
    mutationFn: async (data: CommsMaterial) => {
      const { id, ...updateData } = data;
      const response = await api.patch<ApiResponse<CommsMaterial>>(
        `/lookups/comms-materials/${id}`,
        updateData
      );
      return response.data;
    },
    onSuccess: (responseData) => {
      queryClient.setQueryData(['commsMaterials'], (old: any) => {
        if (!old) return [responseData.data];
        return old.map((item: any) =>
          item.id === responseData.data.id ? responseData.data : item
        );
      });
      setEditingCommsMaterial(null);
    },
  });

  const updateGovRepMutation = useMutation({
    mutationFn: async (data: GovernmentRepresentative) => {
      const { id, ...updateData } = data;
      const response = await api.patch<ApiResponse<GovernmentRepresentative>>(
        `/lookups/government-representatives/${id}`,
        updateData
      );
      return response.data;
    },
    onSuccess: (responseData) => {
      queryClient.setQueryData(['governmentRepresentatives'], (old: any) => {
        if (!old) return [responseData.data];
        return old.map((item: any) =>
          item.id === responseData.data.id ? responseData.data : item
        );
      });
      setEditingGovRep(null);
    },
  });

  const updateTagMutation = useMutation({
    mutationFn: async (data: Tag) => {
      const { id, ...updateData } = data;
      const response = await api.patch<ApiResponse<Tag>>(`/lookups/tags/${id}`, updateData);
      return response.data;
    },
    onSuccess: (responseData) => {
      queryClient.setQueryData(['tags'], (old: any) => {
        if (!old) return [responseData.data];
        return old.map((item: any) =>
          item.id === responseData.data.id ? responseData.data : item
        );
      });
      setEditingTag(null);
    },
  });

  const updateMinistryMutation = useMutation({
    mutationFn: async (data: Ministry) => {
      const { id, ...updateData } = data;
      const response = await api.patch<ApiResponse<Ministry>>(`/lookups/ministries/${id}`, updateData);
      return response.data;
    },
    onSuccess: (responseData) => {
      queryClient.setQueryData(['ministries'], (old: any) => {
        if (!old) return [responseData.data];
        return old.map((item: any) =>
          item.id === responseData.data.id ? responseData.data : item
        );
      });
      setEditingMinistry(null);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (data: ActivityStatus) => {
      const { id, ...updateData } = data;
      const response = await api.patch<ApiResponse<ActivityStatus>>(
        `/lookups/activity-statuses/${id}`,
        updateData
      );
      return response.data;
    },
    onSuccess: (responseData) => {
      queryClient.setQueryData(['activityStatuses'], (old: any) => {
        if (!old) return [responseData.data];
        return old.map((item: any) =>
          item.id === responseData.data.id ? responseData.data : item
        );
      });
      setEditingStatus(null);
    },
  });

  const updateThemeMutation = useMutation({
    mutationFn: async (data: Theme) => {
      const { id, ...updateData } = data;
      const response = await api.patch<ApiResponse<Theme>>(`/lookups/themes/${id}`, updateData);
      return response.data;
    },
    onSuccess: (responseData) => {
      queryClient.setQueryData(['themes'], (old: any) => {
        if (!old) return [responseData.data];
        return old.map((item: any) =>
          item.id === responseData.data.id ? responseData.data : item
        );
      });
      setEditingTheme(null);
    },
  });

  // Delete mutations (soft delete by setting isActive to false)
  const deleteCategoryMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const response = await api.patch<ApiResponse<Category>>(`/lookups/categories/${id}`, {
        isActive: !isActive,
      });
      return response.data;
    },
    onSuccess: (responseData, variables) => {
      queryClient.setQueryData(['categories'], (old: any) => {
        if (!old) return [];
        return old.map((item: any) =>
          item.id === responseData.data.id ? responseData.data : item
        );
      });
      const action = variables.isActive ? 'deactivated' : 'reactivated';
      dispatchToast(
        <Toast>
          <ToastTitle>Category {action}</ToastTitle>
          <ToastBody>
            {responseData.data.name} has been {action}.
          </ToastBody>
        </Toast>,
        { intent: 'success', timeout: 3000 }
      );
    },
  });

  const deleteCityMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const response = await api.patch<ApiResponse<City>>(`/lookups/cities/${id}`, {
        isActive: !isActive,
      });
      return response.data;
    },
    onSuccess: (responseData, variables) => {
      queryClient.setQueryData(['cities'], (old: any) => {
        if (!old) return [];
        return old.map((item: any) =>
          item.id === responseData.data.id ? responseData.data : item
        );
      });
      const action = variables.isActive ? 'deactivated' : 'reactivated';
      dispatchToast(
        <Toast>
          <ToastTitle>City {action}</ToastTitle>
          <ToastBody>
            {responseData.data.name} has been {action}.
          </ToastBody>
        </Toast>,
        { intent: 'success', timeout: 3000 }
      );
    },
  });

  const deleteCommsMaterialMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const response = await api.patch<ApiResponse<CommsMaterial>>(`/lookups/comms-materials/${id}`, {
        isActive: !isActive,
      });
      return response.data;
    },
    onSuccess: (responseData, variables) => {
      queryClient.setQueryData(['commsMaterials'], (old: any) => {
        if (!old) return [];
        return old.map((item: any) =>
          item.id === responseData.data.id ? responseData.data : item
        );
      });
      const action = variables.isActive ? 'deactivated' : 'reactivated';
      dispatchToast(
        <Toast>
          <ToastTitle>Comms Material {action}</ToastTitle>
          <ToastBody>
            {responseData.data.name} has been {action}.
          </ToastBody>
        </Toast>,
        { intent: 'success', timeout: 3000 }
      );
    },
  });

  const deleteGovRepMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const response = await api.patch<ApiResponse<GovernmentRepresentative>>(
        `/lookups/government-representatives/${id}`,
        { isActive: !isActive }
      );
      return response.data;
    },
    onSuccess: (responseData, variables) => {
      queryClient.setQueryData(['governmentRepresentatives'], (old: any) => {
        if (!old) return [];
        return old.map((item: any) =>
          item.id === responseData.data.id ? responseData.data : item
        );
      });
      const action = variables.isActive ? 'deactivated' : 'reactivated';
      dispatchToast(
        <Toast>
          <ToastTitle>Government Representative {action}</ToastTitle>
          <ToastBody>
            {responseData.data.name} has been {action}.
          </ToastBody>
        </Toast>,
        { intent: 'success', timeout: 3000 }
      );
    },
  });

  const deleteTagMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await api.patch<ApiResponse<Tag>>(`/lookups/tags/${id}`, {
        isActive: !isActive,
      });
      return response.data;
    },
    onSuccess: (responseData, variables) => {
      queryClient.setQueryData(['tags'], (old: any) => {
        if (!old) return [];
        return old.map((item: any) =>
          item.id === responseData.data.id ? responseData.data : item
        );
      });
      const action = variables.isActive ? 'deactivated' : 'reactivated';
      dispatchToast(
        <Toast>
          <ToastTitle>Tag {action}</ToastTitle>
          <ToastBody>
            {responseData.data.name} has been {action}.
          </ToastBody>
        </Toast>,
        { intent: 'success', timeout: 3000 }
      );
    },
  });

  const deleteMinistryMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await api.patch<ApiResponse<Ministry>>(`/lookups/ministries/${id}`, {
        isActive: !isActive,
      });
      return response.data;
    },
    onSuccess: (responseData, variables) => {
      queryClient.setQueryData(['ministries'], (old: any) => {
        if (!old) return [];
        return old.map((item: any) =>
          item.id === responseData.data.id ? responseData.data : item
        );
      });
      const action = variables.isActive ? 'deactivated' : 'reactivated';
      dispatchToast(
        <Toast>
          <ToastTitle>Ministry {action}</ToastTitle>
          <ToastBody>
            {responseData.data.displayName || responseData.data.abbreviation} has
            been {action}.
          </ToastBody>
        </Toast>,
        { intent: 'success', timeout: 3000 }
      );
    },
  });

  const deleteStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const response = await api.patch<ApiResponse<ActivityStatus>>(`/lookups/activity-statuses/${id}`, {
        isActive: !isActive,
      });
      return response.data;
    },
    onSuccess: (responseData, variables) => {
      queryClient.setQueryData(['activityStatuses'], (old: any) => {
        if (!old) return [];
        return old.map((item: any) =>
          item.id === responseData.data.id ? responseData.data : item
        );
      });
      const action = variables.isActive ? 'deactivated' : 'reactivated';
      dispatchToast(
        <Toast>
          <ToastTitle>Activity Status {action}</ToastTitle>
          <ToastBody>
            {responseData.data.name} has been {action}.
          </ToastBody>
        </Toast>,
        { intent: 'success', timeout: 3000 }
      );
    },
  });

  const deleteThemeMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await api.patch<ApiResponse<Theme>>(`/lookups/themes/${id}`, {
        isActive: !isActive,
      });
      return response.data;
    },
    onSuccess: (responseData, variables) => {
      queryClient.setQueryData(['themes'], (old: any) => {
        if (!old) return [];
        return old.map((item: any) =>
          item.id === responseData.data.id ? responseData.data : item
        );
      });
      const action = variables.isActive ? 'deactivated' : 'reactivated';
      dispatchToast(
        <Toast>
          <ToastTitle>Theme {action}</ToastTitle>
          <ToastBody>
            {responseData.data.displayName || responseData.data.key} has been{' '}
            {action}.
          </ToastBody>
        </Toast>,
        { intent: 'success', timeout: 3000 }
      );
    },
  });

  const {
    data: categories,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useQuery({
    queryKey: ['categories'],
    queryFn: () => fetchCategories(true),
  });

  const {
    data: cities,
    isLoading: citiesLoading,
    error: citiesError,
  } = useQuery({
    queryKey: ['cities'],
    queryFn: () => fetchCities(true),
  });

  const {
    data: commsMaterials,
    isLoading: commsMaterialsLoading,
    error: commsMaterialsError,
  } = useQuery({
    queryKey: ['commsMaterials'],
    queryFn: () => fetchCommsMaterials(true),
  });

  const {
    data: governmentRepresentatives,
    isLoading: govRepsLoading,
    error: govRepsError,
  } = useQuery({
    queryKey: ['governmentRepresentatives'],
    queryFn: () => fetchGovernmentRepresentatives(true),
  });

  const {
    data: tags,
    isLoading: tagsLoading,
    error: tagsError,
  } = useQuery({
    queryKey: ['tags'],
    queryFn: () => fetchTags(true),
  });

  const {
    data: ministries,
    isLoading: ministriesLoading,
    error: ministriesError,
  } = useQuery({
    queryKey: ['ministries'],
    queryFn: () => fetchMinistries(true),
  });

  const {
    data: statuses,
    isLoading: statusLoading,
    error: statusError,
  } = useQuery({
    queryKey: ['activityStatuses'],
    queryFn: () => fetchActivityStatuses(true),
  });

  const {
    data: themes,
    isLoading: themesLoading,
    error: themesError,
  } = useQuery({
    queryKey: ['themes'],
    queryFn: () => fetchThemes(true),
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
      {
        id: 'actions',
        header: 'Actions',
        cell: (info) => (
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              appearance="subtle"
              icon={<Edit20Regular />}
              onClick={() => setEditingCategory(info.row.original)}
            >
              Edit
            </Button>
            <Button
              appearance="subtle"
              icon={<Delete20Regular />}
              onClick={() =>
                deleteCategoryMutation.mutate({
                  id: info.row.original.id,
                  isActive: info.row.original.isActive,
                })
              }
            >
              {info.row.original.isActive ? 'Deactivate' : 'Reactivate'}
            </Button>
          </div>
        ),
      },
    ],
    [deleteCategoryMutation]
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
      {
        id: 'actions',
        header: 'Actions',
        cell: (info) => (
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              appearance="subtle"
              icon={<Edit20Regular />}
              onClick={() => setEditingCity(info.row.original)}
            >
              Edit
            </Button>
            <Button
              appearance="subtle"
              icon={<Delete20Regular />}
              onClick={() =>
                deleteCityMutation.mutate({
                  id: info.row.original.id,
                  isActive: info.row.original.isActive,
                })
              }
            >
              {info.row.original.isActive ? 'Deactivate' : 'Reactivate'}
            </Button>
          </div>
        ),
      },
    ],
    [deleteCityMutation]
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
      {
        id: 'actions',
        header: 'Actions',
        cell: (info) => (
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              appearance="subtle"
              icon={<Edit20Regular />}
              onClick={() => setEditingCommsMaterial(info.row.original)}
            >
              Edit
            </Button>
            <Button
              appearance="subtle"
              icon={<Delete20Regular />}
              onClick={() =>
                deleteCommsMaterialMutation.mutate({
                  id: info.row.original.id,
                  isActive: info.row.original.isActive,
                })
              }
            >
              {info.row.original.isActive ? 'Deactivate' : 'Reactivate'}
            </Button>
          </div>
        ),
      },
    ],
    [deleteCommsMaterialMutation]
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
      {
        id: 'actions',
        header: 'Actions',
        cell: (info) => (
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              appearance="subtle"
              icon={<Edit20Regular />}
              onClick={() => setEditingGovRep(info.row.original)}
            >
              Edit
            </Button>
            <Button
              appearance="subtle"
              icon={<Delete20Regular />}
              onClick={() =>
                deleteGovRepMutation.mutate({
                  id: info.row.original.id,
                  isActive: info.row.original.isActive,
                })
              }
            >
              {info.row.original.isActive ? 'Deactivate' : 'Reactivate'}
            </Button>
          </div>
        ),
      },
    ],
    [deleteGovRepMutation]
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
      {
        id: 'actions',
        header: 'Actions',
        cell: (info) => (
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              appearance="subtle"
              icon={<Edit20Regular />}
              onClick={() => setEditingTag(info.row.original)}
            >
              Edit
            </Button>
            <Button
              appearance="subtle"
              icon={<Delete20Regular />}
              onClick={() =>
                deleteTagMutation.mutate({
                  id: info.row.original.id,
                  isActive: info.row.original.isActive,
                })
              }
            >
              {info.row.original.isActive ? 'Deactivate' : 'Reactivate'}
            </Button>
          </div>
        ),
      },
    ],
    [deleteTagMutation]
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
      {
        id: 'actions',
        header: 'Actions',
        cell: (info) => (
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              appearance="subtle"
              icon={<Edit20Regular />}
              onClick={() => setEditingMinistry(info.row.original)}
            >
              Edit
            </Button>
            <Button
              appearance="subtle"
              icon={<Delete20Regular />}
              onClick={() =>
                deleteMinistryMutation.mutate({
                  id: info.row.original.id,
                  isActive: info.row.original.isActive,
                })
              }
            >
              {info.row.original.isActive ? 'Deactivate' : 'Reactivate'}
            </Button>
          </div>
        ),
      },
    ],
    [deleteMinistryMutation]
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
      {
        id: 'actions',
        header: 'Actions',
        cell: (info) => (
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              appearance="subtle"
              icon={<Edit20Regular />}
              onClick={() => setEditingStatus(info.row.original)}
            >
              Edit
            </Button>
            <Button
              appearance="subtle"
              icon={<Delete20Regular />}
              onClick={() =>
                deleteStatusMutation.mutate({
                  id: info.row.original.id,
                  isActive: info.row.original.isActive,
                })
              }
            >
              {info.row.original.isActive ? 'Deactivate' : 'Reactivate'}
            </Button>
          </div>
        ),
      },
    ],
    [deleteStatusMutation]
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
      {
        id: 'actions',
        header: 'Actions',
        cell: (info) => (
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              appearance="subtle"
              icon={<Edit20Regular />}
              onClick={() => setEditingTheme(info.row.original)}
            >
              Edit
            </Button>
            <Button
              appearance="subtle"
              icon={<Delete20Regular />}
              onClick={() =>
                deleteThemeMutation.mutate({
                  id: info.row.original.id,
                  isActive: info.row.original.isActive,
                })
              }
            >
              {info.row.original.isActive ? 'Deactivate' : 'Reactivate'}
            </Button>
          </div>
        ),
      },
    ],
    [deleteThemeMutation]
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

      <AddModal
        open={!!editingCategory}
        onClose={() => setEditingCategory(null)}
        onSubmit={(data) =>
          updateCategoryMutation.mutate({ ...data, id: editingCategory?.id })
        }
        title="Edit Category"
        initialData={editingCategory || undefined}
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

      <AddModal
        open={!!editingCity}
        onClose={() => setEditingCity(null)}
        onSubmit={(data) =>
          updateCityMutation.mutate({ ...data, id: editingCity?.id })
        }
        title="Edit City"
        initialData={editingCity || undefined}
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

      <AddModal
        open={!!editingCommsMaterial}
        onClose={() => setEditingCommsMaterial(null)}
        onSubmit={(data) =>
          updateCommsMaterialMutation.mutate({
            ...data,
            id: editingCommsMaterial?.id,
          })
        }
        title="Edit Communication Material"
        initialData={editingCommsMaterial || undefined}
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

      <AddModal
        open={!!editingGovRep}
        onClose={() => setEditingGovRep(null)}
        onSubmit={(data) =>
          updateGovRepMutation.mutate({ ...data, id: editingGovRep?.id })
        }
        title="Edit Government Representative"
        initialData={editingGovRep || undefined}
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

      <AddModal
        open={!!editingTag}
        onClose={() => setEditingTag(null)}
        onSubmit={(data) =>
          updateTagMutation.mutate({ ...data, id: editingTag?.id })
        }
        title="Edit HQ Tag"
        initialData={editingTag || undefined}
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

      <AddModal
        open={!!editingMinistry}
        onClose={() => setEditingMinistry(null)}
        onSubmit={(data) =>
          updateMinistryMutation.mutate({ ...data, id: editingMinistry?.id })
        }
        title="Edit Ministry"
        initialData={editingMinistry || undefined}
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

      <AddModal
        open={!!editingStatus}
        onClose={() => setEditingStatus(null)}
        onSubmit={(data) =>
          updateStatusMutation.mutate({ ...data, id: editingStatus?.id })
        }
        title="Edit Status"
        initialData={editingStatus || undefined}
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

      <AddModal
        open={!!editingTheme}
        onClose={() => setEditingTheme(null)}
        onSubmit={(data) =>
          updateThemeMutation.mutate({ ...data, id: editingTheme?.id })
        }
        title="Edit Theme"
        initialData={editingTheme || undefined}
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
