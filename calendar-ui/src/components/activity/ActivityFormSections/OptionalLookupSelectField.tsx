import { X } from 'lucide-react';
import { useFormContext, type Control, type FieldPath } from 'react-hook-form';
import type { ReactNode } from 'react';

import type { ActivityFormData } from '@corpcal/shared/schemas';
import {
  FormSelectSafe,
  FormSelectTrigger,
} from '@/components/app/form-select';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { filterPopoverMenuItemClass } from '@/components/users/filterPopoverMenuItemClasses';
import {
  optionalIdSelectDisplayValue,
  optionalSelectIdValue,
} from '@/lib/activity-form-coerce-value';
import { getActivityFieldLabel } from '@/lib/activity-form-labels';
import { setActivityFormFieldValue } from '@/lib/activity-form-set-field';
import { cn } from '@/lib/utils';
import type { OptionItem } from '@/schemas/types';

import { ActivityFieldInfoIcon } from '../activity-info-icon-settings-context';

type ClearableOptionalLookupFieldName = Extract<
  FieldPath<ActivityFormData>,
  'newsReleaseOriginId' | 'newsReleaseDistributionId' | 'premierRequestedId'
>;

type OptionalLookupSelectFieldProps = {
  control: Control<ActivityFormData>;
  name: ClearableOptionalLookupFieldName;
  options: OptionItem[];
  readOnly?: boolean;
  disabled?: boolean;
  /** When set, applied to the select trigger (e.g. read-only styling while scope-disabled). */
  triggerReadOnly?: boolean;
  infoAriaLabel: string;
  /** Wraps {@link FormControl} (e.g. field-scope tooltip). */
  wrapControl?: (control: ReactNode) => ReactNode;
};

function defaultWrapControl(control: ReactNode): ReactNode {
  return control;
}

/**
 * Optional lookup FK as a select with an in-menu Clear footer when a value is set.
 */
export function OptionalLookupSelectField({
  control,
  name,
  options,
  readOnly = false,
  disabled = false,
  triggerReadOnly,
  infoAriaLabel,
  wrapControl = defaultWrapControl,
}: OptionalLookupSelectFieldProps) {
  const form = useFormContext<ActivityFormData>();
  const effectiveTriggerReadOnly = triggerReadOnly ?? readOnly;

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const hasValue = field.value != null;
        const canClear = hasValue && !readOnly && !disabled;
        const fieldLabel = getActivityFieldLabel(field.name);

        const controlNode = (
          <FormControl data-field={field.name}>
            <FormSelectTrigger readOnly={effectiveTriggerReadOnly}>
              <SelectValue placeholder="" />
            </FormSelectTrigger>
          </FormControl>
        );

        const handleClear = () => {
          setActivityFormFieldValue(form, field.name, undefined);
        };

        return (
          <FormItem>
            <FormLabel>
              <>
                {fieldLabel}
                <ActivityFieldInfoIcon
                  fieldKey={name}
                  ariaLabel={infoAriaLabel}
                />
              </>
            </FormLabel>
            <FormSelectSafe
              readOnly={readOnly}
              disabled={disabled}
              optionValues={options.map((o) => o.value)}
              value={optionalIdSelectDisplayValue(field.value)}
              onValueChange={(value) =>
                setActivityFormFieldValue(
                  form,
                  field.name,
                  optionalSelectIdValue(value)
                )
              }
            >
              {wrapControl(controlNode)}
              <SelectContent
                footer={
                  canClear ? (
                    <>
                      <div className="border-t" />
                      <button
                        type="button"
                        className={cn(
                          'text-muted-foreground flex w-full items-center gap-2 border-0 px-3 py-2 text-sm',
                          filterPopoverMenuItemClass,
                          'rounded-none focus-visible:rounded-none'
                        )}
                        aria-label={`Clear ${fieldLabel}`}
                        onPointerDown={(event) => event.preventDefault()}
                        onClick={handleClear}
                      >
                        <X className="h-3.5 w-3.5" />
                        Clear
                      </button>
                    </>
                  ) : undefined
                }
              >
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </FormSelectSafe>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
