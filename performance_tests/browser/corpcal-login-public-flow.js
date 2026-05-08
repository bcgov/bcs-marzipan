/**
 * Unauthenticated UI flow: login surface + light interaction + redirect to /login from protected /.
 * Does not complete real login (no authenticated session intended).
 *
 * Handles post-merge login modes:
 * - mock dev username form (#mock-username)
 * - local email-first step (#email + Continue)
 * - Azure primary (“Sign in with IDIR”), optional local behind chevron
 *
 *   npm run perf:k6:browser:flow:local
 */
import { check } from 'k6';
import { browser } from 'k6/browser';

import {
  assertAppShellVisible,
  assertNoGlobalErrorFallback,
  assertRootHasChildren,
  attachSevereConsoleWatch,
  configurePageTimeouts,
  openPath,
  SELECTOR_TIMEOUT_MS,
  waitForAppReady,
  waitForLoginSurfaceReady,
  waitForPathnameLogin,
} from './helpers/browser-helpers.js';

export const options = {
  scenarios: {
    browser_login_public_flow: {
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

  configurePageTimeouts(page);
  const consoleWatch = attachSevereConsoleWatch(page);

  try {
    const resLogin = await openPath(page, '/login');
    check(resLogin, {
      'login: navigation returned response': (r) => r !== null,
    });

    await waitForAppReady(page);
    check(await assertAppShellVisible(page), {
      'login: app shell visible': Boolean,
    });
    check(await assertRootHasChildren(page), {
      'login: #root populated': Boolean,
    });
    check(await assertNoGlobalErrorFallback(page), {
      'login: no global error fallback': Boolean,
    });

    const title = await page.title();
    check(title, {
      'login: document title mentions app': (t) =>
        typeof t === 'string' && t.includes('Corporate Calendar'),
    });

    await waitForLoginSurfaceReady(page);

    check(await page.isVisible('[data-testid="login-page"]'), {
      'login: login page container visible': (v) => v === true,
    });

    const noMethodsBanner = await page.evaluate(() =>
      document.body.innerText.includes('No login method is configured.')
    );

    if (noMethodsBanner) {
      check(true, {
        'degraded: no login methods messaging shown': () => true,
      });
    } else if (await page.isVisible('#mock-username')) {
      const disabledEmptyMock = !(await page.isEnabled(
        '[data-testid="login-submit-mock"]'
      ));
      check(disabledEmptyMock, {
        'mock: submit disabled until username non-empty': (v) => v === true,
      });

      await page.fill('#mock-username', 'k6-public-flow');
      check(await page.inputValue('#mock-username'), {
        'mock: username field accepts input': (v) => v === 'k6-public-flow',
      });

      check(await page.isEnabled('[data-testid="login-submit-mock"]'), {
        'mock: submit enabled when username non-empty': (v) => v === true,
      });
    } else if (await page.isVisible('#email')) {
      const continueDisabledInitially = !(await page.isEnabled(
        '[data-testid="login-continue-email"]'
      ));
      check(continueDisabledInitially, {
        'local: Continue disabled until email entered': (v) => v === true,
      });

      await page.fill('#email', 'k6-public-flow@example.com');
      check(await page.inputValue('#email'), {
        'local: email field accepts input': (v) => v.includes('k6-public-flow'),
      });

      check(await page.isEnabled('[data-testid="login-continue-email"]'), {
        'local: Continue enabled when email present': (v) => v === true,
      });
    } else if (await page.isVisible('#password')) {
      await page.click('[data-testid="login-password-toggle"]');
      const typeAfterShow = await page.evaluate(
        () => document.querySelector('#password')?.getAttribute('type') || ''
      );
      check(typeAfterShow, {
        'local: password toggle reveals text type': (t) => t === 'text',
      });

      await page.click('[data-testid="login-password-toggle"]');
      const typeAfterHide = await page.evaluate(
        () => document.querySelector('#password')?.getAttribute('type') || ''
      );
      check(typeAfterHide, {
        'local: password toggle restores masked type': (t) => t === 'password',
      });
    } else {
      await page.getByText('Sign in with IDIR').waitFor({
        state: 'visible',
        timeout: SELECTOR_TIMEOUT_MS,
      });
      const idirVisible = await page.evaluate(() =>
        [...document.querySelectorAll('button')].some((b) =>
          (b.textContent || '').includes('Sign in with IDIR')
        )
      );
      check(idirVisible, {
        'azure: Sign in with IDIR option visible': (v) => v === true,
      });
    }

    const resHome = await openPath(page, '/');
    check(resHome, {
      'home redirect: initial navigation returned response': (r) => r !== null,
    });

    await waitForPathnameLogin(page);
    const onLogin = await page.evaluate(
      () =>
        window.location.pathname === '/login' ||
        window.location.pathname.endsWith('/login')
    );
    check(onLogin, {
      'spa: unauthenticated user lands on /login': (v) => v === true,
    });

    await waitForLoginSurfaceReady(page);

    const brandingVisible = await page.evaluate(() =>
      document.body.innerText.includes('Corporate Calendar')
    );
    check(brandingVisible, {
      'after redirect: branding still visible': (v) => v === true,
    });

    check(await assertNoGlobalErrorFallback(page), {
      'after navigation: no global error fallback': Boolean,
    });
    check(await assertAppShellVisible(page), {
      'after navigation: app shell visible': Boolean,
    });

    const severe = consoleWatch.getSevereEntries();
    check(severe, {
      'browser console: no severe console.error (after allowlist)': (arr) =>
        Array.isArray(arr) && arr.length === 0,
    });
  } finally {
    await page.close();
  }
}
