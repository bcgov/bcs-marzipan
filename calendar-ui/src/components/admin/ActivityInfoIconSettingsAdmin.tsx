import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState, type ReactElement } from 'react';

import {
  ACTIVITY_INFO_ICON_FIELD_KEYS,
  ACTIVITY_INFO_ICON_TEXT_MAX_LENGTH,
  DEFAULT_ACTIVITY_INFO_ICON_SETTINGS,
  PERMISSIONS,
  type ActivityInfoIconFieldKey,
  type ActivityInfoIconSettings,
} from '@corpcal/shared';
import { plainTextFromActivityRichField } from '@corpcal/shared/utils';
import {
  activityInfoIconSettingsRetryDelay,
  fetchActivityInfoIconSettings,
  patchActivityInfoIconSettings,
  readCachedActivityInfoIconSettings,
  shouldRetryActivityInfoIconSettings,
} from '@/api/activityInfoIconSettingsApi';
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
  ComboboxValue,
  useComboboxAnchor,
} from '@/components/ui/combobox';
import { Label } from '@/components/ui/label';
import { RichTextField } from '@/components/ui/rich-text-field';
import { usePermission } from '@/hooks/usePermissions';
import { getActivityFieldLabel } from '@/lib/activity-form-labels';
import { showErrorToast, showSuccessToast } from '@/lib/error-toast';
import type { OptionItem } from '@/schemas/types';

const DESCRIPTION = `Choose which activity form fields show an information icon, then edit the text shown in the popover. Each message is limited to ${ACTIVITY_INFO_ICON_TEXT_MAX_LENGTH} characters.`;

type InfoIconFieldState = {
  selectedFieldKeys: ActivityInfoIconFieldKey[];
  textsByFieldKey: Record<string, string>;
};

function toFieldState(settings: ActivityInfoIconSettings): InfoIconFieldState {
  return {
    selectedFieldKeys: settings.items.map((item) => item.fieldKey),
    textsByFieldKey: Object.fromEntries(
      settings.items.map((item) => [item.fieldKey, item.text])
    ),
  };
}

export function ActivityInfoIconSettingsAdmin(): ReactElement | null {
  const queryClient = useQueryClient();
  const comboboxAnchorRef = useComboboxAnchor();
  const cachedInitialData = useMemo(
    () => readCachedActivityInfoIconSettings(),
    []
  );
  const canManage = usePermission(
    PERMISSIONS.SETTINGS.MANAGE_ACTIVITY_INFO_ICONS
  );

  const { data, isLoading, error } = useQuery({
    queryKey: ['settings', 'activity-info-icons'],
    queryFn: fetchActivityInfoIconSettings,
    retry: shouldRetryActivityInfoIconSettings,
    retryDelay: activityInfoIconSettingsRetryDelay,
    enabled: canManage,
    initialData: cachedInitialData ?? DEFAULT_ACTIVITY_INFO_ICON_SETTINGS,
  });

  const isUsingCachedFallback = Boolean(error) && Boolean(cachedInitialData);
  const isUsingDefaultFallback = Boolean(error) && !cachedInitialData;

  const [draft, setDraft] = useState<InfoIconFieldState>(() =>
    toFieldState(data ?? DEFAULT_ACTIVITY_INFO_ICON_SETTINGS)
  );

  useEffect(() => {
    if (data) {
      setDraft(toFieldState(data));
    }
  }, [data]);

  const defaultTextByFieldKey = useMemo(
    () =>
      Object.fromEntries(
        DEFAULT_ACTIVITY_INFO_ICON_SETTINGS.items.map((item) => [
          item.fieldKey,
          item.text,
        ])
      ),
    []
  );

  const allFieldOptions = useMemo<OptionItem[]>(
    () =>
      ACTIVITY_INFO_ICON_FIELD_KEYS.map((fieldKey) => ({
        value: fieldKey,
        label: getActivityFieldLabel(fieldKey),
      })),
    []
  );

  const selectedFieldOptions = useMemo(
    () =>
      allFieldOptions.filter((option) =>
        draft.selectedFieldKeys.includes(
          option.value as ActivityInfoIconFieldKey
        )
      ),
    [allFieldOptions, draft.selectedFieldKeys]
  );

  const initial = useMemo(
    () => toFieldState(data ?? DEFAULT_ACTIVITY_INFO_ICON_SETTINGS),
    [data]
  );

  const hasChanges = useMemo(() => {
    const initialKeys = initial.selectedFieldKeys;
    const currentKeys = draft.selectedFieldKeys;
    if (initialKeys.length !== currentKeys.length) return true;
    for (let i = 0; i < initialKeys.length; i += 1) {
      if (initialKeys[i] !== currentKeys[i]) return true;
    }
    for (const key of currentKeys) {
      if (
        (draft.textsByFieldKey[key] ?? '').trim() !==
        (initial.textsByFieldKey[key] ?? '').trim()
      ) {
        return true;
      }
    }
    return false;
  }, [draft, initial]);

  const invalidFieldKeys = useMemo(
    () =>
      draft.selectedFieldKeys.filter(
        (fieldKey) =>
          plainTextFromActivityRichField(
            draft.textsByFieldKey[fieldKey] ?? ''
          ).trim().length === 0 ||
          plainTextFromActivityRichField(draft.textsByFieldKey[fieldKey] ?? '')
            .length > ACTIVITY_INFO_ICON_TEXT_MAX_LENGTH
      ),
    [draft.selectedFieldKeys, draft.textsByFieldKey]
  );

  const saveMutation = useMutation({
    mutationFn: patchActivityInfoIconSettings,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['settings', 'activity-info-icons'],
      });
      showSuccessToast('Activity info icon settings updated');
    },
    onError: (err: unknown) => {
      showErrorToast(err);
    },
  });

  return (
    <AdminSection
      title="Activity info icons"
      description={DESCRIPTION}
      isLoading={isLoading}
      headerAction={
        <Button
          type="button"
          onClick={() =>
            saveMutation.mutate({
              items: draft.selectedFieldKeys.map((fieldKey) => ({
                fieldKey,
                text: (draft.textsByFieldKey[fieldKey] ?? '').trim(),
              })),
            })
          }
          disabled={
            !hasChanges || invalidFieldKeys.length > 0 || saveMutation.isPending
          }
        >
          Save
        </Button>
      }
    >
      {!canManage ? (
        <p className="text-sm text-slate-600">
          You do not have permission to manage activity info icons.
        </p>
      ) : !isLoading && data ? (
        <div className="space-y-6">
          {isUsingCachedFallback ? (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Could not refresh from the server. Showing the last saved local
              copy of settings.
            </p>
          ) : null}
          {isUsingDefaultFallback ? (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Could not refresh from the server. Showing default settings
              temporarily.
            </p>
          ) : null}
          <div className="max-w-4xl">
            <Combobox
              items={allFieldOptions}
              multiple
              value={selectedFieldOptions}
              onValueChange={(options) => {
                const nextKeys = options.map(
                  (option) => option.value as ActivityInfoIconFieldKey
                );
                setDraft((current) => {
                  const nextTexts = { ...current.textsByFieldKey };
                  for (const key of nextKeys) {
                    if (!nextTexts[key]) {
                      nextTexts[key] =
                        current.textsByFieldKey[key] ??
                        defaultTextByFieldKey[key] ??
                        '';
                    }
                  }
                  return {
                    selectedFieldKeys: nextKeys,
                    textsByFieldKey: nextTexts,
                  };
                });
              }}
              itemToStringValue={(option) => option.label}
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
                      <ComboboxChipsInput placeholder="Search fields with info icons..." />
                    </>
                  )}
                </ComboboxValue>
              </ComboboxChips>
              <ComboboxContent anchor={comboboxAnchorRef} className="max-h-72">
                <ComboboxEmpty>No fields match.</ComboboxEmpty>
                <ComboboxList>
                  <ComboboxGroup items={allFieldOptions}>
                    <ComboboxLabel>Activity fields</ComboboxLabel>
                    <ComboboxCollection>
                      {(option: OptionItem) => (
                        <ComboboxItem key={option.value} value={option}>
                          {option.label}
                        </ComboboxItem>
                      )}
                    </ComboboxCollection>
                  </ComboboxGroup>
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>

          {draft.selectedFieldKeys.length > 0 ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {draft.selectedFieldKeys.map((fieldKey) => {
                const value = draft.textsByFieldKey[fieldKey] ?? '';
                const currentText =
                  plainTextFromActivityRichField(value).trim();
                const initialText = plainTextFromActivityRichField(
                  initial.textsByFieldKey[fieldKey] ?? ''
                ).trim();
                const isPersistedField =
                  initial.selectedFieldKeys.includes(fieldKey);
                const isPersisted =
                  isPersistedField && currentText === initialText;
                const plainTextLength =
                  plainTextFromActivityRichField(value).length;
                return (
                  <div
                    key={fieldKey}
                    className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <Label className="mb-2 block text-sm font-semibold text-slate-900">
                      {getActivityFieldLabel(fieldKey)}
                    </Label>
                    <p className="mb-2 text-xs text-slate-500">
                      Supports bold, italic, links, and lists.
                    </p>
                    <RichTextField
                      name={`activity-info-icon-${fieldKey}`}
                      value={value}
                      onChange={(nextValue) =>
                        setDraft((current) => ({
                          ...current,
                          textsByFieldKey: {
                            ...current.textsByFieldKey,
                            [fieldKey]: nextValue,
                          },
                        }))
                      }
                      onBlur={() => {}}
                      placeholder="Enter info icon text"
                      maxLength={ACTIVITY_INFO_ICON_TEXT_MAX_LENGTH}
                    />
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                      <span>
                        {currentText.length === 0
                          ? 'Required'
                          : isPersisted
                            ? 'Saved as tooltip text'
                            : 'Unsaved changes'}
                      </span>
                      <span>
                        {plainTextLength}/{ACTIVITY_INFO_ICON_TEXT_MAX_LENGTH}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-600">
              Select one or more fields to configure their info icons.
            </p>
          )}
        </div>
      ) : error ? (
        <p className="text-destructive text-sm">Could not load settings.</p>
      ) : null}
    </AdminSection>
  );
}
