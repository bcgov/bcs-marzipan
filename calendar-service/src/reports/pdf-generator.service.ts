import { Injectable, Logger } from '@nestjs/common';
import puppeteer, {
  type PDFOptions,
  type PuppeteerLifeCycleEvent,
} from 'puppeteer';

import { REPORT_PRINT_LAYOUT_WIDTH_PX } from '@corpcal/shared/reports/reportPrintHtml';

/**
 * Rendering defaults for print-aligned report PDFs. Kept together so the
 * viewport and PDF content box both match the shared 1024px print layout
 * (`REPORT_PRINT_SHEET_CONTENT_MAX_WIDTH_CSS`), matching the in-app "PDF width"
 * preview. Without this, US Letter + margins yields a ~740px content width so
 * `min(100%, 1024px)` resolves to 100% of a narrow box — not 1024px — and
 * columns wrap more than in the preview.
 *
 * Page width is 1024 CSS px at 96px/in; height matches Letter (11in) for
 * familiar page breaks. Margins are zero so `.corpcal-print-root` is full bleed
 * to the page edge, like the preview container.
 */
const DEFAULT_PDF_OPTIONS: PDFOptions = {
  printBackground: true,
  preferCSSPageSize: false,
  width: `${REPORT_PRINT_LAYOUT_WIDTH_PX / 96}in`,
  height: '11in',
  margin: {
    top: '0',
    bottom: '0',
    left: '0',
    right: '0',
  },
};

const DEFAULT_VIEWPORT = {
  width: REPORT_PRINT_LAYOUT_WIDTH_PX,
  height: 1440,
  deviceScaleFactor: 2,
} as const;

const SET_CONTENT_WAIT_UNTIL: PuppeteerLifeCycleEvent = 'networkidle0';

@Injectable()
export class PdfGeneratorService {
  private readonly logger = new Logger(PdfGeneratorService.name);

  async generatePdfFromHtml(html: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setViewport(DEFAULT_VIEWPORT);
      await page.setContent(html, {
        waitUntil: SET_CONTENT_WAIT_UNTIL,
      });
      try {
        // `document.fonts.ready` blocks until embedded `@font-face` entries
        // have loaded — required when font bytes are inlined as `data:` URLs.
        // Evaluated as a string so the service-side TS lib (no DOM) compiles.
        await page.evaluate(
          'document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()'
        );
      } catch (err) {
        this.logger.warn(
          `document.fonts.ready did not resolve: ${String(err)}. Continuing.`
        );
      }
      const pdf = await page.pdf(DEFAULT_PDF_OPTIONS);
      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }
}
