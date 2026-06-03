import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useEffect, useMemo, useState, type ReactElement } from 'react';

import { PERMISSIONS } from '@corpcal/shared';
import {
  fetchReportCoverContactSettings,
  patchReportCoverContactSettings,
} from '@/api/reportCoverContactApi';
import { AdminSection } from '@/components/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePermission } from '@/hooks/usePermissions';

/** Aligns with `FormLabel` (`min-h-[18px]`, `gap-2`) so label rows match other settings sections. */
const SETTINGS_FIELD_LABEL_ROW_CLASS = 'flex min-h-[18px] items-center gap-2';

export function ReportCoverContactSettingsAdmin(): ReactElement | null {
  const queryClient = useQueryClient();
  const canManage = usePermission(PERMISSIONS.SETTINGS.MANAGE);

  const { data, isLoading, error } = useQuery({
    queryKey: ['settings', 'report-cover-contact'],
    queryFn: fetchReportCoverContactSettings,
    retry: false,
    enabled: canManage,
  });

  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  useEffect(() => {
    if (data) {
      setContactPhone(data.contactPhone);
      setContactEmail(data.contactEmail);
    }
  }, [data]);

  const hasChanges = useMemo(() => {
    if (!data) return false;
    return (
      contactPhone !== data.contactPhone || contactEmail !== data.contactEmail
    );
  }, [data, contactPhone, contactEmail]);

  const saveMutation = useMutation({
    mutationFn: patchReportCoverContactSettings,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['settings', 'report-cover-contact'],
      });
      toast.success('Calendar admin contact details updated');
    },
    onError: () => {
      toast.error('Failed to update calendar admin contact details');
    },
  });

  if (!canManage) {
    return null;
  }

  return (
    <AdminSection
      title="Calendar admin contact"
      description="Configure contact phone and text for reports and help sections."
      isLoading={isLoading}
      headerAction={
        <Button
          type="button"
          onClick={() => saveMutation.mutate({ contactPhone, contactEmail })}
          disabled={!hasChanges || saveMutation.isPending}
        >
          Save
        </Button>
      }
    >
      {error && (
        <p className="text-destructive text-sm">Could not load settings.</p>
      )}
      {!isLoading && !error && (
        <div className="max-w-4xl space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:items-start">
            <div className="space-y-2">
              <div className={SETTINGS_FIELD_LABEL_ROW_CLASS}>
                <Label htmlFor="report-cover-contact-phone">
                  Contact phone (optional)
                </Label>
              </div>
              <Input
                id="report-cover-contact-phone"
                type="text"
                autoComplete="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                disabled={saveMutation.isPending}
                maxLength={120}
              />
            </div>
            <div className="space-y-2">
              <div className={SETTINGS_FIELD_LABEL_ROW_CLASS}>
                <Label htmlFor="report-cover-contact-email">
                  Contact text (optional)
                </Label>
              </div>
              <Input
                id="report-cover-contact-email"
                type="text"
                autoComplete="off"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                disabled={saveMutation.isPending}
                maxLength={254}
              />
            </div>
          </div>
          <p className="text-muted-foreground text-xs">
            Shown in reports and help sections.
          </p>
        </div>
      )}
    </AdminSection>
  );
}
