import '@testing-library/jest-dom';

import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

const originalConsoleWarn = console.warn;

beforeEach(() => {
  // jsdom does not implement the browser Navigation API used by some router/UI libraries.
  // Provide a no-op stub and silence the noisy jsdom warning it emits during tests.
  const navigationStub = {
    currentEntry: { url: window.location.href },
    canGoBack: false,
    canGoForward: false,
    entries: vi.fn(() => []),
    navigate: vi.fn(),
    reload: vi.fn(),
    traverseTo: vi.fn(),
    updateCurrentEntry: vi.fn(),
  };

  Object.defineProperty(window, 'navigation', {
    configurable: true,
    writable: true,
    value: navigationStub,
  });

  Object.defineProperty(document, 'navigation', {
    configurable: true,
    writable: true,
    value: navigationStub,
  });

  vi.spyOn(console, 'warn').mockImplementation((...args) => {
    const message = args.map((arg) => String(arg)).join(' ');
    if (message.includes('Not implemented: navigation to another Document')) {
      return;
    }
    originalConsoleWarn(...args);
  });
});

// Mock ResizeObserver (required by cmdk and other libraries)
global.ResizeObserver = class ResizeObserver {
  observe() {
    // Mock implementation
  }
  unobserve() {
    // Mock implementation
  }
  disconnect() {
    // Mock implementation
  }
};

// Mock scrollIntoView (required by cmdk)
Element.prototype.scrollIntoView = vi.fn();

// Mock matchMedia (required by ActivityFormMissingFieldsHint, use-mobile, etc.)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Cleanup after each test
afterEach(() => {
  cleanup();
});
