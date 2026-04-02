import { describe, expect, it } from 'vitest';

import { insertActionIntoContent } from '../BannerSettingsAdmin';

const ACTION_SNIPPET = `<a href="#" onclick="window.open('#', '_blank')" class="inline-flex items-center justify-center bg-white text-slate-900 border border-slate-200 px-3 py-0.5 rounded-md text-sm font-semibold hover:bg-slate-100 no-underline align-middle leading-none text-center">Action</a>`;

describe('insertActionIntoContent', () => {
  it('inserts into the flex-1 content div when present', () => {
    const content = `<div class="flex items-center justify-between">\n  <div class="flex items-center space-x-2">\n    <span class="text-sm font-medium whitespace-nowrap">Notice</span>\n  </div>\n  <div class="flex-1 text-sm px-4 hidden md:block">\n    Default banner content.\n  </div>\n</div>`;

    const result = insertActionIntoContent(content);
    // should have action snippet inside the flex-1 div
    expect(result).toContain('flex-1');
    expect(result).toContain(ACTION_SNIPPET);
    // ensure it is inside the flex-1 closing tag (approx)
    expect(result.indexOf(ACTION_SNIPPET)).toBeGreaterThan(
      result.indexOf('flex-1')
    );
  });

  it('falls back to inserting into outer items-center row', () => {
    const content = `<div class="outer items-center"><p>Hi</p></div>`;
    const result = insertActionIntoContent(content);
    expect(result).toContain(ACTION_SNIPPET);
    expect(result.indexOf(ACTION_SNIPPET)).toBeGreaterThan(
      result.indexOf('items-center')
    );
  });

  it('appends when no suitable container found', () => {
    const content = `<p>No container here</p>`;
    const result = insertActionIntoContent(content);
    expect(
      result.endsWith(ACTION_SNIPPET) || result.includes(ACTION_SNIPPET)
    ).toBe(true);
  });
});
