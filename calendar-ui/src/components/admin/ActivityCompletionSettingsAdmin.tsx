import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Play } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect, useMemo, useState } from 'react';

import {
  COMPLETION_BUFFER_OPTIONS,
  COMPLETION_SCHEDULES,
  DEFAULT_COMPLETION_BUFFER_MINUTES,
  DEFAULT_COMPLETION_SCHEDULE,
  PERMISSIONS,
  type CompletionBufferMinutes,
  type CompletionSchedule,
} from '@corpcal/shared';
import {
  fetchCompletionSettings,
  patchCompletionSettings,
  runCompletionJobNow,
} from '@/api/activityCompletionApi';
import { AdminSection } from '@/components/admin';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePermission } from '@/hooks/usePermissions';

const SCHEDULE_LABELS: Record<CompletionSchedule, string> = {
  hourly: 'Hourly',
  twice_daily: 'Twice daily (00:00 and 12:00)',
  daily: 'Daily (00:00)',
};

const BUFFER_LABELS: Record<CompletionBufferMinutes, string> = {
  0: 'No buffer',
  15: '15 minutes',
  30: '30 minutes',
  45: '45 minutes',
};

export function ActivityCompletionSettingsAdmin(): React.ReactElement | null {
  const queryClient = useQueryClient();
  const canManage = usePermission(
    PERMISSIONS.SETTINGS.MANAGE_ACTIVITY_COMPLETE
  );

  const { data, isLoading, error } = useQuery({
    queryKey: ['settings', 'activity-completion'],
    queryFn: fetchCompletionSettings,
    retry: false,
    enabled: canManage,
  });

  const [schedule, setSchedule] = useState<CompletionSchedule>(
    data?.schedule ?? DEFAULT_COMPLETION_SCHEDULE
  );
  const [buffer, setBuffer] = useState<CompletionBufferMinutes>(
    data?.bufferMinutes ?? DEFAULT_COMPLETION_BUFFER_MINUTES
  );

  useEffect(() => {
    if (data) {
      setSchedule(data.schedule);
      setBuffer(data.bufferMinutes);
    }
  }, [data]);

  const hasChanges = useMemo(() => {
    if (!data) return false;
    return schedule !== data.schedule || buffer !== data.bufferMinutes;
  }, [data, schedule, buffer]);

  const saveMutation = useMutation({
    mutationFn: patchCompletionSettings,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['settings', 'activity-completion'],
      });
      toast.success('Activity completion settings updated');
    },
    onError: () => {
      toast.error('Failed to update completion settings');
    },
  });

  const runNowMutation = useMutation({
    mutationFn: runCompletionJobNow,
    onSuccess: (result) => {
      if (result.skipped) {
        toast.info('Completion job is already running');
      } else {
        toast.success(
          `Completion job completed: ${result.updated} activity(s) updated`
        );
      }
    },
    onError: () => {
      toast.error('Failed to run completion job');
    },
  });

  if (!canManage) return null;

  return (
    <AdminSection
      title="Activity completion automation"
      description="Configure how frequently reviewed activities with confirmed date and time are automatically moved to Completed status after their end time."
      isLoading={isLoading}
      headerAction={
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => runNowMutation.mutate()}
            disabled={runNowMutation.isPending || saveMutation.isPending}
          >
            <Play className="mr-1.5 h-3.5 w-3.5" />
            Run now
          </Button>
          <Button
            type="button"
            onClick={() =>
              saveMutation.mutate({ schedule, bufferMinutes: buffer })
            }
            disabled={!hasChanges || saveMutation.isPending}
          >
            Save
          </Button>
        </div>
      }
    >
      {error && (
        <p className="text-destructive text-sm">Could not load settings.</p>
      )}
      {!isLoading && !error && (
        <div className="max-w-md space-y-4">
          <div className="space-y-2">
            <Label htmlFor="completion-schedule">Schedule</Label>
            <Select
              value={schedule}
              onValueChange={(v) => setSchedule(v as CompletionSchedule)}
              disabled={saveMutation.isPending}
            >
              <SelectTrigger id="completion-schedule">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMPLETION_SCHEDULES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {SCHEDULE_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-xs">
              Times shown are Pacific Time (UTC-7).
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="completion-buffer">Buffer after end time</Label>
            <Select
              value={String(buffer)}
              onValueChange={(v) =>
                setBuffer(Number(v) as CompletionBufferMinutes)
              }
              disabled={saveMutation.isPending}
            >
              <SelectTrigger id="completion-buffer">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMPLETION_BUFFER_OPTIONS.map((b) => (
                  <SelectItem key={b} value={String(b)}>
                    {BUFFER_LABELS[b]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-xs">
              The job will wait this long after an activity ends before
              progressing it to Completed.
            </p>
          </div>
        </div>
      )}
    </AdminSection>
  );
}
