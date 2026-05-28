import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import puppeteer, { type Browser, type PDFOptions } from 'puppeteer';

import {
  REPORT_PDF_PAGE_FOOTER_MARGIN_BOTTOM_CSS,
  REPORT_PDF_PAGE_HEADER_MARGIN_TOP_CSS,
  REPORT_PRINT_BODY_PDF_LAYOUT_TO_LETTER_SCALE,
  REPORT_PRINT_COVER_PDF_LAYOUT_TO_LETTER_SCALE,
  REPORT_PRINT_COVER_SHEET_WIDTH_PX,
  REPORT_PRINT_LANDSCAPE_LAYOUT_WIDTH_PX,
  REPORT_PRINT_LANDSCAPE_PDF_LAYOUT_TO_LETTER_SCALE,
  REPORT_PRINT_LAYOUT_WIDTH_PX,
} from '@corpcal/shared/reports/reportPrintHtml';

export type GenerateReportPdfOptions = {
  /** Puppeteer `footerTemplate` HTML; enables `displayHeaderFooter` and bottom margin. */
  footerTemplate: string;
  /** Optional `headerTemplate`; when set, reserves {@link REPORT_PDF_PAGE_HEADER_MARGIN_TOP_CSS} at the top. */
  headerTemplate?: string;
  /** When true, exports US Letter landscape (Planning Report). */
  landscape?: boolean;
  /** Override viewport width + scale; defaults to portrait body or landscape body. */
  render?: PdfRenderProfile;
};

type PdfRenderProfile = {
  viewportWidth: number;
  pdfScale: number;
};

const BODY_PDF_RENDER: PdfRenderProfile = {
  viewportWidth: REPORT_PRINT_LAYOUT_WIDTH_PX,
  pdfScale: REPORT_PRINT_BODY_PDF_LAYOUT_TO_LETTER_SCALE,
};

const LANDSCAPE_BODY_PDF_RENDER: PdfRenderProfile = {
  viewportWidth: REPORT_PRINT_LANDSCAPE_LAYOUT_WIDTH_PX,
  pdfScale: REPORT_PRINT_LANDSCAPE_PDF_LAYOUT_TO_LETTER_SCALE,
};

const COVER_PDF_RENDER: PdfRenderProfile = {
  viewportWidth: REPORT_PRINT_COVER_SHEET_WIDTH_PX,
  pdfScale: REPORT_PRINT_COVER_PDF_LAYOUT_TO_LETTER_SCALE,
};

/**
 * Print-aligned report PDFs: viewport matches shared layout width so HTML
 * line breaks match the in-app “PDF width” preview. `scale` shrinks that
 * layout onto US Letter without reflow.
 *
 * Cover sheets use {@link COVER_PDF_RENDER} (1024px, original cover scale);
 * report body uses {@link BODY_PDF_RENDER} (narrower layout for readable body type).
 */
const BASE_PDF_OPTIONS: Omit<PDFOptions, 'scale'> = {
  format: 'Letter',
  printBackground: true,
  preferCSSPageSize: true,
  margin: {
    top: '0',
    bottom: '0',
    left: '0',
    right: '0',
  },
};

/** Font bytes are inlined (`data:` URLs); `load` avoids `networkidle0` hangs. */
const SET_CONTENT_WAIT_UNTIL = 'load' as const;

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
   * Letter PDF for a standalone cover sheet: cover viewport/scale, top header band,
   * no footer margin. Used before merging with {@link generatePdfFromHtml}.
   */
  async generatePdfFromHtmlCover(
    html: string,
    headerTemplate: string
  ): Promise<Buffer> {
    const invisibleFooter =
      '<div style="font-size:0;margin:0;padding:0;width:0;height:0;"></div>';
    const pdfOptions: PDFOptions = {
      ...BASE_PDF_OPTIONS,
      scale: COVER_PDF_RENDER.pdfScale,
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
    return this.generatePdfWithOptions(html, pdfOptions, COVER_PDF_RENDER);
  }

  async generatePdfFromHtml(
    html: string,
    options: GenerateReportPdfOptions
  ): Promise<Buffer> {
    const headerTemplate =
      options.headerTemplate ??
      '<div style="font-size:0;margin:0;padding:0;width:0;height:0;"></div>';
    const render =
      options.render ??
      (options.landscape ? LANDSCAPE_BODY_PDF_RENDER : BODY_PDF_RENDER);
    const pdfOptions: PDFOptions = {
      ...BASE_PDF_OPTIONS,
      scale: render.pdfScale,
      landscape: options.landscape === true,
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
    return this.generatePdfWithOptions(html, pdfOptions, render);
  }

  private async generatePdfWithOptions(
    html: string,
    pdfOptions: PDFOptions,
    render: PdfRenderProfile
  ): Promise<Buffer> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();
    try {
      await page.setViewport({
        width: render.viewportWidth,
        height: 1440,
        deviceScaleFactor: 2,
      });
      await page.setContent(html, {
        waitUntil: SET_CONTENT_WAIT_UNTIL,
      });
      try {
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
