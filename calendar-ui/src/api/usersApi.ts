/**
 * Users and teams API
 */
import type {
  AddUserToTeamBody,
  CreateUserBody,
  RemoveUserFromTeamBody,
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

/**
 * Removes a user from a team.
 *
 * `body` is optional: omit it (or omit `targetUserId`) for a silent removal
 * when the user has no comms assignments scoped to this team. If the user
 * does have scoped comms assignments, the server rejects the request unless
 * `targetUserId` is provided to transfer them.
 */
export async function removeUserFromTeam(
  userId: number,
  teamId: number,
  body?: RemoveUserFromTeamBody
): Promise<{ transferredCount: number }> {
  const response = await api.delete<{
    success: boolean;
    transferredCount: number;
  }>(`/users/${userId}/teams/${teamId}`, { data: body });
  return { transferredCount: response.data.transferredCount };
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
  isLead: boolean;
}

export interface UserActivityCountItem {
  userId: number;
  activityCount: number;
}

/**
 * Fetches activities where the user has an active comms contact row.
 * When `fromTeamId` is provided, scopes to activities where
 * `leadTeamId === fromTeamId` (the set used by transfer/removal flows).
 */
export async function fetchUserActivities(
  userId: number,
  fromTeamId?: number
): Promise<UserActivityItem[]> {
  const response = await api.get<{
    success: boolean;
    data: UserActivityItem[];
  }>(`/users/${userId}/activities`, {
    params: fromTeamId != null ? { fromTeamId } : undefined,
  });
  return response.data.data;
}

export async function fetchUserActivityCounts(
  userIds: number[]
): Promise<UserActivityCountItem[]> {
  const normalizedIds = Array.from(
    new Set(userIds.filter((id) => Number.isInteger(id) && id > 0))
  );
  if (normalizedIds.length === 0) return [];

  const response = await api.get<{
    success: boolean;
    data: UserActivityCountItem[];
  }>('/users/activity-counts', {
    params: { userIds: normalizedIds.join(',') },
  });

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
  Pick<
    TeamListItem,
    'id' | 'name' | 'displayName' | 'ministryId' | 'ministryName'
  >[]
> {
  const response = await api.get<{
    success: boolean;
    data: TeamListItem[];
  }>('/teams');
  return response.data.data.map((t) => ({
    id: t.id,
    name: t.name,
    displayName: t.displayName,
    ministryId: t.ministryId ?? null,
    ministryName: t.ministryName ?? null,
  }));
}

export async function fetchRoles(): Promise<RoleOption[]> {
  const response = await api.get<{ success: boolean; data: RoleOption[] }>(
    '/lookups/roles'
  );
  return Array.isArray(response.data.data) ? response.data.data : [];
}

export async function fetchRolePermissions(roleId: number): Promise<
  {
    key: string;
    displayName?: string | null;
    description?: string | null;
    hasPermission?: boolean;
  }[]
> {
  const response = await api.get<{ success: boolean; data: any }>(
    `/lookups/roles/${roleId}/permissions`
  );
  return Array.isArray(response.data.data) ? response.data.data : [];
}
