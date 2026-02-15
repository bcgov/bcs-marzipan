/**
 * Users and teams API
 */
import type {
  AddUserToTeamBody,
  RoleOption,
  TeamListItem,
  TransferActivitiesBody,
  UpdateUserBody,
  UpdateUserTeamRoleBody,
  UserDetail,
  UserHistoryEntry,
  UserListItem,
} from '@corpcal/shared/api/types';

import api from './axios';

export async function fetchUsers(search?: string): Promise<UserListItem[]> {
  const params = search ? { search: search.trim() } : {};
  const response = await api.get<{ success: boolean; data: UserListItem[] }>(
    '/users',
    { params }
  );
  return response.data.data;
}

export async function fetchUser(id: number): Promise<UserDetail | null> {
  const response = await api.get<{
    success: boolean;
    data: UserDetail | null;
  }>(`/users/${id}`);
  return response.data.data;
}

export async function updateUser(
  id: number,
  body: UpdateUserBody
): Promise<UserDetail> {
  const response = await api.patch<{ success: boolean; data: UserDetail }>(
    `/users/${id}`,
    body
  );
  return response.data.data;
}

export async function addUserToTeam(
  userId: number,
  body: AddUserToTeamBody
): Promise<void> {
  await api.post(`/users/${userId}/teams`, body);
}

export async function removeUserFromTeam(
  userId: number,
  teamId: number
): Promise<void> {
  await api.delete(`/users/${userId}/teams/${teamId}`);
}

export async function updateUserTeamRole(
  userId: number,
  teamId: number,
  body: UpdateUserTeamRoleBody
): Promise<void> {
  await api.patch(`/users/${userId}/teams/${teamId}`, body);
}

export async function fetchUserHistory(
  userId: number
): Promise<UserHistoryEntry[]> {
  const response = await api.get<{
    success: boolean;
    data: UserHistoryEntry[];
  }>(`/users/${userId}/history`);
  return response.data.data;
}

export interface UserActivityItem {
  id: number;
  label: string;
  value: number;
}

export async function fetchUserActivities(
  userId: number
): Promise<UserActivityItem[]> {
  const response = await api.get<{
    success: boolean;
    data: UserActivityItem[];
  }>(`/users/${userId}/activities`);
  return response.data.data;
}

export async function transferActivities(
  sourceUserId: number,
  body: TransferActivitiesBody
): Promise<{ transferredCount: number }> {
  const response = await api.post<{
    success: boolean;
    transferredCount: number;
  }>(`/users/${sourceUserId}/transfer-activities`, body);
  return { transferredCount: response.data.transferredCount };
}

export async function fetchTeams(): Promise<
  Pick<TeamListItem, 'id' | 'name' | 'displayName'>[]
> {
  const response = await api.get<{
    success: boolean;
    data: TeamListItem[];
  }>('/teams');
  return response.data.data.map((t) => ({
    id: t.id,
    name: t.name,
    displayName: t.displayName,
  }));
}

export async function fetchRoles(): Promise<RoleOption[]> {
  const response = await api.get<{ success: boolean; data: RoleOption[] }>(
    '/lookups/roles'
  );
  return Array.isArray(response.data.data) ? response.data.data : [];
}
