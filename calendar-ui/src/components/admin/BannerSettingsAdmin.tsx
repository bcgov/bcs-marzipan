import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Megaphone } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect, useMemo, useState } from 'react';

import { PERMISSIONS, SYSTEM_ROLE_IDS } from '@corpcal/shared';
import type {
  BannerSettings,
  UpsertBannerSettingsBody,
} from '@corpcal/shared/api/types';
import { fetchBannerSettings, upsertBannerSettings } from '@/api/bannerApi';
import { AdminSection } from '@/components/admin';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { usePermission } from '@/hooks/usePermissions';

import { SystemBanner } from '../layout/SystemBanner';

type BannerFormData = {
  isActive: boolean;
  content: string;
  backgroundColor: string;
  textColor: string;
  isDismissible: boolean;
  variant: 'info' | 'warning' | 'success';
  dismissScope: 'persistent' | 'session';
  startDateTime: string;
  endDateTime: string;
};

const DEFAULT_FORM_DATA: BannerFormData = {
  isActive: false,
  content: '',
  backgroundColor: '#E6A635',
  textColor: '#000000',
  isDismissible: true,
  variant: 'info',
  dismissScope: 'persistent',
  startDateTime: '',
  endDateTime: '',
};

function toLocalDateTimeValue(value: string | null): string {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  const pad = (num: number) => String(num).padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toFormData(banner: BannerSettings | null): BannerFormData {
  if (!banner) {
    return DEFAULT_FORM_DATA;
  }

  return {
    isActive: banner.isActive,
    content: banner.content,
    backgroundColor: banner.backgroundColor,
    textColor: banner.textColor,
    isDismissible: banner.isDismissible,
    variant: banner.variant ?? 'info',
    dismissScope: banner.dismissScope ?? 'persistent',
    startDateTime: toLocalDateTimeValue(banner.startDateTime),
    endDateTime: toLocalDateTimeValue(banner.endDateTime),
  };
}

function toRequestBody(formData: BannerFormData): UpsertBannerSettingsBody {
  return {
    isActive: formData.isActive,
    content: formData.content.trim(),
    backgroundColor: formData.backgroundColor,
    textColor: formData.textColor,
    variant: formData.variant,
    isDismissible: formData.isDismissible,
    dismissScope: formData.dismissScope,
    startDateTime: formData.startDateTime
      ? new Date(formData.startDateTime).toISOString()
      : null,
    endDateTime: formData.endDateTime
      ? new Date(formData.endDateTime).toISOString()
      : null,
  };
}

export function BannerSettingsAdmin() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const hasSettingsManage = usePermission(PERMISSIONS.SETTINGS.MANAGE);
  const isSystemAdmin = user?.roleId === SYSTEM_ROLE_IDS.SYSTEM_ADMIN;
  const canManage = hasSettingsManage && isSystemAdmin;
  const [formData, setFormData] = useState<BannerFormData>(DEFAULT_FORM_DATA);

  const {
    data: bannerSettings,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['banner', 'settings'],
    queryFn: fetchBannerSettings,
    retry: false,
  });

  const initialFormData = useMemo(
    () => toFormData(bannerSettings ?? null),
    [bannerSettings]
  );

  useEffect(() => {
    setFormData(initialFormData);
  }, [initialFormData]);

  const hasChanges = useMemo(
    () => JSON.stringify(formData) !== JSON.stringify(initialFormData),
    [formData, initialFormData]
  );

  const previewBanner = useMemo<BannerSettings | null>(() => {
    if (!formData.content.trim()) {
      return null;
    }

    return {
      id: bannerSettings?.id ?? 0,
      isActive: formData.isActive,
      content: formData.content,
      backgroundColor: formData.backgroundColor,
      textColor: formData.textColor,
      variant: formData.variant,
      isDismissible: formData.isDismissible,
      dismissScope: formData.dismissScope,
      startDateTime: formData.startDateTime
        ? new Date(formData.startDateTime).toISOString()
        : null,
      endDateTime: formData.endDateTime
        ? new Date(formData.endDateTime).toISOString()
        : null,
      createdDateTime:
        bannerSettings?.createdDateTime ?? new Date().toISOString(),
      lastUpdatedDateTime:
        bannerSettings?.lastUpdatedDateTime ?? new Date().toISOString(),
    };
  }, [bannerSettings, formData]);

  const saveMutation = useMutation({
    mutationFn: (data: BannerFormData) =>
      upsertBannerSettings(toRequestBody(data)),
    onSuccess: (savedBanner) => {
      queryClient.setQueryData(['banner', 'settings'], savedBanner);
      void queryClient.invalidateQueries({ queryKey: ['banner', 'active'] });
      toast.success('Banner settings saved');
    },
    onError: (err) => {
      const message =
        err instanceof Error ? err.message : 'Failed to save banner settings';
      toast.error(message);
    },
  });

  const handleFieldChange = <K extends keyof BannerFormData>(
    key: K,
    value: BannerFormData[K]
  ) => {
    setFormData((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleReset = () => {
    setFormData(initialFormData);
  };

  const handleSave = () => {
    if (!formData.content.trim()) {
      toast.error('Banner content cannot be empty');
      return;
    }

    if (
      formData.startDateTime &&
      formData.endDateTime &&
      new Date(formData.endDateTime) <= new Date(formData.startDateTime)
    ) {
      toast.error('End date/time must be after start date/time');
      return;
    }

    saveMutation.mutate(formData);
  };

  // Hide the entire admin section for non-System-Admin users
  if (!isSystemAdmin) {
    return null;
  }

  return (
    <AdminSection
      title="System Banner"
      description="Manage the dismissible info banner shown at the top of the app for all signed-in users."
      isLoading={isLoading}
      headerAction={
        canManage ? (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={!hasChanges || saveMutation.isPending}
            >
              Reset
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={!hasChanges || saveMutation.isPending}
            >
              Save Banner
            </Button>
          </div>
        ) : null
      }
    >
      {error && (
        <div className="text-destructive mb-4 text-sm">
          Error loading banner settings.
        </div>
      )}

      {!canManage && (
        <div className="mb-4 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
          You can view the current banner configuration, but only System Admin
          users can update it.
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
        <div className="space-y-5">
          <div className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
            <Megaphone className="h-5 w-5 text-slate-600" />
            <div className="text-sm text-slate-700">
              Dismissals are stored locally in the browser and reset when the
              banner is updated.
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="banner-content">Banner Content</Label>
            <Textarea
              id="banner-content"
              rows={8}
              value={formData.content}
              onChange={(event) =>
                handleFieldChange('content', event.target.value)
              }
              disabled={!canManage}
              placeholder="Enter HTML to display in the banner, for example: <strong>Important:</strong> Service will be unavailable from 6-7 PM."
            />
            <p className="text-sm text-slate-600">
              Supports safe HTML such as paragraphs, links, bold, italics,
              lists, and line breaks. Scripts and unsafe markup are removed
              automatically.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="banner-background-color">Background Color</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="banner-background-color"
                  type="color"
                  value={formData.backgroundColor}
                  onChange={(event) =>
                    handleFieldChange('backgroundColor', event.target.value)
                  }
                  disabled={!canManage}
                  className="h-10 w-16 cursor-pointer p-1"
                />
                <Input
                  type="text"
                  value={formData.backgroundColor}
                  onChange={(event) =>
                    handleFieldChange('backgroundColor', event.target.value)
                  }
                  disabled={!canManage}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="banner-text-color">Text Color</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="banner-text-color"
                  type="color"
                  value={formData.textColor}
                  onChange={(event) =>
                    handleFieldChange('textColor', event.target.value)
                  }
                  disabled={!canManage}
                  className="h-10 w-16 cursor-pointer p-1"
                />
                <Input
                  type="text"
                  value={formData.textColor}
                  onChange={(event) =>
                    handleFieldChange('textColor', event.target.value)
                  }
                  disabled={!canManage}
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="banner-variant">Variant</Label>
              <select
                id="banner-variant"
                value={formData.variant}
                onChange={(e) =>
                  handleFieldChange('variant', e.target.value as any)
                }
                disabled={!canManage}
                className="w-full rounded border p-2"
              >
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="success">Success</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="banner-dismiss-scope">Dismiss Scope</Label>
              <select
                id="banner-dismiss-scope"
                value={formData.dismissScope}
                onChange={(e) =>
                  handleFieldChange('dismissScope', e.target.value as any)
                }
                disabled={!canManage}
                className="w-full rounded border p-2"
              >
                <option value="persistent">Persistent (local)</option>
                <option value="session">Session (tab only)</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="banner-start">Start Date / Time</Label>
              <Input
                id="banner-start"
                type="datetime-local"
                value={formData.startDateTime}
                onChange={(event) =>
                  handleFieldChange('startDateTime', event.target.value)
                }
                disabled={!canManage}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="banner-end">End Date / Time</Label>
              <Input
                id="banner-end"
                type="datetime-local"
                value={formData.endDateTime}
                onChange={(event) =>
                  handleFieldChange('endDateTime', event.target.value)
                }
                disabled={!canManage}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex items-start gap-3 rounded-md border border-slate-200 p-3">
              <Checkbox
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  handleFieldChange('isActive', checked === true)
                }
                disabled={!canManage}
              />
              <div className="space-y-1">
                <div className="text-sm font-medium text-slate-900">
                  Banner Active
                </div>
                <div className="text-sm text-slate-600">
                  Show the banner to users when the schedule allows it.
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 rounded-md border border-slate-200 p-3">
              <Checkbox
                checked={formData.isDismissible}
                onCheckedChange={(checked) =>
                  handleFieldChange('isDismissible', checked === true)
                }
                disabled={!canManage}
              />
              <div className="space-y-1">
                <div className="text-sm font-medium text-slate-900">
                  Dismissible
                </div>
                <div className="text-sm text-slate-600">
                  Let users hide the banner in their current browser.
                </div>
              </div>
            </label>
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-sm font-medium text-slate-900">Preview</div>
          {previewBanner ? (
            <div className="overflow-hidden rounded-md border border-slate-200">
              <SystemBanner banner={previewBanner} compact />
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-slate-300 p-6 text-sm text-slate-500">
              Add banner HTML to preview how it will look.
            </div>
          )}
        </div>
      </div>
    </AdminSection>
  );
}
