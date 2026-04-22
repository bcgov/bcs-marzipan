import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
} from 'react';

import {
  ACTIVITY_REVIEW_EXEMPT_CONFIGURABLE_SECTIONS,
  PERMISSIONS,
} from '@corpcal/shared';
import {
  fetchReviewExemptFieldSettings,
  patchReviewExemptFieldSettings,
} from '@/api/reviewExemptSettingsApi';
import { AdminSection } from '@/components/admin';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { usePermission } from '@/hooks/usePermissions';
import { getActivityFieldLabel } from '@/lib/activity-form-labels';
import { showErrorToast, showSuccessToast } from '@/lib/error-toast';
import { cn } from '@/lib/utils';

const DESCRIPTION =
  'Choose which form fields can change without moving a Reviewed activity to Changed. ' +
  'Summary and scheduling fields (e.g. dates, times, date/time status) are always exempt and are not listed here.';

export function ReviewExemptFieldsSettingsAdmin(): ReactElement | null {
  const queryClient = useQueryClient();
  const canManage = usePermission(
    PERMISSIONS.SETTINGS.MANAGE_REVIEW_EXEMPT_FIELDS
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data, isLoading, error } = useQuery({
    queryKey: ['settings', 'review-exempt-fields'],
    queryFn: fetchReviewExemptFieldSettings,
    retry: false,
    enabled: canManage,
  });

  useEffect(() => {
    if (data?.fieldKeys) {
      setSelected(new Set([...data.fieldKeys]));
    }
  }, [data]);

  const initial = useMemo(
    () => (data ? new Set([...data.fieldKeys]) : new Set<string>()),
    [data]
  );

  const hasChanges = useMemo(() => {
    if (!data) return false;
    if (initial.size !== selected.size) return true;
    for (const k of initial) {
      if (!selected.has(k)) return true;
    }
    for (const k of selected) {
      if (!initial.has(k)) return true;
    }
    return false;
  }, [data, initial, selected]);

  const toggleKey = useCallback((key: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(key);
      } else {
        next.delete(key);
      }
      return next;
    });
  }, []);

  const saveMutation = useMutation({
    mutationFn: patchReviewExemptFieldSettings,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['settings', 'review-exempt-fields'],
      });
      showSuccessToast('Review-exempt field settings updated');
    },
    onError: (err: unknown) => {
      showErrorToast(err);
    },
  });

  if (!canManage) return null;

  return (
    <AdminSection
      title="Review-exempt activity fields"
      description={DESCRIPTION}
      isLoading={isLoading}
      headerAction={
        <Button
          type="button"
          onClick={() => saveMutation.mutate({ fieldKeys: [...selected] })}
          disabled={!hasChanges || saveMutation.isPending}
        >
          Save
        </Button>
      }
    >
      {error && (
        <p className="text-destructive text-sm">Could not load settings.</p>
      )}
      {!isLoading && !error && data && (
        <div className="max-w-4xl space-y-8">
          {ACTIVITY_REVIEW_EXEMPT_CONFIGURABLE_SECTIONS.map((section) => (
            <div key={section.id} className="space-y-3">
              <h3 className="text-foreground text-sm font-semibold">
                {section.title}
              </h3>
              <div
                className={cn(
                  'grid grid-cols-1 gap-3 sm:grid-cols-2',
                  'md:grid-cols-2 lg:max-w-3xl'
                )}
              >
                {section.keys.map((key) => {
                  const k = String(key);
                  return (
                    <div key={k} className="flex items-center gap-2">
                      <Checkbox
                        id={`review-exempt-${section.id}-${k}`}
                        checked={selected.has(k)}
                        onCheckedChange={(c) => toggleKey(k, c === true)}
                        disabled={saveMutation.isPending}
                      />
                      <Label
                        htmlFor={`review-exempt-${section.id}-${k}`}
                        className="text-sm leading-none font-normal"
                      >
                        {getActivityFieldLabel(k)}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminSection>
  );
}
