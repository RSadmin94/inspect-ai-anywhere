import { PDFContext, TOCEntry } from './reportTypes';
import { Language } from '@/lib/i18n';
import { addPageFooter, checkNewPage } from './pdfUtils';

export function addTableOfContentsPlaceholder(ctx: PDFContext, lang: Language): number {
  ctx.pdf.addPage();
  ctx.pageNumber++;
  ctx.yPos = ctx.margin;
  
  // Store the page number where ToC starts
  const tocPageNumber = ctx.pageNumber;
  
  // Just reserve the page for now - we'll fill it in later
  // when we know all the page numbers
  
  return tocPageNumber;
}

export function fillTableOfContents(
  ctx: PDFContext,
  tocPageNumber: number,
  entries: TOCEntry[],
  lang: Language
): void {
  const { pdf, pageWidth, pageHeight, margin, contentWidth } = ctx;
  
  // Go to the ToC page
  pdf.setPage(tocPageNumber);
  let y = margin;
  
  // Title
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  const tocTitle = lang === 'es' ? 'ÍNDICE' : 'TABLE OF CONTENTS';
  pdf.text(tocTitle, pageWidth / 2, y + 5, { align: 'center' });
  y += 20;

  // Decorative line
  pdf.setDrawColor(150);
  pdf.setLineWidth(0.3);
  pdf.line(margin + 20, y, pageWidth - margin - 20, y);
  y += 15;

  pdf.setFontSize(11);
  
  for (const entry of entries) {
    if (y > pageHeight - 30) {
      // If ToC exceeds one page, we have a problem
      // For now, just stop - in a real implementation you'd handle multi-page ToC
      break;
    }
    
    const indent = (entry.level - 1) * 10;
    
    // Section title
    pdf.setFont('helvetica', entry.level === 1 ? 'bold' : 'normal');
    pdf.text(entry.title, margin + indent, y);
    
    // Page number (right-aligned)
    const pageText = String(entry.pageNumber);
    pdf.setFont('helvetica', 'normal');
    pdf.text(pageText, pageWidth - margin - 5, y, { align: 'right' });
    
    // Dotted leader line
    const titleWidth = pdf.getTextWidth(entry.title);
    const pageNumWidth = pdf.getTextWidth(pageText);
    const startX = margin + indent + titleWidth + 5;
    const endX = pageWidth - margin - pageNumWidth - 10;
    
    if (endX > startX + 20) {
      pdf.setFontSize(8);
      let dotX = startX;
      while (dotX < endX) {
        pdf.text('.', dotX, y);
        dotX += 3;
      }
      pdf.setFontSize(11);
    }
    
    y += 8;
  }
  
  // Add footer to ToC page
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100);
  pdf.text(`Page ${tocPageNumber}`, pageWidth - margin - 15, pageHeight - 6);
  pdf.setTextColor(0);
}
