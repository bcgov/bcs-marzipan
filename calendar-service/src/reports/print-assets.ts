import { readFileSync } from 'fs';
import { createRequire } from 'node:module';
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
 * **Single source of truth:** BC Sans `.woff2` files live under
 * `packages/shared/assets/fonts/` (same files referenced by
 * `@corpcal/shared/styles/bcsans-font-face.css` for calendar-ui).
 */

/** Resolves via an `exports` entry so this works under Node `package.json` "exports". */
function resolveSharedPackageRoot(): string {
  const bcsansCss = createRequire(__filename).resolve(
    '@corpcal/shared/styles/bcsans-font-face.css'
  );
  return path.join(path.dirname(bcsansCss), '..');
}

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

function resolveFontsDir(): string | null {
  const dir = path.join(resolveSharedPackageRoot(), 'assets', 'fonts');
  try {
    readFileSync(path.join(dir, BC_SANS_VARIANTS[0].fileName));
    return dir;
  } catch {
    return null;
  }
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

function resolveLookAheadCoverDir(): string | null {
  const dir = path.join(resolveSharedPackageRoot(), 'assets', 'reports');
  try {
    readFileSync(path.join(dir, LOOK_AHEAD_COVER_FILE_NAME));
    return dir;
  } catch {
    return null;
  }
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
  const dir = resolveLookAheadCoverDir();
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
