import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';

import { fetchCities } from '@/api/lookupsApi';
import {
  AddressAutocomplete,
  type AddressData,
} from '@/components/ui/address-autocomplete';
import { Checkbox } from '@/components/ui/checkbox';
import {
  FreeformCombobox,
  type FreeformComboboxOption,
  type FreeformComboboxValue,
  type FreeformComboboxValueWithLead,
} from '@/components/ui/freeform-combobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getActivityFieldLabel } from '@/lib/activity-form-labels';
import { lookupQueryKeys } from '@/lib/lookupQueryKeys';

export interface VenuePresetFormData {
  venueName?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  provinceOrState?: string | null;
  country?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  isPinned?: boolean;
  pinnedSortOrder?: number;
}

interface VenuePresetFormProps {
  initialData: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
  isSubmitting?: boolean;
}

const defaultFormData: VenuePresetFormData = {
  venueName: '',
  addressLine1: null,
  addressLine2: null,
  city: null,
  provinceOrState: null,
  country: null,
  sortOrder: 0,
  isActive: true,
  isPinned: false,
  pinnedSortOrder: 0,
};

function toFormData(initial: Record<string, unknown>): VenuePresetFormData {
  return {
    venueName: (initial.venueName as string) ?? defaultFormData.venueName ?? '',
    addressLine1:
      (initial.addressLine1 as string | null) ?? defaultFormData.addressLine1,
    addressLine2:
      (initial.addressLine2 as string | null) ?? defaultFormData.addressLine2,
    city: (initial.city as string | null) ?? defaultFormData.city,
    provinceOrState:
      (initial.provinceOrState as string | null) ??
      defaultFormData.provinceOrState,
    country: (initial.country as string | null) ?? defaultFormData.country,
    sortOrder:
      typeof initial.sortOrder === 'number'
        ? initial.sortOrder
        : (defaultFormData.sortOrder ?? 0),
    isActive:
      typeof initial.isActive === 'boolean'
        ? initial.isActive
        : (defaultFormData.isActive ?? true),
    isPinned:
      typeof initial.isPinned === 'boolean'
        ? initial.isPinned
        : (defaultFormData.isPinned ?? false),
    pinnedSortOrder:
      typeof initial.pinnedSortOrder === 'number'
        ? initial.pinnedSortOrder
        : (defaultFormData.pinnedSortOrder ?? 0),
  };
}

function serializeFormData(data: VenuePresetFormData): Record<string, unknown> {
  return {
    venueName: data.venueName ?? '',
    addressLine1: data.addressLine1 ?? null,
    addressLine2: data.addressLine2 ?? null,
    city: data.city ?? null,
    provinceOrState: data.provinceOrState ?? null,
    country: data.country ?? null,
    sortOrder: data.sortOrder ?? 0,
    isActive: data.isActive ?? true,
    isPinned: data.isPinned ?? false,
    pinnedSortOrder: data.pinnedSortOrder ?? 0,
  };
}

export function VenuePresetForm({
  initialData,
  onChange,
  isSubmitting = false,
}: VenuePresetFormProps) {
  const [formData, setFormData] = useState<VenuePresetFormData>(() =>
    toFormData(initialData)
  );

  const { data: citiesList = [] } = useQuery({
    queryKey: lookupQueryKeys.cities(),
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

  useEffect(() => {
    const next = toFormData(initialData);
    setFormData(next);
    onChange(serializeFormData(next));
  }, [initialData, onChange]);

  const notifyChange = (next: VenuePresetFormData) => {
    setFormData(next);
    onChange(serializeFormData(next));
  };

  const handleAddressSelect = (addressData: AddressData) => {
    notifyChange({
      ...formData,
      addressLine1: addressData.addressLine1,
      addressLine2: null,
      city: addressData.city,
      provinceOrState: addressData.province,
      country: addressData.country,
    });
  };

  const handleCityComboboxChange = (
    v: FreeformComboboxValue | FreeformComboboxValue[] | null
  ) => {
    if (Array.isArray(v)) return;
    if (v == null) {
      notifyChange({ ...formData, city: null });
      return;
    }
    if (v.type === 'option') {
      const item = citiesList.find((c) => String(c.id) === v.value);
      if (item) {
        notifyChange({
          ...formData,
          city: item.displayName,
          provinceOrState: item.provinceOrState ?? null,
          country: item.country ?? null,
        });
      }
      return;
    }
    notifyChange({
      ...formData,
      city: v.value ? v.value : null,
    });
  };

  const cityComboboxValue = useMemo((): FreeformComboboxValueWithLead => {
    const cityText = formData.city?.trim() ?? '';
    if (!cityText) return null;
    const active = citiesList.filter((c) => c.isActive);
    const triple = active.filter(
      (c) =>
        (c.displayName === cityText || c.name === cityText) &&
        (c.provinceOrState ?? '') === (formData.provinceOrState ?? '') &&
        (c.country ?? '') === (formData.country ?? '')
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
  }, [formData.city, formData.provinceOrState, formData.country, citiesList]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label
          htmlFor="venue-preset-venue-name"
          className="text-sm font-medium"
        >
          Venue name
          <span className="text-destructive ml-1">*</span>
        </Label>
        <Input
          id="venue-preset-venue-name"
          type="text"
          placeholder="e.g. BC Legislature"
          value={formData.venueName ?? ''}
          onChange={(e) =>
            notifyChange({ ...formData, venueName: e.target.value })
          }
          disabled={isSubmitting}
          className="w-full"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:items-start">
        <div className="space-y-2">
          <Label
            htmlFor="venue-preset-address-line1"
            className="text-sm font-medium"
          >
            {getActivityFieldLabel('addressLine1')}
          </Label>
          <AddressAutocomplete
            id="venue-preset-address-line1"
            placeholder="Start typing an address..."
            value={formData.addressLine1 ?? ''}
            onAddressSelect={handleAddressSelect}
            disabled={isSubmitting}
          />
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="venue-preset-address-line2"
            className="text-sm font-medium"
          >
            {getActivityFieldLabel('addressLine2')}
          </Label>
          <Input
            id="venue-preset-address-line2"
            type="text"
            value={formData.addressLine2 ?? ''}
            onChange={(e) =>
              notifyChange({
                ...formData,
                addressLine2: e.target.value || null,
              })
            }
            disabled={isSubmitting}
            placeholder="Floor, room, etc."
            className="w-full"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            {getActivityFieldLabel('city')}
          </Label>
          <FreeformCombobox
            multiple={false}
            useChips={false}
            options={cityComboboxOptions}
            value={cityComboboxValue}
            onChange={handleCityComboboxChange}
            searchPlaceholder="Search cities..."
            emptyMessage="No cities found."
            freeformLabel="Other"
            freeformDescription="Enter a city not in the list"
            readOnly={isSubmitting}
          />
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="venue-preset-province"
            className="text-sm font-medium"
          >
            {getActivityFieldLabel('provinceOrState')}
          </Label>
          <Input
            id="venue-preset-province"
            type="text"
            value={formData.provinceOrState ?? ''}
            onChange={(e) =>
              notifyChange({
                ...formData,
                provinceOrState: e.target.value || null,
              })
            }
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="venue-preset-country" className="text-sm font-medium">
          {getActivityFieldLabel('country')}
        </Label>
        <Input
          id="venue-preset-country"
          type="text"
          value={formData.country ?? ''}
          onChange={(e) =>
            notifyChange({
              ...formData,
              country: e.target.value || null,
            })
          }
          disabled={isSubmitting}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label
            htmlFor="venue-preset-sort-order"
            className="text-sm font-medium"
          >
            Sort order
          </Label>
          <Input
            id="venue-preset-sort-order"
            type="number"
            value={formData.sortOrder ?? 0}
            onChange={(e) =>
              notifyChange({
                ...formData,
                sortOrder: parseInt(e.target.value, 10) || 0,
              })
            }
            disabled={isSubmitting}
            className="w-full"
          />
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="venue-preset-pinned-sort-order"
            className="text-sm font-medium"
          >
            Pinned sort order
          </Label>
          <Input
            id="venue-preset-pinned-sort-order"
            type="number"
            value={formData.pinnedSortOrder ?? 0}
            onChange={(e) =>
              notifyChange({
                ...formData,
                pinnedSortOrder: parseInt(e.target.value, 10) || 0,
              })
            }
            disabled={isSubmitting}
            className="w-full"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="venue-preset-is-active"
            checked={formData.isActive ?? true}
            onCheckedChange={(checked) =>
              notifyChange({
                ...formData,
                isActive: checked === true,
              })
            }
            disabled={isSubmitting}
          />
          <Label
            htmlFor="venue-preset-is-active"
            className="cursor-pointer text-sm font-normal"
          >
            Active
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="venue-preset-is-pinned"
            checked={formData.isPinned ?? false}
            onCheckedChange={(checked) =>
              notifyChange({
                ...formData,
                isPinned: checked === true,
              })
            }
            disabled={isSubmitting}
          />
          <Label
            htmlFor="venue-preset-is-pinned"
            className="cursor-pointer text-sm font-normal"
          >
            Pinned (show as badge)
          </Label>
        </div>
      </div>
    </div>
  );
}
