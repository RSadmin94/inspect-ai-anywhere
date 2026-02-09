import { PDFContext } from './reportTypes';
import { InspectionRecord } from '@/lib/db';
import { Language, translations } from '@/lib/i18n';
import { addPageFooter, formatDate, formatTime } from './pdfUtils';

export async function addCoverPage(
  ctx: PDFContext,
  inspection: InspectionRecord,
  lang: Language
): Promise<void> {
  const { pdf, companyProfile, companyLogo, pageWidth, pageHeight, margin } = ctx;
  
  // Company logo (centered at top)
  if (companyLogo) {
    try {
      pdf.addImage(companyLogo, 'PNG', pageWidth / 2 - 25, ctx.yPos, 50, 25);
      ctx.yPos += 35;
    } catch {
      ctx.yPos += 10;
    }
  }

  // Report title
  pdf.setFontSize(28);
  pdf.setFont('helvetica', 'bold');
  const reportTitle = lang === 'es' 
    ? 'INFORME DE INSPECCIÓN DE PROPIEDAD' 
    : 'PROPERTY INSPECTION REPORT';
  pdf.text(reportTitle, pageWidth / 2, ctx.yPos, { align: 'center' });
  ctx.yPos += 20;

  // Decorative line
  pdf.setDrawColor(100);
  pdf.setLineWidth(0.5);
  pdf.line(margin + 30, ctx.yPos, pageWidth - margin - 30, ctx.yPos);
  ctx.yPos += 15;

  // Property Address (prominent)
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text(inspection.propertyAddress, pageWidth / 2, ctx.yPos, { align: 'center' });
  ctx.yPos += 12;

  // Date and Time
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  const dateStr = formatDate(inspection.createdAt, lang);
  const timeStr = formatTime(inspection.createdAt, lang);
  const dateTimeLabel = lang === 'es' ? 'Fecha y Hora de Inspección' : 'Inspection Date & Time';
  pdf.text(`${dateTimeLabel}: ${dateStr} at ${timeStr}`, pageWidth / 2, ctx.yPos, { align: 'center' });
  ctx.yPos += 15;

  // Property Photo Placeholder
  const photoBoxWidth = 100;
  const photoBoxHeight = 70;
  const photoBoxX = (pageWidth - photoBoxWidth) / 2;
  
  // Draw placeholder box with light gray background
  pdf.setFillColor(245, 245, 245);
  pdf.setDrawColor(180);
  pdf.setLineWidth(0.5);
  pdf.rect(photoBoxX, ctx.yPos, photoBoxWidth, photoBoxHeight, 'FD');
  
  // Add placeholder text
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(150);
  const photoLabel = lang === 'es' ? 'Foto de la Propiedad' : 'Property Photo';
  pdf.text(photoLabel, pageWidth / 2, ctx.yPos + photoBoxHeight / 2 - 5, { align: 'center' });
  
  // Small icon hint
  pdf.setFontSize(24);
  pdf.text('🏠', pageWidth / 2, ctx.yPos + photoBoxHeight / 2 + 10, { align: 'center' });
  pdf.setTextColor(0);
  
  ctx.yPos += photoBoxHeight + 10;

  // Client Information Box
  pdf.setFillColor(248, 248, 248);
  pdf.rect(margin + 20, ctx.yPos, pageWidth - margin * 2 - 40, 25, 'F');
  ctx.yPos += 8;
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  const preparedFor = lang === 'es' ? 'PREPARADO PARA' : 'PREPARED FOR';
  pdf.text(preparedFor, pageWidth / 2, ctx.yPos, { align: 'center' });
  ctx.yPos += 7;
  
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'normal');
  pdf.text(inspection.clientName || 'Client', pageWidth / 2, ctx.yPos, { align: 'center' });
  ctx.yPos += 25;

  // Inspector Information Section
  ctx.yPos += 10;
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  const inspectorLabel = lang === 'es' ? 'INSPECTOR' : 'INSPECTOR';
  pdf.text(inspectorLabel, pageWidth / 2, ctx.yPos, { align: 'center' });
  ctx.yPos += 8;

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  const inspectorName = inspection.inspectorName || companyProfile.inspectorName || 'Inspector';
  pdf.text(inspectorName, pageWidth / 2, ctx.yPos, { align: 'center' });
  ctx.yPos += 6;

  // License Number
  if (companyProfile.licenseNumber) {
    pdf.setFontSize(10);
    const licenseLabel = lang === 'es' ? 'Licencia #' : 'License #';
    pdf.text(`${licenseLabel}: ${companyProfile.licenseNumber}`, pageWidth / 2, ctx.yPos, { align: 'center' });
    ctx.yPos += 6;
  }

  // Certifications
  if (companyProfile.certifications && companyProfile.certifications.length > 0) {
    pdf.setFontSize(9);
    pdf.setTextColor(80);
    pdf.text(companyProfile.certifications.slice(0, 3).join(' | '), pageWidth / 2, ctx.yPos, { align: 'center' });
    pdf.setTextColor(0);
    ctx.yPos += 8;
  }

  // Company name and tagline
  ctx.yPos += 10;
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text(companyProfile.companyName, pageWidth / 2, ctx.yPos, { align: 'center' });
  ctx.yPos += 7;

  if (companyProfile.tagline) {
    const tagline = lang === 'es' && companyProfile.taglineEs 
      ? companyProfile.taglineEs 
      : companyProfile.tagline;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'italic');
    pdf.text(tagline, pageWidth / 2, ctx.yPos, { align: 'center' });
    ctx.yPos += 8;
  }

  // Digital Signature Area
  ctx.yPos = pageHeight - 85;
  pdf.setDrawColor(150);
  pdf.setLineWidth(0.3);
  
  // Signature line
  const sigLineWidth = 70;
  const sigStartX = pageWidth / 2 - sigLineWidth / 2;
  pdf.line(sigStartX, ctx.yPos, sigStartX + sigLineWidth, ctx.yPos);
  ctx.yPos += 5;
  
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  const signatureLabel = lang === 'es' ? 'Firma del Inspector' : 'Inspector Signature';
  pdf.text(signatureLabel, pageWidth / 2, ctx.yPos, { align: 'center' });
  ctx.yPos += 15;

  // Company Contact Info (bottom of cover page)
  pdf.setFontSize(9);
  pdf.setTextColor(80);
  
  const confidentialText = lang === 'es' ? 'Confidencial y Propietario' : 'Confidential and Proprietary';
  pdf.text(confidentialText, pageWidth / 2, ctx.yPos, { align: 'center' });
  ctx.yPos += 5;

  if (companyProfile.address) {
    pdf.text(companyProfile.address, pageWidth / 2, ctx.yPos, { align: 'center' });
    ctx.yPos += 4;
  }
  
  if (companyProfile.city && companyProfile.state) {
    pdf.text(`${companyProfile.city}, ${companyProfile.state} ${companyProfile.zip || ''}`, pageWidth / 2, ctx.yPos, { align: 'center' });
    ctx.yPos += 4;
  }

  const contactParts = [];
  if (companyProfile.phone) contactParts.push(companyProfile.phone);
  if (companyProfile.email) contactParts.push(companyProfile.email);
  if (contactParts.length > 0) {
    pdf.text(contactParts.join(' | '), pageWidth / 2, ctx.yPos, { align: 'center' });
    ctx.yPos += 4;
  }

  if (companyProfile.website) {
    pdf.text(companyProfile.website, pageWidth / 2, ctx.yPos, { align: 'center' });
  }

  pdf.setTextColor(0);
  addPageFooter(ctx);
}
