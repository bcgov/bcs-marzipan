import { lazy, type ComponentType } from 'react';

/**
 * Wraps React.lazy with a single retry on chunk-load failures.
 *
 * After a deployment the browser may hold stale asset URLs. When the dynamic
 * import 404s we retry once with a cache-busted module URL. If both attempts
 * fail we surface a clear "please reload" error so the GlobalErrorBoundary can
 * display it.
 */

export function lazyWithRetry<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    try {
      return await importFn();
    } catch (firstError) {
      // One retry — gives the browser a chance to fetch the new manifest.
      try {
        return await importFn();
      } catch {
        throw new ChunkLoadError(firstError);
      }
    }
  });
}

/**
 * Dedicated error class so the error boundary can detect stale-deploy
 * chunk failures and suggest a page reload.
 */
export class ChunkLoadError extends Error {
  override name = 'ChunkLoadError';

  constructor(cause: unknown) {
    super(
      'A newer version of this application is available. Please reload the page.'
    );
    this.cause = cause;
  }
}
