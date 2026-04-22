import { useEffect, useRef, useState } from 'react';

import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'checkbox' | 'select';
  required?: boolean;
  placeholder?: string;
  /** Options for type "select"; use empty string value for "none" / null. */
  options?: { value: string; label: string }[];
}

function buildDefaultFormData(
  initialData?: Record<string, any>
): Record<string, any> {
  return {
    isActive: true,
    sortOrder: 0,
    ...(initialData ?? {}),
  };
}

interface LookupFormProps {
  fields: FormField[];
  /**
   * When this value changes (e.g. create vs edit, or one row vs another), the form
   * resets from `initialData`. Use a stable id string per record. For create, use a
   * value that changes on every new add (e.g. `create-${session}` incremented when
   * opening the modal) so the form clears if the dialog keeps the same mount.
   */
  resetKey: string;
  initialData?: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
}

/**
 * LookupForm - Reusable form for admin lookup data
 * Provides consistent form styling and data handling for admin forms.
 */
export function LookupForm({
  fields,
  resetKey,
  initialData,
  onChange,
}: LookupFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>(() =>
    buildDefaultFormData(initialData)
  );

  const lastResetKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (lastResetKeyRef.current === null) {
      lastResetKeyRef.current = resetKey;
      return;
    }
    if (lastResetKeyRef.current === resetKey) {
      return;
    }
    lastResetKeyRef.current = resetKey;
    setFormData(buildDefaultFormData(initialData));
    // Only reset on `resetKey` changes; `initialData` is the snapshot for that key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  useEffect(() => {
    onChange(formData);
  }, [formData, onChange]);

  const handleChange = (name: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="space-y-4">
      {fields.map((field) => (
        <div key={field.name} className="space-y-2">
          <Label htmlFor={field.name} className="text-sm font-medium">
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>

          {field.type === 'checkbox' ? (
            <div className="flex items-center space-x-2">
              <Checkbox
                id={field.name}
                checked={formData[field.name] ?? true}
                onCheckedChange={(checked) => handleChange(field.name, checked)}
              />
              <label
                htmlFor={field.name}
                className="text-sm leading-none font-normal peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {field.placeholder || 'Enabled'}
              </label>
            </div>
          ) : field.type === 'select' ? (
            <Select
              value={(() => {
                const raw = formData[field.name];
                if (raw == null || raw === '' || raw === '__none__') {
                  return '__none__';
                }
                return String(raw);
              })()}
              onValueChange={(v) => handleChange(field.name, v)}
            >
              <SelectTrigger id={field.name} className="w-full">
                <SelectValue placeholder={field.placeholder ?? 'Select…'} />
              </SelectTrigger>
              <SelectContent>
                {(field.options ?? []).map((opt) => (
                  <SelectItem
                    key={`${opt.value}-${opt.label}`}
                    value={opt.value}
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              id={field.name}
              type={field.type}
              placeholder={field.placeholder}
              value={formData[field.name] || ''}
              onChange={(e) => handleChange(field.name, e.target.value)}
              required={field.required}
              className="w-full"
            />
          )}
        </div>
      ))}
    </div>
  );
}
