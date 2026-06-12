import { Info } from 'lucide-react';
import { useEffect, useRef, useState, type MouseEvent } from 'react';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

const HOVER_CLOSE_DELAY_MS = 150;

const infoTriggerClassName =
  'text-stone-500 hover:text-stone-700 focus-visible:ring-ring/50 relative z-10 -ml-1.5 inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 outline-none focus-visible:ring-[3px]';

function usePrefersHover(): boolean {
  const [value, setValue] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(hover: hover)').matches
      : false
  );
  useEffect(() => {
    const mq = window.matchMedia('(hover: hover)');
    const onChange = () => setValue(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return value;
}

type ActivityFormMissingFieldsHintProps = {
  helperText: string;
  fields: readonly string[];
  align?: 'start' | 'center' | 'end';
};

export function ActivityFormMissingFieldsHint({
  helperText,
  fields,
  align = 'end',
}: ActivityFormMissingFieldsHintProps) {
  const [open, setOpen] = useState(false);
  const prefersHover = usePrefersHover();
  const closeTimerRef = useRef<number | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const preventMouseFocus = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  const cancelScheduledClose = () => {
    if (closeTimerRef.current != null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const handleHoverOpen = () => {
    if (!prefersHover) return;
    cancelScheduledClose();
    setOpen(true);
  };

  const handleHoverScheduleClose = () => {
    if (!prefersHover) return;
    cancelScheduledClose();
    closeTimerRef.current = window.setTimeout(() => {
      setOpen(false);
      triggerRef.current?.blur();
      closeTimerRef.current = null;
    }, HOVER_CLOSE_DELAY_MS);
  };

  useEffect(
    () => () => {
      cancelScheduledClose();
    },
    []
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <span
        className="inline-flex max-w-full min-w-0 items-center gap-x-0 leading-normal"
        onMouseEnter={handleHoverOpen}
        onMouseLeave={handleHoverScheduleClose}
      >
        <span className="text-muted-foreground min-w-0 px-1 text-sm wrap-break-word">
          {helperText}
        </span>
        <PopoverTrigger asChild>
          <button
            ref={triggerRef}
            type="button"
            className={infoTriggerClassName}
            aria-label={`${helperText}. Show required field details.`}
            aria-expanded={open}
            onMouseDown={preventMouseFocus}
            onMouseEnter={handleHoverOpen}
            onMouseLeave={handleHoverScheduleClose}
          >
            <Info className="size-3.5 shrink-0" aria-hidden />
          </button>
        </PopoverTrigger>
      </span>
      <PopoverContent
        className="w-80"
        align={align}
        onMouseEnter={handleHoverOpen}
        onMouseLeave={handleHoverScheduleClose}
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        <div>
          <h4 className="mb-3 text-sm font-medium">
            Required fields remaining:
          </h4>
          <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
            {fields.map((field) => (
              <li key={field}>{field}</li>
            ))}
          </ul>
        </div>
      </PopoverContent>
    </Popover>
  );
}
