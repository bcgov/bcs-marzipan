import { useQuery } from '@tanstack/react-query';

import type { TeamListItem } from '@corpcal/shared/api/types';

import { fetchLeadTeamOptions } from '../api/teamsApi';
import { lookupQueryKeys } from '../lib/lookupQueryKeys';

/**
 * Teams the current user may choose as activity lead team (for create/edit forms).
 * Requires activities.create. Returns user's teams or (with create.any) all active teams.
 * Returns the full useQuery result (data, error, isError, isLoading, refetch) so consumers
 * can show loading or error state and offer retry.
 */
export function useLeadTeamOptions(enabled: boolean) {
  return useQuery<TeamListItem[]>({
    queryKey: lookupQueryKeys.teamsLeadOptions(),
    queryFn: () => fetchLeadTeamOptions(),
    enabled,
    staleTime: 60_000,
  });
}
