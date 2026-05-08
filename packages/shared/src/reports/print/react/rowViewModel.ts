import type { ActivityResponse } from '../../../schemas/activity-response.schema';
import {
  formatLastUpdated,
  formatShortDate,
  formatTime12h,
} from './dateFormatters';

/** Kind of print report row to render; different columns include different narrative blocks. */
export type PrintReportVariant = 'lookAhead' | 'exec';

/** Look-ahead status badge variants. `'none'` is normalised to `null`. */
export type LookAheadBadge = 'new' | 'changed' | null;

/** Structural flags shown at the top of column 3. */
export interface ColumnFlags {
  isIssue: boolean;
  isConfidential: boolean;
  isFyi: boolean;
}

export interface VenueBlock {
  city: string | null;
  name: string | null;
  address: string | null;
}

export interface LeadBlock {
  /** Ministry abbreviation (preferred) → full ministry → team display name → `null`. */
  ministryOrTeam: string | null;
  /** Lead organisation text (already resolved by the API). */
  org: string | null;
}

export interface DateTimeBlock {
  /** Pre-formatted start date, e.g. `Apr 27, 2026`. Empty when no start date. */
  startDate: string;
  /** Pre-formatted end date, omitted when the activity is single-day. */
  endDate: string;
  dateStatus: string;
  startTime: string;
  timeStatus: string;
  lookAheadStatus: LookAheadBadge;
}

export interface ActivityIdBlock {
  /** User-facing id (e.g. `ACT-1234`) or internal numeric id fallback. */
  label: string;
  /** Absolute URL to the activity page for the current environment. */
  href: string;
}

export interface ReleaseBlock {
  newsReleaseOrigin: string | null;
  /** Always present. Shows explicit `none` when no translations are required. */
  translationsLine: string;
}

export interface PrintRowViewModel {
  activityId: number;
  dateTime: DateTimeBlock;
  lead: LeadBlock;
  activityLink: ActivityIdBlock;
  lastUpdated: string;
  flags: ColumnFlags;
  venue: VenueBlock;
  /** Plain-text title used on look-ahead / 30-60-90 variants. */
  title: string;
  /** Rich summary stored value (TipTap JSON or legacy markdown). */
  summaryStored: string | null;
  /** Rich executive summary stored value (exec variant). */
  executiveSummaryStored: string | null;
  release: ReleaseBlock;
  eventPlannerLead: string | null;
}

/** Threshold at and above which translations collapse to a count line. */
export const TRANSLATIONS_COLLAPSE_AT = 4;

function normaliseLookAheadStatus(
  status: string | null | undefined
): LookAheadBadge {
  if (!status || status === 'none') return null;
  return status === 'new' ? 'new' : 'changed';
}

/** Strips trailing `/` without regex (avoids CodeQL ReDoS warnings on library input). */
function trimTrailingSlashes(s: string): string {
  let end = s.length;
  while (end > 0 && s[end - 1] === '/') end -= 1;
  return s.slice(0, end);
}

function joinActivityUrl(baseUrl: string, activityId: number): string {
  const trimmed = trimTrailingSlashes(baseUrl);
  return `${trimmed}/activity/${activityId}`;
}

/**
 * Builds the `Translations: …` block content:
 *  - `null` when the list is empty,
 *  - a comma-joined list when `length < TRANSLATIONS_COLLAPSE_AT`,
 *  - a `Translations: N languages` count otherwise.
 */
export function buildTranslationsLine(
  translations: readonly string[] | null | undefined
): string {
  if (!translations || translations.length === 0) return 'Translations: none';
  if (translations.length < TRANSLATIONS_COLLAPSE_AT) {
    return `Translations: ${translations.join(', ')}`;
  }
  return `Translations: ${translations.length} languages`;
}

function pickLeadMinistryOrTeam(activity: ActivityResponse): string | null {
  const abbrev = activity.leadMinistryAbbreviation?.trim();
  if (abbrev) return abbrev;
  const ministry = activity.leadMinistry?.trim();
  if (ministry) return ministry;
  const team = activity.leadTeamDisplayName?.trim();
  return team ? team : null;
}

function buildVenueAddressLine(
  venue: ActivityResponse['venueAddress']
): string | null {
  if (!venue) return null;
  const parts = [venue.addressLine1, venue.addressLine2, venue.provinceOrState]
    .map((part) => (part ?? '').trim())
    .filter((part) => part.length > 0);
  return parts.length > 0 ? parts.join(', ') : null;
}

function pickEventPlannerLead(activity: ActivityResponse): string | null {
  const lead = activity.eventPlannerDetails?.find((p) => p.isLead);
  const name = lead?.name?.trim();
  return name && name.length > 0 ? name : null;
}

function toNonEmpty(value: string | null | undefined): string | null {
  const trimmed = (value ?? '').trim();
  return trimmed.length > 0 ? trimmed : null;
}

const norm = (s: string | null | undefined) => s?.trim().toLowerCase() ?? '';

/**
 * Whether `leadOrg` should appear in the Lead column. Hidden when the org
 * string matches the ministry, team, or ministry abbreviation the activity
 * already uses as its primary lead label.
 */
export function resolveLeadOrgForPrint(
  activity: ActivityResponse
): string | null {
  const org = toNonEmpty(activity.leadOrg);
  if (!org) return null;
  const o = norm(org);
  if (o && o === norm(activity.leadMinistry)) return null;
  if (o && o === norm(activity.leadTeamDisplayName)) return null;
  if (o && o === norm(activity.leadMinistryAbbreviation)) return null;
  return org;
}

/**
 * Shape an `ActivityResponse` into the pure row view-model consumed by the
 * print React row. All data massaging (date formatting, url assembly,
 * translations collapsing) lives here so the React layer stays declarative.
 */
export function toPrintRowViewModel(
  activity: ActivityResponse,
  options: { activityBaseUrl: string }
): PrintRowViewModel {
  const startDateLabel = formatShortDate(activity.startDate);
  const endDateLabel = formatShortDate(activity.endDate);

  return {
    activityId: activity.id,
    dateTime: {
      startDate: startDateLabel,
      endDate:
        endDateLabel && endDateLabel !== startDateLabel ? endDateLabel : '',
      dateStatus: activity.dateStatus?.trim() ?? '',
      startTime:
        activity.isAllDay === true
          ? 'All day'
          : formatTime12h(activity.startDate, activity.startTime),
      timeStatus: activity.timeStatus?.trim() ?? '',
      lookAheadStatus: normaliseLookAheadStatus(activity.lookAheadStatus),
    },
    lead: {
      ministryOrTeam: pickLeadMinistryOrTeam(activity),
      org: resolveLeadOrgForPrint(activity),
    },
    activityLink: {
      label: activity.displayId?.trim() || `ACT-${activity.id}`,
      href: joinActivityUrl(options.activityBaseUrl, activity.id),
    },
    lastUpdated: formatLastUpdated(activity.lastUpdatedDateTime),
    flags: {
      isIssue: activity.isIssue === true,
      isConfidential: activity.isConfidential === true,
      isFyi: Array.isArray(activity.category)
        ? activity.category.includes('FYI')
        : false,
    },
    venue: {
      city: toNonEmpty(activity.venueAddress?.city ?? null),
      name: toNonEmpty(activity.venueAddress?.venueName ?? null),
      address: buildVenueAddressLine(activity.venueAddress ?? null),
    },
    title: activity.title?.trim() ?? '',
    summaryStored: toNonEmpty(activity.summary),
    executiveSummaryStored: toNonEmpty(activity.executiveSummary),
    release: {
      newsReleaseOrigin: toNonEmpty(activity.newsReleaseOrigin),
      translationsLine: buildTranslationsLine(activity.translationsRequired),
    },
    eventPlannerLead: pickEventPlannerLead(activity),
  };
}

/**
 * Stable sort for activities within a section: by `startTime`, then by `title`.
 */
export function compareActivitiesForPrint(
  a: ActivityResponse,
  b: ActivityResponse
): number {
  const ta = a.startTime ?? '';
  const tb = b.startTime ?? '';
  if (ta !== tb) return ta.localeCompare(tb);
  return (a.title ?? '').localeCompare(b.title ?? '');
}
