import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  CHROMIUM_USER_DATA_DIR,
  PUPPETEER_LAUNCH_ARGS,
  puppeteerLaunchOptions,
  resolveChromiumExecutablePath,
} from './report-pdf-puppeteer';

describe('resolveChromiumExecutablePath', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns trimmed PUPPETEER_EXECUTABLE_PATH when set', () => {
    vi.stubEnv('PUPPETEER_EXECUTABLE_PATH', '  /usr/bin/chromium  ');
    expect(resolveChromiumExecutablePath()).toBe('/usr/bin/chromium');
  });

  it('does not use env when unset', () => {
    vi.stubEnv('PUPPETEER_EXECUTABLE_PATH', '');
    const path = resolveChromiumExecutablePath();
    if (path) {
      expect(path).not.toBe('');
    }
  });
});

describe('puppeteerLaunchOptions', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('throws when no executable can be resolved', () => {
    vi.stubEnv('PUPPETEER_EXECUTABLE_PATH', '/nonexistent/chromium-binary');
    expect(() => puppeteerLaunchOptions()).toThrow(/not found at/);
  });

  it('includes container-safe Chromium args when executable exists', () => {
    vi.stubEnv('PUPPETEER_EXECUTABLE_PATH', process.execPath);
    const options = puppeteerLaunchOptions();
    expect(options.executablePath).toBe(process.execPath);
    expect(options.args).toEqual(
      expect.arrayContaining([...PUPPETEER_LAUNCH_ARGS])
    );
    expect(options.args).toContain(`--user-data-dir=${CHROMIUM_USER_DATA_DIR}`);
    expect(options.args).toContain('--crash-dumps-dir=/tmp');
  });
});
