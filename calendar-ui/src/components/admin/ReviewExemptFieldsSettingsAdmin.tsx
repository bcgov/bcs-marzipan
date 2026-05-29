import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Fragment,
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
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxSeparator,
  ComboboxValue,
  useComboboxAnchor,
} from '@/components/ui/combobox';
import { usePermission } from '@/hooks/usePermissions';
import { getActivityFieldLabel } from '@/lib/activity-form-labels';
import { showErrorToast, showSuccessToast } from '@/lib/error-toast';
import type { OptionItem } from '@/schemas/types';

const DESCRIPTION =
  'Choose which form fields can change without moving a Reviewed activity to Changed. ' +
  'Summary and scheduling fields (e.g. dates, times, date/time status) are always exempt and are not listed here.';

export function ReviewExemptFieldsSettingsAdmin(): ReactElement | null {
  const queryClient = useQueryClient();
  const comboboxAnchorRef = useComboboxAnchor();
  const canManage = usePermission(
    PERMISSIONS.SETTINGS.MANAGE_REVIEW_EXEMPT_FIELDS
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { allFieldOptions, sectionsWithOptions } = useMemo(() => {
    const sections = ACTIVITY_REVIEW_EXEMPT_CONFIGURABLE_SECTIONS.map(
      (section) => ({
        id: section.id,
        title: section.title,
        options: section.keys.map((key) => {
          const k = String(key);
          return {
            value: k,
            label: getActivityFieldLabel(k),
          } satisfies OptionItem;
        }),
      })
    );
    return {
      sectionsWithOptions: sections,
      allFieldOptions: sections.flatMap((s) => s.options),
    };
  }, []);

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

  const selectedOptions = useMemo(
    () => allFieldOptions.filter((o) => selected.has(o.value)),
    [allFieldOptions, selected]
  );

  const onExemptFieldsChange = useCallback((opts: OptionItem[]) => {
    setSelected(new Set(opts.map((o) => o.value)));
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
      title="Review-Exempt Activity Fields"
      description={DESCRIPTION}
      isLoading={isLoading}
      headerAction={
        <Button
          type="button"
          onClick={() =>
            saveMutation.mutate({
              fieldKeys: allFieldOptions
                .filter((o) => selected.has(o.value))
                .map((o) => o.value),
            })
          }
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
        <div className="max-w-4xl">
          <Combobox
            items={allFieldOptions}
            multiple
            value={selectedOptions}
            onValueChange={onExemptFieldsChange}
            itemToStringValue={(o) => o.label}
            disabled={saveMutation.isPending}
          >
            <ComboboxChips ref={comboboxAnchorRef} className="w-full">
              <ComboboxValue>
                {(values: OptionItem[]) => (
                  <>
                    {values.map((option) => (
                      <ComboboxChip key={option.value}>
                        {option.label}
                      </ComboboxChip>
                    ))}
                    <ComboboxChipsInput placeholder="Search or add exempt fields..." />
                  </>
                )}
              </ComboboxValue>
            </ComboboxChips>
            <ComboboxContent anchor={comboboxAnchorRef} className="max-h-72">
              <ComboboxEmpty>No fields match.</ComboboxEmpty>
              <ComboboxList>
                {sectionsWithOptions.map((section, idx) => (
                  <Fragment key={section.id}>
                    {idx > 0 ? <ComboboxSeparator className="my-1" /> : null}
                    <ComboboxGroup items={section.options}>
                      <ComboboxLabel>{section.title}</ComboboxLabel>
                      <ComboboxCollection>
                        {(option: OptionItem) => (
                          <ComboboxItem key={option.value} value={option}>
                            {option.label}
                          </ComboboxItem>
                        )}
                      </ComboboxCollection>
                    </ComboboxGroup>
                  </Fragment>
                ))}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>
      )}
    </AdminSection>
  );
}
