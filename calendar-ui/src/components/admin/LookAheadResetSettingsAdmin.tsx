import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eraser, Loader2, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect, useMemo, useState, type ReactElement } from 'react';

import {
  DEFAULT_LOOK_AHEAD_RESET_WINDOW_DAYS,
  MAX_LOOK_AHEAD_RESET_WINDOW_DAYS,
  MIN_LOOK_AHEAD_RESET_WINDOW_DAYS,
  PERMISSIONS,
  type LookAheadResetCronMode,
} from '@corpcal/shared';
import {
  fetchLookAheadResetRunPreview,
  fetchLookAheadResetSettings,
  patchLookAheadResetSettings,
  rollbackLookAheadReset,
  runLookAheadResetNow,
} from '@/api/lookAheadResetApi';
import { AdminSection } from '@/components/admin';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { InfoIconButton } from '@/components/ui/info-icon-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { usePermission } from '@/hooks/usePermissions';

const SETTINGS_FIELD_LABEL_ROW_CLASS = 'flex min-h-[18px] items-center gap-2';

const CRON_MODE_LABELS: Record<LookAheadResetCronMode, string> = {
  running: 'Running',
  paused_today: 'Pause tonight',
  stopped: 'Stopped',
};

function WindowDaysInfoTrigger(): ReactElement {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <InfoIconButton aria-label="About the Look Ahead reset window" />
      </PopoverTrigger>
      <PopoverContent
        className="w-80 max-w-[calc(100vw-2rem)] space-y-2 text-sm"
        align="start"
        side="top"
      >
        <p>
          The job clears Look Ahead status to &quot;None&quot; for activities
          that overlap today through to today + n calendar days (Pacific fixed
          UTC-7). Default 7 means eight calendar days total. Eligibility follows
          those calendar dates only.
        </p>
        <p>The scheduled job runs daily at 23:45 Pacific (UTC-7).</p>
      </PopoverContent>
    </Popover>
  );
}

function clampWindowDays(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_LOOK_AHEAD_RESET_WINDOW_DAYS;
  return Math.min(
    MAX_LOOK_AHEAD_RESET_WINDOW_DAYS,
    Math.max(MIN_LOOK_AHEAD_RESET_WINDOW_DAYS, Math.trunc(value))
  );
}

function formatLastClearTrigger(trigger: 'schedule' | 'manual'): string {
  return trigger === 'schedule' ? 'scheduled job' : 'manual clear';
}

export function LookAheadResetSettingsAdmin(): ReactElement | null {
  const queryClient = useQueryClient();
  const canManage = usePermission(PERMISSIONS.SETTINGS.MANAGE_LOOK_AHEAD_RESET);

  const [runConfirmOpen, setRunConfirmOpen] = useState(false);
  const [rollbackConfirmOpen, setRollbackConfirmOpen] = useState(false);
  const [showPreviewList, setShowPreviewList] = useState(false);
  const [manualDaysInput, setManualDaysInput] = useState(
    String(DEFAULT_LOOK_AHEAD_RESET_WINDOW_DAYS)
  );
  const [clearAllFuture, setClearAllFuture] = useState(false);
  const [includePast, setIncludePast] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['settings', 'look-ahead-reset'],
    queryFn: fetchLookAheadResetSettings,
    retry: false,
    enabled: canManage,
  });

  const manualDays = clampWindowDays(Number.parseInt(manualDaysInput, 10));
  const manualScope = clearAllFuture ? 'all_future' : 'window';

  const previewQuery = useQuery({
    queryKey: [
      'settings',
      'look-ahead-reset',
      'run-preview',
      manualScope,
      clearAllFuture ? null : manualDays,
      includePast,
    ],
    queryFn: () =>
      fetchLookAheadResetRunPreview({
        scope: manualScope,
        days: clearAllFuture ? undefined : manualDays,
        includePast: clearAllFuture ? includePast : false,
      }),
    enabled: canManage && runConfirmOpen,
    staleTime: 15_000,
  });

  const [windowDays, setWindowDays] = useState(
    data?.windowDaysAfterToday ?? DEFAULT_LOOK_AHEAD_RESET_WINDOW_DAYS
  );

  useEffect(() => {
    if (data) {
      setWindowDays(data.windowDaysAfterToday);
    }
  }, [data]);

  useEffect(() => {
    if (!runConfirmOpen) {
      setShowPreviewList(false);
      setClearAllFuture(false);
      setIncludePast(false);
    }
  }, [runConfirmOpen]);

  useEffect(() => {
    if (runConfirmOpen && data) {
      setManualDaysInput(String(data.windowDaysAfterToday));
    }
  }, [runConfirmOpen, data]);

  useEffect(() => {
    if (!clearAllFuture) {
      setIncludePast(false);
    }
  }, [clearAllFuture]);

  const hasWindowChanges = useMemo(() => {
    if (!data) return false;
    return windowDays !== data.windowDaysAfterToday;
  }, [data, windowDays]);

  const invalidateSettings = () => {
    void queryClient.invalidateQueries({
      queryKey: ['settings', 'look-ahead-reset'],
    });
  };

  const saveWindowMutation = useMutation({
    mutationFn: (windowDaysAfterToday: number) =>
      patchLookAheadResetSettings({ windowDaysAfterToday }),
    onSuccess: () => {
      invalidateSettings();
      toast.success('Look Ahead reset window updated');
    },
    onError: () => {
      toast.error('Failed to update Look Ahead reset window');
    },
  });

  const cronModeMutation = useMutation({
    mutationFn: (cronMode: LookAheadResetCronMode) =>
      patchLookAheadResetSettings({ cronMode }),
    onSuccess: (_result, cronMode) => {
      invalidateSettings();
      toast.success(`Scheduled job set to ${CRON_MODE_LABELS[cronMode]}`);
    },
    onError: () => {
      toast.error('Failed to update scheduled job state');
    },
  });

  const runNowMutation = useMutation({
    mutationFn: runLookAheadResetNow,
    onSuccess: (result) => {
      setRunConfirmOpen(false);
      void queryClient.invalidateQueries({
        queryKey: ['settings', 'look-ahead-reset', 'run-preview'],
      });
      invalidateSettings();
      if (result.skipped) {
        if (result.skipReason === 'advisory_lock') {
          toast.info(
            'Another instance is running the Look Ahead reset. Try again shortly.'
          );
        } else if (result.skipReason === 'in_flight') {
          toast.info('Look Ahead reset is already running on this server.');
        } else {
          toast.info('Look Ahead reset did not run.');
        }
      } else {
        toast.success(
          `Look Ahead reset completed: ${result.updated} activity(s) updated`
        );
      }
    },
    onError: () => {
      toast.error('Failed to run Look Ahead reset');
    },
  });

  const rollbackMutation = useMutation({
    mutationFn: rollbackLookAheadReset,
    onSuccess: (result) => {
      setRollbackConfirmOpen(false);
      invalidateSettings();
      toast.success(
        `Restored Look Ahead status on ${result.restored} activity(s)${
          result.skipped > 0 ? ` (${result.skipped} skipped)` : ''
        }`
      );
    },
    onError: () => {
      toast.error('Failed to restore previous Look Ahead statuses');
    },
  });

  const handleRunConfirmOpenChange = (open: boolean) => {
    if (!open && runNowMutation.isPending) return;
    setRunConfirmOpen(open);
  };

  const handleRollbackConfirmOpenChange = (open: boolean) => {
    if (!open && rollbackMutation.isPending) return;
    setRollbackConfirmOpen(open);
  };

  if (!canManage) return null;

  const previewCount = previewQuery.data?.count;
  const previewItems = previewQuery.data?.items ?? [];
  const listTruncated = previewQuery.data?.listTruncated ?? false;
  const cronMode = data?.cronMode ?? 'running';

  const previewScopeLabel = clearAllFuture
    ? includePast
      ? 'all activities with a Look Ahead status'
      : 'today and all following dates'
    : `today through today + ${manualDays} days`;

  return (
    <>
      <AdminSection
        title="Look Ahead status reset"
        description="Automatically clear Look Ahead status for activities in the configured forward window. You can pause or stop the nightly job, run a manual clear, or restore the previous state after the last clear."
        isLoading={isLoading}
        headerAction={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="shadow-none"
              onClick={() => setRollbackConfirmOpen(true)}
              disabled={
                !data?.rollbackAvailable ||
                rollbackMutation.isPending ||
                runNowMutation.isPending
              }
            >
              <Undo2 className="size-4" aria-hidden />
              Restore previous
            </Button>
            <Button
              type="button"
              variant="outline"
              className="shadow-none"
              onClick={() => setRunConfirmOpen(true)}
              disabled={
                runNowMutation.isPending || saveWindowMutation.isPending
              }
            >
              <Eraser className="size-4" aria-hidden />
              Clear LA status
            </Button>
            <Button
              type="button"
              onClick={() => saveWindowMutation.mutate(windowDays)}
              disabled={!hasWindowChanges || saveWindowMutation.isPending}
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
          <div className="max-w-4xl space-y-6">
            <div className="space-y-2">
              <div className={SETTINGS_FIELD_LABEL_ROW_CLASS}>
                <Label htmlFor="la-reset-window-days">
                  Days after today (inclusive end)
                </Label>
                <WindowDaysInfoTrigger />
              </div>
              <Input
                id="la-reset-window-days"
                type="number"
                min={MIN_LOOK_AHEAD_RESET_WINDOW_DAYS}
                max={MAX_LOOK_AHEAD_RESET_WINDOW_DAYS}
                value={windowDays}
                onChange={(e) =>
                  setWindowDays(clampWindowDays(Number(e.target.value)))
                }
                disabled={saveWindowMutation.isPending}
                className="max-w-xs"
              />
              <p className="text-muted-foreground text-xs">
                Saved value applies to the nightly job (default{' '}
                {DEFAULT_LOOK_AHEAD_RESET_WINDOW_DAYS} = today plus the next{' '}
                {DEFAULT_LOOK_AHEAD_RESET_WINDOW_DAYS} days).
              </p>
            </div>

            <div className="space-y-3">
              <Label>Scheduled job</Label>
              <RadioGroup
                value={cronMode}
                onValueChange={(value) =>
                  cronModeMutation.mutate(value as LookAheadResetCronMode)
                }
                disabled={cronModeMutation.isPending}
                className="flex flex-col gap-2 sm:flex-row sm:gap-4"
              >
                {(
                  Object.keys(CRON_MODE_LABELS) as LookAheadResetCronMode[]
                ).map((mode) => (
                  <div key={mode} className="flex items-center gap-2">
                    <RadioGroupItem value={mode} id={`la-cron-${mode}`} />
                    <Label
                      htmlFor={`la-cron-${mode}`}
                      className="cursor-pointer font-normal"
                    >
                      {CRON_MODE_LABELS[mode]}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              <p className="text-muted-foreground text-xs">
                Pause tonight skips one run at 23:45 Pacific (UTC-7) and resumes
                automatically the next day. Stopped skips all scheduled runs
                until you set Running again. Manual clears are always available.
              </p>
            </div>
          </div>
        )}
      </AdminSection>

      <Dialog open={runConfirmOpen} onOpenChange={handleRunConfirmOpenChange}>
        <DialogContent className="max-w-[calc(100vw-2rem)] min-w-0 sm:max-w-lg">
          <DialogHeader className="min-w-0">
            <DialogTitle className="min-w-0 truncate pr-10 text-left">
              Clear Look Ahead status now?
            </DialogTitle>
            <DialogDescription asChild>
              <div className="min-w-0 space-y-3 text-left">
                <p>
                  This sets Look Ahead status to &quot;None&quot; for eligible
                  activities. It does not change your saved window for the
                  nightly job.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="la-reset-manual-days">
                    Days after today for this run
                  </Label>
                  <Input
                    id="la-reset-manual-days"
                    type="number"
                    min={MIN_LOOK_AHEAD_RESET_WINDOW_DAYS}
                    max={MAX_LOOK_AHEAD_RESET_WINDOW_DAYS}
                    value={manualDaysInput}
                    onChange={(e) => setManualDaysInput(e.target.value)}
                    disabled={runNowMutation.isPending || clearAllFuture}
                    className="max-w-xs"
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="la-reset-clear-all-future"
                      checked={clearAllFuture}
                      onCheckedChange={(checked) =>
                        setClearAllFuture(checked === true)
                      }
                      disabled={runNowMutation.isPending}
                    />
                    <div className="space-y-1">
                      <Label
                        htmlFor="la-reset-clear-all-future"
                        className="cursor-pointer font-normal"
                      >
                        Clear all future activities
                      </Label>
                      <p className="text-muted-foreground text-xs">
                        Use today and all following dates instead of the day
                        window above.
                      </p>
                    </div>
                  </div>
                  {clearAllFuture ? (
                    <div className="flex items-start gap-2 pl-6">
                      <Checkbox
                        id="la-reset-include-past"
                        checked={includePast}
                        onCheckedChange={(checked) =>
                          setIncludePast(checked === true)
                        }
                        disabled={runNowMutation.isPending}
                      />
                      <div className="space-y-1">
                        <Label
                          htmlFor="la-reset-include-past"
                          className="cursor-pointer font-normal"
                        >
                          Include past activities
                        </Label>
                        <p className="text-muted-foreground text-xs">
                          Also clear activities that ended before today.
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>
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
                        ? 'No activities are eligible to be cleared right now.'
                        : `${previewCount} activit${previewCount === 1 ? 'y' : 'ies'} will have Look Ahead status cleared (${previewScopeLabel}).`}
                    </p>
                    {previewCount > 0 && previewItems.length > 0 ? (
                      <div className="min-w-0 space-y-1">
                        <button
                          type="button"
                          className="text-primary focus-visible:ring-ring cursor-pointer rounded-sm border-none bg-transparent p-0 text-[12px] font-normal underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:outline-none"
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
              onClick={() =>
                runNowMutation.mutate({
                  scope: manualScope,
                  days: clearAllFuture ? undefined : manualDays,
                  includePast: clearAllFuture ? includePast : false,
                })
              }
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

      <Dialog
        open={rollbackConfirmOpen}
        onOpenChange={handleRollbackConfirmOpenChange}
      >
        <DialogContent className="max-w-[calc(100vw-2rem)] min-w-0 sm:max-w-lg">
          <DialogHeader className="min-w-0">
            <DialogTitle className="min-w-0 truncate pr-10 text-left">
              Restore previous Look Ahead statuses?
            </DialogTitle>
            <DialogDescription asChild>
              <div className="min-w-0 space-y-2 text-left">
                <p>
                  This restores Look Ahead statuses to what they were
                  immediately before the last clear. You can only roll back one
                  step.
                </p>
                {data?.lastClear ? (
                  <p className="text-foreground text-sm font-medium">
                    Last clear: {data.lastClear.updated} activity(s) via{' '}
                    {formatLastClearTrigger(data.lastClear.trigger)} at{' '}
                    {new Date(data.lastClear.at).toLocaleString()}
                  </p>
                ) : null}
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleRollbackConfirmOpenChange(false)}
              disabled={rollbackMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => rollbackMutation.mutate()}
              disabled={rollbackMutation.isPending}
            >
              {rollbackMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Restoring…
                </>
              ) : (
                'Restore'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
