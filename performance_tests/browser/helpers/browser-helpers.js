/**
 * Shared k6/browser utilities for CorpCal UI tests.
 */

export const NAV_TIMEOUT_MS = 60_000;
export const SELECTOR_TIMEOUT_MS = 45_000;

/** Default allowlist for benign console.error noise in local Vite/React dev. */
const DEFAULT_CONSOLE_ERROR_ALLOWLIST = [
  /^Download the React DevTools/i,
  /ResizeObserver loop limit exceeded/i,
  /Failed to load resource.*favicon/i,
];

export function frontendBaseUrl() {
  return (__ENV.FRONTEND_URL || 'http://127.0.0.1:3000').replace(/\/+$/, '');
}

/**
 * @param {string} path - Absolute path starting with / (e.g. /login)
 */
export function pathUrl(path) {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${frontendBaseUrl()}${normalized}`;
}

export function configurePageTimeouts(page) {
  page.setDefaultTimeout(SELECTOR_TIMEOUT_MS);
  page.setDefaultNavigationTimeout(NAV_TIMEOUT_MS);
}

/**
 * Attaches listeners before navigation.
 * Only tracks console API type "error" (not console.warn) to reduce flake in dev.
 *
 * @returns {{ getSevereEntries: () => Array<{ type: string, text: string }> }}
 */
export function attachSevereConsoleWatch(
  page,
  allowlistPatterns = DEFAULT_CONSOLE_ERROR_ALLOWLIST
) {
  const entries = [];

  page.on('console', (msg) => {
    if (msg.type() !== 'error') {
      return;
    }
    const text = msg.text() || '';
    if (allowlistPatterns.some((re) => re.test(text))) {
      return;
    }
    entries.push({ type: msg.type(), text });
  });

  return {
    getSevereEntries: () => [...entries],
  };
}

/** App shell visible and React mounted into #root. */
export async function waitForAppReady(page, timeoutMs = SELECTOR_TIMEOUT_MS) {
  await page.getByTestId('app-shell').waitFor({
    state: 'visible',
    timeout: timeoutMs,
  });

  await page.waitForFunction(
    () => {
      const root = document.getElementById('root');
      return !!(root && root.children && root.children.length > 0);
    },
    { timeout: timeoutMs }
  );
}

export async function assertAppShellVisible(page) {
  return (await page.isVisible('[data-testid="app-shell"]')) === true;
}

export async function assertNoGlobalErrorFallback(page) {
  return (
    (await page.isVisible('[data-testid="global-error-fallback"]')) === false
  );
}

export async function assertRootHasChildren(page) {
  return await page.evaluate(() => {
    const root = document.getElementById('root');
    return !!(root && root.children && root.children.length > 0);
  });
}

/**
 * Login surface once config resolves: mock dev form, email-first local row, Azure IDIR primary,
 * or explicit "no method configured" copy.
 */
export async function waitForLoginSurfaceReady(
  page,
  timeoutMs = SELECTOR_TIMEOUT_MS
) {
  await page.waitForFunction(
    () => {
      function isShown(el) {
        if (!el) {
          return false;
        }
        const st = window.getComputedStyle(el);
        if (st.visibility === 'hidden' || st.display === 'none') {
          return false;
        }
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      }

      if (document.body.innerText.includes('No login method is configured.')) {
        return true;
      }

      if (isShown(document.querySelector('#mock-username'))) {
        return true;
      }

      if (isShown(document.querySelector('#email'))) {
        return true;
      }

      if (isShown(document.querySelector('#password'))) {
        return true;
      }

      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.some((b) =>
        (b.textContent || '').includes('Sign in with IDIR')
      );
    },
    { timeout: timeoutMs }
  );
}

/**
 * Full load of a path with default waitUntil.
 */
export async function openPath(page, path, options = {}) {
  const url = pathUrl(path);
  return await page.goto(url, {
    waitUntil: 'load',
    timeout: NAV_TIMEOUT_MS,
    ...options,
  });
}

/**
 * Client-side SPA redirect to login (unauthenticated hit on protected '/').
 */
export async function waitForPathnameLogin(
  page,
  timeoutMs = SELECTOR_TIMEOUT_MS
) {
  await page.waitForFunction(
    () =>
      window.location.pathname === '/login' ||
      window.location.pathname.endsWith('/login'),
    { timeout: timeoutMs }
  );
}
