/**
 * Cache-Control header helpers for authenticated lookup GET routes.
 *
 * The browser's HTTP cache and TanStack Query's in-memory cache overlap, and
 * a long `public, max-age` on the HTTP layer will serve stale payloads after
 * schema/seed changes (especially locally) regardless of what React Query does.
 *
 * We prefer a revalidation-first policy:
 * - Non-production: `no-store` so local schema/seed changes are immediately
 *   visible on refresh without clearing caches manually.
 * - Production: `private, no-cache` so the browser may store the response for
 *   a given user but must revalidate with the server before reuse. Paired with
 *   the short React Query `staleTime` this keeps bandwidth low while avoiding
 *   user-visible staleness.
 *
 * For endpoints that truly never change (e.g. translation languages) callers
 * may still opt into a longer `max-age` by using a literal header instead of
 * this helper.
 */

/** Cache-Control value for idempotent lookup GETs (authenticated, per-user). */
export function lookupGetCacheControl(): string {
  return process.env.NODE_ENV === 'production'
    ? 'private, no-cache'
    : 'no-store';
}
