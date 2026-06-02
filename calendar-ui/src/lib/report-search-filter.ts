import {
  activityMatchesSearchKeyword,
  activityResponseToSearchableInput,
} from '@corpcal/shared';
import type { ReportDataResponse } from '@corpcal/shared/api/types';

/** Applies keyword search client-side over cached report payload sections. */
export function filterReportDataBySearchKeyword(
  data: ReportDataResponse | undefined,
  keyword: string
): ReportDataResponse | undefined {
  if (!data) return undefined;
  const term = keyword.trim();
  if (term === '') return data;

  const sections = data.sections.map((section) => ({
    ...section,
    activities: section.activities.filter((activity) =>
      activityMatchesSearchKeyword(
        activityResponseToSearchableInput(activity),
        keyword
      )
    ),
  }));

  const activityCount = sections.reduce(
    (total, section) => total + section.activities.length,
    0
  );

  return {
    ...data,
    sections,
    meta: data.meta
      ? {
          ...data.meta,
          activityCount,
        }
      : undefined,
  };
}
