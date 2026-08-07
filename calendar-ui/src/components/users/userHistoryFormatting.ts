import type { HistoryChange } from '@corpcal/shared/api/types';

interface UserHistoryLookups {
  roleNamesById: Record<number, string>;
  teamNamesById: Record<number, string>;
  activityTitlesById?: Record<number, string>;
}

const USER_HISTORY_FIELD_LABELS: Record<string, string> = {
  roleId: 'Role',
  teamId: 'Team',
  adDisplayName: 'Display name',
  displayName: 'Display name',
  adUsername: 'Username',
  adEmail: 'Email',
  email: 'Email',
  adPhone: 'Phone',
  phone: 'Phone',
  adJobTitle: 'Job title',
  jobTitle: 'Job title',
  firstName: 'First name',
  lastName: 'Last name',
  isActive: 'Account status',
  directLoginEnabled: 'Direct login enabled',
  notes: 'Notes',
  flagColour: 'Flag colour',
  teamRole: 'Team role',
  targetUserId: 'Transfer target',
  fromTeamId: 'From team',
  toTeamId: 'To team',
  activityCount: 'Activities affected',
  activityIds: 'Activities',
};

function toLabelFromField(field: string): string {
  const knownLabel = USER_HISTORY_FIELD_LABELS[field];
  if (knownLabel) return knownLabel;

  const spaced = field
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim();

  if (!spaced) return 'Field';
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function isEmptyValue(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  return false;
}

function parseNumericId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function formatBooleanValue(field: string, value: boolean): string {
  if (field === 'isActive') return value ? 'Active' : 'Inactive';
  if (field === 'directLoginEnabled') return value ? 'Enabled' : 'Disabled';
  return value ? 'Yes' : 'No';
}

function formatHistoryValue(
  field: string,
  value: unknown,
  lookups: UserHistoryLookups
): string {
  if (value == null) return '';

  if (field === 'roleId') {
    const roleId = parseNumericId(value);
    if (roleId != null) {
      return lookups.roleNamesById[roleId] ?? `Role ${roleId}`;
    }
  }

  if (field === 'teamId') {
    const teamId = parseNumericId(value);
    if (teamId != null) {
      return lookups.teamNamesById[teamId] ?? `Team ${teamId}`;
    }
  }

  if (field === 'fromTeamId' || field === 'toTeamId') {
    const teamId = parseNumericId(value);
    if (teamId != null) {
      return lookups.teamNamesById[teamId] ?? `Team ${teamId}`;
    }
  }

  if (field === 'targetUserId') {
    const id = parseNumericId(value);
    if (id != null) return `User ${id}`;
  }

  if (field === 'activityIds' && Array.isArray(value)) {
    const ids = value
      .map((entry) => parseNumericId(entry))
      .filter((id): id is number => id != null);
    if (ids.length === 0) return 'none';
    const labels = ids.map(
      (id) => lookups.activityTitlesById?.[id] ?? `#${id}`
    );
    const countLabel = `${ids.length} activit${ids.length === 1 ? 'y' : 'ies'}`;
    const maxListed = 5;
    if (labels.length <= maxListed) {
      return `${countLabel}: ${labels.join(', ')}`;
    }
    return `${countLabel}: ${labels.slice(0, maxListed).join(', ')}, …`;
  }

  if (typeof value === 'boolean') return formatBooleanValue(field, value);
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
}

export function buildUserHistoryChangeMessage(
  change: HistoryChange,
  lookups: UserHistoryLookups
): string {
  const label = toLabelFromField(change.field);
  const oldEmpty = isEmptyValue(change.oldValue);
  const newEmpty = isEmptyValue(change.newValue);

  const oldValue = formatHistoryValue(change.field, change.oldValue, lookups);
  const newValue = formatHistoryValue(change.field, change.newValue, lookups);

  if (oldEmpty && newEmpty) return `${label} updated`;
  if (oldEmpty) return `${label} set to ${newValue}`;
  if (newEmpty) return `${label} cleared (was ${oldValue})`;
  return `${label} changed from ${oldValue} to ${newValue}`;
}
