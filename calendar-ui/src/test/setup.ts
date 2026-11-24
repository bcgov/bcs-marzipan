import '@testing-library/jest-dom';

import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

function createStorage(): Storage {
  const storage = {} as Storage;
  const storedKeys = () => Object.keys(storage);

  Object.defineProperties(storage, {
    length: {
      configurable: false,
      enumerable: false,
      get: () => storedKeys().length,
    },
    clear: {
      value: () => {
        for (const key of storedKeys()) delete storage[key];
      },
      enumerable: false,
    },
    getItem: {
      value: (key: string) =>
        Object.prototype.hasOwnProperty.call(storage, key)
          ? storage[key]
          : null,
      enumerable: false,
    },
    key: {
      value: (index: number) => storedKeys()[index] ?? null,
      enumerable: false,
    },
    removeItem: {
      value: (key: string) => {
        delete storage[key];
      },
      enumerable: false,
    },
    setItem: {
      value: (key: string, value: string) => {
        Object.defineProperty(storage, key, {
          configurable: true,
          enumerable: true,
          value: String(value),
          writable: true,
        });
      },
      enumerable: false,
    },
  });

  return storage;
}

if (typeof window !== 'undefined') {
  if (!window.localStorage) {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: createStorage(),
    });
  }
  if (!window.sessionStorage) {
    Object.defineProperty(window, 'sessionStorage', {
      configurable: true,
      value: createStorage(),
    });
  }
}

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
