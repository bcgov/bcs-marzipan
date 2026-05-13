import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import puppeteer, {
  type Browser,
  type PDFOptions,
  type PuppeteerLifeCycleEvent,
} from 'puppeteer';

import {
  REPORT_LETTER_CONTENT_WIDTH_PX,
  REPORT_PDF_PAGE_FOOTER_MARGIN_BOTTOM_CSS,
  REPORT_PDF_PAGE_HEADER_MARGIN_TOP_CSS,
  REPORT_PRINT_LAYOUT_WIDTH_PX,
} from '@corpcal/shared/reports/reportPrintHtml';

/** Maps canonical layout width (1024px) onto Letter content width (816px). */
const PDF_LAYOUT_TO_LETTER_SCALE =
  REPORT_LETTER_CONTENT_WIDTH_PX / REPORT_PRINT_LAYOUT_WIDTH_PX;

export type GenerateReportPdfOptions = {
  /** Puppeteer `footerTemplate` HTML; enables `displayHeaderFooter` and bottom margin. */
  footerTemplate: string;
  /** Optional `headerTemplate`; when set, reserves {@link REPORT_PDF_PAGE_HEADER_MARGIN_TOP_CSS} at the top. */
  headerTemplate?: string;
};

/**
 * Print-aligned report PDFs: viewport matches shared layout width so HTML
 * line breaks match the in-app “PDF width” preview. `scale` shrinks that
 * layout onto US Letter without reflow.
 *
 * Page format is Letter (8.5×11in). Body margins are zero. With
 * {@link GenerateReportPdfOptions.footerTemplate}, Chromium reserves
 * {@link REPORT_PDF_PAGE_FOOTER_MARGIN_BOTTOM_CSS} at the bottom for that band.
 * With {@link GenerateReportPdfOptions.headerTemplate}, the top margin is
 * {@link REPORT_PDF_PAGE_HEADER_MARGIN_TOP_CSS}.
 * `preferCSSPageSize` respects `@page` when present; if output clips in QA,
 * revisit relative to `scale`.
 */
const BASE_PDF_OPTIONS: PDFOptions = {
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

  /**
   * Letter PDF for a standalone cover sheet: same top header band as body
   * ({@link REPORT_PDF_PAGE_HEADER_MARGIN_TOP_CSS}), no footer margin or
   * visible footer band. Used before merging with {@link generatePdfFromHtml}.
   */
  async generatePdfFromHtmlCover(
    html: string,
    headerTemplate: string
  ): Promise<Buffer> {
    const invisibleFooter =
      '<div style="font-size:0;margin:0;padding:0;width:0;height:0;"></div>';
    const pdfOptions: PDFOptions = {
      ...BASE_PDF_OPTIONS,
      displayHeaderFooter: true,
      headerTemplate,
      footerTemplate: invisibleFooter,
      margin: {
        top: REPORT_PDF_PAGE_HEADER_MARGIN_TOP_CSS,
        bottom: '0',
        left: '0',
        right: '0',
      },
    };
    return this.generatePdfWithOptions(html, pdfOptions);
  }

  async generatePdfFromHtml(
    html: string,
    options: GenerateReportPdfOptions
  ): Promise<Buffer> {
    const headerTemplate =
      options.headerTemplate ??
      '<div style="font-size:0;margin:0;padding:0;width:0;height:0;"></div>';
    const pdfOptions: PDFOptions = {
      ...BASE_PDF_OPTIONS,
      displayHeaderFooter: true,
      headerTemplate,
      footerTemplate: options.footerTemplate,
      margin: {
        top: options.headerTemplate
          ? REPORT_PDF_PAGE_HEADER_MARGIN_TOP_CSS
          : '0',
        bottom: REPORT_PDF_PAGE_FOOTER_MARGIN_BOTTOM_CSS,
        left: '0',
        right: '0',
      },
    };
    return this.generatePdfWithOptions(html, pdfOptions);
  }

  private async generatePdfWithOptions(
    html: string,
    pdfOptions: PDFOptions
  ): Promise<Buffer> {
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
      const pdf = await page.pdf(pdfOptions);
      return Buffer.from(pdf);
    } finally {
      await page.close().catch(() => undefined);
    }
  }
}
