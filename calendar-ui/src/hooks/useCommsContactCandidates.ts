import { useQuery } from '@tanstack/react-query';

import type { CommsContactCandidate } from '@corpcal/shared/api/types';

import { fetchCommsContactCandidates } from '../api/teamsApi';

/**
 * Eligible comms contact candidates for a given lead team.
 * Returns active team members whose role grants activities.edit.
 * Re-fetches when `teamId` changes; disabled when teamId is falsy / 0 or when
 * `fetchEnabled` is false (e.g. caller is not on that team and lacks
 * activities.create.any — matches GET /teams/:id/comms-contact-candidates).
 */
export function useCommsContactCandidates(
  teamId: number | undefined,
  fetchEnabled = true
) {
  return useQuery<CommsContactCandidate[]>({
    queryKey: ['teams', teamId, 'comms-contact-candidates'] as const,
    queryFn: () => fetchCommsContactCandidates(teamId!),
    enabled: teamId != null && teamId > 0 && fetchEnabled,
    staleTime: 60_000,
  });
}
