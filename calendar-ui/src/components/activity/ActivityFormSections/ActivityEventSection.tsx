import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import { useMemo } from 'react';

import type {
  CityLookupItem,
  VenueQuickPickItem,
} from '@corpcal/shared/api/types';
import type { ActivityFormData } from '@corpcal/shared/schemas';
import {
  fetchCities,
  fetchLastUsedAddresses,
  fetchVenueQuickPicks,
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

const QUICK_PICK_MAX_TOTAL = 4;

const VENUE_TBC_OPTION_VALUE = '__venue_tbc__';
const VENUE_TBC_DISPLAY = 'Venue TBC';

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

function venueToFormValue(item: VenueQuickPickItem): VenueFormValue {
  return {
    venueName: item.venueName ?? null,
    addressLine1: item.addressLine1 ?? null,
    addressLine2: item.addressLine2 ?? null,
    city: item.city ?? null,
    provinceOrState: item.provinceOrState ?? null,
    country: item.country ?? null,
  };
}

function venueTagLabel(item: VenueQuickPickItem): string {
  if (item.venueName) return item.venueName;
  const parts = [item.addressLine1, item.city].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'Address';
}

function addressMatchesQuickPick(
  currentVenue: VenueFormValue,
  item: VenueQuickPickItem
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
  quickPickTags: VenueQuickPickItem[]
): FreeformComboboxValueWithLead {
  const matches = quickPickTags.filter((item) =>
    addressMatchesQuickPick(currentVenue, item)
  );
  if (matches.length > 0) {
    const pick = matches[0];
    return { type: 'option', value: String(pick.id) };
  }
  if (currentVenue.venueName === VENUE_TBC_DISPLAY) {
    return { type: 'option', value: VENUE_TBC_OPTION_VALUE };
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
  representativeOptions: Array<{
    id: number;
    name: string;
    displayName?: string;
    title?: string;
  }>;
  premierRequestedOptions: OptionItem[];
  eventPlannerOptions: OptionItem[];
};

export const ActivityEventSection: React.FC<ActivityEventSectionProps> = ({
  representativeOptions,
  premierRequestedOptions,
  eventPlannerOptions,
}) => {
  const { readOnly } = useActivityEdit();
  const form = useFormContext<ActivityFormData>();
  const representativesAnchorRef = useComboboxAnchor();

  const { data: fixedQuickPicks = [] } = useQuery({
    queryKey: ['venueQuickPicks'],
    queryFn: fetchVenueQuickPicks,
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

  const lastUsedSlots = QUICK_PICK_MAX_TOTAL - fixedQuickPicks.length;
  const lastUsedDisplay =
    lastUsedSlots > 0 ? lastUsed.slice(0, lastUsedSlots) : [];
  const quickPickTags = [...fixedQuickPicks, ...lastUsedDisplay];

  const venueNameComboboxOptions: FreeformComboboxOption[] = useMemo(
    () => [
      { value: VENUE_TBC_OPTION_VALUE, label: VENUE_TBC_DISPLAY },
      ...quickPickTags.map((item) => ({
        value: String(item.id),
        label: venueTagLabel(item),
      })),
    ],
    [quickPickTags]
  );

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

          const handleQuickPickSelect = (item: VenueQuickPickItem) => {
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
              field.onChange({ ...currentVenue, venueName: null });
              return;
            }
            if (v.type === 'option' && v.value === VENUE_TBC_OPTION_VALUE) {
              field.onChange({
                ...currentVenue,
                venueName: VENUE_TBC_DISPLAY,
              });
              return;
            }
            if (v.type === 'option') {
              const item = quickPickTags.find((t) => String(t.id) === v.value);
              if (item) field.onChange(venueToFormValue(item));
              return;
            }
            field.onChange({
              ...currentVenue,
              venueName: v.value ? v.value : null,
            });
          };

          return (
            <>
              <FormItem>
                <FormLabel>{getActivityFieldLabel('venueName')}</FormLabel>
                <FormControl data-field={field.name}>
                  <FreeformCombobox
                    readOnly={readOnly}
                    multiple={false}
                    useChips={false}
                    options={venueNameComboboxOptions}
                    value={venueComboboxValueFromForm(
                      currentVenue,
                      quickPickTags
                    )}
                    onChange={handleVenueNameComboboxChange}
                    placeholder="Search or enter venue name"
                    searchPlaceholder="Search venues..."
                    emptyMessage="No venues found."
                  />
                </FormControl>
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

              <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 md:items-start">
                <FormItem>
                  <FormLabel>{getActivityFieldLabel('addressLine1')}</FormLabel>
                  <FormControl data-field={field.name}>
                    <AddressAutocomplete
                      placeholder="Start typing an address..."
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
                      searchPlaceholder="Search cities..."
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
