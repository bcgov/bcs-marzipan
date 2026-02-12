/**
 * Shared sort logic for Look Ahead report table and PDF export.
 * Keeps table and PDF ordering aligned: by scheduled date (earliest first),
 * then by time (chronological) within each day.
 */

export interface LookAheadSortable {
  startDate: string | null;
  startTime: string | null;
}

/** Parse "HH:mm" or "HH:mm:ss" to minutes since midnight. Null => 0 (earliest). */
function timeToMinutes(timeStr: string | null): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':');
  return (parseInt(h ?? '0', 10) * 60 + parseInt(m ?? '0', 10)) | 0;
}

/**
 * Sort activities for Look Ahead: by startDate ascending (earliest first),
 * then by startTime ascending (chronological) within the same day.
 */
export function sortLookAheadActivities<T extends LookAheadSortable>(
  activities: T[]
): T[] {
  return [...activities].sort((a, b) => {
    const da = a.startDate ? new Date(a.startDate).getTime() : 0;
    const db = b.startDate ? new Date(b.startDate).getTime() : 0;
    if (da !== db) return da - db;
    return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
  });
}
