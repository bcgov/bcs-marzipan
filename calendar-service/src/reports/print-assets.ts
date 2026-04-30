import { readFileSync } from 'fs';
import * as path from 'path';

/**
 * Print-time font resolution for server-generated PDFs.
 *
 * Puppeteer loads HTML via `setContent` without a base URL, so relative `/fonts/…`
 * references from the browser preview do not resolve. Rather than hosting the
 * fonts on the service, we embed them as `data:` URLs in an `@font-face` block
 * that is prepended to the shared print stylesheet. This keeps the PDF path
 * self-contained and identical to the in-browser render.
 *
 * **Single source of truth:** BC Sans `.woff2` files live in
 * `calendar-ui/public/fonts/` (Vite serves them at `/fonts/...` in the app).
 * PDF export does not load URLs from a separate calendar-service `fonts/`
 * directory; it embeds the same files as base64 `@font-face` for Puppeteer.
 */

interface FontVariant {
  weight: 400 | 700;
  style: 'normal' | 'italic';
  fileName: string;
}

const BC_SANS_VARIANTS: readonly FontVariant[] = [
  {
    weight: 400,
    style: 'normal',
    fileName: '2023_01_01_BCSans-Regular_2f.woff2',
  },
  {
    weight: 400,
    style: 'italic',
    fileName: '2023_01_01_BCSans-Italic_2f.woff2',
  },
  {
    weight: 700,
    style: 'normal',
    fileName: '2023_01_01_BCSans-Bold_2f.woff2',
  },
  {
    weight: 700,
    style: 'italic',
    fileName: '2023_01_01_BCSans-BoldItalic_2f.woff2',
  },
];

/**
 * Resolve the calendar-ui public fonts directory relative to `__dirname` so
 * both ts-node (src) and compiled (dist) layouts work without extra config.
 */
function resolveFontsDir(): string | null {
  const candidates = [
    path.resolve(__dirname, '../../../calendar-ui/public/fonts'),
    path.resolve(__dirname, '../../calendar-ui/public/fonts'),
    path.resolve(process.cwd(), 'calendar-ui/public/fonts'),
  ];
  for (const candidate of candidates) {
    try {
      readFileSync(path.join(candidate, BC_SANS_VARIANTS[0].fileName));
      return candidate;
    } catch {
      continue;
    }
  }
  return null;
}

let cachedFontFaceCss: string | null | undefined;

/**
 * Returns an `@font-face` CSS block with BC Sans variants embedded as base64
 * `data:` URLs. Returns `null` once and caches the miss if fonts are not
 * available in the expected locations (so PDFs still render with the system
 * fallback chain).
 */
export function buildPrintFontFaceCss(): string | null {
  if (cachedFontFaceCss !== undefined) return cachedFontFaceCss;

  const dir = resolveFontsDir();
  if (!dir) {
    cachedFontFaceCss = null;
    return null;
  }

  const blocks: string[] = [];
  for (const variant of BC_SANS_VARIANTS) {
    try {
      const buffer = readFileSync(path.join(dir, variant.fileName));
      const base64 = buffer.toString('base64');
      blocks.push(
        `@font-face{font-family:'BCSans';src:url(data:font/woff2;base64,${base64}) format('woff2');font-weight:${variant.weight};font-style:${variant.style};font-display:swap;}`
      );
    } catch {
      // Skip any missing variant — the stylesheet still loads.
    }
  }

  cachedFontFaceCss = blocks.length > 0 ? blocks.join('') : null;
  return cachedFontFaceCss;
}

const LOOK_AHEAD_COVER_FILE_NAME = '20260430_look_ahead_report_cover_50.webp';

/**
 * Resolve `calendar-ui/public/reports/` (same path strategy as
 * {@link buildPrintFontFaceCss}) so PDF export can embed the look-ahead cover
 * WebP as a `data:` URL for Puppeteer.
 */
function resolveReportsPublicDir(): string | null {
  const candidates = [
    path.resolve(__dirname, '../../../calendar-ui/public/reports'),
    path.resolve(__dirname, '../../calendar-ui/public/reports'),
    path.resolve(process.cwd(), 'calendar-ui/public/reports'),
  ];
  for (const candidate of candidates) {
    try {
      readFileSync(path.join(candidate, LOOK_AHEAD_COVER_FILE_NAME));
      return candidate;
    } catch {
      continue;
    }
  }
  return null;
}

let cachedLookAheadCoverDataUrl: string | null | undefined;

/**
 * Returns a `data:image/webp;base64,...` URL for the look-ahead report cover, or
 * `null` if the file is missing (PDF export continues without a cover).
 */
export function buildLookAheadReportCoverDataUrl(): string | null {
  if (cachedLookAheadCoverDataUrl !== undefined) {
    return cachedLookAheadCoverDataUrl;
  }
  const dir = resolveReportsPublicDir();
  if (!dir) {
    cachedLookAheadCoverDataUrl = null;
    return null;
  }
  try {
    const buffer = readFileSync(path.join(dir, LOOK_AHEAD_COVER_FILE_NAME));
    const base64 = buffer.toString('base64');
    cachedLookAheadCoverDataUrl = `data:image/webp;base64,${base64}`;
    return cachedLookAheadCoverDataUrl;
  } catch {
    cachedLookAheadCoverDataUrl = null;
    return null;
  }
}
