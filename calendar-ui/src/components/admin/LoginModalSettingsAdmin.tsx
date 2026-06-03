import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LogIn } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { PERMISSIONS, SYSTEM_ROLE_IDS } from '@corpcal/shared';
import type {
  LoginModalSettings,
  UpsertLoginModalSettingsBody,
} from '@corpcal/shared/api/types';
import {
  fetchLoginModalSettings,
  upsertLoginModalSettings,
} from '@/api/loginModalApi';
import { AdminSection } from '@/components/admin';
import { LoginModal } from '@/components/layout/LoginModal';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { useLoginModalSettingsWebSocket } from '@/hooks/useLoginModalSettingsWebSocket';
import { usePermission } from '@/hooks/usePermissions';
import { showErrorToast, showSuccessToast } from '@/lib/error-toast';

type ModalFormData = {
  isActive: boolean;
  title: string;
  content: string;
  startDateTime: string;
  endDateTime: string;
};

const DEFAULT_FORM_DATA: ModalFormData = {
  isActive: false,
  title: 'Notice',
  content: '',
  startDateTime: '',
  endDateTime: '',
};

function toLocalDateTimeValue(value: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toFormData(settings: LoginModalSettings | null): ModalFormData {
  if (!settings) return DEFAULT_FORM_DATA;
  return {
    isActive: settings.isActive,
    title: settings.title,
    content: settings.content,
    startDateTime: toLocalDateTimeValue(settings.startDateTime),
    endDateTime: toLocalDateTimeValue(settings.endDateTime),
  };
}

function toRequestBody(formData: ModalFormData): UpsertLoginModalSettingsBody {
  return {
    isActive: formData.isActive,
    title: formData.title.trim(),
    content: formData.content.trim(),
    startDateTime: formData.startDateTime
      ? new Date(formData.startDateTime).toISOString()
      : null,
    endDateTime: formData.endDateTime
      ? new Date(formData.endDateTime).toISOString()
      : null,
  };
}

export function LoginModalSettingsAdmin() {
  const { user } = useAuth();
  const isSystemAdmin = user?.roleId === SYSTEM_ROLE_IDS.SYSTEM_ADMIN;

  if (!isSystemAdmin) {
    return null;
  }

  return <LoginModalSettingsAdminInner />;
}

function LoginModalSettingsAdminInner() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const hasSettingsManage = usePermission(PERMISSIONS.SETTINGS.MANAGE);
  const isSystemAdmin = user?.roleId === SYSTEM_ROLE_IDS.SYSTEM_ADMIN;
  const canManage = hasSettingsManage && isSystemAdmin;

  const [formData, setFormData] = useState<ModalFormData>(DEFAULT_FORM_DATA);
  const [previewOpen, setPreviewOpen] = useState(false);

  const {
    data: settings,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['login-modal', 'settings'],
    queryFn: fetchLoginModalSettings,
    retry: false,
  });

  const initialFormData = useMemo(
    () => toFormData(settings ?? null),
    [settings]
  );

  useLoginModalSettingsWebSocket({
    onSettingsUpdated: () => {
      void queryClient.invalidateQueries({
        queryKey: ['login-modal', 'settings'],
      });
    },
  });

  useEffect(() => {
    setFormData(initialFormData);
  }, [initialFormData]);

  const hasChanges = useMemo(
    () => JSON.stringify(formData) !== JSON.stringify(initialFormData),
    [formData, initialFormData]
  );

  const saveMutation = useMutation({
    mutationFn: (data: ModalFormData) =>
      upsertLoginModalSettings(toRequestBody(data)),
    onSuccess: (saved) => {
      queryClient.setQueryData(['login-modal', 'settings'], saved);
      showSuccessToast('Login modal settings saved');
    },
    onError: (err) => {
      showErrorToast(err);
    },
  });

  const handleSave = () => {
    if (!formData.title.trim()) {
      showErrorToast(new Error('Title cannot be empty'));
      return;
    }
    if (!formData.content.trim()) {
      showErrorToast(new Error('Content cannot be empty'));
      return;
    }
    if (
      formData.startDateTime &&
      formData.endDateTime &&
      new Date(formData.endDateTime) <= new Date(formData.startDateTime)
    ) {
      showErrorToast(new Error('End date/time must be after start date/time'));
      return;
    }
    saveMutation.mutate(formData);
  };

  const previewModal = useMemo<LoginModalSettings | null>(() => {
    if (!formData.content.trim()) return null;
    return {
      id: settings?.id ?? 0,
      isActive: formData.isActive,
      title: formData.title || 'Notice',
      content: formData.content,
      startDateTime: formData.startDateTime
        ? new Date(formData.startDateTime).toISOString()
        : null,
      endDateTime: formData.endDateTime
        ? new Date(formData.endDateTime).toISOString()
        : null,
      createdDateTime: settings?.createdDateTime ?? new Date().toISOString(),
      lastUpdatedDateTime:
        settings?.lastUpdatedDateTime ?? new Date().toISOString(),
    };
  }, [settings, formData]);

  return (
    <>
      <AdminSection
        title="Login modal"
        description="Configure a notice modal shown to users the first time they sign in each session."
        isLoading={isLoading}
        headerAction={
          canManage ? (
            <div className="flex items-center gap-2">
              {previewModal && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPreviewOpen(true)}
                >
                  Preview
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormData(initialFormData)}
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
            Error loading login modal settings.
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
            <LogIn className="h-5 w-5 text-slate-600" />
            <div className="text-sm text-slate-700">
              The modal is shown once per session, the first time a user signs
              in. HTML content is supported.
            </div>
          </div>

          {/* Active toggle + current status */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3">
              <Checkbox
                id="modal-is-active"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData((f) => ({ ...f, isActive: !!checked }))
                }
                disabled={!canManage}
                data-testid="checkbox-login-modal-active"
              />
              <Label htmlFor="modal-is-active">Active</Label>
            </div>
            <div>
              <Label className="text-sm font-medium text-slate-900">
                Current Status
              </Label>
              <p className="mt-1 text-sm text-slate-600">
                Login modal is currently{' '}
                {formData.isActive
                  ? 'active — will show after login'
                  : 'inactive'}
              </p>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="modal-title">Title</Label>
            <Input
              id="modal-title"
              value={formData.title}
              onChange={(e) =>
                setFormData((f) => ({ ...f, title: e.target.value }))
              }
              disabled={!canManage}
              maxLength={200}
              placeholder="Notice"
              data-testid="input-login-modal-title"
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="modal-content">Content (HTML supported)</Label>
            <Textarea
              id="modal-content"
              value={formData.content}
              onChange={(e) =>
                setFormData((f) => ({ ...f, content: e.target.value }))
              }
              disabled={!canManage}
              rows={6}
              placeholder="Enter modal content…"
              maxLength={5000}
              data-testid="textarea-login-modal-content"
            />
          </div>

          {/* Date range */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="modal-start">Start date/time (optional)</Label>
              <Input
                id="modal-start"
                type="datetime-local"
                value={formData.startDateTime}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, startDateTime: e.target.value }))
                }
                disabled={!canManage}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="modal-end">End date/time (optional)</Label>
              <Input
                id="modal-end"
                type="datetime-local"
                value={formData.endDateTime}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, endDateTime: e.target.value }))
                }
                disabled={!canManage}
              />
            </div>
          </div>
        </div>
      </AdminSection>

      {previewModal && (
        <LoginModal
          modal={previewModal}
          open={previewOpen}
          onDismiss={() => setPreviewOpen(false)}
        />
      )}
    </>
  );
}
