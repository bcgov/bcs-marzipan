import type { ActivityFormData } from '@corpcal/shared/schemas';
import {
  EMPTY_RICH_TEXT_DOC,
  isActivityRichTextEffectivelyEmpty,
  tryParseTipTapDoc,
} from '@corpcal/shared/utils';
import { markdownManagerForRichText } from '@/lib/activity-rich-text-extensions';

let markdownManager: ReturnType<typeof markdownManagerForRichText> | null =
  null;

function getMarkdownManager(): ReturnType<typeof markdownManagerForRichText> {
  if (!markdownManager) {
    markdownManager = markdownManagerForRichText();
  }
  return markdownManager;
}

/**
 * Maps API/stored rich text (TipTap JSON string, legacy markdown, or plain text)
 * to the canonical JSON string the TipTap editor emits via `JSON.stringify(editor.getJSON())`.
 * Without this, RHF sees plain text defaults vs JSON current values and marks fields dirty
 * when the editor syncs (e.g. read-only / lock transitions).
 */
export function normalizeActivityRichTextFormValue(
  value: string | undefined | null
): string | undefined {
  if (value == null || value === '') {
    return undefined;
  }
  if (isActivityRichTextEffectivelyEmpty(value)) {
    return undefined;
  }
  const asDoc = tryParseTipTapDoc(value);
  if (asDoc) {
    return JSON.stringify(asDoc);
  }
  try {
    const doc = getMarkdownManager().parse(value);
    return JSON.stringify(doc);
  } catch {
    return value;
  }
}

/** Stable empty/non-empty JSON string for RHF storage and TipTap onChange. */
export function coalesceRichTextFormStorageValue(
  value: string | undefined | null
): string {
  return normalizeActivityRichTextFormValue(value) ?? EMPTY_RICH_TEXT_DOC;
}

/** Normalizes summary, significance, and executive summary for edit-form hydration. */
export function normalizeActivityRichTextFormFields(
  data: ActivityFormData
): ActivityFormData {
  const summaryNorm = normalizeActivityRichTextFormValue(data.summary);
  const significanceNorm = normalizeActivityRichTextFormValue(
    data.significance
  );
  const executiveSummaryNorm = normalizeActivityRichTextFormValue(
    data.executiveSummary
  );
  return {
    ...data,
    summary: summaryNorm ?? EMPTY_RICH_TEXT_DOC,
    significance: significanceNorm ?? EMPTY_RICH_TEXT_DOC,
    executiveSummary: executiveSummaryNorm ?? EMPTY_RICH_TEXT_DOC,
  };
}
