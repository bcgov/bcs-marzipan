import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import puppeteer, {
  type Browser,
  type PDFOptions,
  type PuppeteerLifeCycleEvent,
} from 'puppeteer';

import {
  REPORT_LETTER_CONTENT_WIDTH_PX,
  REPORT_PRINT_LAYOUT_WIDTH_PX,
} from '@corpcal/shared/reports/reportPrintHtml';

/** Maps canonical layout width (1024px) onto Letter content width (816px). */
const PDF_LAYOUT_TO_LETTER_SCALE =
  REPORT_LETTER_CONTENT_WIDTH_PX / REPORT_PRINT_LAYOUT_WIDTH_PX;

/**
 * Print-aligned report PDFs: viewport matches shared layout width so HTML
 * line breaks match the in-app “PDF width” preview. `scale` shrinks that
 * layout onto US Letter without reflow.
 *
 * Page format is Letter (8.5×11in). Margins are zero. `preferCSSPageSize`
 * respects `@page` when present; if output clips in QA, revisit relative to
 * `scale`.
 */
const DEFAULT_PDF_OPTIONS: PDFOptions = {
  format: 'Letter',
  printBackground: true,
  preferCSSPageSize: true,
  scale: PDF_LAYOUT_TO_LETTER_SCALE,
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

/** Font bytes are inlined (`data:` URLs); `load` avoids `networkidle0` hangs. */
const SET_CONTENT_WAIT_UNTIL: PuppeteerLifeCycleEvent = 'load';

@Injectable()
export class PdfGeneratorService implements OnModuleDestroy {
  private readonly logger = new Logger(PdfGeneratorService.name);

  private browserLaunch: Promise<Browser> | null = null;

  async onModuleDestroy(): Promise<void> {
    const launch = this.browserLaunch;
    this.browserLaunch = null;
    if (!launch) return;
    try {
      const browser = await launch;
      await browser.close();
    } catch {
      /* shutting down */
    }
  }

  private async getBrowser(): Promise<Browser> {
    if (!this.browserLaunch) {
      this.browserLaunch = puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    }
    try {
      return await this.browserLaunch;
    } catch (err) {
      this.browserLaunch = null;
      throw err;
    }
  }

  async generatePdfFromHtml(html: string): Promise<Buffer> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();
    try {
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
      await page.close().catch(() => undefined);
    }
  }
}
