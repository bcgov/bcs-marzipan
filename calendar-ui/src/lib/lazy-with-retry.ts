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
      const mod = await importFn();
      // If the resolved module doesn't have a usable default export, try to
      // pick the first function/class export we can find so lazy() receives
      // a valid component. This guards against modules that accidentally
      // export named-only components or against build-time changes.
      if (!mod || !mod.default) {
        const keys = Object.keys(mod || {});
        console.warn('lazyWithRetry: resolved module missing default export', {
          keys,
        });
        const fallback = Object.values(mod || {}).find(
          (v) => typeof v === 'function'
        );
        if (fallback) {
          console.warn('lazyWithRetry: using fallback export from module', {
            keys,
          });
          return { default: fallback as any };
        }
        throw new Error(
          `lazyWithRetry: resolved module missing default export and no usable fallback export was found (exports: ${keys.join(', ')})`
        );
      }
      return mod;
    } catch (firstError) {
      // One retry — gives the browser a chance to fetch the new manifest.
      try {
        const mod = await importFn();
        if (!mod || !mod.default) {
          const keys = Object.keys(mod || {});
          console.warn(
            'lazyWithRetry (retry): resolved module missing default export',
            {
              keys,
            }
          );
          const fallback = Object.values(mod || {}).find(
            (v) => typeof v === 'function'
          );
          if (fallback) {
            console.warn(
              'lazyWithRetry (retry): using fallback export from module',
              { keys }
            );
            return { default: fallback as any };
          }
          throw new Error(
            `lazyWithRetry (retry): resolved module missing default export and no usable fallback export was found (exports: ${keys.join(', ')})`
          );
        }
        return mod;
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
