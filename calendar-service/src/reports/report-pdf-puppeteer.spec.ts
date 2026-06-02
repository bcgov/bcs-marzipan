import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  CHROMIUM_USER_DATA_DIR,
  PUPPETEER_LAUNCH_ARGS,
  puppeteerLaunchOptions,
  resolveChromiumExecutablePath,
} from './report-pdf-puppeteer';

const mockExistsSync = vi.hoisted(() =>
  vi.fn<typeof import('node:fs').existsSync>()
);

vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>();
  return {
    ...actual,
    existsSync: (path: Parameters<typeof actual.existsSync>[0]) =>
      mockExistsSync(path),
  };
});

const LINUX_CHROMIUM_PATH = '/usr/bin/chromium-browser';
const MACOS_CHROME_PATH =
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

describe('resolveChromiumExecutablePath', () => {
  beforeEach(() => {
    mockExistsSync.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('returns trimmed PUPPETEER_EXECUTABLE_PATH when set', () => {
    vi.stubEnv('PUPPETEER_EXECUTABLE_PATH', '  /usr/bin/chromium  ');
    expect(resolveChromiumExecutablePath()).toBe('/usr/bin/chromium');
  });

  it.each(['', '   '])(
    'ignores empty or whitespace-only PUPPETEER_EXECUTABLE_PATH (%j)',
    (envValue) => {
      vi.stubEnv('PUPPETEER_EXECUTABLE_PATH', envValue);
      vi.spyOn(process, 'platform', 'get').mockReturnValue('linux');
      mockExistsSync.mockImplementation((path) => path === LINUX_CHROMIUM_PATH);
      expect(resolveChromiumExecutablePath()).toBe(LINUX_CHROMIUM_PATH);
    }
  );

  it('returns macOS Chrome when env is empty and Chrome is installed', () => {
    vi.stubEnv('PUPPETEER_EXECUTABLE_PATH', '');
    vi.spyOn(process, 'platform', 'get').mockReturnValue('darwin');
    mockExistsSync.mockImplementation((path) => path === MACOS_CHROME_PATH);
    expect(resolveChromiumExecutablePath()).toBe(MACOS_CHROME_PATH);
  });
});

describe('puppeteerLaunchOptions', () => {
  beforeEach(() => {
    mockExistsSync.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('throws when resolved executable does not exist on disk', () => {
    vi.stubEnv('PUPPETEER_EXECUTABLE_PATH', '/nonexistent/chromium-binary');
    mockExistsSync.mockReturnValue(false);
    expect(() => puppeteerLaunchOptions()).toThrow(/not found at/);
  });

  it('throws when no Chromium executable can be resolved', () => {
    vi.stubEnv('PUPPETEER_EXECUTABLE_PATH', '');
    vi.spyOn(process, 'platform', 'get').mockReturnValue('linux');
    mockExistsSync.mockReturnValue(false);
    expect(() => puppeteerLaunchOptions()).toThrow(
      /No Chromium\/Chrome executable found/
    );
  });

  it('includes container-safe Chromium args when executable exists', () => {
    vi.stubEnv('PUPPETEER_EXECUTABLE_PATH', process.execPath);
    mockExistsSync.mockReturnValue(true);
    const options = puppeteerLaunchOptions();
    expect(options.executablePath).toBe(process.execPath);
    expect(options.args).toEqual(
      expect.arrayContaining([...PUPPETEER_LAUNCH_ARGS])
    );
    expect(options.args).toContain(`--user-data-dir=${CHROMIUM_USER_DATA_DIR}`);
    expect(options.args).toContain('--crash-dumps-dir=/tmp');
  });
});
