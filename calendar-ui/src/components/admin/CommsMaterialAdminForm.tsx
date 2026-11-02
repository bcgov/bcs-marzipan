import { useEffect, useRef, useState } from 'react';

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { OptionItem } from '@/schemas/types';

import {
  LookupVisibilityAdminForm,
  type LookupVisibilityAdminFormProps,
} from './LookupVisibilityAdminForm';

type CommsMaterialAdminFormProps = LookupVisibilityAdminFormProps & {
  releaseTypeOptions: OptionItem[];
};

function releaseTypeIdToSelectValue(id: unknown): string {
  if (id == null || id === '') return 'none';
  if (typeof id === 'number' && Number.isFinite(id)) return String(id);
  if (typeof id === 'string') return id;
  return 'none';
}

export function CommsMaterialAdminForm({
  releaseTypeOptions,
  onChange,
  initialData,
  resetKey,
  ...rest
}: CommsMaterialAdminFormProps) {
  const [releaseTypeId, setReleaseTypeId] = useState<string>(() =>
    releaseTypeIdToSelectValue(initialData.releaseTypeId)
  );
  const lastResetKeyRef = useRef<string | null>(null);
  const latestVisibilityDataRef = useRef<Record<string, unknown>>(initialData);

  useEffect(() => {
    if (lastResetKeyRef.current === null) {
      lastResetKeyRef.current = resetKey;
      return;
    }
    if (lastResetKeyRef.current === resetKey) return;
    lastResetKeyRef.current = resetKey;
    setReleaseTypeId(releaseTypeIdToSelectValue(initialData.releaseTypeId));
  }, [resetKey, initialData.releaseTypeId]);

  const handleVisibilityChange = (data: Record<string, unknown>) => {
    latestVisibilityDataRef.current = data;
    onChange({
      ...data,
      releaseTypeId: releaseTypeId === 'none' ? null : Number(releaseTypeId),
    });
  };

  return (
    <div className="space-y-4">
      <LookupVisibilityAdminForm
        {...rest}
        resetKey={resetKey}
        initialData={initialData}
        onChange={handleVisibilityChange}
      />
      <div className="space-y-2">
        <Label htmlFor="comms-material-release-type">Release type</Label>
        <Select
          value={releaseTypeId}
          onValueChange={(value) => {
            setReleaseTypeId(value);
            onChange({
              ...latestVisibilityDataRef.current,
              releaseTypeId: value === 'none' ? null : Number(value),
            });
          }}
        >
          <SelectTrigger id="comms-material-release-type">
            <SelectValue placeholder="None (internal only)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None (internal only)</SelectItem>
            {releaseTypeOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
