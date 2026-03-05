import { useQuery } from '@tanstack/react-query';

import type { TeamListItem } from '@corpcal/shared/api/types';

import { fetchLeadTeamOptions } from '../api/teamsApi';

const LEAD_TEAM_OPTIONS_QUERY_KEY = ['teams', 'lead-options'] as const;

/**
 * Teams the current user may choose as activity lead team (for create/edit forms).
 * Requires activities.create. Returns user's teams or (with create.any) all active teams.
 */
export function useLeadTeamOptions(enabled: boolean) {
  return useQuery<TeamListItem[]>({
    queryKey: LEAD_TEAM_OPTIONS_QUERY_KEY,
    queryFn: () => fetchLeadTeamOptions(),
    enabled,
    staleTime: 60_000,
  });
}
