import {
  CategoriesAdmin,
  CitiesAdmin,
  CommsMaterialsAdmin,
  GovernmentRepresentativesAdmin,
  TagsAdmin,
  MinistriesAdmin,
  ActivityStatusesAdmin,
  ThemesAdmin,
} from '@/components/admin/LookupAdmins';
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
  FolderTree,
  MapPin,
  FileText,
  Users,
  Tag,
  Building2,
  Activity,
  Palette,
} from 'lucide-react';

type Section =
  | 'categories'
  | 'cities'
  | 'comms'
  | 'representatives'
  | 'tags'
  | 'ministries'
  | 'statuses'
  | 'themes';

const sections = [
  { id: 'categories' as Section, label: 'Categories', icon: FolderTree },
  { id: 'cities' as Section, label: 'Cities', icon: MapPin },
  { id: 'comms' as Section, label: 'Communications Materials', icon: FileText },
  {
    id: 'representatives' as Section,
    label: 'Government Representatives',
    icon: Users,
  },
  { id: 'tags' as Section, label: 'Tags', icon: Tag },
  { id: 'ministries' as Section, label: 'Ministries', icon: Building2 },
  { id: 'statuses' as Section, label: 'Activity Statuses', icon: Activity },
  { id: 'themes' as Section, label: 'Themes', icon: Palette },
];

/**
 * Modern Settings Page
 * Manages all lookup data with a clean, organized interface.
 * Features quick navigation and modular admin sections.
 */
export function Settings() {
  const scrollToSection = (sectionId: Section) => {
    const element = document.getElementById(`section-${sectionId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="mx-auto max-w-7xl px-6 py-6">
        <h1 className="mb-2 text-2xl font-bold text-slate-900 sm:text-3xl">
          Settings & Configuration
        </h1>
        <p className="text-sm text-slate-600 sm:text-base">
          Manage lookup data and system configuration
        </p>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Quick Navigation */}
        <div
          id="quick-navigation"
          className="mb-8 rounded-lg border border-slate-200 bg-white shadow-sm"
        >
          <div className="border-b border-slate-200 p-4 sm:p-6">
            <h2 className="mb-2 text-lg font-semibold text-slate-900">
              Quick Navigation
            </h2>
            <p className="text-sm text-slate-600">Jump to any admin section</p>
          </div>
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <a
                    key={section.id}
                    href={`#section-${section.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection(section.id);
                    }}
                    className="flex items-center gap-2 rounded-lg p-2 text-sm text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-800"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{section.label}</span>
                  </a>
                );
              })}
            </div>
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
        </div>

        {/* Admin Sections */}
        <div className="space-y-8">
          <div id="section-categories">
            <CategoriesAdmin />
          </div>

          <div id="section-cities">
            <CitiesAdmin />
          </div>

          <div id="section-comms">
            <CommsMaterialsAdmin />
          </div>

          <div id="section-representatives">
            <GovernmentRepresentativesAdmin />
          </div>

          <div id="section-tags">
            <TagsAdmin />
          </div>

          <div id="section-ministries">
            <MinistriesAdmin />
          </div>

          <div id="section-statuses">
            <ActivityStatusesAdmin />
          </div>

          <div id="section-themes">
            <ThemesAdmin />
          </div>
        </div>
      </div>
    </div>
  );
}
