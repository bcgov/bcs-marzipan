import { ChevronDown, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  reportsMenuAvailabilityMessage,
  reportsMenuItemsDisabled,
  type ActivityListReportAvailability,
} from '@/lib/activity-list-effective-scope';
import type { ActivityListReportName } from '@/lib/activity-list-report-params';

export type ActivityListReportMenuItem = {
  id: number;
  name: string;
  displayName?: string;
};

function formatReportMenuLabel(displayName: string | undefined): string {
  return (displayName ?? '').replace(/\bReport$/, 'report');
}

const LOOK_AHEAD_PAGE_PATH = '/look-ahead';

export interface ActivityListReportsMenuProps {
  reports: ActivityListReportMenuItem[];
  availability: ActivityListReportAvailability;
  onOpenReport: (name: ActivityListReportName) => void;
  onShowFullList?: () => void;
  /** When true, shows a bottom link to the Look Ahead page. */
  showLookAheadLink?: boolean;
}

export function ActivityListReportsMenu({
  reports,
  availability,
  onOpenReport,
  onShowFullList,
  showLookAheadLink = false,
}: ActivityListReportsMenuProps) {
  const reportsDisabled = reportsMenuItemsDisabled(availability);
  const availabilityMessage = reportsMenuAvailabilityMessage(availability);
  const showSwitchToAll =
    availability === 'blocked-conflict' && onShowFullList != null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="default"
          className="gap-2"
        >
          <FileText className="h-4 w-4" />
          Reports
          <ChevronDown className="h-4 w-4 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-w-xs">
        {reports.map((report) => (
          <DropdownMenuItem
            key={report.id}
            disabled={reportsDisabled}
            onSelect={() => onOpenReport(report.name as ActivityListReportName)}
          >
            {formatReportMenuLabel(report.displayName)}
          </DropdownMenuItem>
        ))}
        {availabilityMessage != null ? (
          <>
            <DropdownMenuSeparator />
            <p className="text-muted-foreground px-2 py-1.5 text-xs">
              {availabilityMessage}
            </p>
            {showSwitchToAll ? (
              <DropdownMenuItem
                className="text-primary font-medium"
                onSelect={() => onShowFullList()}
              >
                Show full activity list
              </DropdownMenuItem>
            ) : null}
          </>
        ) : null}
        {showLookAheadLink ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to={LOOK_AHEAD_PAGE_PATH}>Look Ahead</Link>
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
