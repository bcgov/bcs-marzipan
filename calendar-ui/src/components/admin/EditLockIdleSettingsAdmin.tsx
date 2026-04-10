import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useEffect, useMemo, useState } from 'react';

import { PERMISSIONS, SYSTEM_ROLE_IDS } from '@corpcal/shared';
import { fetchIdleTimeoutConfig, patchIdleTimeoutConfig } from '@/api/locksApi';
import { AdminSection } from '@/components/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { usePermission } from '@/hooks/usePermissions';

export function EditLockIdleSettingsAdmin(): React.ReactElement | null {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const hasSettingsManage = usePermission(PERMISSIONS.SETTINGS.MANAGE);
  const isSystemAdmin = user?.roleId === SYSTEM_ROLE_IDS.SYSTEM_ADMIN;
  const canManage = hasSettingsManage && isSystemAdmin;

  const { data, isLoading, error } = useQuery({
    queryKey: ['locks', 'idle-timeout-config'],
    queryFn: fetchIdleTimeoutConfig,
    retry: false,
  });

  const [minutes, setMinutes] = useState(
    String(data?.idleTimeoutMinutes ?? 30)
  );

  useEffect(() => {
    if (data?.idleTimeoutMinutes != null) {
      setMinutes(String(data.idleTimeoutMinutes));
    }
  }, [data?.idleTimeoutMinutes]);

  const mutation = useMutation({
    mutationFn: patchIdleTimeoutConfig,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['locks', 'idle-timeout-config'],
      });
      toast.success('Edit lock idle timeout updated');
    },
    onError: () => {
      toast.error('Failed to update idle timeout');
    },
  });

  const parsed = Number.parseInt(minutes, 10);
  const hasChanges = useMemo(() => {
    if (data?.idleTimeoutMinutes == null) return false;
    return parsed !== data.idleTimeoutMinutes;
  }, [data?.idleTimeoutMinutes, parsed]);

  const handleSave = (): void => {
    if (!Number.isFinite(parsed) || parsed < 1 || parsed > 24 * 60) {
      toast.error('Enter a number between 1 and 1440 (minutes).');
      return;
    }
    mutation.mutate(parsed);
  };

  if (!canManage) {
    return null;
  }

  return (
    <AdminSection
      title="Edit lock idle timeout"
      description="When a user holds an activity edit lock without activity, the lock expires after this many minutes. Users get a warning two minutes before."
      isLoading={isLoading}
      headerAction={
        <Button
          type="button"
          onClick={() => handleSave()}
          disabled={!hasChanges || mutation.isPending}
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
            <Label htmlFor="edit-lock-idle-minutes">
              Idle timeout (minutes)
            </Label>
            <Input
              id="edit-lock-idle-minutes"
              type="number"
              min={1}
              max={1440}
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              disabled={mutation.isPending}
            />
          </div>
        </div>
      )}
    </AdminSection>
  );
}
