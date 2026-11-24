/**
 * Shared title row styling for {@link PageHeader}, Look Ahead, and report preview
 * dialogs so headings and inline date controls stay the same size and alignment.
 */

/** Primary page heading (e.g. Look Ahead, report dialog title). */
export const PAGE_PRIMARY_TITLE_CLASS = 'text-2xl font-semibold text-slate-900';

/** Heading + inline addon (date picker); vertically centers controls with the title. */
export const PAGE_TITLE_ADDON_ROW_CLASS =
  'flex min-w-0 flex-wrap items-center gap-3';

/**
 * Overrides default {@link DialogTitle} padding/leading so it matches {@link PAGE_PRIMARY_TITLE_CLASS}.
 */
export const DIALOG_TITLE_CHROME_RESET_CLASS =
  'pb-0 leading-normal tracking-normal';
