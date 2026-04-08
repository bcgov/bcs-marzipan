/**
 * Activity Summary / Executive summary are stored as stringified Tip Tap / ProseMirror
 * JSON documents, or legacy markdown/plain text during migration.
 */

/** Max persisted size for rich text fields (request validation). */
export const ACTIVITY_RICH_TEXT_MAX_BYTES = 500_000;

/** Canonical empty document JSON string (stable storage for "cleared" rich fields). */
export const EMPTY_RICH_TEXT_DOC = '{"type":"doc","content":[]}' as const;

export type TipTapJSONContent = {
  type?: string;
  text?: string;
  content?: TipTapJSONContent[];
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Parse a string as Tip Tap document JSON. Returns null if not valid `{ type: "doc", ... }`.
 */
export function tryParseTipTapDoc(value: string): TipTapJSONContent | null {
  const trimmed = value.trim();
  if (!trimmed.startsWith('{')) return null;
  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (!isRecord(parsed)) return null;
    if (parsed.type !== 'doc') return null;
    if (parsed.content !== undefined && !Array.isArray(parsed.content)) {
      return null;
    }
    return parsed as TipTapJSONContent;
  } catch {
    return null;
  }
}

function collectTextFromNode(node: TipTapJSONContent, out: string[]): void {
  if (typeof node.text === 'string' && node.text.length > 0) {
    out.push(node.text);
  }
  if (Array.isArray(node.content)) {
    for (const child of node.content) {
      if (isRecord(child) && typeof child.type === 'string') {
        collectTextFromNode(child, out);
      }
    }
  }
}

/** Plain text extraction from a parsed Tip Tap document (search, history, previews). */
export function tipTapDocToPlainText(doc: TipTapJSONContent): string {
  const parts: string[] = [];
  collectTextFromNode(doc, parts);
  return parts.join('');
}

/**
 * Strip minimal markdown constructs for search/preview when value is legacy markdown or plain text.
 */
export function markdownLikeToPlainTextFallback(value: string): string {
  let s = value.replace(/\r\n/g, '\n');
  s = s.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
  s = s.replace(/\*\*([^*]+)\*\*/g, '$1');
  s = s.replace(/__(?!_)([^_]+)__(?!_)/g, '$1');
  s = s.replace(/\*([^*\n]+)\*/g, '$1');
  s = s.replace(/(^|\s)_([^_\n]+)_(\s|$)/g, '$1$2$3');
  s = s.replace(/^#{1,6}\s+/gm, '');
  return s.replace(/\s+/g, ' ').trim();
}

/**
 * Plain text for search/history: Tip Tap JSON → walker; otherwise markdown-style fallback.
 */
export function plainTextFromActivityRichField(
  value: string | null | undefined
): string {
  if (value === null || value === undefined || value === '') return '';
  const doc = tryParseTipTapDoc(value);
  if (doc) return tipTapDocToPlainText(doc);
  return markdownLikeToPlainTextFallback(value);
}

export function isActivityRichTextStorageRefine(value: string): boolean {
  if (value === '') return true;
  const t = value.trim();
  if (t.startsWith('{')) return tryParseTipTapDoc(value) !== null;
  return true;
}

export function isActivityRichTextEffectivelyEmpty(
  value: string | null | undefined
): boolean {
  if (value === null || value === undefined || value === '') return true;
  const doc = tryParseTipTapDoc(value);
  if (doc) return tipTapDocToPlainText(doc).trim() === '';
  return plainTextFromActivityRichField(value).trim() === '';
}

/** Single-paragraph document JSON from plain text (e.g. confidential default line). */
export function tipTapDocJsonFromPlainText(text: string): string {
  return JSON.stringify({
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text }],
      },
    ],
  } satisfies TipTapJSONContent);
}
