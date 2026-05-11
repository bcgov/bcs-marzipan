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
      toast.success('Report cover contact details updated');
    },
    onError: () => {
      toast.error('Failed to update report cover contact details');
    },
  });

  if (!canManage) {
    return null;
  }

  return (
    <AdminSection
      title="Look-ahead report PDF cover"
      description="Phone and email appear on the cover page of exported look-ahead family PDFs (Corporate Look Ahead, 30-60-90, Executive). Leave blank to omit one or both from the footer."
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
        <div className="max-w-md space-y-4">
          <div className="space-y-2">
            <Label htmlFor="report-cover-contact-phone">
              Contact phone (optional)
            </Label>
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
            <Label htmlFor="report-cover-contact-email">
              Contact email (optional)
            </Label>
            <Input
              id="report-cover-contact-email"
              type="email"
              autoComplete="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              disabled={saveMutation.isPending}
              maxLength={254}
            />
          </div>
        </div>
      )}
    </AdminSection>
  );
}
