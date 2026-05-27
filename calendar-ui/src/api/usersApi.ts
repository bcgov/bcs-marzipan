/**
 * Users and teams API
 */
import type {
  AddUserToTeamBody,
  CreateUserBody,
  RoleOption,
  TeamListItem,
  TransferActivitiesBody,
  UpdateUserBody,
  UpdateUserSettingsBody,
  UpdateUserTeamRoleBody,
  UserDetail,
  UserHistoryEntry,
  UserListItem,
} from '@corpcal/shared/api/types';

import api from './axios';

export interface FetchUsersParams {
  search?: string;
  teamIds?: number[];
  roleIds?: number[];
}

export async function fetchUsers(
  params?: FetchUsersParams
): Promise<UserListItem[]> {
  const search = params?.search?.trim();
  const teamIds = params?.teamIds?.length
    ? params.teamIds.join(',')
    : undefined;
  const roleIds = params?.roleIds?.length
    ? params.roleIds.join(',')
    : undefined;
  const query: Record<string, string> = {};
  if (search) query.search = search;
  if (teamIds) query.teamIds = teamIds;
  if (roleIds) query.roleIds = roleIds;
  const response = await api.get<{ success: boolean; data: UserListItem[] }>(
    '/users',
    { params: Object.keys(query).length ? query : undefined }
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

export async function createUser(body: CreateUserBody): Promise<UserDetail> {
  const response = await api.post<{ success: boolean; data: UserDetail }>(
    '/users',
    body
  );
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

export async function updateUserSettings(
  id: number,
  body: UpdateUserSettingsBody
): Promise<UserDetail> {
  const response = await api.patch<{ success: boolean; data: UserDetail }>(
    `/users/${id}/settings`,
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

/**
 * Initiate a password reset for a local-auth user. Returns the one-time reset
 * code that the admin must share with the user out-of-band. Expires in 48 hours.
 */
export async function initiatePasswordReset(
  userId: number
): Promise<{ resetCode: string; expiresInHours: number }> {
  const response = await api.post<{
    resetCode: string;
    expiresInHours: number;
  }>(`/users/${userId}/initiate-password-reset`);
  return response.data;
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

export async function fetchRolePermissions(
  roleId: number
): Promise<{ key: string; description?: string | null }[]> {
  const response = await api.get<{ success: boolean; data: any }>(
    `/lookups/roles/${roleId}/permissions`
  );
  return Array.isArray(response.data.data) ? response.data.data : [];
}
