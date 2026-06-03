import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Megaphone } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect, useMemo, useRef, useState } from 'react';

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
import { showErrorToast, showSuccessToast } from '@/lib/error-toast';

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
    <span class="text-sm font-medium whitespace-nowrap">Notice</span>
  </div>
  <div class="flex-1 text-sm px-4 hidden md:block">
    Default banner content.
  </div>
  <a href="#" onclick="window.open('#', '_blank')" class="inline-flex items-center justify-center bg-white text-slate-900 border border-slate-200 px-2 py-0.5 rounded-sm text-sm font-semibold hover:bg-slate-100 no-underline align-middle leading-none">Link</a>
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
  { name: 'Golden amber (Default)', bg: '#E6A635', text: '#000000' },
  { name: 'BC blue', bg: '#003366', text: '#FFFFFF' },
  { name: 'Emergency red', bg: '#DC2626', text: '#FFFFFF' },
  { name: 'Success green', bg: '#059669', text: '#FFFFFF' },
  { name: 'Warning orange', bg: '#EA580C', text: '#FFFFFF' },
  { name: 'Info blue', bg: '#0284C7', text: '#FFFFFF' },
];

/**
 * Small ready-made action button snippet used by the Insert helper
 */
const ACTION_BUTTON_SNIPPET = `<a href="#" onclick="window.open('#', '_blank')" class="inline-flex items-center justify-center bg-white text-slate-900 border border-slate-200 px-3 py-0.5 rounded-md text-sm font-semibold hover:bg-slate-100 no-underline align-middle leading-none text-center">Action</a>`;

/**
 * Insert the action button inside the centered content div when possible.
 * Targets a div whose class contains `flex-1` (matches DEFAULT_BANNER_CONTENT).
 * Falls back to inserting inside the outer items-center row, or appending.
 */
export function insertActionIntoContent(content: string) {
  // match: <div ... class="... flex-1 ...">CONTENT</div>
  const containerRe =
    /(<div[^>]*class="[^"]*\bflex-1\b[^"]*"[^>]*>)([\s\S]*?)(<\/div>)/i;
  if (containerRe.test(content)) {
    return content.replace(containerRe, `$1$2 ${ACTION_BUTTON_SNIPPET}$3`);
  }

  // fallback: match an outer row with items-center (the top-level flex row)
  const rowRe =
    /(<div[^>]*class="[^"]*\bitems-center\b[^"]*"[^>]*>)([\s\S]*?)(<\/div>)/i;
  if (rowRe.test(content)) {
    return content.replace(rowRe, `$1$2 ${ACTION_BUTTON_SNIPPET}$3`);
  }

  // final fallback: append to the end
  return `${content}\n${ACTION_BUTTON_SNIPPET}`;
}
function applyColorPreset(preset: (typeof COLOR_PRESETS)[0], setFormData: any) {
  // Update both background and text colour from preset
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
    backgroundColor: banner.backgroundColor ?? '#E6A635',
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
    backgroundColor: formData.backgroundColor ?? '#f4f3f2f3',
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
  const contentRef = useRef<HTMLDivElement | null>(null);

  // Keep the uncontrolled contentEditable in sync when switching modes
  useEffect(() => {
    if (editorMode === 'wysiwyg' && contentRef.current) {
      if (contentRef.current.innerHTML !== formData.content) {
        contentRef.current.innerHTML = formData.content;
      }
    }
  }, [editorMode, formData.content]);

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
      // Preserve existing background colour from loaded settings; the admin no longer edits it
      upsertBannerSettings(toRequestBody(data)),
    onSuccess: (savedBanner) => {
      queryClient.setQueryData(['banner', 'settings'], savedBanner);
      void queryClient.invalidateQueries({ queryKey: ['banner', 'active'] });
      showSuccessToast('Banner settings saved');
    },
    onError: (err) => {
      showErrorToast(err);
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
      title="System banner"
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
              Save banner
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
              <Label htmlFor="banner-content">Banner content</Label>
              <div className="flex gap-2">
                {canManage && (
                  <>
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

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFormData((current) => ({
                          ...current,
                          content: insertActionIntoContent(current.content),
                        }));
                        // If switching to Visual mode, reflect change immediately
                        if (editorMode === 'wysiwyg') {
                          setEditorMode('wysiwyg');
                        }
                      }}
                      className="rounded-md"
                    >
                      Insert action
                    </Button>
                  </>
                )}
              </div>
            </div>

            {editorMode === 'wysiwyg' ? (
              <div
                ref={contentRef}
                contentEditable={canManage}
                suppressContentEditableWarning
                onInput={() =>
                  handleFieldChange(
                    'content',
                    contentRef.current?.innerHTML ?? ''
                  )
                }
                className={`min-h-[120px] rounded border p-2 ${!canManage ? 'pointer-events-none bg-slate-50' : ''}`}
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

          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="banner-bg-color">Background color</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="banner-bg-color"
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
              <Label htmlFor="banner-text-color">Text color</Label>
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
              <Label htmlFor="banner-dismiss-scope">Dismiss scope</Label>
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
              <Label htmlFor="banner-start">Start date / time</Label>
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
              <Label htmlFor="banner-end">End date / time</Label>
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
              <SystemBanner banner={previewBanner} />
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
