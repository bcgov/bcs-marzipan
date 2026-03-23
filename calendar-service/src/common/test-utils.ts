import type { Activity } from '@corpcal/database/types';
import type {
  AddUserToTeamBody,
  CreateTeamBody,
  TeamDetail,
  TeamHistoryEntry,
  TeamListItem,
  TransferActivitiesBody,
  UpdateTeamBody,
  UpdateUserTeamRoleBody,
  UserDetail,
  UserHistoryEntry,
  UserListItem,
} from '@corpcal/shared/api/types';
import type {
  CreateActivityRequest,
  UpdateActivityRequest,
} from '@corpcal/shared/schemas';

/**
 * Helper functions to generate test data for activities, teams, and users
 */

// Re-export shared test fixtures for ActivityResponse
export { createMockActivityResponse } from '@corpcal/shared/test-utils';

export const createMockActivityRequest = (
  overrides?: Partial<CreateActivityRequest>
): CreateActivityRequest => {
  return {
    title: 'Test Activity',
    summary: 'This is a test activity',
    significance: '',
    schedulingNotes: '',
    isIssue: false,
    isConfidential: false,
    isAllDay: false,
    startDate: '2025-01-15',
    startTime: '10:00',
    endDate: '2025-01-15',
    endTime: '12:00',
    dateStatusId: 1,
    timeStatusId: 1,
    venueStatusId: null,
    activityStatusId: 1,
    leadTeamId: 1,
    leadMinistryId: 1, // Office of the Premier (from seed)
    visibility: 'global',
    leadOrgName: 'Test Org', // XOR with leadOrgId: exactly one must be set
    categoryIds: [1],
    eventPlanners: [{ eventPlannerName: 'Test Lead', isLead: true }],
    commsContacts: [{ userId: 1, isLead: true }],
    ...overrides,
  };
};

export const createMockUpdateRequest = (
  overrides?: Partial<UpdateActivityRequest>
): UpdateActivityRequest => {
  return {
    title: 'Updated Activity',
    summary: 'This activity has been updated',
    ...overrides,
  };
};

export const createMockActivity = (overrides?: Partial<Activity>): Activity => {
  const now = new Date();
  return {
    id: 1,
    displayId: 'MIN-000001',
    activityStatusId: 1,
    title: 'Test Activity',
    summary: 'Test summary',
    isIssue: false,
    isConfidential: false,
    leadOrgId: null,
    leadOrgName: null,
    significance: '',
    dateStatusId: 1,
    timeStatusId: 1,
    venueStatusId: null,
    isAllDay: false,
    startDate: new Date('2024-01-15').toISOString(),
    startTime: '10:00',
    endDate: new Date('2024-01-15').toISOString(),
    endTime: '12:00',
    schedulingNotes: '',
    strategy: null,
    newsReleaseId: null,
    newsReleaseDateTime: null,
    newsReleaseOriginId: null,
    newsReleaseDistributionId: null,
    executiveSummary: null,
    lookAheadStatus: 'none',
    lookAheadSection: 'events',
    notes: null,
    pitchDate: null,
    pitchRequiredStatusId: null,
    translationsRequiredStatusId: null,
    premierRequestedId: null,
    visibility: 'global',
    leadTeamId: 1,
    leadMinistryId: 1,
    createdDateTime: now,
    createdBy: 1,
    lastUpdatedDateTime: now,
    lastUpdatedBy: 1,
    rowVersion: 0,
    ...overrides,
  };
};

// ============================================
// Teams and Users test fixtures
// ============================================

export const createMockTeamListItem = (
  overrides?: Partial<TeamListItem>
): TeamListItem => ({
  id: 1,
  name: 'Test Team',
  displayName: 'Test Team Display',
  description: 'Test description',
  sortOrder: 0,
  isActive: true,
  roleId: null,
  memberCount: 2,
  ministryId: 1,
  ministryName: 'Office of the Premier',
  ...overrides,
});

export const createMockTeamDetail = (
  overrides?: Partial<TeamDetail>
): TeamDetail => ({
  ...createMockTeamListItem(),
  members: [
    { userId: 1, userName: 'User One', role: 'owner' },
    { userId: 2, userName: 'User Two', role: 'member' },
  ],
  ...overrides,
});

export const createMockTeamHistoryEntry = (
  overrides?: Partial<TeamHistoryEntry>
): TeamHistoryEntry => ({
  id: 1,
  teamId: 1,
  changedByUserId: 1,
  actionType: 'created',
  changes: null,
  notes: null,
  timestamp: new Date().toISOString(),
  changedByUserName: 'Admin User',
  ...overrides,
});

export const createMockCreateTeamBody = (
  overrides?: Partial<CreateTeamBody>
): CreateTeamBody => ({
  name: 'New Team',
  displayName: 'New Team Display',
  description: undefined,
  sortOrder: 0,
  isActive: true,
  ministryId: 1,
  notes: undefined,
  ...overrides,
});

export const createMockUpdateTeamBody = (
  overrides?: Partial<UpdateTeamBody>
): UpdateTeamBody => ({
  name: 'Updated Team',
  displayName: 'Updated Display',
  ...overrides,
});

export const createMockUserListItem = (
  overrides?: Partial<UserListItem>
): UserListItem => ({
  id: 1,
  adUsername: 'user1',
  adDisplayName: 'Test User',
  adEmail: 'user@example.com',
  roleId: 2,
  roleName: 'Editor',
  isActive: true,
  teams: [{ teamId: 1, teamName: 'Team One', role: 'member' }],
  ...overrides,
});

export const createMockUserDetail = (
  overrides?: Partial<UserDetail>
): UserDetail => ({
  ...createMockUserListItem(),
  notes: null,
  ...overrides,
});

export const createMockUserHistoryEntry = (
  overrides?: Partial<UserHistoryEntry>
): UserHistoryEntry => ({
  id: 1,
  userId: 1,
  changedByUserId: 2,
  actionType: 'role_changed',
  changes: [{ field: 'roleId', oldValue: 1, newValue: 2 }],
  notes: null,
  timestamp: new Date().toISOString(),
  changedByUserName: 'Admin User',
  ...overrides,
});

export const createMockAddUserToTeamBody = (
  overrides?: Partial<AddUserToTeamBody>
): AddUserToTeamBody => ({
  teamId: 1,
  role: 'member',
  notes: undefined,
  ...overrides,
});

export const createMockUpdateUserTeamRoleBody = (
  overrides?: Partial<UpdateUserTeamRoleBody>
): UpdateUserTeamRoleBody => ({
  role: 'owner',
  notes: undefined,
  ...overrides,
});

export const createMockTransferActivitiesBody = (
  overrides?: Partial<TransferActivitiesBody>
): TransferActivitiesBody => ({
  targetUserId: 2,
  activityIds: [1, 2],
  transferCommsLead: true,
  transferCommsContact: true,
  notes: undefined,
  ...overrides,
});
