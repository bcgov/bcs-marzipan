import '@testing-library/jest-dom';

import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

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
