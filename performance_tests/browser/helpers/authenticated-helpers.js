/**
 * Authenticated k6/browser helpers — mock dev username login (httpOnly cookie session).
 */

import {
  attachSevereConsoleWatch,
  NAV_TIMEOUT_MS,
  openPath,
  pathUrl,
  SELECTOR_TIMEOUT_MS,
  waitForAppReady,
  waitForLoginSurfaceReady,
} from './browser-helpers.js';

/** @see attachSevereConsoleWatch — attach early in iteration, assert getSevereEntries() later */
export function collectBrowserConsoleErrors(page, allowlistPatterns) {
  return attachSevereConsoleWatch(page, allowlistPatterns);
}

export { attachSevereConsoleWatch };

/** MOCK_LOGIN_USERNAME (default aligns with seeded admin / api perf hints). */
export function mockLoginUsernameFromEnv() {
  return (__ENV.MOCK_LOGIN_USERNAME || 'thomas.garcia').trim();
}

/**
 * Activities home after ProtectedRoute clears auth bootstrap (may show full-screen Loading… briefly).
 */
export async function waitForAuthenticatedShell(
  page,
  timeoutMs = NAV_TIMEOUT_MS
) {
  await page.waitForFunction(
    () => {
      if (window.location.pathname !== '/') {
        return false;
      }

      const authBootstrapLoading = [...document.querySelectorAll('p')].some(
        (p) =>
          (p.textContent || '').trim() === 'Loading...' &&
          Boolean(p.closest('[class*="min-h-screen"]'))
      );

      if (authBootstrapLoading) {
        return false;
      }

      const sidebarMounted =
        document.querySelector('[data-slot="sidebar"]') !== null;

      const calendarHeading = [...document.querySelectorAll('h1')].some((h) =>
        (h.textContent || '').includes('Calendar activities')
      );

      return sidebarMounted || calendarHeading;
    },
    { timeout: timeoutMs }
  );
}

export async function assertSidebarNavLinkPresent(page, label) {
  return await page.evaluate((navLabel) => {
    const byAria = [...document.querySelectorAll('a')].some(
      (a) => (a.getAttribute('aria-label') || '') === navLabel
    );
    if (byAria) return true;

    if (navLabel === 'Activities') {
      return [...document.querySelectorAll('a[href="/"]')].some((a) =>
        (a.textContent || '').includes('Activities')
      );
    }
    if (navLabel === 'History') {
      return [...document.querySelectorAll('a[href="/global-history"]')].some(
        (a) => (a.textContent || '').includes('History')
      );
    }

    return false;
  }, label);
}

/**
 * Full-document navigation preserving cookies (preferred over collapsed-sidebar clicks in headless).
 */
export async function safeNavigation(page, path, options = {}) {
  return await page.goto(pathUrl(path), {
    waitUntil: 'load',
    timeout: NAV_TIMEOUT_MS,
    ...options,
  });
}

/**
 * Activities list headline (loads after Suspense/route chunk; sidebar may render first).
 */
export async function waitForActivitiesHeading(
  page,
  timeoutMs = SELECTOR_TIMEOUT_MS
) {
  await page.waitForFunction(
    () =>
      [...document.querySelectorAll('h1')].some((h) =>
        (h.textContent || '').includes('Calendar activities')
      ),
    { timeout: timeoutMs }
  );
}

/**
 * Mock login via #mock-username + submit. Backend must expose mock auth (/auth/login) and seed the user.
 */
export async function loginWithMockUser(page, username) {
  await openPath(page, '/login');
  await waitForAppReady(page);
  await waitForLoginSurfaceReady(page);

  await page.waitForSelector('#mock-username', {
    state: 'visible',
    timeout: SELECTOR_TIMEOUT_MS,
  });

  await page.fill('#mock-username', username);
  await page.click('[data-testid="login-submit-mock"]');
  await waitForAuthenticatedShell(page);
}
