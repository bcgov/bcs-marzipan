/**
 * Authenticated LOCAL mock login + History page + tab switch.
 *
 * Requires:
 * - calendar-ui dev server (npm --prefix calendar-ui run dev)
 * - calendar-service with mock auth enabled and MOCK_LOGIN_USERNAME user (default thomas.garcia)
 *
 *   npm run perf:k6:browser:auth:local
 *
 * Env:
 *   MOCK_LOGIN_USERNAME
 *   FRONTEND_URL
 *   K6_BROWSER_HEADLESS
 */
import { check } from 'k6';
import { browser } from 'k6/browser';

import {
  assertSidebarNavLinkPresent,
  collectBrowserConsoleErrors,
  loginWithMockUser,
  mockLoginUsernameFromEnv,
  safeNavigation,
  waitForActivitiesHeading,
} from './helpers/authenticated-helpers.js';
import {
  assertAppShellVisible,
  assertNoGlobalErrorFallback,
  configurePageTimeouts,
  SELECTOR_TIMEOUT_MS,
} from './helpers/browser-helpers.js';

export const options = {
  scenarios: {
    browser_mock_authenticated_history: {
      executor: 'shared-iterations',
      vus: 1,
      iterations: 1,
      maxDuration: '5m',
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

async function waitForHistoryPageHeading(page) {
  await page.waitForFunction(
    () =>
      window.location.pathname === '/global-history' &&
      [...document.querySelectorAll('h1')].some((h) =>
        (h.textContent || '').trim().includes('History')
      ),
    { timeout: SELECTOR_TIMEOUT_MS }
  );
}

export default async function () {
  const page = await browser.newPage();

  configurePageTimeouts(page);
  const consoleRecorder = collectBrowserConsoleErrors(page);

  try {
    await loginWithMockUser(page, mockLoginUsernameFromEnv());

    check(await assertNoGlobalErrorFallback(page), {
      'post-login: no global error fallback': Boolean,
    });
    check(await assertAppShellVisible(page), {
      'post-login: app shell visible': Boolean,
    });

    await waitForActivitiesHeading(page);
    check(
      await page.evaluate(() =>
        [...document.querySelectorAll('h1')].some((h) =>
          (h.textContent || '').includes('Calendar activities')
        )
      ),
      { 'home: Calendar activities headline visible': (v) => v === true }
    );

    check(await assertSidebarNavLinkPresent(page, 'Activities'), {
      'layout: Activities nav link in DOM': Boolean,
    });
    check(await assertSidebarNavLinkPresent(page, 'History'), {
      'layout: History nav link in DOM': Boolean,
    });

    const resHistory = await safeNavigation(page, '/global-history');
    check(resHistory, {
      'goto /global-history: got response': (r) => r !== null,
    });

    await waitForHistoryPageHeading(page);

    check(await assertNoGlobalErrorFallback(page), {
      'history page: no global error fallback': Boolean,
    });

    const headingVisible = await page.evaluate(() =>
      [...document.querySelectorAll('h1')].some(
        (h) => (h.textContent || '').trim() === 'History'
      )
    );
    check(headingVisible, {
      'history: page title headline visible': (v) => v === true,
    });

    await page.getByRole('tab', { name: 'My history' }).click();

    await page.waitForFunction(
      () => {
        const triggers = [
          ...document.querySelectorAll('[data-slot="tabs-trigger"]'),
        ];
        const mine = triggers.find((t) =>
          (t.textContent || '').includes('My history')
        );
        return mine?.getAttribute('data-state') === 'active';
      },
      { timeout: SELECTOR_TIMEOUT_MS }
    );

    await page.waitForSelector('[aria-label="Search history"]', {
      state: 'visible',
      timeout: SELECTOR_TIMEOUT_MS,
    });
    check(await page.isVisible('[aria-label="Search history"]'), {
      'history tab: search field visible': (v) => v === true,
    });

    check(await assertNoGlobalErrorFallback(page), {
      'after tab switch: no global error fallback': Boolean,
    });

    const severe = consoleRecorder.getSevereEntries();
    check(severe, {
      'browser console: no severe console.error': (arr) =>
        Array.isArray(arr) && arr.length === 0,
    });
  } finally {
    await page.close();
  }
}
