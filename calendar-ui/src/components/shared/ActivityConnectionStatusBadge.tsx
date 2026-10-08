import { CloudOff, CloudSync } from 'lucide-react';
import { useEffect, useState, type ReactElement } from 'react';

import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

type ActivityConnectionStatusBadgeProps = {
  state: 'reconnecting' | 'offline';
};

const TOOLTIP =
  'Live updates are paused. You can keep editing; save may stay unavailable until the connection and edit lock are restored.';

function AnimatedEllipsis(): ReactElement {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setFrame((value) => (value + 1) % 4);
    }, 400);
    return () => window.clearInterval(id);
  }, []);

  const dots = '.'.repeat(frame);
  return (
    <span className="inline-block w-[1em] tabular-nums" aria-hidden>
      {dots}
    </span>
  );
}

export function ActivityConnectionStatusBadge({
  state,
}: ActivityConnectionStatusBadgeProps): ReactElement {
  const label = state === 'offline' ? 'Offline' : 'Reconnecting';
  const ariaLabel =
    state === 'offline'
      ? 'Offline. Live updates paused.'
      : 'Reconnecting. Live updates paused.';

  const Icon = state === 'offline' ? CloudOff : CloudSync;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          tabIndex={0}
          variant="outline"
          size="md"
          className={cn(
            'cursor-default gap-1.5 border-transparent font-medium',
            state === 'offline'
              ? 'bg-[var(--bcsds-gold-15)] text-slate-900 hover:bg-[var(--bcsds-gold-15)]'
              : 'text-primary bg-[var(--fluent-brand-background-2)] hover:bg-[var(--fluent-brand-background-2)]'
          )}
          role="status"
          aria-label={ariaLabel}
        >
          <Icon className="size-4 shrink-0" aria-hidden />
          {label}
          {state === 'reconnecting' ? <AnimatedEllipsis /> : null}
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="bottom" variant="light">
        {TOOLTIP}
      </TooltipContent>
    </Tooltip>
  );
}
