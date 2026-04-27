import { Injectable, Logger } from '@nestjs/common';
import puppeteer, {
  type PDFOptions,
  type PuppeteerLifeCycleEvent,
} from 'puppeteer';

/**
 * Rendering defaults for print-aligned report PDFs. Kept together so the
 * viewport used during measurement matches the `@page` / table column widths
 * encoded in the shared print stylesheet.
 */
const DEFAULT_PDF_OPTIONS: PDFOptions = {
  format: 'A4',
  printBackground: true,
  preferCSSPageSize: true,
  margin: {
    top: '10mm',
    bottom: '10mm',
    left: '10mm',
    right: '10mm',
  },
};

const DEFAULT_VIEWPORT = {
  width: 1024,
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
