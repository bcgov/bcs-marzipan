import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PencilOff } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
  DEFAULT_RECURRING_LOCKOUT_ACTIVE_CONTENT,
  DEFAULT_RECURRING_LOCKOUT_LEAD_CONTENT,
  PERMISSIONS,
  RECURRING_LOCKOUT_BANNER_CONTACT_EMAIL_PLACEHOLDER,
  RECURRING_LOCKOUT_BANNER_LOCK_END_TIME_PLACEHOLDER,
  RECURRING_LOCKOUT_BANNER_LOCK_START_TIME_PLACEHOLDER,
  resolveRecurringLockoutBannerContent,
} from '@corpcal/shared';
import type {
  BannerSettings,
  RecurringLockoutBannerSettings,
  UpsertRecurringLockoutBannerSettingsBody,
} from '@corpcal/shared/api/types';
import {
  BANNER_CONTENT_MAX_LENGTH,
  DEFAULT_RECURRING_EDIT_LOCKOUT_BANNER_LEAD_MINUTES,
  DEFAULT_RECURRING_EDIT_LOCKOUT_END_TIME,
  DEFAULT_RECURRING_EDIT_LOCKOUT_START_TIME,
} from '@corpcal/shared/schemas';
import {
  fetchRecurringLockoutBannerSettings,
  upsertRecurringLockoutBannerSettings,
} from '@/api/bannerApi';
import { fetchReportCoverContactSettings } from '@/api/reportCoverContactApi';
import { SystemBanner } from '@/components/layout/SystemBanner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { usePermission } from '@/hooks/usePermissions';
import { RECURRING_LOCKOUT_BANNER_QUERY_KEY } from '@/hooks/useRecurringLockoutBanner';
import { showErrorToast, showSuccessToast } from '@/lib/error-toast';

import { AdminSection } from './AdminSection';

type RecurringLockoutFormData = {
  isActive: boolean;
  leadContent: string;
  activeContent: string;
  backgroundColor: string;
  textColor: string;
  variant: 'info' | 'warning' | 'success';
  startTimeOfDay: string;
  endTimeOfDay: string;
  bannerLeadMinutes: number;
};

const DEFAULT_FORM_DATA: RecurringLockoutFormData = {
  isActive: false,
  leadContent: DEFAULT_RECURRING_LOCKOUT_LEAD_CONTENT,
  activeContent: DEFAULT_RECURRING_LOCKOUT_ACTIVE_CONTENT,
  backgroundColor: '#E6A635',
  textColor: '#000000',
  variant: 'warning',
  startTimeOfDay: DEFAULT_RECURRING_EDIT_LOCKOUT_START_TIME,
  endTimeOfDay: DEFAULT_RECURRING_EDIT_LOCKOUT_END_TIME,
  bannerLeadMinutes: DEFAULT_RECURRING_EDIT_LOCKOUT_BANNER_LEAD_MINUTES,
};

const PLACEHOLDER_HELPER = [
  RECURRING_LOCKOUT_BANNER_LOCK_START_TIME_PLACEHOLDER,
  RECURRING_LOCKOUT_BANNER_LOCK_END_TIME_PLACEHOLDER,
  RECURRING_LOCKOUT_BANNER_CONTACT_EMAIL_PLACEHOLDER,
].join(', ');

function toFormData(
  settings: RecurringLockoutBannerSettings | null
): RecurringLockoutFormData {
  if (!settings) {
    return DEFAULT_FORM_DATA;
  }

  return {
    isActive: settings.isActive,
    leadContent: settings.leadContent,
    activeContent: settings.activeContent,
    backgroundColor: settings.backgroundColor,
    textColor: settings.textColor,
    variant: settings.variant,
    startTimeOfDay: settings.startTimeOfDay,
    endTimeOfDay: settings.endTimeOfDay,
    bannerLeadMinutes: settings.bannerLeadMinutes,
  };
}

function toRequestBody(
  formData: RecurringLockoutFormData
): UpsertRecurringLockoutBannerSettingsBody {
  return {
    isActive: formData.isActive,
    leadContent: formData.leadContent.trim(),
    activeContent: formData.activeContent.trim(),
    backgroundColor: formData.backgroundColor,
    textColor: formData.textColor,
    variant: formData.variant,
    startTimeOfDay: formData.startTimeOfDay,
    endTimeOfDay: formData.endTimeOfDay,
    bannerLeadMinutes: formData.bannerLeadMinutes,
  };
}

function buildPreviewBanner(
  formData: RecurringLockoutFormData,
  settings: RecurringLockoutBannerSettings | null | undefined,
  contactEmail: string,
  content: string
): BannerSettings {
  return {
    id: settings?.id ?? 0,
    isActive: formData.isActive,
    content,
    backgroundColor: formData.backgroundColor,
    textColor: formData.textColor,
    variant: formData.variant,
    isDismissible: false,
    dismissScope: 'persistent',
    startDateTime: null,
    endDateTime: null,
    createdDateTime: settings?.createdDateTime ?? new Date().toISOString(),
    lastUpdatedDateTime:
      settings?.lastUpdatedDateTime ?? new Date().toISOString(),
  };
}

export function RecurringLockoutBannerSettingsAdmin() {
  const canManage = usePermission(
    PERMISSIONS.SETTINGS.MANAGE_RECURRING_LOCKOUT
  );

  if (!canManage) {
    return null;
  }

  return <RecurringLockoutBannerSettingsAdminInner />;
}

function RecurringLockoutBannerSettingsAdminInner() {
  const queryClient = useQueryClient();
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

  const { data: reportCoverContact } = useQuery({
    queryKey: ['settings', 'report-cover-contact'],
    queryFn: fetchReportCoverContactSettings,
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

  const contactEmail = reportCoverContact?.contactEmail ?? '';

  const leadPreviewBanner = useMemo(() => {
    const trimmed = formData.leadContent.trim();
    if (!trimmed) {
      return null;
    }

    const content = resolveRecurringLockoutBannerContent({
      phase: 'lead-up',
      leadContent: trimmed,
      activeContent: formData.activeContent.trim(),
      startTimeOfDay: formData.startTimeOfDay,
      endTimeOfDay: formData.endTimeOfDay,
      contactEmail,
    });

    return buildPreviewBanner(formData, settings, contactEmail, content);
  }, [contactEmail, formData, settings]);

  const activePreviewBanner = useMemo(() => {
    const trimmed = formData.activeContent.trim();
    if (!trimmed) {
      return null;
    }

    const content = resolveRecurringLockoutBannerContent({
      phase: 'active',
      leadContent: formData.leadContent.trim(),
      activeContent: trimmed,
      startTimeOfDay: formData.startTimeOfDay,
      endTimeOfDay: formData.endTimeOfDay,
      contactEmail,
    });

    return buildPreviewBanner(formData, settings, contactEmail, content);
  }, [contactEmail, formData, settings]);

  const saveMutation = useMutation({
    mutationFn: (data: RecurringLockoutFormData) =>
      upsertRecurringLockoutBannerSettings(toRequestBody(data)),
    onSuccess: (saved) => {
      queryClient.setQueryData(
        ['banner', 'recurring-lockout', 'settings'],
        saved
      );
      void queryClient.invalidateQueries({
        queryKey: RECURRING_LOCKOUT_BANNER_QUERY_KEY,
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

  const handleContentChange = (
    field: 'leadContent' | 'activeContent',
    next: string
  ) => {
    if (next.trim().length > BANNER_CONTENT_MAX_LENGTH) {
      notifyContentLimitExceeded();
      return;
    }

    setFormData((current) => ({
      ...current,
      [field]: next,
    }));
  };

  const handleReset = () => {
    setFormData(initialFormData);
  };

  const validateContentField = (value: string, label: string): boolean => {
    const trimmed = value.trim();
    if (!trimmed) {
      toast.error(`${label} cannot be empty`);
      return false;
    }

    if (trimmed.length > BANNER_CONTENT_MAX_LENGTH) {
      toast.error(
        `${label} must be ${BANNER_CONTENT_MAX_LENGTH} characters or fewer`
      );
      return false;
    }

    return true;
  };

  const handleSave = () => {
    if (!validateContentField(formData.leadContent, 'Lead-up banner content')) {
      return;
    }

    if (
      !validateContentField(
        formData.activeContent,
        'Active lockout banner content'
      )
    ) {
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
      leadContent: formData.leadContent.trim(),
      activeContent: formData.activeContent.trim(),
    });
  };

  return (
    <AdminSection
      title="Recurring edit lockout"
      description="Configure a recurring lockout window and warning banners shown before and during lockout. Users with activities.bypass_recurring_lockout may still edit during the window."
      isLoading={isLoading}
      headerAction={
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
      }
    >
      {error && (
        <div className="text-destructive mb-4 text-sm">
          Error loading recurring lockout settings.
        </div>
      )}

      <div className="space-y-5">
        <div className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
          <PencilOff className="h-5 w-5 text-slate-600" />
          <div className="text-sm text-slate-700">
            Users without the bypass permission cannot edit activities during
            the configured lockout window.
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
            />
          </div>
        </div>

        <p className="text-xs text-slate-500">
          Placeholders: {PLACEHOLDER_HELPER}. Contact email is managed under
          Report cover contact settings.
        </p>

        <div className="space-y-2">
          <Label htmlFor="lockout-banner-lead-content">
            Lead-up banner content
          </Label>
          <Textarea
            id="lockout-banner-lead-content"
            value={formData.leadContent}
            onChange={(e) => handleContentChange('leadContent', e.target.value)}
            rows={3}
          />
          <div className="text-xs text-slate-500">
            {formData.leadContent.trim().length} / {BANNER_CONTENT_MAX_LENGTH}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="lockout-banner-active-content">
            Active lockout banner content
          </Label>
          <Textarea
            id="lockout-banner-active-content"
            value={formData.activeContent}
            onChange={(e) =>
              handleContentChange('activeContent', e.target.value)
            }
            rows={3}
          />
          <div className="text-xs text-slate-500">
            {formData.activeContent.trim().length} / {BANNER_CONTENT_MAX_LENGTH}
          </div>
        </div>

        <div className="space-y-3">
          <Label>Preview</Label>
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-600">Lead-up</p>
            {leadPreviewBanner ? (
              <SystemBanner banner={leadPreviewBanner} icon={PencilOff} />
            ) : (
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                Add lead-up banner content to preview.
              </div>
            )}
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-600">Active lockout</p>
            {activePreviewBanner ? (
              <SystemBanner banner={activePreviewBanner} icon={PencilOff} />
            ) : (
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                Add active lockout banner content to preview.
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminSection>
  );
}
