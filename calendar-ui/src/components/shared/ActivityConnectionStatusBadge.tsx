import { useEffect, useState, type ReactElement } from 'react';

import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type ActivityConnectionStatusBadgeProps = {
  state: 'reconnecting' | 'offline';
};

const TOOLTIP =
  'Live updates are paused. You can keep editing; saving is available once you are reconnected.';

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

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant={state === 'offline' ? 'warning' : 'secondary'}
          className="cursor-default font-medium"
          role="status"
          aria-label={ariaLabel}
        >
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
