import type { ActivityResponse } from '../../../schemas/activity-response.schema';
import { getCommsContactLeadDisplayName } from '../../reportTypeConfig';
import {
  formatLastUpdated,
  formatShortDate,
  formatShortDateNoYear,
  formatTime12h,
} from './dateFormatters';

/** Kind of print report row to render; different columns include different narrative blocks. */
export type PrintReportVariant =
  /** Corporate Look Ahead: executive summary, compact chrome. */
  | 'lookAhead'
  /** 30/60/90: title + summary, classic chrome. */
  | 'thirtySixtyNinety'
  /** Exec Look Ahead: title + summary, classic chrome; distinct PDF template slug. */
  | 'execLookAhead';

/** How activity start/end dates render in rollup table column 1. */
export type PrintDateCellStyle = 'shortWithYear' | 'shortNoYear';

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
  /** Pre-formatted start date, e.g. `Apr 27, 2026` or rollup `Apr 27`. Empty when no start date. */
  startDate: string;
  /** Pre-formatted end date, omitted when the activity is single-day. */
  endDate: string;
  dateStatus: string;
  startTime: string;
  timeStatus: string;
  lookAheadStatus: LookAheadBadge;
}

export interface ActivityIdBlock {
  /** User-facing id (e.g. `ECC-000123`) or internal numeric id fallback. */
  label: string;
  /** Absolute URL to the activity page for the current environment. */
  href: string;
}

/**
 * Splits a display id (`PREFIX-NUMERIC`) for Look Ahead print: bold acronym line,
 * linked numeric segment only.
 */
export function splitActivityDisplayIdForPrint(label: string): {
  acronym: string;
  idForLink: string;
} {
  const trimmed = label.trim();
  const dash = trimmed.indexOf('-');
  if (dash <= 0) {
    return { acronym: '', idForLink: trimmed };
  }
  return {
    acronym: trimmed.slice(0, dash),
    idForLink: trimmed.slice(dash + 1),
  };
}

export interface ReleaseBlock {
  newsReleaseOrigin: string | null;
  /**
   * Release column text after the optional {@link newsReleaseOrigin} line.
   * Look Ahead / Exec: language shortcodes or `TBD` / `none` / `N languages` — no
   * `Translations:` prefix (icon in {@link PrintRow}).
   * 30/60/90: full {@link buildTranslationsLine} string including `Translations:`.
   */
  translationsLine: string;
}

/** Look Ahead print: pending review with no languages — shown with Languages icon in UI. */
export const LOOK_AHEAD_TRANSLATIONS_PENDING_LINE = 'TBD';

export interface PrintRowViewModel {
  activityId: number;
  dateTime: DateTimeBlock;
  lead: LeadBlock;
  activityLink: ActivityIdBlock;
  lastUpdated: string;
  flags: ColumnFlags;
  venue: VenueBlock;
  /** Plain-text title used on Exec Look Ahead / 30/60/90 print rows. */
  title: string;
  /** Rich summary stored value (TipTap JSON or legacy markdown). */
  summaryStored: string | null;
  /** Rich executive summary (Corporate Look Ahead column 3). */
  executiveSummaryStored: string | null;
  /** Comms contact marked lead (`event_lead` report field). */
  eventLeadStored: string | null;
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

function toNonEmpty(value: string | null | undefined): string | null {
  const trimmed = (value ?? '').trim();
  return trimmed.length > 0 ? trimmed : null;
}

const norm = (s: string | null | undefined) => s?.trim().toLowerCase() ?? '';

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

function activityCategoryIncludesRelease(activity: ActivityResponse): boolean {
  return Array.isArray(activity.category)
    ? activity.category.some((c) => norm(c) === 'release')
    : false;
}

/**
 * Look Ahead / Exec Look Ahead: show a translations line only for release-style
 * activities (Release category and/or news release origin).
 */
export function lookAheadShowsTranslationsLine(
  activity: ActivityResponse
): boolean {
  return (
    activityCategoryIncludesRelease(activity) ||
    toNonEmpty(activity.newsReleaseOrigin) !== null
  );
}

function isTranslationsPendingReviewDisplay(
  status: string | null | undefined
): boolean {
  const n = norm(status);
  return n === 'pending review' || n === 'pending';
}

/**
 * Translations line for Look Ahead release column: pending review with empty
 * language list uses {@link LOOK_AHEAD_TRANSLATIONS_PENDING_LINE} instead of
 * `none`. No `Translations:` prefix — {@link PrintRow} renders a Languages icon.
 */
export function buildLookAheadReleaseTranslationsLine(
  activity: ActivityResponse
): string {
  const langs = activity.translationsRequired ?? [];
  if (
    isTranslationsPendingReviewDisplay(activity.translationsRequiredStatus) &&
    langs.length === 0
  ) {
    return LOOK_AHEAD_TRANSLATIONS_PENDING_LINE;
  }
  if (!langs || langs.length === 0) {
    return 'none';
  }
  if (langs.length < TRANSLATIONS_COLLAPSE_AT) {
    return langs.join(', ');
  }
  return `${langs.length} languages`;
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

function isConfirmedStatusDisplay(value: string): boolean {
  return value.trim().toLowerCase() === 'confirmed';
}

/**
 * Look Ahead / Exec Look Ahead print: hide date/time status when Confirmed;
 * otherwise show fixed labels (not raw lookup text).
 */
function lookAheadDateStatusForPrint(raw: string): string {
  const t = raw.trim();
  if (!t || isConfirmedStatusDisplay(t)) return '';
  return 'Date TBD';
}

function lookAheadTimeStatusForPrint(raw: string): string {
  const t = raw.trim();
  if (!t || isConfirmedStatusDisplay(t)) return '';
  return 'Time TBD';
}

function shouldUseLookAheadDateTimeStatusRules(
  variant: PrintReportVariant | undefined
): boolean {
  return variant === 'lookAhead' || variant === 'execLookAhead';
}

/**
 * Shape an `ActivityResponse` into the pure row view-model consumed by the
 * print React row. All data massaging (date formatting, url assembly,
 * translations collapsing) lives here so the React layer stays declarative.
 *
 * `@default dateCellStyle` — `'shortWithYear'` keeps legacy callers/tests stable;
 * rollup `{@link PrintReportDocument}` passes `'shortNoYear'`.
 *
 * When `variant` is `lookAhead` or `execLookAhead`, Confirmed date/time status
 * is omitted; any other non-empty status becomes `Date TBD` / `Time TBD`.
 */
export function toPrintRowViewModel(
  activity: ActivityResponse,
  options: {
    activityBaseUrl: string;
    /** @default `'shortWithYear'` */
    dateCellStyle?: PrintDateCellStyle;
    /**
     * Rollup print variant. When `lookAhead` or `execLookAhead`, date/time
     * status labels follow look-ahead print rules; otherwise raw API strings.
     */
    variant?: PrintReportVariant;
  }
): PrintRowViewModel {
  const fmtDate =
    options.dateCellStyle === 'shortNoYear'
      ? formatShortDateNoYear
      : formatShortDate;

  const startDateLabel = fmtDate(activity.startDate);
  const endDateLabel = fmtDate(activity.endDate);

  const rawDateStatus = activity.dateStatus?.trim() ?? '';
  const rawTimeStatus = activity.timeStatus?.trim() ?? '';
  const useLaRules = shouldUseLookAheadDateTimeStatusRules(options.variant);
  const useLookAheadReleaseRules =
    options.variant === 'lookAhead' || options.variant === 'execLookAhead';

  return {
    activityId: activity.id,
    dateTime: {
      startDate: startDateLabel,
      endDate:
        endDateLabel && endDateLabel !== startDateLabel ? endDateLabel : '',
      dateStatus: useLaRules
        ? lookAheadDateStatusForPrint(rawDateStatus)
        : rawDateStatus,
      startTime:
        activity.isAllDay === true
          ? 'All day'
          : formatTime12h(activity.startDate, activity.startTime),
      timeStatus: useLaRules
        ? lookAheadTimeStatusForPrint(rawTimeStatus)
        : rawTimeStatus,
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
    eventLeadStored: getCommsContactLeadDisplayName(activity),
    release: {
      newsReleaseOrigin: toNonEmpty(activity.newsReleaseOrigin),
      translationsLine: useLookAheadReleaseRules
        ? lookAheadShowsTranslationsLine(activity)
          ? buildLookAheadReleaseTranslationsLine(activity)
          : ''
        : buildTranslationsLine(activity.translationsRequired),
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
