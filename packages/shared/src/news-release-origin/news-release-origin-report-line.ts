import {
  NEWS_RELEASE_ORIGIN_IDS,
  NEWS_RELEASE_ORIGIN_NAMES,
} from './constants';

export type NewsReleaseOriginLookupRow = {
  id: number;
  name: string;
};

const REPORT_LINE_BY_ORIGIN_NAME: Record<string, string> = {
  [NEWS_RELEASE_ORIGIN_NAMES.tbd]: 'TBD',
  [NEWS_RELEASE_ORIGIN_NAMES.ministryRelease]: 'BCGov',
  [NEWS_RELEASE_ORIGIN_NAMES.jointMinistry3rdParty]: 'Joint',
  [NEWS_RELEASE_ORIGIN_NAMES.jointMinistryFederal]: 'Joint',
  [NEWS_RELEASE_ORIGIN_NAMES.localGovernment]: 'Local government',
  [NEWS_RELEASE_ORIGIN_NAMES.thirdParty]: '3rd party',
  [NEWS_RELEASE_ORIGIN_NAMES.federal]: 'Fed',
};

const REPORT_LINE_BY_ID: Record<number, string> = {
  [NEWS_RELEASE_ORIGIN_IDS.tbd]: 'TBD',
  [NEWS_RELEASE_ORIGIN_IDS.ministryRelease]: 'BCGov',
  [NEWS_RELEASE_ORIGIN_IDS.jointMinistry3rdParty]: 'Joint',
  [NEWS_RELEASE_ORIGIN_IDS.jointMinistryFederal]: 'Joint',
  [NEWS_RELEASE_ORIGIN_IDS.localGovernment]: 'Local government',
  [NEWS_RELEASE_ORIGIN_IDS.thirdParty]: '3rd party',
  [NEWS_RELEASE_ORIGIN_IDS.federal]: 'Fed',
};

function normalizeOriginName(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Short Look Ahead / Exec report origin line from stored origin id or lookup name.
 */
export function newsReleaseOriginReportLine(
  originId: number | null | undefined,
  originName?: string | null
): string | null {
  if (originId != null && REPORT_LINE_BY_ID[originId]) {
    return REPORT_LINE_BY_ID[originId];
  }
  if (originName) {
    const line = REPORT_LINE_BY_ORIGIN_NAME[normalizeOriginName(originName)];
    if (line) return line;
  }
  return null;
}

export function newsReleaseOriginReportLineFromLookup(
  originId: number | null | undefined,
  lookups: readonly NewsReleaseOriginLookupRow[]
): string | null {
  if (originId == null) return null;
  const row = lookups.find((l) => l.id === originId);
  if (!row) {
    return REPORT_LINE_BY_ID[originId] ?? null;
  }
  return newsReleaseOriginReportLine(originId, row.name);
}
