import { PDFContext } from './reportTypes';
import { InspectionRecord } from '@/lib/db';
import { Language } from '@/lib/i18n';
import { addPageFooter, formatDate, formatTime } from './pdfUtils';

export async function addCoverPage(
  ctx: PDFContext,
  inspection: InspectionRecord,
  lang: Language
): Promise<void> {
  const { pdf, companyProfile, companyLogo, pageWidth, pageHeight, margin } = ctx;
  const centerX = pageWidth / 2;
  const contentWidth = pageWidth - margin * 2;

  // ── Company Logo (centered, top) ──
  let yPos = margin + 10;

  if (companyLogo) {
    try {
      const logoW = 45;
      const logoH = 22;
      pdf.addImage(companyLogo, 'PNG', centerX - logoW / 2, yPos, logoW, logoH);
      yPos += logoH + 12;
    } catch {
      yPos += 8;
    }
  } else {
    yPos += 5;
  }

  // ── Report Title ──
  pdf.setFontSize(26);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(30, 30, 30);
  const reportTitle = lang === 'es'
    ? 'INFORME DE INSPECCIÓN DE PROPIEDAD'
    : 'PROPERTY INSPECTION REPORT';
  pdf.text(reportTitle, centerX, yPos, { align: 'center' });
  yPos += 10;

  // Accent line
  const lineInset = 40;
  pdf.setDrawColor(60, 60, 60);
  pdf.setLineWidth(0.8);
  pdf.line(margin + lineInset, yPos, pageWidth - margin - lineInset, yPos);
  yPos += 18;

  // ── Property Address ──
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0);
  pdf.text(inspection.propertyAddress, centerX, yPos, { align: 'center' });
  yPos += 10;

  // Date & Time
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(60);
  const dateStr = formatDate(inspection.createdAt, lang);
  const timeStr = formatTime(inspection.createdAt, lang);
  const dateTimeLabel = lang === 'es' ? 'Fecha de Inspección' : 'Inspection Date';
  pdf.text(`${dateTimeLabel}: ${dateStr}  •  ${timeStr}`, centerX, yPos, { align: 'center' });
  pdf.setTextColor(0);
  yPos += 20;

  // ── Property Photo Placeholder ──
  const photoW = 100;
  const photoH = 65;
  const photoX = centerX - photoW / 2;

  pdf.setFillColor(242, 242, 242);
  pdf.setDrawColor(200);
  pdf.setLineWidth(0.4);
  pdf.roundedRect(photoX, yPos, photoW, photoH, 2, 2, 'FD');

  // Placeholder icon (simple house shape with lines)
  const iconCX = centerX;
  const iconCY = yPos + photoH / 2 - 4;
  pdf.setDrawColor(180);
  pdf.setLineWidth(0.6);
  // Roof triangle
  pdf.line(iconCX - 10, iconCY, iconCX, iconCY - 8);
  pdf.line(iconCX, iconCY - 8, iconCX + 10, iconCY);
  // Walls
  pdf.line(iconCX - 8, iconCY, iconCX - 8, iconCY + 10);
  pdf.line(iconCX + 8, iconCY, iconCX + 8, iconCY + 10);
  pdf.line(iconCX - 8, iconCY + 10, iconCX + 8, iconCY + 10);
  // Door
  pdf.line(iconCX - 2, iconCY + 10, iconCX - 2, iconCY + 4);
  pdf.line(iconCX + 2, iconCY + 10, iconCX + 2, iconCY + 4);
  pdf.line(iconCX - 2, iconCY + 4, iconCX + 2, iconCY + 4);

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(150);
  const photoLabel = lang === 'es' ? 'Foto de la Propiedad' : 'Property Photo';
  pdf.text(photoLabel, centerX, yPos + photoH - 8, { align: 'center' });
  pdf.setTextColor(0);

  yPos += photoH + 20;

  // ── Prepared For ──
  const clientBoxH = 28;
  const clientBoxInset = 25;
  pdf.setFillColor(247, 247, 247);
  pdf.roundedRect(margin + clientBoxInset, yPos, contentWidth - clientBoxInset * 2, clientBoxH, 2, 2, 'F');

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(100);
  const preparedFor = lang === 'es' ? 'PREPARADO PARA' : 'PREPARED FOR';
  pdf.text(preparedFor, centerX, yPos + 10, { align: 'center' });

  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(0);
  pdf.text(inspection.clientName || 'Client', centerX, yPos + 21, { align: 'center' });

  yPos += clientBoxH + 18;

  // ── Inspector Section ──
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(100);
  const inspectorLabel = lang === 'es' ? 'INSPECTOR' : 'INSPECTOR';
  pdf.text(inspectorLabel, centerX, yPos, { align: 'center' });
  yPos += 8;

  pdf.setFontSize(13);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(0);
  const inspectorName = inspection.inspectorName || companyProfile.inspectorName || 'Inspector';
  pdf.text(inspectorName, centerX, yPos, { align: 'center' });
  yPos += 7;

  if (companyProfile.licenseNumber) {
    pdf.setFontSize(10);
    pdf.setTextColor(80);
    const licenseLabel = lang === 'es' ? 'Licencia #' : 'License #';
    pdf.text(`${licenseLabel}: ${companyProfile.licenseNumber}`, centerX, yPos, { align: 'center' });
    yPos += 6;
  }

  if (companyProfile.certifications && companyProfile.certifications.length > 0) {
    pdf.setFontSize(9);
    pdf.setTextColor(100);
    pdf.text(companyProfile.certifications.slice(0, 3).join('  •  '), centerX, yPos, { align: 'center' });
    yPos += 7;
  }

  pdf.setTextColor(0);
  yPos += 10;

  // ── Company Name & Tagline ──
  pdf.setFontSize(15);
  pdf.setFont('helvetica', 'bold');
  pdf.text(companyProfile.companyName, centerX, yPos, { align: 'center' });
  yPos += 8;

  if (companyProfile.tagline) {
    const tagline = lang === 'es' && companyProfile.taglineEs
      ? companyProfile.taglineEs
      : companyProfile.tagline;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'italic');
    pdf.setTextColor(80);
    pdf.text(tagline, centerX, yPos, { align: 'center' });
    pdf.setTextColor(0);
  }

  // ── Bottom Section (anchored to page bottom) ──

  // Signature line
  let bottomY = pageHeight - 75;
  const sigW = 65;
  pdf.setDrawColor(160);
  pdf.setLineWidth(0.3);
  pdf.line(centerX - sigW / 2, bottomY, centerX + sigW / 2, bottomY);
  bottomY += 5;

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100);
  const signatureLabel = lang === 'es' ? 'Firma del Inspector' : 'Inspector Signature';
  pdf.text(signatureLabel, centerX, bottomY, { align: 'center' });
  bottomY += 14;

  // Confidential notice
  pdf.setFontSize(8);
  pdf.setTextColor(120);
  const confidentialText = lang === 'es' ? 'Confidencial y Propietario' : 'Confidential and Proprietary';
  pdf.text(confidentialText, centerX, bottomY, { align: 'center' });
  bottomY += 6;

  // Company contact info
  const contactLines: string[] = [];
  if (companyProfile.address) contactLines.push(companyProfile.address);
  if (companyProfile.city && companyProfile.state) {
    contactLines.push(`${companyProfile.city}, ${companyProfile.state} ${companyProfile.zip || ''}`);
  }
  const contactParts: string[] = [];
  if (companyProfile.phone) contactParts.push(companyProfile.phone);
  if (companyProfile.email) contactParts.push(companyProfile.email);
  if (contactParts.length > 0) contactLines.push(contactParts.join('  •  '));
  if (companyProfile.website) contactLines.push(companyProfile.website);

  pdf.setFontSize(8);
  pdf.setTextColor(100);
  for (const line of contactLines) {
    pdf.text(line, centerX, bottomY, { align: 'center' });
    bottomY += 4;
  }

  pdf.setTextColor(0);
  ctx.yPos = bottomY;
  addPageFooter(ctx);
}
