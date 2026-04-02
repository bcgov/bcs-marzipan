/**
 * Generic Report PDF Export
 * Exports reports to PDF with BC Government branding and tabular layout.
 */

import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import sanitizeHtml from 'sanitize-html';

import {
  getEffectiveReportDetailText,
  getEffectiveReportFields,
} from '@corpcal/shared/reports/reportTypeConfig';

import type { ReportDataResponse } from '../api/reportsApi';
import { sortLookAheadActivities } from './look-ahead-sort';

const MARGIN = 20;
const ROW_HEIGHT = 5;
const HEADER_HEIGHT = 50;
const FOOTER_HEIGHT = 20;

function stripHtml(html: string): string {
  if (!html) return '';
  const cleaned = sanitizeHtml(html, {
    allowedTags: [],
    allowedAttributes: {},
  });
  return cleaned
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .trim();
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '–';
  try {
    return format(new Date(dateStr), 'EEE MMM d');
  } catch {
    return dateStr;
  }
}

function formatTime(dateStr: string | null, timeStr: string | null): string {
  if (timeStr) {
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h ?? '0', 10);
    const minute = m ?? '00';
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour % 12 || 12;
    return `${h12}:${minute} ${ampm}`;
  }
  if (dateStr) {
    try {
      return format(new Date(dateStr), 'h:mm a');
    } catch {
      return '–';
    }
  }
  return '–';
}

function statusLabel(status: string | null | undefined): string {
  if (!status || status === 'none') return '–';
  return status === 'new' ? 'NEW' : 'CHANGED';
}

function addHeader(
  doc: jsPDF,
  reportTitle: string,
  reportDate: string,
  isFirstPage: boolean
): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text('BRITISH COLUMBIA', MARGIN, 12);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(153, 0, 0);
  const draftText = 'DRAFT AND CONFIDENTIAL';
  doc.text(draftText, pageWidth - MARGIN - doc.getTextWidth(draftText), 12);

  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(reportDate, MARGIN, 22);

  if (isFirstPage) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(reportTitle, MARGIN, 35);
  }
}

function addFooter(
  doc: jsPDF,
  pageNumber: number,
  totalPages: number,
  reportDate: string
): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const footerY = pageHeight - 10;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Report generated ${reportDate}`, MARGIN, footerY);
  const pageText = `Page ${pageNumber} of ${totalPages}`;
  doc.text(pageText, pageWidth - MARGIN - doc.getTextWidth(pageText), footerY);
}

/**
 * Export report data to a PDF file.
 */
export function exportReportToPdf(data: ReportDataResponse): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentStartY = HEADER_HEIGHT;
  const contentEndY = pageHeight - FOOTER_HEIGHT;

  const reportDate = format(new Date(), 'EEEE, MMMM d, yyyy h:mm a');
  const reportTitle = data.report.displayName;
  const effectiveFields = getEffectiveReportFields(data.report);

  addHeader(doc, reportTitle, reportDate, true);

  let totalPages = 1;
  let currentPage = 1;
  addFooter(doc, currentPage, totalPages, reportDate);

  const contentWidth = pageWidth - MARGIN * 2;
  const colWidths = [22, 20, contentWidth - 22 - 20 - 28 - 28, 28, 28];
  const headers = ['Time', 'Status', 'Activity Details', 'Ref #', 'MIN'];

  let y = contentStartY;

  for (const section of data.sections) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    if (y + 20 > contentEndY) {
      doc.addPage();
      totalPages += 1;
      currentPage += 1;
      addHeader(doc, reportTitle, reportDate, false);
      addFooter(doc, currentPage, totalPages, reportDate);
      y = contentStartY;
    }
    doc.text(section.name, MARGIN, y);
    y += ROW_HEIGHT + 4;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    let x = MARGIN;
    headers.forEach((h, i) => {
      doc.text(h, x, y);
      x += colWidths[i];
    });
    y += ROW_HEIGHT + 2;
    doc.setDrawColor(200, 200, 200);
    doc.line(MARGIN, y, pageWidth - MARGIN, y);
    y += 4;

    doc.setFont('helvetica', 'normal');

    const sorted = sortLookAheadActivities(section.activities);

    let lastDateKey: string | null = null;

    for (const activity of sorted) {
      const dateKey = activity.startDate ?? '';
      if (dateKey !== lastDateKey) {
        lastDateKey = dateKey;
        if (y + ROW_HEIGHT * 2 > contentEndY) {
          doc.addPage();
          totalPages += 1;
          currentPage += 1;
          addHeader(doc, reportTitle, reportDate, false);
          addFooter(doc, currentPage, totalPages, reportDate);
          y = contentStartY;
        }
        doc.setFont('helvetica', 'bold');
        doc.text(formatDate(activity.startDate), MARGIN, y + ROW_HEIGHT);
        y += ROW_HEIGHT;
        doc.setFont('helvetica', 'normal');
      }

      const detailText = getEffectiveReportDetailText(
        activity,
        effectiveFields
      );
      const detailsStr = stripHtml(
        [activity.title, detailText].filter(Boolean).join(' – ')
      );
      const detailsLines = doc.splitTextToSize(detailsStr, colWidths[2]);
      const lineCount = Math.min(detailsLines.length, 3);
      const rowH = (lineCount + 1) * ROW_HEIGHT + 4;

      if (y + rowH > contentEndY) {
        doc.addPage();
        totalPages += 1;
        currentPage += 1;
        addHeader(doc, reportTitle, reportDate, false);
        addFooter(doc, currentPage, totalPages, reportDate);
        y = contentStartY;
      }

      doc.text(
        formatTime(activity.startDate, activity.startTime),
        MARGIN,
        y + ROW_HEIGHT
      );
      doc.text(
        statusLabel(activity.lookAheadStatus),
        MARGIN + colWidths[0],
        y + ROW_HEIGHT
      );
      detailsLines.slice(0, 3).forEach((line: string, i: number) => {
        doc.text(
          line,
          MARGIN + colWidths[0] + colWidths[1],
          y + ROW_HEIGHT + i * ROW_HEIGHT
        );
      });
      doc.text(
        activity.displayId ?? '–',
        MARGIN + colWidths[0] + colWidths[1] + colWidths[2],
        y + ROW_HEIGHT
      );
      const minStr = activity.displayId
        ? (activity.displayId.split('-')[0] ?? '–')
        : '–';
      doc.text(
        minStr,
        MARGIN + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3],
        y + ROW_HEIGHT
      );

      y += rowH;
    }

    y += 8;
  }

  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    addFooter(doc, p, pageCount, reportDate);
  }

  const fileName = `${data.report.name}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(fileName);
}
