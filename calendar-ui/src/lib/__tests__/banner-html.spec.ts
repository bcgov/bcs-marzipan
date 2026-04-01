import { describe, expect, it } from 'vitest';

import { sanitizeBannerHtml } from '../banner-html';

describe('sanitizeBannerHtml', () => {
  it('preserves class attributes on allowed tags and strips unsafe attributes', () => {
    const input = `<div class="foo bar"><a href="/test" onclick="alert(1)" class="link">Click</a><svg class="icon"><path d="M0 0"/></svg></div>`;
    const out = sanitizeBannerHtml(input);

    // class on div should be preserved
    expect(out).toContain('class="foo bar"');
    // onclick should be removed from anchor
    expect(out).not.toContain('onclick="alert(1)"');
    // anchor should retain href and class
    expect(out).toContain('href="/test"');
    expect(out).toContain('class="link"');
    // svg/path attributes should be preserved
    expect(out).toContain('<svg');
    expect(out).toContain('<path');
    // transformTags should add rel and target
    expect(out).toContain('rel="noopener noreferrer"');
    expect(out).toContain('target="_blank"');
  });

  it('removes disallowed tags and attributes', () => {
    const input = `<script>alert('x')</script><div style="color:red">Hello</div>`;
    const out = sanitizeBannerHtml(input);
    expect(out).not.toContain('<script>');
    // style attribute must be removed
    expect(out).not.toContain('style="color:red"');
    expect(out).toContain('Hello');
  });
});
