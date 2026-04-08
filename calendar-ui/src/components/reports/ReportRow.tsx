import type { ActivityResponse } from '@corpcal/shared/api/types';
import { tableBodyRow, tableTd } from '@/components/table/tableConstants';
import { Badge } from '@/components/ui/badge';
import { CopyableText } from '@/components/ui/copyable-text';
import { formatExactDate, formatTime12h } from '@/lib/datetime-utils';
import { cn } from '@/lib/utils';

/** Matches Activity List table cells: light stroke + white fill (Fluent NeutralStroke1.Rest / #FFF via Tailwind). */
const reportTableCell = cn(
  tableTd,
  'border-b border-slate-100 bg-white text-sm'
);

interface ReportRowProps {
  activity: ActivityResponse;
  className?: string;
}

/**
 * Rich row component for Reports page.
 * Displays activity data in 4/5 main columns:
 * 1. Date/Meta Info (date, time, premier requested, tags)
 * 2. Lead Info (lead ministry, lead org)
 * 3. Main Activity Content (title, summary, executive summary)
 * 4. Release Info (comms contact, status, category)
 * 5. Activity ID
 *
 * Reuses styling and layout patterns from Activity List View.
 */
export function ReportRow({ activity, className }: ReportRowProps) {
  const displayIdText = activity.displayId ?? String(activity.id);

  // Convert ISO date string to Date object for formatting
  const startDate = activity.startDate ? new Date(activity.startDate) : null;
  const formattedDate = startDate ? formatExactDate(startDate) : '–';
  const formattedTime = activity.startTime
    ? formatTime12h(activity.startTime)
    : '–';
  //might need to change based on how it is saved in the DB and returned by the API
  const premierRequested = activity.premierRequested;

  const commsLead = activity.commsContacts.find((c) => c.isLead);
  const commsLeadName = commsLead?.name ?? '–';

  return (
    <tr className={cn(tableBodyRow, 'bg-white transition-colors', className)}>
      {/* Column 1: Date/Meta Info */}
      <td className={reportTableCell}>
        <div className="space-y-1.5">
          {/* Date and Time */}
          <div>
            <div className="text-xs font-medium text-slate-600">
              {formattedDate}
            </div>
            <div className="text-sm font-medium text-slate-900">
              {formattedTime}
            </div>
            <div className="text-sm font-medium text-slate-900">
              {activity.timeStatus}
            </div>
          </div>

          {/* Premier Requested */}
          {premierRequested && (
            <div>
              <Badge variant="warning" className="text-xs">
                Premier: {activity.premierRequested}
              </Badge>
            </div>
          )}

          {/* HQ Tags */}
          {activity.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {activity.tags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  className="text-xs text-slate-600"
                >
                  {tag.text}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </td>

      {/* Column 2: Ministry Info */}
      <td className={reportTableCell}>
        <div className="space-y-1">
          {/* Lead Ministry (with abbreviation) */}
          <div>
            <div className="text-xs font-medium text-slate-600">Ministry</div>
            <div className="text-sm font-medium text-slate-900">
              {activity.leadMinistryAbbreviation ??
                activity.leadMinistry ??
                '–'}
            </div>
          </div>

          {/* Lead Org */}
          {activity.leadOrg && (
            <div>
              <div className="text-xs font-medium text-slate-600">
                Organization
              </div>
              <div className="text-sm text-slate-700">{activity.leadOrg}</div>
            </div>
          )}
        </div>
      </td>

      {/* Column 3: Main Activity Content */}
      <td className={cn(reportTableCell, 'break-words whitespace-normal')}>
        <div className="space-y-2">
          {/* Title */}
          <div>
            <div className="text-sm font-semibold break-words whitespace-normal text-slate-900">
              {activity.title}
            </div>
          </div>
          {/* Is Confidential */}
          {activity.isConfidential && (
            <div className="text-xs font-medium text-slate-600">
              Confidential
            </div>
          )}
          {/* Is Issue */}
          {activity.isIssue && (
            <div className="text-xs font-medium text-slate-600">Issue</div>
          )}
          {/* FYI */}
          {activity.category.includes('FYI') && (
            <div className="text-xs font-medium text-slate-600">FYI</div>
          )}
          {/* Summary */}
          {activity.summary && (
            <div className="text-xs font-medium text-slate-600">
              {activity.summary}
            </div>
          )}
          {/* Executive Summary */}
          {activity.executiveSummary && (
            <div className="text-xs leading-relaxed text-slate-600">
              <p className="break-words whitespace-normal">
                {activity.executiveSummary}
              </p>
            </div>
          )}
          {/* Significance */}
          {activity.significance && (
            <div className="text-xs font-medium text-slate-600">
              {activity.significance}
            </div>
          )}
          {/* Event Planner Lead */}
          {activity.eventPlannerDetails && (
            <div className="text-xs font-medium text-slate-600">
              Event planner:{' '}
              {
                activity.eventPlannerDetails.find((planner) =>
                  planner.isLead ? planner.name : null
                )?.name
              }
            </div>
          )}
        </div>
      </td>

      {/* Column 4: Release Info */}
      <td className={reportTableCell}>
        <div className="space-y-1.5">
          {/* News Release Origin */}
          {activity.newsReleaseOrigin && (
            <div className="text-xs font-medium text-slate-600">
              {activity.newsReleaseOrigin}
            </div>
          )}
          {/* Comms Materials */}
          {activity.commsMaterials && (
            <div className="text-xs font-medium text-slate-600">
              {activity.commsMaterials.map((material) => material).join(', ')}
            </div>
          )}
          {/* Translations Required Status */}
          {activity.translationsRequiredStatus && (
            <div className="text-xs font-medium text-slate-600">
              {activity.translationsRequiredStatus}
            </div>
          )}
          {/* Translations Required */}
          {activity.translationsRequired && (
            <div className="text-xs font-medium text-slate-600">
              {activity.translationsRequired
                .map((translation) => translation)
                .join(', ')}
            </div>
          )}
          {/* Comms Contact Lead */}
          {commsLeadName !== '–' && (
            <div>
              <div className="text-xs font-medium text-slate-600">
                Comms Lead
              </div>
              <div className="text-sm text-slate-700">{commsLeadName}</div>
            </div>
          )}

          {/* Look Ahead Status & Section (if available) */}
          {activity.lookAheadStatus && activity.lookAheadStatus !== 'none' && (
            <div>
              <div className="text-xs font-medium text-slate-600">
                LA Status
              </div>
              <Badge
                variant={
                  activity.lookAheadStatus === 'new' ? 'info' : 'warning'
                }
                className="mt-0.5 text-xs"
              >
                {activity.lookAheadStatus === 'new' ? 'NEW' : 'CHANGED'}
              </Badge>
            </div>
          )}
        </div>
      </td>
      {/* Column 5: Activity ID Info */}
      <td className={reportTableCell}>
        <div className="space-y-1.5">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span data-no-row-nav onClick={(e) => e.stopPropagation()}>
              <CopyableText
                text={displayIdText}
                copyLabel="Copy activity ID"
                variant="minimal"
                copiedTooltipContent="Activity ID copied"
                className="text-xs font-semibold text-slate-600"
              >
                {displayIdText}
              </CopyableText>
            </span>
          </div>
          {/* Activity Status */}
          {activity.activityStatus && (
            <div>
              <div className="text-xs font-medium text-slate-600">Status</div>
              <Badge variant="secondary" className="mt-0.5 text-xs">
                {activity.activityStatus}
              </Badge>
            </div>
          )}

          {/* Date Status */}
          {activity.dateStatus && (
            <div className="text-xs text-slate-600">
              Date: {activity.dateStatus}
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}
