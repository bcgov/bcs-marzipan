import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useFormContext, useWatch } from 'react-hook-form';
import { useMemo, type FC } from 'react';

import type {
  CityLookupItem,
  VenuePresetItem,
  VenueStatusLookupItem,
} from '@corpcal/shared/api/types';
import type { ActivityFormData } from '@corpcal/shared/schemas';
import {
  fetchCities,
  fetchLastUsedAddresses,
  fetchVenuePresets,
} from '@/api/lookupsApi';
import { FormSelect, FormSelectTrigger } from '@/components/app/form-select';
import {
  AddressAutocomplete,
  type AddressData,
} from '@/components/ui/address-autocomplete';
import { Badge } from '@/components/ui/badge';
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from '@/components/ui/combobox';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { FormSectionDivider } from '@/components/ui/form-section-divider';
import {
  FreeformCombobox,
  type FreeformComboboxItemWithLead,
  type FreeformComboboxOption,
  type FreeformComboboxSection,
  type FreeformComboboxValue,
  type FreeformComboboxValueWithLead,
} from '@/components/ui/freeform-combobox';
import { Input } from '@/components/ui/input';
import { SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { getActivityFieldLabel } from '@/lib/activity-form-labels';
import { ACTIVITY_FORM_SECTION_LABELS } from '@/lib/activity-form-section-labels';
import type { OptionItem } from '@/schemas/types';

import { useActivityEdit } from '../activity-edit-context';
import { ActivityFormHeading } from './ActivityFormHeading';
import { ActivityFormSection } from './ActivityFormSection';

const PINNED_BADGE_MAX_TOTAL = 4;

const VENUE_OPTION_STATUS_PREFIX = 'vs:' as const;
const VENUE_OPTION_PRESET_PREFIX = 'vp:' as const;

function venueStatusOptionValue(id: number): string {
  return `${VENUE_OPTION_STATUS_PREFIX}${id}`;
}

function venuePresetOptionValue(id: number): string {
  return `${VENUE_OPTION_PRESET_PREFIX}${id}`;
}

type VenueFormValue = {
  venueName: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  provinceOrState: string | null;
  country: string | null;
};

const EMPTY_VENUE: VenueFormValue = {
  venueName: null,
  addressLine1: null,
  addressLine2: null,
  city: null,
  provinceOrState: null,
  country: null,
};

function venueToFormValue(item: VenuePresetItem): VenueFormValue {
  return {
    venueName: item.venueName ?? null,
    addressLine1: item.addressLine1 ?? null,
    addressLine2: item.addressLine2 ?? null,
    city: item.city ?? null,
    provinceOrState: item.provinceOrState ?? null,
    country: item.country ?? null,
  };
}

function venueTagLabel(item: VenuePresetItem): string {
  if (item.venueName) return item.venueName;
  const parts = [item.addressLine1, item.city].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'Address';
}

function addressMatchesQuickPick(
  currentVenue: VenueFormValue,
  item: VenuePresetItem
): boolean {
  const n = (v: string | null | undefined) => v ?? null;
  return (
    n(currentVenue.venueName) === n(item.venueName) &&
    n(currentVenue.addressLine1) === n(item.addressLine1) &&
    n(currentVenue.addressLine2) === n(item.addressLine2) &&
    n(currentVenue.city) === n(item.city) &&
    n(currentVenue.provinceOrState) === n(item.provinceOrState) &&
    n(currentVenue.country) === n(item.country)
  );
}

function venueComboboxValueFromForm(
  currentVenue: VenueFormValue,
  quickPickTags: VenuePresetItem[],
  venueStatusId: number | null | undefined
): FreeformComboboxValueWithLead {
  const matches = quickPickTags.filter((item) =>
    addressMatchesQuickPick(currentVenue, item)
  );
  if (matches.length > 0) {
    const pick = matches[0];
    return { type: 'option', value: venuePresetOptionValue(pick.id) };
  }
  if (venueStatusId != null && !Number.isNaN(Number(venueStatusId))) {
    return { type: 'option', value: venueStatusOptionValue(venueStatusId) };
  }
  if (currentVenue.venueName) {
    return { type: 'freeform', value: currentVenue.venueName };
  }
  return null;
}

function cityComboboxValueFromVenue(
  currentVenue: VenueFormValue,
  citiesList: CityLookupItem[]
): FreeformComboboxValueWithLead {
  const cityText = currentVenue.city?.trim() ?? '';
  if (!cityText) return null;
  const active = citiesList.filter((c) => c.isActive);
  const triple = active.filter(
    (c) =>
      (c.displayName === cityText || c.name === cityText) &&
      (c.provinceOrState ?? '') === (currentVenue.provinceOrState ?? '') &&
      (c.country ?? '') === (currentVenue.country ?? '')
  );
  if (triple.length === 1) {
    return { type: 'option', value: String(triple[0].id) };
  }
  const byName = active.filter(
    (c) => c.displayName === cityText || c.name === cityText
  );
  if (byName.length === 1) {
    return { type: 'option', value: String(byName[0].id) };
  }
  return { type: 'freeform', value: cityText };
}

type ActivityEventSectionProps = {
  venueStatuses: VenueStatusLookupItem[];
  representativeOptions: Array<{
    id: number;
    name: string;
    displayName?: string;
    title?: string;
  }>;
  premierRequestedOptions: OptionItem[];
  eventPlannerOptions: OptionItem[];
};

export const ActivityEventSection: FC<ActivityEventSectionProps> = ({
  venueStatuses,
  representativeOptions,
  premierRequestedOptions,
  eventPlannerOptions,
}) => {
  const { readOnly } = useActivityEdit();
  const form = useFormContext<ActivityFormData>();
  const venueStatusIdWatched = useWatch({
    control: form.control,
    name: 'venueStatusId',
  });
  const representativesAnchorRef = useComboboxAnchor();

  const { data: allPresets = [] } = useQuery({
    queryKey: ['venuePresets'],
    queryFn: fetchVenuePresets,
  });
  const { data: lastUsed = [] } = useQuery({
    queryKey: ['venueLastUsed'],
    queryFn: fetchLastUsedAddresses,
  });

  const { data: citiesList = [] } = useQuery({
    queryKey: ['cities'],
    queryFn: fetchCities,
  });

  const cityComboboxOptions: FreeformComboboxOption[] = useMemo(
    () =>
      citiesList
        .filter((c) => c.isActive)
        .map((c) => ({
          value: String(c.id),
          label: c.displayName,
        })),
    [citiesList]
  );

  const pinnedPresets = useMemo(
    () =>
      allPresets
        .filter((p) => p.isPinned)
        .sort((a, b) => a.pinnedSortOrder - b.pinnedSortOrder),
    [allPresets]
  );

  const lastUsedSlots = PINNED_BADGE_MAX_TOTAL - pinnedPresets.length;
  const lastUsedDisplay =
    lastUsedSlots > 0 ? lastUsed.slice(0, lastUsedSlots) : [];
  const quickPickTags = [...pinnedPresets, ...lastUsedDisplay];

  const venueNameComboboxSections: FreeformComboboxSection[] = useMemo(() => {
    const statusOptions: FreeformComboboxOption[] = [...venueStatuses]
      .sort((a, b) =>
        (a.displayName ?? a.name).localeCompare(b.displayName ?? b.name)
      )
      .map((s) => ({
        value: venueStatusOptionValue(s.id),
        label: s.displayName ?? s.name,
      }));
    const presetOptions: FreeformComboboxOption[] = allPresets
      .slice()
      .sort((a, b) => (a.venueName ?? '').localeCompare(b.venueName ?? ''))
      .map((item) => ({
        value: venuePresetOptionValue(item.id),
        label: venueTagLabel(item),
      }));
    return [
      { id: 'venue-status', options: statusOptions },
      { id: 'venue-presets', options: presetOptions },
    ];
  }, [venueStatuses, allPresets]);

  // Convert representative options to combobox format
  const representativeComboboxOptions = representativeOptions.map((rep) => ({
    value: rep.id.toString(),
    label: rep.displayName || rep.name,
  }));
  return (
    <ActivityFormSection title={ACTIVITY_FORM_SECTION_LABELS.event}>
      <FormField
        control={form.control}
        name="premierRequestedId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{getActivityFieldLabel(field.name)}</FormLabel>
            <FormSelect
              readOnly={readOnly}
              onValueChange={(value) => {
                const parsed = value ? parseInt(value, 10) : null;
                field.onChange(isNaN(parsed as number) ? null : parsed);
              }}
              value={field.value ? field.value.toString() : ''}
            >
              <FormControl data-field={field.name}>
                <FormSelectTrigger readOnly={readOnly}>
                  <SelectValue placeholder="Select premier requested option" />
                </FormSelectTrigger>
              </FormControl>
              <SelectContent>
                {premierRequestedOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </FormSelect>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="representatives"
        render={({ field }) => {
          const representatives = field.value || [];
          const selectedValues = representatives
            .filter((rep) => rep.representativeId !== undefined)
            .map((rep) => rep.representativeId!.toString());
          const selectedOptions = representativeComboboxOptions.filter((o) =>
            selectedValues.includes(o.value)
          );

          return (
            <FormItem>
              <FormLabel>{getActivityFieldLabel(field.name)}</FormLabel>
              <FormControl data-field={field.name}>
                <Combobox
                  items={representativeComboboxOptions}
                  multiple
                  value={selectedOptions}
                  onValueChange={(selected: OptionItem[]) => {
                    field.onChange(
                      selected.map((o) => ({
                        representativeId: parseInt(o.value, 10),
                      }))
                    );
                  }}
                  itemToStringValue={(o: OptionItem) => o.label}
                  readOnly={readOnly}
                >
                  <ComboboxChips
                    ref={representativesAnchorRef}
                    className="w-full"
                  >
                    <ComboboxValue>
                      {(values: OptionItem[]) => (
                        <>
                          {values.map((option) => (
                            <ComboboxChip key={option.value}>
                              {option.label}
                            </ComboboxChip>
                          ))}
                          <ComboboxChipsInput placeholder="Add representatives" />
                        </>
                      )}
                    </ComboboxValue>
                  </ComboboxChips>
                  <ComboboxContent anchor={representativesAnchorRef}>
                    <ComboboxEmpty>No representatives found.</ComboboxEmpty>
                    <ComboboxList>
                      {(option: OptionItem) => (
                        <ComboboxItem key={option.value} value={option}>
                          {option.label}
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </FormControl>
              <FormMessage />
            </FormItem>
          );
        }}
      />

      <FormSectionDivider />

      <ActivityFormHeading>Location</ActivityFormHeading>

      <FormField
        control={form.control}
        name="venueAddress"
        render={({ field }) => {
          const currentVenue: VenueFormValue = {
            ...EMPTY_VENUE,
            ...(field.value ?? {}),
          };

          const handleAddressSelect = (addressData: AddressData) => {
            const updated = {
              ...currentVenue,
              addressLine1: addressData.addressLine1,
              addressLine2: null,
              city: addressData.city,
              provinceOrState: addressData.province,
              country: addressData.country,
            };
            field.onChange(updated);
          };

          const handleQuickPickSelect = (item: VenuePresetItem) => {
            form.setValue('venueStatusId', null);
            field.onChange(venueToFormValue(item));
          };

          const handleCityComboboxChange = (
            v:
              | FreeformComboboxValueWithLead
              | FreeformComboboxItemWithLead[]
              | null
          ) => {
            if (Array.isArray(v)) return;
            if (v == null) {
              field.onChange({ ...currentVenue, city: null });
              return;
            }
            if (v.type === 'option') {
              const item = citiesList.find((c) => String(c.id) === v.value);
              if (item) {
                field.onChange({
                  ...currentVenue,
                  city: item.displayName,
                  provinceOrState: item.provinceOrState ?? null,
                  country: item.country ?? null,
                });
              }
              return;
            }
            field.onChange({
              ...currentVenue,
              city: v.value ? v.value : null,
            });
          };

          const handleVenueNameComboboxChange = (
            v:
              | FreeformComboboxValueWithLead
              | FreeformComboboxItemWithLead[]
              | null
          ) => {
            if (Array.isArray(v)) return;
            if (v == null) {
              form.setValue('venueStatusId', null);
              field.onChange({ ...currentVenue, venueName: null });
              return;
            }
            if (v.type === 'option') {
              if (v.value.startsWith(VENUE_OPTION_STATUS_PREFIX)) {
                const id = Number(
                  v.value.slice(VENUE_OPTION_STATUS_PREFIX.length)
                );
                if (!Number.isNaN(id)) {
                  form.setValue('venueStatusId', id);
                  field.onChange({ ...EMPTY_VENUE });
                }
                return;
              }
              if (v.value.startsWith(VENUE_OPTION_PRESET_PREFIX)) {
                const idStr = v.value.slice(VENUE_OPTION_PRESET_PREFIX.length);
                const item = allPresets.find((t) => String(t.id) === idStr);
                if (item) {
                  form.setValue('venueStatusId', null);
                  field.onChange(venueToFormValue(item));
                }
                return;
              }
              return;
            }
            form.setValue('venueStatusId', null);
            field.onChange({
              ...currentVenue,
              venueName: v.value ? v.value : null,
            });
          };

          return (
            <>
              <FormItem className="mb-8">
                <FormLabel>{getActivityFieldLabel('venueName')}</FormLabel>
                <FormControl data-field={field.name}>
                  <FreeformCombobox
                    readOnly={readOnly}
                    multiple={false}
                    useChips={false}
                    sections={venueNameComboboxSections}
                    value={venueComboboxValueFromForm(
                      currentVenue,
                      quickPickTags,
                      venueStatusIdWatched
                    )}
                    onChange={handleVenueNameComboboxChange}
                    placeholder="Venue TBD, TBC, or a venue name…"
                    searchPlaceholder="Search venue status or venues…"
                    emptyMessage="No venues found."
                  />
                </FormControl>
                <FormField
                  control={form.control}
                  name="venueStatusId"
                  render={() => <FormMessage className="mt-1" />}
                />
                {quickPickTags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {quickPickTags.map((item) => {
                      const isSelected = addressMatchesQuickPick(
                        currentVenue,
                        item
                      );
                      return (
                        <Badge
                          key={item.id}
                          variant={isSelected ? 'selected' : 'outline'}
                          className={
                            readOnly
                              ? 'gap-1 font-normal'
                              : 'cursor-pointer gap-1 font-normal'
                          }
                          onClick={
                            readOnly
                              ? undefined
                              : () => handleQuickPickSelect(item)
                          }
                        >
                          <Plus className="h-3.5 w-3.5" />
                          {venueTagLabel(item)}
                        </Badge>
                      );
                    })}
                  </div>
                )}
                <FormMessage />
              </FormItem>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:items-start">
                <FormItem>
                  <FormLabel>{getActivityFieldLabel('addressLine1')}</FormLabel>
                  <FormControl data-field={field.name}>
                    <AddressAutocomplete
                      defaultValue={currentVenue.addressLine1 || ''}
                      value={currentVenue.addressLine1 ?? ''}
                      onAddressSelect={handleAddressSelect}
                      readOnly={readOnly}
                    />
                  </FormControl>
                </FormItem>
                <FormItem>
                  <FormLabel>{getActivityFieldLabel('addressLine2')}</FormLabel>
                  <FormControl data-field={field.name}>
                    <Input
                      value={currentVenue.addressLine2 ?? ''}
                      readOnly={readOnly}
                      onChange={(e) =>
                        field.onChange({
                          ...currentVenue,
                          addressLine2: e.target.value || null,
                        })
                      }
                      placeholder="Floor, room, etc."
                    />
                  </FormControl>
                </FormItem>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormItem>
                  <FormLabel>{getActivityFieldLabel('city')}</FormLabel>
                  <FormControl data-field={field.name}>
                    <FreeformCombobox
                      readOnly={readOnly}
                      multiple={false}
                      useChips={false}
                      options={cityComboboxOptions}
                      value={cityComboboxValueFromVenue(
                        currentVenue,
                        citiesList
                      )}
                      onChange={handleCityComboboxChange}
                      emptyMessage="No cities found."
                      freeformLabel="Other"
                      freeformDescription="Enter a city not in the list"
                    />
                  </FormControl>
                </FormItem>

                <FormItem>
                  <FormLabel>
                    {getActivityFieldLabel('provinceOrState')}
                  </FormLabel>
                  <FormControl data-field={field.name}>
                    <Input
                      value={currentVenue.provinceOrState ?? ''}
                      readOnly={readOnly}
                      onChange={(e) =>
                        field.onChange({
                          ...currentVenue,
                          provinceOrState: e.target.value || null,
                        })
                      }
                    />
                  </FormControl>
                </FormItem>
              </div>

              <FormItem className="mt-6">
                <FormLabel>{getActivityFieldLabel('country')}</FormLabel>
                <FormControl data-field={field.name}>
                  <Input
                    value={currentVenue.country ?? ''}
                    readOnly={readOnly}
                    onChange={(e) =>
                      field.onChange({
                        ...currentVenue,
                        country: e.target.value || null,
                      })
                    }
                  />
                </FormControl>
              </FormItem>
            </>
          );
        }}
      />

      <FormSectionDivider />

      <FormField
        control={form.control}
        name="eventPlanners"
        render={({ field }) => {
          const list = field.value ?? [];
          const comboboxValue: FreeformComboboxItemWithLead[] = list.map(
            (p) => {
              const base: FreeformComboboxItemWithLead =
                p.eventPlannerId != null
                  ? { type: 'option', value: String(p.eventPlannerId) }
                  : p.eventPlannerName
                    ? { type: 'freeform', value: p.eventPlannerName }
                    : { type: 'freeform', value: '' };
              return { ...base, isLead: p.isLead ?? false };
            }
          );

          const handleChange = (
            value: FreeformComboboxValue | FreeformComboboxValue[] | null
          ) => {
            const arr =
              value == null
                ? []
                : Array.isArray(value)
                  ? value.filter(
                      (v): v is NonNullable<FreeformComboboxValue> => v != null
                    )
                  : [value];
            if (arr.length === 0) {
              field.onChange([]);
              return;
            }
            const current = field.value ?? [];
            const prevLead = current.find((p) => p.isLead);
            const leadKey =
              prevLead?.eventPlannerId != null
                ? `id:${prevLead.eventPlannerId}`
                : prevLead?.eventPlannerName != null
                  ? `name:${prevLead.eventPlannerName}`
                  : null;
            const next = arr.map((v, i) => {
              const key =
                v.type === 'option'
                  ? `id:${parseInt(v.value, 10)}`
                  : `name:${v.value}`;
              const isLead = leadKey != null ? key === leadKey : i === 0;
              if (v.type === 'option') {
                return {
                  eventPlannerId: parseInt(v.value, 10),
                  isLead,
                };
              }
              return { eventPlannerName: v.value, isLead };
            });
            if (next.length > 0 && !next.some((p) => p.isLead)) {
              next[0] = { ...next[0], isLead: true };
            }
            field.onChange(next);
          };

          const setLead = (index: number) => {
            const next = (field.value ?? []).map((p, i) => ({
              ...p,
              isLead: i === index,
            }));
            field.onChange(next);
          };

          return (
            <FormItem>
              <FormLabel>{getActivityFieldLabel(field.name)}</FormLabel>
              <FormControl data-field={field.name}>
                <FreeformCombobox
                  readOnly={readOnly}
                  options={eventPlannerOptions}
                  value={comboboxValue}
                  onChange={handleChange}
                  placeholder="Select event planners"
                  searchPlaceholder="Search event planners..."
                  emptyMessage="No event planners found."
                  freeformLabel="Other"
                  freeformDescription="Can't find the event planner?"
                  multiple
                  useChips
                  onSetLead={setLead}
                />
              </FormControl>

              <FormMessage />
            </FormItem>
          );
        }}
      />
    </ActivityFormSection>
  );
};
