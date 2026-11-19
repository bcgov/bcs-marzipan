import { useEffect, useState } from 'react';

const REPORTS_PREVIEW_SHEET_WIDTH_KEY = 'reportsPreviewSheetWidth';

/** Show Print width on Look Ahead; preview layout hook stays active either way. */
export const LOOK_AHEAD_PRINT_WIDTH_TOGGLE_VISIBLE = false;

export type ReportPreviewSheetWidthMode = 'full' | 'print';

function readStoredPreviewSheetWidth(): ReportPreviewSheetWidthMode {
  if (typeof sessionStorage === 'undefined') return 'full';
  try {
    const v = sessionStorage.getItem(REPORTS_PREVIEW_SHEET_WIDTH_KEY);
    if (v === 'full' || v === 'print') return v;
  } catch {
    /* private mode */
  }
  return 'full';
}

export function useReportPreviewSheetWidth() {
  const [previewSheetWidthMode, setPreviewSheetWidthMode] =
    useState<ReportPreviewSheetWidthMode>(readStoredPreviewSheetWidth);

  useEffect(() => {
    try {
      sessionStorage.setItem(
        REPORTS_PREVIEW_SHEET_WIDTH_KEY,
        previewSheetWidthMode
      );
    } catch {
      /* private mode */
    }
  }, [previewSheetWidthMode]);

  return { previewSheetWidthMode, setPreviewSheetWidthMode };
}
