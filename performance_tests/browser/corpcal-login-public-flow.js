/**
 * Unauthenticated UI flow: login surface + light interaction + redirect to /login from protected /.
 * Does not submit login (no authenticated session).
 *
 *   npm run perf:k6:browser:flow:local
 */
import { browser } from 'k6/browser';
import { check } from 'k6';

import {
  SELECTOR_TIMEOUT_MS,
  attachSevereConsoleWatch,
  assertNoGlobalErrorFallback,
  assertRootHasChildren,
  assertAppShellVisible,
  configurePageTimeouts,
  openPath,
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
    check(resLogin, { 'login: navigation returned response': (r) => r !== null });

    await waitForAppReady(page);
    check(await assertAppShellVisible(page), { 'login: app shell visible': Boolean });
    check(await assertRootHasChildren(page), { 'login: #root populated': Boolean });
    check(await assertNoGlobalErrorFallback(page), { 'login: no global error fallback': Boolean });

    const title = await page.title();
    check(title, {
      'login: document title mentions app': (t) =>
        typeof t === 'string' && t.includes('Corporate Calendar'),
    });

    await waitForLoginSurfaceReady(page);
    check(await page.isVisible('[data-testid="login-page"]'), {
      'login: login page container visible': (v) => v === true,
    });

    const mockFormVisible = await page.isVisible('#username');

    if (mockFormVisible) {
      const submitEnabledWhenEmpty = await page.isEnabled('[data-testid="login-submit-mock"]');
      check(submitEnabledWhenEmpty, {
        'mock: sign-in disabled with empty username': (en) => en === false,
      });

      await page.fill('#username', 'k6-public-flow');
      check(await page.inputValue('#username'), {
        'mock: username field accepts input': (v) => v === 'k6-public-flow',
      });

      const submitEnabledWhenFilled = await page.isEnabled('[data-testid="login-submit-mock"]');
      check(submitEnabledWhenFilled, {
        'mock: sign-in enabled when username non-empty': (en) => en === true,
      });

      await page.click('[data-testid="login-password-toggle"]');
      const typeAfterShow = await page.evaluate(
        () => document.querySelector('#password')?.getAttribute('type') || ''
      );
      check(typeAfterShow, { 'mock: password toggle reveals value (type=text)': (t) => t === 'text' });

      await page.click('[data-testid="login-password-toggle"]');
      const typeAfterHide = await page.evaluate(
        () => document.querySelector('#password')?.getAttribute('type') || ''
      );
      check(typeAfterHide, { 'mock: password toggle restores masking': (t) => t === 'password' });
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
        'azure: primary sign-in option visible': (v) => v === true,
      });
    }

    const resHome = await openPath(page, '/');
    check(resHome, { 'home redirect: initial navigation returned response': (r) => r !== null });

    await waitForPathnameLogin(page);
    const onLogin = await page.evaluate(
      () =>
        window.location.pathname === '/login' || window.location.pathname.endsWith('/login')
    );
    check(onLogin, { 'spa: unauthenticated user lands on /login': (v) => v === true });

    await waitForLoginSurfaceReady(page);

    const brandingVisible = await page.evaluate(() =>
      document.body.innerText.includes('Corporate Calendar')
    );
    check(brandingVisible, { 'after redirect: branding still visible': (v) => v === true });

    check(await assertNoGlobalErrorFallback(page), {
      'after navigation: no global error fallback': Boolean,
    });
    check(await assertAppShellVisible(page), { 'after navigation: app shell visible': Boolean });

    const severe = consoleWatch.getSevereEntries();
    check(severe, {
      'browser console: no severe console.error (after allowlist)': (arr) =>
        Array.isArray(arr) && arr.length === 0,
    });
  } finally {
    await page.close();
  }
}
