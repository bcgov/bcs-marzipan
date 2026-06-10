import type { Request } from 'express';

import type { AuthUser } from '@corpcal/shared';

/**
 * Extended request user/context for policy and data scoping
 */
export type UserContext = AuthUser;

/**
 * Data scope for filtering results by team membership
 * Advanced, Admin, and System Admin bypass team scoping (bypass=true)
 */
export interface DataScope {
  teamIds: number[];
  bypass: boolean;
}

/** Fail-closed default: global-only visibility when no request scope is present. */
export const DEFAULT_DATA_SCOPE: DataScope = {
  teamIds: [],
  bypass: false,
};

/** Resolves data scope; missing scope defaults to restricted (not bypass). */
export function resolveDataScope(dataScope?: DataScope): DataScope {
  return dataScope ?? { teamIds: [], bypass: false };
}

/**
 * Context slice of the augmented Express Request (user + dataScope).
 * dataScope is required because @RequestContext() always provides it (defaults when absent).
 */
export type RequestContext = Pick<Request, 'user' | 'dataScope'> & {
  dataScope: DataScope;
};
