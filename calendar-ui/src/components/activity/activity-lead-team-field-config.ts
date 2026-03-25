import type { TeamListItem } from '@corpcal/shared/api/types';

/**
 * Async lead-team select + view label wiring for the activity overview section.
 *
 * **displayLabel**: Server-computed name (`leadTeamDisplayName`) for the current
 * `leadTeamId`. Used when `readOnly` (static line), and in edit when the team is not
 * in scoped `options` so the Select can merge the correct label.
 */
export type ActivityLeadTeamFieldConfig = {
  options: TeamListItem[];
  displayLabel: string | null;
  optionsFetching: boolean;
};

export const defaultActivityLeadTeamFieldConfig: ActivityLeadTeamFieldConfig = {
  options: [],
  displayLabel: null,
  optionsFetching: false,
};
