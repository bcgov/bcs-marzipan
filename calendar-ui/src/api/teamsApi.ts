/**
 * Teams CRUD API for admin (list all including inactive, get, create, update, history).
 */
import type {
  CreateTeamBody,
  TeamDetail,
  TeamHistoryEntry,
  TeamListItem,
  UpdateTeamBody,
} from '@corpcal/shared/api/types';

import api from './axios';

export async function fetchTeamsList(
  activeOnly = true
): Promise<TeamListItem[]> {
  const response = await api.get<{
    success: boolean;
    data: TeamListItem[];
  }>('/teams', {
    params: { activeOnly: activeOnly ? 'true' : 'false' },
  });
  return response.data.data;
}

export async function fetchTeamById(id: number): Promise<TeamDetail | null> {
  const response = await api.get<{
    success: boolean;
    data: TeamDetail | null;
  }>(`/teams/${id}`);
  return response.data.data;
}

export async function createTeam(body: CreateTeamBody): Promise<TeamDetail> {
  const response = await api.post<{ success: boolean; data: TeamDetail }>(
    '/teams',
    body
  );
  return response.data.data;
}

export async function updateTeam(
  id: number,
  body: UpdateTeamBody
): Promise<TeamDetail> {
  const response = await api.patch<{ success: boolean; data: TeamDetail }>(
    `/teams/${id}`,
    body
  );
  return response.data.data;
}

export async function fetchTeamHistory(
  teamId: number
): Promise<TeamHistoryEntry[]> {
  const response = await api.get<{
    success: boolean;
    data: TeamHistoryEntry[];
  }>(`/teams/${teamId}/history`);
  return response.data.data;
}

/**
 * Teams the current user may choose as activity lead team (for create/edit).
 * Requires activities.create. Returns user's teams or (with create.any) all active teams.
 */
export async function fetchLeadTeamOptions(): Promise<TeamListItem[]> {
  const response = await api.get<{
    success: boolean;
    data: TeamListItem[];
  }>('/teams/lead-options');
  return response.data.data;
}
