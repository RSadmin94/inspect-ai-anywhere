import { jsPDF } from 'jspdf';
import { PDFContext, TOCEntry } from './reportTypes';
import { Language, translations } from '@/lib/i18n';

export function createPDFContext(pdf: jsPDF): Partial<PDFContext> {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  
  return {
    pdf,
    pageWidth,
    pageHeight,
    margin,
    contentWidth: pageWidth - (margin * 2),
    yPos: margin,
    pageNumber: 1,
    sectionNumber: 0,
    tocEntries: [],
    sectionPageNumbers: new Map<string, number>(),
    tabbedPages: [],
  };
}

export function t(key: keyof typeof translations.en, lang: Language): string {
  return translations[lang][key] || String(key);
}

export function getRoomName(
  room: string, 
  lang: Language, 
  customRoomMap: Map<string, { id: string; name: string; nameEs?: string }>
): string {
  if (room in translations[lang]) {
    return translations[lang][room as keyof typeof translations.en] || room;
  }
  const customRoom = customRoomMap.get(room);
  if (customRoom) {
    return lang === 'es' && customRoom.nameEs ? customRoom.nameEs : customRoom.name;
  }
  return room;
}

export function addPageFooter(ctx: PDFContext): void {
  const { pdf, companyProfile, pageWidth, pageHeight, margin, pageNumber } = ctx;
  
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100);
  
  // Left side: company info
  pdf.text(`${companyProfile.companyName} ${companyProfile.phone || ''}`, margin, pageHeight - 10);
  pdf.text(`© ${new Date().getFullYear()} All rights reserved.`, margin, pageHeight - 6);
  
  // Right side: page number
  pdf.text(`Page ${pageNumber}`, pageWidth - margin - 15, pageHeight - 6);
  
  pdf.setTextColor(0);
}

export function checkNewPage(ctx: PDFContext, neededSpace: number = 40): boolean {
  if (ctx.yPos > ctx.pageHeight - neededSpace) {
    addPageFooter(ctx);
    ctx.pdf.addPage();
    ctx.pageNumber++;
    ctx.yPos = ctx.margin;
    return true;
  }
  return false;
}

export function addTocEntry(ctx: PDFContext, title: string, level: number = 1): void {
  ctx.tocEntries.push({
    title,
    pageNumber: ctx.pageNumber,
    level,
  });
}

export function drawSectionHeader(ctx: PDFContext, title: string, addToToc: boolean = true): void {
  checkNewPage(ctx, 30);
  
  const { pdf, margin, contentWidth } = ctx;
  
  pdf.setFillColor(240, 240, 240);
  pdf.rect(margin, ctx.yPos - 2, contentWidth, 10, 'F');
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text(title, margin + 3, ctx.yPos + 5);
  
  if (addToToc) {
    addTocEntry(ctx, title, 1);
  }
  
  ctx.yPos += 15;
}

export function drawSubsectionHeader(ctx: PDFContext, number: string, title: string): void {
  checkNewPage(ctx, 25);
  
  const { pdf, margin } = ctx;
  
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`${number} ${title}`, margin, ctx.yPos);
  ctx.yPos += 7;
}

export function drawParagraph(ctx: PDFContext, text: string, maxWidth?: number): void {
  const { pdf, margin, contentWidth } = ctx;
  const width = maxWidth || contentWidth;
  
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  const lines = pdf.splitTextToSize(text, width);
  
  for (const line of lines) {
    checkNewPage(ctx, 10);
    pdf.text(line, margin, ctx.yPos);
    ctx.yPos += 4;
  }
  ctx.yPos += 2;
}

export function drawBulletList(ctx: PDFContext, items: string[], indent: number = 3): void {
  const { pdf, margin, contentWidth } = ctx;
  
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  
  for (const item of items) {
    checkNewPage(ctx, 8);
    const lines = pdf.splitTextToSize(`• ${item}`, contentWidth - indent);
    for (const line of lines) {
      pdf.text(line, margin + indent, ctx.yPos);
      ctx.yPos += 4;
    }
    ctx.yPos += 1;
  }
}

export function drawTableRow(ctx: PDFContext, label: string, value: string, isShaded: boolean = false): void {
  const { pdf, margin, contentWidth } = ctx;
  
  if (isShaded) {
    pdf.setFillColor(248, 248, 248);
    pdf.rect(margin, ctx.yPos - 3, contentWidth, 6, 'F');
  }
  
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text(label, margin + 2, ctx.yPos);
  pdf.text(value, margin + 90, ctx.yPos);
  ctx.yPos += 6;
}

export function drawDivider(ctx: PDFContext): void {
  const { pdf, margin, pageWidth } = ctx;
  
  pdf.setDrawColor(200);
  pdf.line(margin, ctx.yPos, pageWidth - margin, ctx.yPos);
  ctx.yPos += 5;
}

export function formatDate(timestamp: number, lang: Language): string {
  return new Date(timestamp).toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatTime(timestamp: number, lang: Language): string {
  return new Date(timestamp).toLocaleTimeString(lang === 'es' ? 'es-ES' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateTime(timestamp: number, lang: Language): string {
  return new Date(timestamp).toLocaleString(lang === 'es' ? 'es-ES' : 'en-US');
}
