import { Users } from 'lucide-react';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export interface SharedWithPopoverProps {
  /** Team display names the activity is shared with. */
  teamNames: string[];
}

/**
 * Read-only shares indicator. Only rendered when the activity has shares;
 * clicking the icon lists the teams. Editing shares is not offered here yet.
 */
export function SharedWithPopover({ teamNames }: SharedWithPopoverProps) {
  if (teamNames.length === 0) return null;

  const label = `Shared with ${teamNames.length} team${teamNames.length === 1 ? '' : 's'}`;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          data-no-row-nav
          onClick={(e) => e.stopPropagation()}
          title={label}
          aria-label={label}
          className="hover:bg-muted focus-visible:ring-ring inline-flex size-5 shrink-0 cursor-pointer items-center justify-center rounded border-0 bg-transparent p-0 text-slate-500 focus-visible:ring-2 focus-visible:outline-none"
        >
          <Users className="size-4" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent
        data-no-row-nav
        onClick={(e) => e.stopPropagation()}
        align="start"
        className="w-56 p-2"
      >
        <p className="px-1 pb-1 text-xs font-medium text-slate-500">
          Shared with
        </p>
        <ul className="space-y-0.5">
          {teamNames.map((teamName) => (
            <li key={teamName} className="px-1 py-0.5 text-sm text-slate-900">
              {teamName}
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
