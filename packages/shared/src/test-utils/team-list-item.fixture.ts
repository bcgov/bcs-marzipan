import type { TeamListItem } from '../api/types';

/**
 * Creates a mock TeamListItem for tests (GET /teams list shape).
 *
 * @example
 * const team = createMockTeamListItem({ id: 5, name: 'Ops' });
 */
export function createMockTeamListItem(
  overrides?: Partial<TeamListItem>
): TeamListItem {
  return {
    id: 1,
    name: 'Test Team',
    displayName: 'Test Team Display',
    abbreviation: 'TT',
    description: 'Test description',
    sortOrder: 0,
    isActive: true,
    roleId: null,
    memberCount: 2,
    ministryId: 1,
    ministryName: 'Office of the Premier',
    ...overrides,
  };
}
