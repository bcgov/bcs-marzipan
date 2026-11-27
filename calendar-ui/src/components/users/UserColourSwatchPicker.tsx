import {
  USER_COLOUR_KEYS,
  USER_COLOUR_PALETTE,
  type UserColourKey,
} from '@corpcal/shared';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';

type UserColourSwatchPickerProps = {
  value: UserColourKey;
  onChange: (key: UserColourKey) => void;
  disabled?: boolean;
  id?: string;
};

export function UserColourSwatchPicker({
  value,
  onChange,
  disabled,
  id = 'user-colour-picker',
}: UserColourSwatchPickerProps) {
  return (
    <RadioGroup
      id={id}
      value={value}
      onValueChange={(next) => onChange(next as UserColourKey)}
      disabled={disabled}
      className="grid w-full grid-cols-6 gap-2"
      aria-label="User colour"
    >
      {USER_COLOUR_KEYS.map((key) => {
        const entry = USER_COLOUR_PALETTE[key];
        return (
          <div key={key} className="flex flex-col items-center gap-1">
            <RadioGroupItem
              value={key}
              id={`${id}-${key}`}
              aria-label={entry.label}
              className={cn(
                'aspect-auto h-9 w-11 rounded-md border-2 border-transparent p-0 shadow-none',
                '[&_span]:hidden',
                'data-[state=checked]:border-slate-900',
                'focus-visible:ring-ring focus-visible:ring-offset-2'
              )}
              style={{ backgroundColor: entry.pickerSwatchHex }}
            />
            <Label
              htmlFor={`${id}-${key}`}
              className="text-muted-foreground cursor-pointer text-xs leading-tight font-normal"
            >
              {entry.label}
            </Label>
          </div>
        );
      })}
    </RadioGroup>
  );
}
