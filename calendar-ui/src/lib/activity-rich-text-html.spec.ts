import { describe, expect, it } from 'vitest';

import { activityStoredValueToSanitizedHtml } from './activity-rich-text-html';

describe('activityStoredValueToSanitizedHtml', () => {
  it('renders bold from JSON document', () => {
    const doc =
      '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","marks":[{"type":"bold"}],"text":"Hi"}]}]}';
    const html = activityStoredValueToSanitizedHtml(doc);
    expect(html).toContain('strong');
    expect(html).toContain('Hi');
  });

  it('parses markdown when not JSON document', () => {
    const html = activityStoredValueToSanitizedHtml('**Bold** and *italic*');
    expect(html).toContain('strong');
    expect(html).toContain('em');
  });

  it('returns empty for null or empty', () => {
    expect(activityStoredValueToSanitizedHtml('')).toBe('');
    expect(activityStoredValueToSanitizedHtml(null)).toBe('');
  });
});
