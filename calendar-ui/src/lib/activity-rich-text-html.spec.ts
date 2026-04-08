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

  it('renders bullet list from JSON document', () => {
    const doc =
      '{"type":"doc","content":[{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"One"}]}]}]}]}';
    const html = activityStoredValueToSanitizedHtml(doc);
    expect(html).toContain('ul');
    expect(html).toContain('li');
    expect(html).toContain('One');
  });

  it('preserves blank lines between paragraphs via br in empty p', () => {
    const doc =
      '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"A"}]},{"type":"paragraph"},{"type":"paragraph","content":[{"type":"text","text":"B"}]}]}';
    const html = activityStoredValueToSanitizedHtml(doc);
    expect(html).toMatch(/<p>A<\/p><p><br\s*\/?><\/p><p>B<\/p>/);
  });

  it('keeps ordered list marker and item text in one li block (no stray empty p between)', () => {
    const doc =
      '{"type":"doc","content":[{"type":"orderedList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"one"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"two"}]}]}]}]}';
    const html = activityStoredValueToSanitizedHtml(doc);
    expect(html).toContain('<ol>');
    expect(html).toContain('<li><p>one</p></li>');
    expect(html).toContain('<li><p>two</p></li>');
    expect(html).not.toMatch(/<\/li>\s*<p><br/);
  });

  it('preserves blank line between list and following paragraph in HTML', () => {
    const doc =
      '{"type":"doc","content":[{"type":"orderedList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"x"}]}]}]},{"type":"paragraph"},{"type":"paragraph","content":[{"type":"text","text":"After gap"}]}]}';
    const html = activityStoredValueToSanitizedHtml(doc);
    expect(html).toContain('</ol>');
    expect(html).toMatch(/<\/ol><p><br\s*\/?><\/p><p>After gap<\/p>/);
  });

  it('legacy markdown double newline becomes separate paragraphs', () => {
    const html = activityStoredValueToSanitizedHtml(
      'First para\n\nSecond para'
    );
    expect(html).toMatch(/<p>First para<\/p><p>Second para<\/p>/);
  });

  it('renders hard break inside a paragraph', () => {
    const doc =
      '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Line1"},{"type":"hardBreak"},{"type":"text","text":"Line2"}]}]}';
    const html = activityStoredValueToSanitizedHtml(doc);
    expect(html).toMatch(/<p>Line1<br\s*\/?>Line2<\/p>/);
  });
});
