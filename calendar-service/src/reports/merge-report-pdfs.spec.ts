import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';

import { mergePdfBuffersInOrder } from './merge-report-pdfs';

async function singleBlankPagePdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.addPage();
  return doc.save();
}

describe('mergePdfBuffersInOrder', () => {
  it('returns a clone when a single part is passed', async () => {
    const one = await singleBlankPagePdf();
    const out = await mergePdfBuffersInOrder([Buffer.from(one)]);
    const reloaded = await PDFDocument.load(out);
    expect(reloaded.getPageCount()).toBe(1);
  });

  it('concatenates multi-page PDFs in order', async () => {
    const a = await singleBlankPagePdf();
    const docB = await PDFDocument.create();
    docB.addPage();
    docB.addPage();
    const b = await docB.save();
    const out = await mergePdfBuffersInOrder([Buffer.from(a), Buffer.from(b)]);
    const merged = await PDFDocument.load(out);
    expect(merged.getPageCount()).toBe(3);
  });

  it('throws when no parts', async () => {
    await expect(mergePdfBuffersInOrder([])).rejects.toThrow(
      /at least one PDF buffer/i
    );
  });
});
