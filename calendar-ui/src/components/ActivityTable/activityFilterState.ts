import type { DateRangeValue } from './ScheduledDateRangeFields';

/**
 * Activity table filter state (Date, Category, Status, Pitch).
 * Used by ActivityTableFilters and persisted in URL + sessionStorage via useActivityTablePreferences.
 */

/** Pitch date filter: any (no filter), not_scheduled, or scheduled with optional date range. */
export type PitchDateFilter =
  | { kind: 'any' }
  | { kind: 'not_scheduled' }
  | { kind: 'scheduled'; dateRange: DateRangeValue };

export interface ActivityFilterState {
  /** Scheduled date range; empty string = no filter for that bound. */
  dateRange: {
    startDate: string;
    endDate: string;
    noStartDate: boolean;
    noEndDate: boolean;
  };
  /** Category display names (match row.activityCategories). */
  categoryNames: string[];
  /** Activity status IDs (match row.activityStatusId). */
  activityStatusIds: number[];
  /** Pitch required status display names (match row.pitchRequiredStatus). */
  pitchRequiredStatusNames: string[];
  /** Pitch date filter; 'any' = no radio selected (deselect by clicking selected radio again). */
  pitchDateFilter: PitchDateFilter;
  /** Look Ahead status values (e.g. 'new', 'changed'). */
  lookAheadStatusValues: string[];
  /** Look Ahead section values (e.g. 'events', 'issues'). */
  lookAheadSectionValues: string[];
  /** Date section confirmation: any (no filter), confirmed, or not_confirmed. */
  dateConfirmedFilter: 'any' | 'confirmed' | 'not_confirmed';
  /** Time section confirmation: any (no filter), confirmed, or not_confirmed. */
  timeConfirmedFilter: 'any' | 'confirmed' | 'not_confirmed';
  /** Selected tag IDs (multi-select). */
  tagIds: number[];
  /** Lead ministry IDs (multi-select). */
  leadMinistryIds: number[];
  /** Lead organization IDs (multi-select). */
  leadOrgIds: number[];
  /** Comms contact lead user IDs (multi-select). */
  commsContactLeadUserIds: number[];
  /** Event planner lead IDs (multi-select). */
  eventPlannerLeadIds: number[];
}

export type ConfirmedFilterValue = ActivityFilterState['dateConfirmedFilter'];

export const DEFAULT_PITCH_DATE_RANGE: DateRangeValue = {
  startDate: '',
  endDate: '',
  noStartDate: false,
  noEndDate: false,
};

export const DEFAULT_ACTIVITY_FILTER_STATE: ActivityFilterState = {
  dateRange: {
    startDate: '',
    endDate: '',
    noStartDate: false,
    noEndDate: false,
  },
  categoryNames: [],
  activityStatusIds: [],
  pitchRequiredStatusNames: [],
  pitchDateFilter: { kind: 'any' },
  lookAheadStatusValues: [],
  lookAheadSectionValues: [],
  dateConfirmedFilter: 'any',
  timeConfirmedFilter: 'any',
  tagIds: [],
  leadMinistryIds: [],
  leadOrgIds: [],
  commsContactLeadUserIds: [],
  eventPlannerLeadIds: [],
};
