/**
 * Minimal browser smoke: headless Chromium loads the local Vite app (public /login route).
 *
 * Requires calendar-ui dev server (default http://127.0.0.1:3000):
 *   npm --prefix calendar-ui run dev
 *
 * Run:
 *   npm run perf:k6:browser:local
 *
 * Env (optional overrides):
 *   FRONTEND_URL — base URL without trailing slash (default http://127.0.0.1:3000)
 *   K6_BROWSER_HEADLESS — default true via launcher (Chromium headless)
 */
import { browser } from 'k6/browser';
import { check } from 'k6';

import {
  assertAppShellVisible,
  assertNoGlobalErrorFallback,
  assertRootHasChildren,
  configurePageTimeouts,
  openPath,
  waitForAppReady,
} from './helpers/browser-helpers.js';

export const options = {
  scenarios: {
    browser_smoke: {
      executor: 'shared-iterations',
      vus: 1,
      iterations: 1,
      maxDuration: '3m',
      options: {
        browser: {
          type: 'chromium',
        },
      },
    },
  },
  thresholds: {
    checks: ['rate==1'],
  },
};

export default async function () {
  const page = await browser.newPage();

  try {
    configurePageTimeouts(page);

    const res = await openPath(page, '/login');
    check(res, {
      'navigation returned a response': (r) => r !== null,
    });

    const title = await page.title();
    check(title, {
      'document title is non-empty': (t) => typeof t === 'string' && t.trim().length > 0,
      'document title mentions Corporate Calendar': (t) =>
        typeof t === 'string' && t.includes('Corporate Calendar'),
    });

    await waitForAppReady(page);

    check(await assertAppShellVisible(page), { 'app shell container is visible': Boolean });
    check(await assertRootHasChildren(page), { '#root has rendered children': Boolean });
    check(await assertNoGlobalErrorFallback(page), {
      'no global error boundary screen': Boolean,
    });
  } finally {
    await page.close();
  }
}
