import type { ReactNode } from 'react';

import type { ReportDataResponse } from '../../../api/report-data';
import type { ActivityResponse } from '../../../schemas/activity-response.schema';
import { formatShortDate, formatTime12h } from './dateFormatters';
import { PrintRichText } from './PrintRichText';

const COLUMN_HEADERS = [
  'Date & Time',
  'Lead',
  'Activity Details',
  'Release',
  'Activity ID',
] as const;

type CustomReportBodyRow =
  | {
      type: 'section';
      key: string;
      label: string;
    }
  | {
      type: 'activity';
      key: string;
      activity: ActivityResponse;
      zebraEven: boolean;
    };

function getEventPlannerLeadName(
  activity: ActivityResponse
): string | undefined {
  const lead = activity.eventPlannerDetails?.find((p) => p.isLead);
  return lead?.name?.trim() || undefined;
}

function formatReportDate(activity: ActivityResponse): string {
  const startDate = activity.startDate ? new Date(activity.startDate) : null;
  return startDate && !Number.isNaN(startDate.getTime())
    ? formatShortDate(startDate)
    : '–';
}

function formatReportTime(activity: ActivityResponse): string {
  return formatTime12h(null, activity.startTime) || '–';
}

function CustomBadge({
  children,
  variant,
}: {
  children: ReactNode;
  variant: 'outline' | 'warning' | 'info' | 'secondary';
}) {
  return (
    <span className={`custom-report-badge custom-report-badge-${variant}`}>
      {children}
    </span>
  );
}

function DateTimeCell({ activity }: { activity: ActivityResponse }) {
  const timeStatus = activity.timeStatus?.trim();

  return (
    <div className="custom-report-stack custom-report-stack-md">
      <div>
        <div className="custom-report-text-xs-medium-muted">
          {formatReportDate(activity)}
        </div>
        <div className="custom-report-text-sm-medium">
          {formatReportTime(activity)}
        </div>
        {timeStatus ? (
          <div className="custom-report-text-sm-medium">{timeStatus}</div>
        ) : null}
      </div>

      {activity.premierRequested ? (
        <div>
          <CustomBadge variant="warning">
            Premier: {activity.premierRequested}
          </CustomBadge>
        </div>
      ) : null}

      {activity.tags.length > 0 ? (
        <div className="custom-report-tag-row">
          {activity.tags.map((tag) => (
            <CustomBadge key={tag.id ?? tag.text} variant="outline">
              {tag.text}
            </CustomBadge>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function LeadCell({ activity }: { activity: ActivityResponse }) {
  const ministry =
    activity.leadMinistryAbbreviation ?? activity.leadMinistry ?? '–';

  return (
    <div className="custom-report-stack custom-report-stack-sm">
      <div>
        <div className="custom-report-text-xs-medium-muted">Ministry</div>
        <div className="custom-report-text-sm-medium">{ministry}</div>
      </div>

      {activity.leadOrg ? (
        <div>
          <div className="custom-report-text-xs-medium-muted">Organization</div>
          <div className="custom-report-text-sm-muted">{activity.leadOrg}</div>
        </div>
      ) : null}
    </div>
  );
}

function RichTextBlock({
  value,
  className,
}: {
  value: string | null | undefined;
  className: string;
}) {
  return (
    <div className={`${className} custom-report-rich-wrap`}>
      <PrintRichText value={value} className="custom-report-rich-text" />
    </div>
  );
}

function ActivityDetailsCell({ activity }: { activity: ActivityResponse }) {
  const plannerLead = getEventPlannerLeadName(activity);

  return (
    <div className="custom-report-stack custom-report-stack-lg">
      <div>
        <div className="custom-report-title">{activity.title}</div>
      </div>

      {activity.isConfidential ? (
        <div className="custom-report-text-xs-medium-muted">Confidential</div>
      ) : null}
      {activity.isIssue ? (
        <div className="custom-report-text-xs-medium-muted">Issue</div>
      ) : null}
      {activity.category.includes('FYI') ? (
        <div className="custom-report-text-xs-medium-muted">FYI</div>
      ) : null}

      <RichTextBlock
        value={activity.summary}
        className="custom-report-text-xs-medium-muted"
      />
      <RichTextBlock
        value={activity.executiveSummary}
        className="custom-report-exec-summary"
      />
      <RichTextBlock
        value={activity.significance}
        className="custom-report-text-xs-medium-muted"
      />

      {plannerLead ? (
        <div className="custom-report-text-xs-medium-muted">
          Event planner: {plannerLead}
        </div>
      ) : null}
    </div>
  );
}

function ReleaseCell({ activity }: { activity: ActivityResponse }) {
  const commsLead = activity.commsContacts.find((c) => c.isLead);
  const commsLeadName = commsLead?.name ?? '–';
  const translationsRequired = activity.translationsRequired ?? [];

  return (
    <div className="custom-report-stack custom-report-stack-md">
      {activity.newsReleaseOrigin ? (
        <div className="custom-report-text-xs-medium-muted">
          {activity.newsReleaseOrigin}
        </div>
      ) : null}
      {activity.commsMaterials.length > 0 ? (
        <div className="custom-report-text-xs-medium-muted">
          {activity.commsMaterials.join(', ')}
        </div>
      ) : null}
      {activity.translationsRequiredStatus ? (
        <div className="custom-report-text-xs-medium-muted">
          {activity.translationsRequiredStatus}
        </div>
      ) : null}
      {translationsRequired.length > 0 ? (
        <div className="custom-report-text-xs-medium-muted">
          {translationsRequired.join(', ')}
        </div>
      ) : null}

      {commsLeadName !== '–' ? (
        <div>
          <div className="custom-report-text-xs-medium-muted">Comms Lead</div>
          <div className="custom-report-text-sm-muted">{commsLeadName}</div>
        </div>
      ) : null}

      {activity.lookAheadStatus && activity.lookAheadStatus !== 'none' ? (
        <div>
          <div className="custom-report-text-xs-medium-muted">LA Status</div>
          <div className="custom-report-la-badge-wrap">
            <CustomBadge
              variant={activity.lookAheadStatus === 'new' ? 'info' : 'warning'}
            >
              {activity.lookAheadStatus === 'new' ? 'NEW' : 'CHANGED'}
            </CustomBadge>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ActivityIdCell({ activity }: { activity: ActivityResponse }) {
  const displayIdText = activity.displayId ?? String(activity.id);

  return (
    <div className="custom-report-stack custom-report-stack-md">
      <div className="custom-report-display-id">{displayIdText}</div>

      {activity.activityStatus ? (
        <div>
          <div className="custom-report-text-xs-medium-muted">Status</div>
          <div className="custom-report-status-badge-wrap">
            <CustomBadge variant="secondary">
              {activity.activityStatus}
            </CustomBadge>
          </div>
        </div>
      ) : null}

      {activity.dateStatus ? (
        <div className="custom-report-text-xs-muted-plain">
          Date: {activity.dateStatus}
        </div>
      ) : null}
    </div>
  );
}

function CustomReportHeader() {
  return (
    <thead>
      <tr className="custom-report-thead-row">
        <th scope="col" className="custom-report-th custom-report-col-date">
          {COLUMN_HEADERS[0]}
        </th>
        <th scope="col" className="custom-report-th custom-report-col-lead">
          {COLUMN_HEADERS[1]}
        </th>
        <th scope="col" className="custom-report-th custom-report-col-details">
          {COLUMN_HEADERS[2]}
        </th>
        <th scope="col" className="custom-report-th custom-report-col-release">
          {COLUMN_HEADERS[3]}
        </th>
        <th scope="col" className="custom-report-th custom-report-col-id">
          {COLUMN_HEADERS[4]}
        </th>
      </tr>
    </thead>
  );
}

function CustomReportActivityRow({
  activity,
  zebraEven,
}: {
  activity: ActivityResponse;
  zebraEven: boolean;
}) {
  return (
    <tr
      className={`custom-report-tr ${
        zebraEven ? 'custom-report-row-even' : 'custom-report-row-odd'
      }`}
    >
      <td className="custom-report-td">
        <DateTimeCell activity={activity} />
      </td>
      <td className="custom-report-td">
        <LeadCell activity={activity} />
      </td>
      <td className="custom-report-td custom-report-td-break">
        <ActivityDetailsCell activity={activity} />
      </td>
      <td className="custom-report-td">
        <ReleaseCell activity={activity} />
      </td>
      <td className="custom-report-td">
        <ActivityIdCell activity={activity} />
      </td>
    </tr>
  );
}

function buildBodyRows(data: ReportDataResponse): CustomReportBodyRow[] {
  const showSectionHeaders = data.sections.length > 1;
  const rows: CustomReportBodyRow[] = [];
  let zebraEven = false;

  for (const section of data.sections) {
    if (showSectionHeaders) {
      rows.push({
        type: 'section',
        key: `section-${section.id}`,
        label: `${section.name} (${section.activities.length})`,
      });
    }
    for (const activity of section.activities) {
      rows.push({
        type: 'activity',
        key: `activity-${activity.id}`,
        activity,
        zebraEven,
      });
      zebraEven = !zebraEven;
    }
  }

  return rows;
}

export function PrintCustomReportDocument({
  data,
}: {
  data: ReportDataResponse;
}) {
  const bodyRows = buildBodyRows(data);

  return (
    <div className="custom-report-root">
      <h1 className="custom-report-doc-title">{data.report.displayName}</h1>
      <div className="custom-report-table-wrap">
        {bodyRows.length === 0 ? (
          <div className="custom-report-empty">No activities to display.</div>
        ) : (
          <table className="custom-report-table" role="table">
            <CustomReportHeader />
            <tbody>
              {bodyRows.map((row) =>
                row.type === 'section' ? (
                  <tr key={row.key} className="custom-report-section-row">
                    <td colSpan={5}>{row.label}</td>
                  </tr>
                ) : (
                  <CustomReportActivityRow
                    key={row.key}
                    activity={row.activity}
                    zebraEven={row.zebraEven}
                  />
                )
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
