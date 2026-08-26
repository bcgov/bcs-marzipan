import { useQuery } from '@tanstack/react-query';

import type { CommsContactCandidate } from '@corpcal/shared/api/types';

import { fetchCommsContactCandidates } from '../api/teamsApi';
import { lookupQueryKeys } from '../lib/lookupQueryKeys';

/**
 * Eligible comms contact candidates for a given lead team.
 * Returns active team members whose role grants activities.edit.
 * Re-fetches when `teamId` changes; disabled when teamId is falsy / 0 or
 * `fetchEnabled` is false.
 */
export function useCommsContactCandidates(
  teamId: number | undefined,
  fetchEnabled = true
) {
  return useQuery<CommsContactCandidate[]>({
    queryKey: lookupQueryKeys.teamsCommsContactCandidates(teamId ?? 0),
    queryFn: () => fetchCommsContactCandidates(teamId!),
    enabled: teamId != null && teamId > 0 && fetchEnabled,
    staleTime: 60_000,
  });
}
