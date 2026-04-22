import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Play } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactElement } from 'react';

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
  fetchCompletionRunPreview,
  fetchCompletionSettings,
  patchCompletionSettings,
  runCompletionJobNow,
} from '@/api/activityCompletionApi';
import { AdminSection } from '@/components/admin';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { InfoIconButton } from '@/components/ui/info-icon-button';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePermission } from '@/hooks/usePermissions';
import {
  showErrorToast,
  showInfoToast,
  showSuccessToast,
} from '@/lib/error-toast';

const SCHEDULE_LABELS: Record<CompletionSchedule, string> = {
  every_15_minutes: 'Every 15 minutes',
  hourly: 'Hourly',
  twice_daily: 'Twice daily (00:00 and 12:00)',
  daily: 'Daily (00:00)',
  never: 'Never (manual runs only)',
};

const BUFFER_LABELS: Record<CompletionBufferMinutes, string> = {
  0: 'No buffer',
  15: '15 minutes',
  30: '30 minutes',
  45: '45 minutes',
};

/** Aligns with `FormLabel` (`min-h-[18px]`, `gap-2`) so label rows match when a trailing control exists. */
const SETTINGS_FIELD_LABEL_ROW_CLASS = 'flex min-h-[18px] items-center gap-2';

function BufferInfoTrigger(): ReactElement {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <InfoIconButton aria-label="About the buffer setting" />
      </PopoverTrigger>
      <PopoverContent
        className="w-80 max-w-[calc(100vw-2rem)] space-y-2 text-sm"
        align="start"
        side="top"
      >
        <p>
          The buffer time is added to an activity&apos;s end time to determine
          if it can be marked Completed by the CRON automation (so activities
          are not completed the instant they end).
        </p>
        <p>
          The buffer also offsets the CRON job run time (Pacific Time UTC-7):
          the job only runs on the scheduled hours where the clock minute equals
          the buffer :00, :15, :30, or :45 (except when schedule is Every 15
          minutes).
        </p>
        <p>
          Example: 15-minute buffer on an hourly schedule
          <br />
          Runs occur at 00:15, 01:15, 02:15, etc. For the run at 01:15, activies
          ending up to 01:00 are marked Completed; activities ending at 01:15
          would not be eligible (end time plus buffer is 01:30).
        </p>
      </PopoverContent>
    </Popover>
  );
}

export function ActivityCompletionSettingsAdmin(): ReactElement | null {
  const queryClient = useQueryClient();
  const canManage = usePermission(
    PERMISSIONS.SETTINGS.MANAGE_ACTIVITY_COMPLETE
  );

  const [runConfirmOpen, setRunConfirmOpen] = useState(false);
  const [showPreviewList, setShowPreviewList] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['settings', 'activity-completion'],
    queryFn: fetchCompletionSettings,
    retry: false,
    enabled: canManage,
  });

  const previewQuery = useQuery({
    queryKey: ['settings', 'activity-completion', 'run-preview'],
    queryFn: fetchCompletionRunPreview,
    enabled: canManage && runConfirmOpen,
    staleTime: 15_000,
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

  useEffect(() => {
    if (!runConfirmOpen) {
      setShowPreviewList(false);
    }
  }, [runConfirmOpen]);

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
      showSuccessToast('Activity completion settings updated');
    },
    onError: (error: unknown) => {
      showErrorToast(error);
    },
  });

  const runNowMutation = useMutation({
    mutationFn: runCompletionJobNow,
    onSuccess: (result) => {
      setRunConfirmOpen(false);
      void queryClient.invalidateQueries({
        queryKey: ['settings', 'activity-completion', 'run-preview'],
      });
      if (result.skipped) {
        if (result.skipReason === 'advisory_lock') {
          showInfoToast(
            'Another instance is running the completion job. Try again shortly.'
          );
        } else if (result.skipReason === 'in_flight') {
          showInfoToast('Completion job is already running on this server.');
        } else {
          showInfoToast('Completion job did not run.');
        }
      } else {
        showSuccessToast(
          `Completion job completed: ${result.updated} activity(s) updated`
        );
      }
    },
    onError: (error: unknown) => {
      showErrorToast(error);
    },
  });

  const handleRunConfirmOpenChange = (open: boolean) => {
    if (!open && runNowMutation.isPending) return;
    setRunConfirmOpen(open);
  };

  if (!canManage) return null;

  const previewCount = previewQuery.data?.count;
  const previewItems = previewQuery.data?.items ?? [];
  const listTruncated = previewQuery.data?.listTruncated ?? false;

  return (
    <>
      <AdminSection
        title="Activity completion automation"
        description="Configure how frequently reviewed activities with confirmed date and time are automatically moved to Completed status after their end time."
        isLoading={isLoading}
        headerAction={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="shadow-none"
              onClick={() => setRunConfirmOpen(true)}
              disabled={runNowMutation.isPending || saveMutation.isPending}
            >
              <Play className="size-4" aria-hidden />
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
          <div className="max-w-4xl space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:items-start">
              <div className="space-y-2">
                <div className={SETTINGS_FIELD_LABEL_ROW_CLASS}>
                  <Label htmlFor="completion-schedule">Schedule</Label>
                </div>
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
                  Times shown are Pacific Time (UTC-7)
                </p>
              </div>
              <div className="space-y-2">
                <div className={SETTINGS_FIELD_LABEL_ROW_CLASS}>
                  <Label htmlFor="completion-buffer">Buffer</Label>
                  <BufferInfoTrigger />
                </div>
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
                  Offsets CRON job run time and activity end times eligible
                </p>
              </div>
            </div>
          </div>
        )}
      </AdminSection>

      <Dialog open={runConfirmOpen} onOpenChange={handleRunConfirmOpenChange}>
        <DialogContent className="max-w-[calc(100vw-2rem)] min-w-0 sm:max-w-lg">
          <DialogHeader className="min-w-0">
            <DialogTitle className="min-w-0 truncate pr-10 text-left">
              Run completion job now?
            </DialogTitle>
            <DialogDescription asChild>
              <div className="min-w-0 space-y-3 text-left">
                <p>
                  Are you sure you want to run a job to complete activities now?
                </p>
                {hasChanges ? (
                  <p className="text-muted-foreground text-xs">
                    The preview and job use saved settings. Save changes first
                    if you need a new buffer applied.
                  </p>
                ) : null}
                {previewQuery.isLoading ? (
                  <p className="text-muted-foreground flex items-center gap-2 text-sm">
                    <Loader2
                      className="size-4 shrink-0 animate-spin"
                      aria-hidden
                    />
                    Checking eligible activities…
                  </p>
                ) : previewQuery.isError ? (
                  <p className="text-destructive text-sm">
                    Could not load the eligibility preview. You can still run
                    the job, or close and try again.
                  </p>
                ) : previewCount !== undefined ? (
                  <div className="min-w-0 space-y-2">
                    <p className="text-foreground min-w-0 text-sm font-medium wrap-break-word">
                      {previewCount === 0
                        ? 'No activities are eligible to be completed right now.'
                        : `${previewCount} activit${previewCount === 1 ? 'y' : 'ies'} will be marked Completed.`}
                    </p>
                    {previewCount > 0 && previewItems.length > 0 ? (
                      <div className="min-w-0 space-y-1">
                        <button
                          type="button"
                          className="focus-visible:ring-ring cursor-pointer rounded-sm border-none bg-transparent p-0 text-[12px] font-normal text-(--fluent-primary) focus-visible:ring-2 focus-visible:outline-none"
                          onClick={() => setShowPreviewList((open) => !open)}
                          aria-expanded={showPreviewList}
                        >
                          {showPreviewList ? 'Hide details' : 'Show details'}
                        </button>
                        {showPreviewList ? (
                          <ul
                            className="border-border bg-muted/30 max-h-48 w-full min-w-0 overflow-x-hidden overflow-y-auto rounded-md border px-2 py-1 text-xs"
                            aria-label="Eligible activities"
                          >
                            {previewItems.map((row, idx) => (
                              <li
                                key={`${row.displayId ?? 'id'}-${idx}`}
                                className="border-border/60 min-h-7 min-w-0 border-b py-1 last:border-b-0"
                              >
                                <p className="max-w-full min-w-0 truncate text-xs">
                                  <span className="text-muted-foreground font-mono">
                                    {row.displayId ?? '—'}
                                  </span>
                                  <span className="text-muted-foreground mx-1.5">
                                    ·
                                  </span>
                                  <span>{row.title}</span>
                                </p>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                        {listTruncated ? (
                          <p className="text-muted-foreground text-xs">
                            Showing first {previewItems.length} of{' '}
                            {previewCount}.
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleRunConfirmOpenChange(false)}
              disabled={runNowMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => runNowMutation.mutate()}
              disabled={runNowMutation.isPending || previewQuery.isPending}
            >
              {runNowMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Running…
                </>
              ) : (
                'Confirm'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
