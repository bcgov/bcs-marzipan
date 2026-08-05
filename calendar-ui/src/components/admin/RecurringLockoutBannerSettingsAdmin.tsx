import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PencilOff } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect, useMemo, useRef, useState } from 'react';

import { PERMISSIONS, SYSTEM_ROLE_IDS } from '@corpcal/shared';
import type {
  RecurringLockoutBannerSettings,
  UpsertRecurringLockoutBannerSettingsBody,
} from '@corpcal/shared/api/types';
import {
  BANNER_CONTENT_MAX_LENGTH,
  DEFAULT_RECURRING_EDIT_LOCKOUT_BANNER_LEAD_MINUTES,
  DEFAULT_RECURRING_EDIT_LOCKOUT_END_TIME,
  DEFAULT_RECURRING_EDIT_LOCKOUT_EXEMPT_ROLE_IDS,
  DEFAULT_RECURRING_EDIT_LOCKOUT_START_TIME,
} from '@corpcal/shared/schemas';
import {
  fetchRecurringLockoutBannerSettings,
  upsertRecurringLockoutBannerSettings,
} from '@/api/bannerApi';
import { SystemBanner } from '@/components/layout/SystemBanner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { usePermission } from '@/hooks/usePermissions';
import { showErrorToast, showSuccessToast } from '@/lib/error-toast';

import { AdminSection } from './AdminSection';

type RecurringLockoutFormData = {
  isActive: boolean;
  content: string;
  backgroundColor: string;
  textColor: string;
  variant: 'info' | 'warning' | 'success';
  startTimeOfDay: string;
  endTimeOfDay: string;
  bannerLeadMinutes: number;
  exemptRoleIdsInput: string;
};

const DEFAULT_FORM_DATA: RecurringLockoutFormData = {
  isActive: false,
  content: 'Editing activities is currently locked for non-exempt users.',
  backgroundColor: '#E6A635',
  textColor: '#000000',
  variant: 'warning',
  startTimeOfDay: DEFAULT_RECURRING_EDIT_LOCKOUT_START_TIME,
  endTimeOfDay: DEFAULT_RECURRING_EDIT_LOCKOUT_END_TIME,
  bannerLeadMinutes: DEFAULT_RECURRING_EDIT_LOCKOUT_BANNER_LEAD_MINUTES,
  exemptRoleIdsInput: DEFAULT_RECURRING_EDIT_LOCKOUT_EXEMPT_ROLE_IDS.join(', '),
};

function toFormData(
  settings: RecurringLockoutBannerSettings | null
): RecurringLockoutFormData {
  if (!settings) {
    return DEFAULT_FORM_DATA;
  }

  return {
    isActive: settings.isActive,
    content: settings.content,
    backgroundColor: settings.backgroundColor,
    textColor: settings.textColor,
    variant: settings.variant,
    startTimeOfDay: settings.startTimeOfDay,
    endTimeOfDay: settings.endTimeOfDay,
    bannerLeadMinutes: settings.bannerLeadMinutes,
    exemptRoleIdsInput: settings.exemptRoleIds.join(', '),
  };
}

function parseExemptRoleIds(input: string): number[] {
  if (!input.trim()) {
    return [];
  }

  const parsed = input
    .split(',')
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isInteger(value) && value > 0);

  return [...new Set(parsed)];
}

function toRequestBody(
  formData: RecurringLockoutFormData
): UpsertRecurringLockoutBannerSettingsBody {
  return {
    isActive: formData.isActive,
    content: formData.content.trim(),
    backgroundColor: formData.backgroundColor,
    textColor: formData.textColor,
    variant: formData.variant,
    startTimeOfDay: formData.startTimeOfDay,
    endTimeOfDay: formData.endTimeOfDay,
    bannerLeadMinutes: formData.bannerLeadMinutes,
    exemptRoleIds: parseExemptRoleIds(formData.exemptRoleIdsInput),
  };
}

export function RecurringLockoutBannerSettingsAdmin() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const hasSettingsManage = usePermission(PERMISSIONS.SETTINGS.MANAGE);
  const isSystemAdmin = user?.roleId === SYSTEM_ROLE_IDS.SYSTEM_ADMIN;
  const canManage = hasSettingsManage && isSystemAdmin;

  if (!isSystemAdmin) {
    return null;
  }

  return (
    <RecurringLockoutBannerSettingsAdminInner
      canManage={canManage}
      queryClient={queryClient}
    />
  );
}

function RecurringLockoutBannerSettingsAdminInner({
  canManage,
  queryClient,
}: {
  canManage: boolean;
  queryClient: ReturnType<typeof useQueryClient>;
}) {
  const [formData, setFormData] =
    useState<RecurringLockoutFormData>(DEFAULT_FORM_DATA);
  const lastContentLimitToastAtRef = useRef(0);

  const {
    data: settings,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['banner', 'recurring-lockout', 'settings'],
    queryFn: fetchRecurringLockoutBannerSettings,
    retry: false,
  });

  const initialFormData = useMemo(
    () => toFormData(settings ?? null),
    [settings]
  );

  useEffect(() => {
    setFormData(initialFormData);
  }, [initialFormData]);

  const hasChanges = useMemo(
    () => JSON.stringify(formData) !== JSON.stringify(initialFormData),
    [formData, initialFormData]
  );

  const previewBanner = useMemo(() => {
    if (!formData.content.trim()) {
      return null;
    }

    return {
      id: settings?.id ?? 0,
      isActive: formData.isActive,
      content: formData.content,
      backgroundColor: formData.backgroundColor,
      textColor: formData.textColor,
      variant: formData.variant,
      isDismissible: false,
      dismissScope: 'persistent' as const,
      startDateTime: null,
      endDateTime: null,
      createdDateTime: settings?.createdDateTime ?? new Date().toISOString(),
      lastUpdatedDateTime:
        settings?.lastUpdatedDateTime ?? new Date().toISOString(),
    };
  }, [formData, settings]);

  const saveMutation = useMutation({
    mutationFn: (data: RecurringLockoutFormData) =>
      upsertRecurringLockoutBannerSettings(toRequestBody(data)),
    onSuccess: (saved) => {
      queryClient.setQueryData(
        ['banner', 'recurring-lockout', 'settings'],
        saved
      );
      void queryClient.invalidateQueries({
        queryKey: ['banner', 'recurring-lockout', 'active'],
      });
      showSuccessToast('Recurring lockout settings saved');
    },
    onError: (err) => {
      showErrorToast(err);
    },
  });

  const notifyContentLimitExceeded = () => {
    const now = Date.now();
    if (now - lastContentLimitToastAtRef.current > 1200) {
      toast.error(
        `Banner content must be ${BANNER_CONTENT_MAX_LENGTH} characters or fewer`,
        { id: 'recurring-lockout-banner-content-max-length' }
      );
      lastContentLimitToastAtRef.current = now;
    }
  };

  const handleReset = () => {
    setFormData(initialFormData);
  };

  const handleSave = () => {
    const trimmed = formData.content.trim();
    if (!trimmed) {
      toast.error('Banner content cannot be empty');
      return;
    }

    if (trimmed.length > BANNER_CONTENT_MAX_LENGTH) {
      toast.error(
        `Banner content must be ${BANNER_CONTENT_MAX_LENGTH} characters or fewer`
      );
      return;
    }

    if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(formData.startTimeOfDay)) {
      toast.error('Start time must be in HH:mm format');
      return;
    }

    if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(formData.endTimeOfDay)) {
      toast.error('End time must be in HH:mm format');
      return;
    }

    if (formData.endTimeOfDay <= formData.startTimeOfDay) {
      toast.error('End time must be after start time');
      return;
    }

    if (formData.bannerLeadMinutes < 0 || formData.bannerLeadMinutes > 1440) {
      toast.error('Banner lead minutes must be between 0 and 1440');
      return;
    }

    saveMutation.mutate({
      ...formData,
      content: trimmed,
    });
  };

  return (
    <AdminSection
      title="Recurring edit lockout"
      description="Configure a recurring lockout window, exempt roles, and the warning banner shown before lockout starts."
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
              Save
            </Button>
          </div>
        ) : null
      }
    >
      {error && (
        <div className="text-destructive mb-4 text-sm">
          Error loading recurring lockout settings.
        </div>
      )}

      {!canManage && (
        <div className="mb-4 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
          You can view the current configuration, but only System Admin users
          can update it.
        </div>
      )}

      <div className="space-y-5">
        <div className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
          <PencilOff className="h-5 w-5 text-slate-600" />
          <div className="text-sm text-slate-700">
            Non-exempt users cannot edit activities during the configured
            lockout window.
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-3">
            <Checkbox
              id="recurring-lockout-is-active"
              checked={formData.isActive}
              onCheckedChange={(checked) =>
                setFormData((current) => ({ ...current, isActive: !!checked }))
              }
              disabled={!canManage}
            />
            <Label htmlFor="recurring-lockout-is-active">Active</Label>
          </div>
          <div>
            <Label className="text-sm font-medium text-slate-900">
              Current Status
            </Label>
            <p className="mt-1 text-sm text-slate-600">
              Recurring lockout is currently{' '}
              {formData.isActive ? 'active' : 'inactive'}.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="lockout-start-time">Start time (Pacific)</Label>
            <Input
              id="lockout-start-time"
              type="time"
              value={formData.startTimeOfDay}
              onChange={(e) =>
                setFormData((current) => ({
                  ...current,
                  startTimeOfDay: e.target.value,
                }))
              }
              disabled={!canManage}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lockout-end-time">End time (Pacific)</Label>
            <Input
              id="lockout-end-time"
              type="time"
              value={formData.endTimeOfDay}
              onChange={(e) =>
                setFormData((current) => ({
                  ...current,
                  endTimeOfDay: e.target.value,
                }))
              }
              disabled={!canManage}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="banner-lead-minutes">Banner lead minutes</Label>
            <Input
              id="banner-lead-minutes"
              type="number"
              min={0}
              max={1440}
              value={formData.bannerLeadMinutes}
              onChange={(e) =>
                setFormData((current) => ({
                  ...current,
                  bannerLeadMinutes: Number(e.target.value || 0),
                }))
              }
              disabled={!canManage}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="exempt-role-ids">
            Exempt role IDs (comma-separated)
          </Label>
          <Input
            id="exempt-role-ids"
            value={formData.exemptRoleIdsInput}
            onChange={(e) =>
              setFormData((current) => ({
                ...current,
                exemptRoleIdsInput: e.target.value,
              }))
            }
            disabled={!canManage}
            placeholder="1, 2"
          />
          <p className="text-xs text-slate-500">
            Enter numeric role IDs, separated by commas. Leave empty for no
            exemptions.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="lockout-banner-content">Banner content</Label>
          <Textarea
            id="lockout-banner-content"
            value={formData.content}
            onChange={(e) => {
              const next = e.target.value;
              if (next.trim().length > BANNER_CONTENT_MAX_LENGTH) {
                notifyContentLimitExceeded();
                return;
              }
              setFormData((current) => ({
                ...current,
                content: next,
              }));
            }}
            disabled={!canManage}
            rows={4}
          />
          <div className="text-xs text-slate-500">
            {formData.content.trim().length} / {BANNER_CONTENT_MAX_LENGTH}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Preview</Label>
          {previewBanner ? (
            <SystemBanner banner={previewBanner} icon={PencilOff} />
          ) : (
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
              Add banner content to preview.
            </div>
          )}
        </div>
      </div>
    </AdminSection>
  );
}
