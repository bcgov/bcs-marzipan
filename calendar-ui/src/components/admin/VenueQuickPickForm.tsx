import { useEffect, useState } from 'react';

import {
  AddressAutocomplete,
  type AddressData,
} from '@/components/ui/address-autocomplete';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface VenueQuickPickFormData {
  venueName?: string | null;
  street?: string | null;
  city?: string | null;
  provinceOrState?: string | null;
  country?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

interface VenueQuickPickFormProps {
  initialData: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
  isSubmitting?: boolean;
}

const defaultFormData: VenueQuickPickFormData = {
  venueName: '',
  street: null,
  city: null,
  provinceOrState: null,
  country: null,
  sortOrder: 0,
  isActive: true,
};

function toFormData(initial: Record<string, unknown>): VenueQuickPickFormData {
  return {
    venueName: (initial.venueName as string) ?? defaultFormData.venueName ?? '',
    street: (initial.street as string | null) ?? defaultFormData.street,
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
  };
}

/**
 * Form for adding/editing a Venue Quick Pick in Settings.
 * Uses AddressAutocomplete for real-address search (same UX as Create Activity venue).
 * Calls onChange with full payload: venueName, street, city, provinceOrState, country, sortOrder, isActive.
 */
export function VenueQuickPickForm({
  initialData,
  onChange,
  isSubmitting = false,
}: VenueQuickPickFormProps) {
  const [formData, setFormData] = useState<VenueQuickPickFormData>(() =>
    toFormData(initialData)
  );

  useEffect(() => {
    const next = toFormData(initialData);
    setFormData(next);
    onChange({
      venueName: next.venueName ?? '',
      street: next.street ?? null,
      city: next.city ?? null,
      provinceOrState: next.provinceOrState ?? null,
      country: next.country ?? null,
      sortOrder: next.sortOrder ?? 0,
      isActive: next.isActive ?? true,
    });
  }, [initialData, onChange]);

  const notifyChange = (next: VenueQuickPickFormData) => {
    setFormData(next);
    onChange({
      venueName: next.venueName ?? '',
      street: next.street ?? null,
      city: next.city ?? null,
      provinceOrState: next.provinceOrState ?? null,
      country: next.country ?? null,
      sortOrder: next.sortOrder ?? 0,
      isActive: next.isActive ?? true,
    });
  };

  const handleAddressSelect = (addressData: AddressData) => {
    notifyChange({
      ...formData,
      street: addressData.street,
      city: addressData.city,
      provinceOrState: addressData.province,
      country: addressData.country,
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label
          htmlFor="venue-quick-pick-venue-name"
          className="text-sm font-medium"
        >
          Venue Name
          <span className="text-destructive ml-1">*</span>
        </Label>
        <Input
          id="venue-quick-pick-venue-name"
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

      <AddressAutocomplete
        label="Street Address"
        placeholder="Start typing an address..."
        value={formData.street ?? ''}
        onAddressSelect={handleAddressSelect}
        required
        disabled={isSubmitting}
      />

      <div className="space-y-2">
        <Label htmlFor="venue-quick-pick-city" className="text-sm font-medium">
          City
        </Label>
        <Input
          id="venue-quick-pick-city"
          type="text"
          value={formData.city ?? ''}
          disabled
          placeholder="City will be populated from address"
          className="w-full opacity-90"
        />
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="venue-quick-pick-province"
          className="text-sm font-medium"
        >
          Province/State
        </Label>
        <Input
          id="venue-quick-pick-province"
          type="text"
          value={formData.provinceOrState ?? ''}
          disabled
          placeholder="Province will be populated from address"
          className="w-full opacity-90"
        />
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="venue-quick-pick-country"
          className="text-sm font-medium"
        >
          Country
        </Label>
        <Input
          id="venue-quick-pick-country"
          type="text"
          value={formData.country ?? ''}
          disabled
          placeholder="Country will be populated from address"
          className="w-full opacity-90"
        />
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="venue-quick-pick-sort-order"
          className="text-sm font-medium"
        >
          Sort Order
        </Label>
        <Input
          id="venue-quick-pick-sort-order"
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

      <div className="flex items-center space-x-2">
        <Checkbox
          id="venue-quick-pick-is-active"
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
          htmlFor="venue-quick-pick-is-active"
          className="cursor-pointer text-sm font-normal"
        >
          Active
        </Label>
      </div>
    </div>
  );
}
