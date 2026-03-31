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

/**
 * Default banner content including an action button (matches media-hub-app)
 */
const DEFAULT_BANNER_CONTENT = `<div class="flex items-center justify-between">
  <div class="flex items-center space-x-2">
    <svg class="w-5 h-5 text-black flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2L22 20H2L12 2Z" fill="currentColor"/>
      <path d="M12 18C12.5523 18 13 17.5523 13 17C13 16.4477 12.5523 16 12 16C11.4477 16 11 16.4477 11 17C11 17.5523 11.4477 18 12 18Z" fill="white"/>
      <path d="M11 8V14H13V8H11Z" fill="white"/>
    </svg>
    <span class="text-sm font-medium whitespace-nowrap">Notice</span>
  </div>
  <div class="flex-1 text-sm px-4 hidden md:block">
    If you experience any issues or have suggestions, please share them in the <a href="#" class="underline text-amber-800 hover:text-amber-900" target="_blank" rel="noopener noreferrer">support channel</a>.
  </div>
  <button onclick="window.open('#', '_blank')" class="px-3 py-1 bg-white text-amber-600 border-none rounded text-sm font-medium hover:bg-gray-50 flex-shrink-0">
    Feedback
  </button>
</div>`;

const DEFAULT_FORM_DATA: BannerFormData = {
  isActive: false,
  content: DEFAULT_BANNER_CONTENT,
  backgroundColor: '#E6A635',
  textColor: '#000000',
  isDismissible: true,
  variant: 'info',
  dismissScope: 'persistent',
  startDateTime: '',
  endDateTime: '',
};

/**
 * Quick color presets to match media-hub-app for consistency across apps
 */
const COLOR_PRESETS = [
  { name: 'Golden Amber (Default)', bg: '#E6A635', text: '#000000' },
  { name: 'BC Blue', bg: '#003366', text: '#FFFFFF' },
  { name: 'Emergency Red', bg: '#DC2626', text: '#FFFFFF' },
  { name: 'Success Green', bg: '#059669', text: '#FFFFFF' },
  { name: 'Warning Orange', bg: '#EA580C', text: '#FFFFFF' },
  { name: 'Info Blue', bg: '#0284C7', text: '#FFFFFF' },
];

function applyColorPreset(preset: (typeof COLOR_PRESETS)[0], setFormData: any) {
  setFormData((current: BannerFormData) => ({
    ...current,
    backgroundColor: preset.bg,
    textColor: preset.text,
  }));
}

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
  const [editorMode, setEditorMode] = useState<'wysiwyg' | 'html'>('html');

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
            <div className="flex items-center justify-between">
              <Label htmlFor="banner-content">Banner Content</Label>
              <div className="flex gap-2">
                {canManage && (
                  <div className="flex overflow-hidden rounded-md border">
                    <Button
                      type="button"
                      variant={editorMode === 'wysiwyg' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => {
                        if (editorMode === 'html') {
                          const hasComplexHtml =
                            /<(svg|button|script|style|iframe|form|input|select|textarea)/i.test(
                              formData.content
                            );
                          if (hasComplexHtml) {
                            if (
                              !window.confirm(
                                'Warning: Visual mode will simplify complex HTML elements like SVGs, buttons, and custom layouts. Continue?'
                              )
                            ) {
                              return;
                            }
                          }
                        }
                        setEditorMode('wysiwyg');
                      }}
                      className="rounded-none"
                    >
                      Visual
                    </Button>
                    <Button
                      type="button"
                      variant={editorMode === 'html' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setEditorMode('html')}
                      className="rounded-none"
                    >
                      HTML
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {editorMode === 'wysiwyg' ? (
              <div
                contentEditable={canManage}
                suppressContentEditableWarning
                onInput={(e) =>
                  handleFieldChange(
                    'content',
                    (e.target as HTMLDivElement).innerHTML
                  )
                }
                className={`min-h-[120px] rounded border p-2 ${!canManage ? 'pointer-events-none bg-slate-50' : ''}`}
                dangerouslySetInnerHTML={{ __html: formData.content }}
              />
            ) : (
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
            )}

            <p className="text-sm text-slate-600">
              {editorMode === 'wysiwyg'
                ? 'Use the visual editor for simple formatting. Complex elements like buttons or SVGs may be simplified when switching to Visual mode — use HTML mode to add action buttons.'
                : 'Edit raw HTML directly. Use HTML mode to add action buttons or other complex elements; unsafe markup is removed automatically.'}
            </p>
          </div>

          {canManage && (
            <div className="space-y-4">
              <div className="mb-3 flex items-center gap-2">
                <div className="text-sm font-medium text-slate-900">
                  Color Presets
                </div>
              </div>

              <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {COLOR_PRESETS.map((preset, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => applyColorPreset(preset, setFormData)}
                    className="flex items-center gap-2 rounded border p-2 text-xs hover:bg-gray-50"
                  >
                    <div
                      className="h-4 w-4 rounded"
                      style={{ backgroundColor: preset.bg }}
                    />
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          )}

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
