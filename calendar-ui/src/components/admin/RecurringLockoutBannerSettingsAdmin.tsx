import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PencilOff } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
  CORP_PACIFIC_LABEL,
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
  DEFAULT_RECURRING_EDIT_LOCKOUT_COUNTDOWN_LEAD_MINUTES,
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
  editCountdownLeadMinutes: number;
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
  editCountdownLeadMinutes:
    DEFAULT_RECURRING_EDIT_LOCKOUT_COUNTDOWN_LEAD_MINUTES,
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
    editCountdownLeadMinutes: settings.editCountdownLeadMinutes,
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
    editCountdownLeadMinutes: formData.editCountdownLeadMinutes,
  };
}

function buildPreviewBanner(
  formData: RecurringLockoutFormData,
  settings: RecurringLockoutBannerSettings | null | undefined,
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

function BannerContentPreview({
  banner,
  emptyMessage,
}: {
  banner: BannerSettings | null;
  emptyMessage: string;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-slate-500">Preview</p>
      {banner ? (
        <div
          aria-hidden
          className="overflow-hidden rounded-md border border-slate-200"
        >
          <SystemBanner banner={banner} icon={PencilOff} />
        </div>
      ) : (
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
          {emptyMessage}
        </div>
      )}
    </div>
  );
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

  const editCountdownExceedsBannerLead =
    formData.editCountdownLeadMinutes > formData.bannerLeadMinutes;

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

    return buildPreviewBanner(formData, settings, content);
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

    return buildPreviewBanner(formData, settings, content);
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

    if (
      formData.editCountdownLeadMinutes < 1 ||
      formData.editCountdownLeadMinutes > 1440
    ) {
      toast.error('Edit countdown lead minutes must be between 1 and 1440');
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
      description="Configure a daily lockout window and warning banners. Users without bypass permission cannot edit activities during lockout."
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
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Switch
              id="recurring-lockout-is-active"
              checked={formData.isActive}
              onCheckedChange={(checked) =>
                setFormData((current) => ({ ...current, isActive: checked }))
              }
            />
            <Label
              htmlFor="recurring-lockout-is-active"
              className="font-normal"
            >
              Enable recurring lockout
            </Label>
          </div>
          <p className="text-xs text-slate-500">
            {formData.isActive
              ? 'Lockout window and warning banners apply on schedule.'
              : 'Recurring lockout is disabled. No lockout window or banners will apply.'}
          </p>
        </div>

        <div className="space-y-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="lockout-start-time">Start time</Label>
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
              <Label htmlFor="lockout-end-time">End time</Label>
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
          </div>
          <p className="text-xs text-slate-500">{CORP_PACIFIC_LABEL}</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

          <div className="space-y-2">
            <Label htmlFor="edit-countdown-lead-minutes">
              Lockout countdown minutes
            </Label>
            <Input
              id="lockout-countdown-lead-minutes"
              type="number"
              min={1}
              max={1440}
              value={formData.editCountdownLeadMinutes}
              onChange={(e) =>
                setFormData((current) => ({
                  ...current,
                  editCountdownLeadMinutes: Number(e.target.value || 1),
                }))
              }
            />
            {editCountdownExceedsBannerLead ? (
              <p className="text-sm text-amber-700">
                Lockout countdown lead is longer than banner lead time.
              </p>
            ) : null}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="lockout-banner-lead-content">
            Lockout banner (lead-up)
          </Label>
          <div className="space-y-2 rounded-md border border-slate-200 p-3">
            <Textarea
              id="lockout-banner-lead-content"
              value={formData.leadContent}
              onChange={(e) =>
                handleContentChange('leadContent', e.target.value)
              }
              rows={3}
            />
            <div className="text-xs text-slate-500">
              {formData.leadContent.trim().length} / {BANNER_CONTENT_MAX_LENGTH}
            </div>
            <BannerContentPreview
              banner={leadPreviewBanner}
              emptyMessage="Add lead-up banner content to preview."
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="lockout-banner-active-content">
            Lockout banner (active)
          </Label>
          <div className="space-y-2 rounded-md border border-slate-200 p-3">
            <Textarea
              id="lockout-banner-active-content"
              value={formData.activeContent}
              onChange={(e) =>
                handleContentChange('activeContent', e.target.value)
              }
              rows={3}
            />
            <div className="text-xs text-slate-500">
              {formData.activeContent.trim().length} /{' '}
              {BANNER_CONTENT_MAX_LENGTH}
            </div>
            <BannerContentPreview
              banner={activePreviewBanner}
              emptyMessage="Add active lockout banner content to preview."
            />
          </div>
        </div>
        <p className="text-xs text-slate-500">
          Placeholders: {PLACEHOLDER_HELPER} can be used in the banner content.
        </p>
      </div>
    </AdminSection>
  );
}
