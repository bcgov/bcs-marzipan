import { existsSync } from 'node:fs';
import puppeteer, { type LaunchOptions } from 'puppeteer-core';

/** Writable under OpenShift arbitrary UID; Chromium profile and crash dumps. */
export const CHROMIUM_USER_DATA_DIR = '/tmp/chromium';

export const PUPPETEER_LAUNCH_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  `--user-data-dir=${CHROMIUM_USER_DATA_DIR}`,
  '--crash-dumps-dir=/tmp',
] as const;

const LINUX_CHROMIUM_CANDIDATES = [
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
] as const;

const MACOS_CHROME_PATH =
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

/**
 * Resolves a Chromium/Chrome binary for puppeteer-core.
 * Docker sets `PUPPETEER_EXECUTABLE_PATH`; local dev can use env or common install paths.
 */
export function resolveChromiumExecutablePath(): string | undefined {
  const fromEnv = process.env.PUPPETEER_EXECUTABLE_PATH?.trim();
  if (fromEnv) return fromEnv;

  if (process.platform === 'darwin' && existsSync(MACOS_CHROME_PATH)) {
    return MACOS_CHROME_PATH;
  }

  if (process.platform === 'linux') {
    for (const candidate of LINUX_CHROMIUM_CANDIDATES) {
      if (existsSync(candidate)) return candidate;
    }
  }

  return undefined;
}

export function puppeteerLaunchOptions(): LaunchOptions {
  const executablePath = resolveChromiumExecutablePath();
  if (!executablePath) {
    throw new Error(
      'No Chromium/Chrome executable found for PDF export. Set PUPPETEER_EXECUTABLE_PATH or install Chromium/Chrome.'
    );
  }

  if (!existsSync(executablePath)) {
    throw new Error(
      `Chromium/Chrome executable not found at "${executablePath}". Check PUPPETEER_EXECUTABLE_PATH.`
    );
  }

  return {
    headless: true,
    executablePath,
    args: [...PUPPETEER_LAUNCH_ARGS],
  };
}

export { puppeteer };
