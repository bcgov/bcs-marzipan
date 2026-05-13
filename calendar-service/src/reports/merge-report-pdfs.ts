import { PDFDocument } from 'pdf-lib';

/** Concatenate one or more PDF byte sequences in order (e.g. cover + body). */
export async function mergePdfBuffersInOrder(
  parts: ReadonlyArray<Buffer | Uint8Array>
): Promise<Buffer> {
  if (parts.length === 0) {
    throw new Error('mergePdfBuffersInOrder requires at least one PDF buffer.');
  }

  if (parts.length === 1) {
    return Buffer.from(parts[0]);
  }

  const mergedPdf = await PDFDocument.create();

  for (const part of parts) {
    const src = await PDFDocument.load(part);
    const copied = await mergedPdf.copyPages(src, src.getPageIndices());
    copied.forEach((page) => {
      mergedPdf.addPage(page);
    });
  }

  const pdfBytes = await mergedPdf.save();
  return Buffer.from(pdfBytes);
}
