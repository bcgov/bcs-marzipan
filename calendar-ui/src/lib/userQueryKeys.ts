import type { QueryClient } from '@tanstack/react-query';

/**
 * Centralized React Query key factory for user detail, list, and change-log history.
 *
 * `list()` uses the `['users']` prefix so invalidation also refreshes nested keys
 * such as `['users', search]` and `['users', userId, 'activities']`.
 */

export const userQueryKeys = {
  detail: (userId: number) => ['user', userId] as const,
  history: (userId: number) => ['userHistory', userId] as const,
  list: () => ['users'] as const,
} as const;

/** Refetch user detail, list, and change-log after a mutation that updates user data. */
export function invalidateUserCaches(
  queryClient: QueryClient,
  userId: number
): void {
  void queryClient.invalidateQueries({
    queryKey: userQueryKeys.detail(userId),
  });
  void queryClient.invalidateQueries({ queryKey: userQueryKeys.list() });
  void queryClient.invalidateQueries({
    queryKey: userQueryKeys.history(userId),
  });
}
