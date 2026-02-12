import type { ActivityResponse } from '../schemas/activity-response.schema';
/**
 * Creates a mock ActivityResponse object for testing.
 *
 * This is the single source of truth for ActivityResponse test fixtures.
 * Use this factory in all tests that need an ActivityResponse object.
 *
 * The factory returns a minimal but schema-valid object using shared constants.
 * All fields can be overridden via the overrides parameter.
 *
 * @param overrides - Partial ActivityResponse to override default values
 * @returns A complete ActivityResponse object
 *
 * @example
 * // Minimal usage
 * const response = createMockActivityResponse();
 *
 * @example
 * // With overrides
 * const response = createMockActivityResponse({
 *   id: 42,
 *   title: 'Custom Title',
 *   lookAheadStatus: 'new',
 * });
 */
export declare function createMockActivityResponse(overrides?: Partial<ActivityResponse>): ActivityResponse;
//# sourceMappingURL=activity-response.fixture.d.ts.map