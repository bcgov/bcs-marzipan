import { ChevronDown, FileText } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ActivityListReportAvailability } from '@/lib/activity-list-effective-scope';
import type { ActivityListReportName } from '@/lib/activity-list-report-params';

export type ActivityListReportMenuItem = {
  id: number;
  name: string;
  displayName?: string;
};

function formatReportMenuLabel(displayName: string | undefined): string {
  return (displayName ?? '').replace(/\bReport$/, 'report');
}

export interface ActivityListReportsMenuProps {
  reports: ActivityListReportMenuItem[];
  availability: ActivityListReportAvailability;
  onOpenReport: (name: ActivityListReportName) => void;
  onShowFullList?: () => void;
}

export function ActivityListReportsMenu({
  reports,
  availability,
  onOpenReport,
  onShowFullList,
}: ActivityListReportsMenuProps) {
  const reportsDisabled =
    availability === 'blocked-tab' || availability === 'blocked-conflict';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" className="gap-2">
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
        {availability === 'blocked-tab' ? (
          <>
            <DropdownMenuSeparator />
            <p className="text-muted-foreground px-2 py-1.5 text-xs">
              Reports aren&apos;t available on the Recent tab.
            </p>
            <DropdownMenuItem
              className="text-primary font-medium"
              onSelect={() => onShowFullList?.()}
            >
              Show full activity list
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
