import { jsPDF } from 'jspdf';
import { PhotoRecord, InspectionRecord, getAllCustomRooms } from '@/lib/db';
import { Language } from '@/lib/i18n';
import { getCompanyProfile, getDefaultCompanyProfile, getCompanyLogo } from '@/lib/companyProfile';
import { PDFContext, createPDFContext, addPageFooter, formatDate, checkNewPage, severityToStatus } from './index';
import { generateUpsellRecommendations } from './upsellRecommendations';

type ReportLanguage = 'en' | 'es' | 'both';

interface CategorizedFinding {
  title: string;
  recommendation: string;
  room: string;
}

interface CategorizedFindings {
  safety: CategorizedFinding[];
  repair: CategorizedFinding[];
  maintenance: CategorizedFinding[];
}

function categorizeFindings(photos: PhotoRecord[], lang: Language): CategorizedFindings {
  const findings: CategorizedFindings = {
    safety: [],
    repair: [],
    maintenance: [],
  };

  for (const photo of photos) {
    const title = lang === 'es' ? (photo.aiFindingTitleEs || photo.aiFindingTitle || '') : (photo.aiFindingTitle || '');
    const recommendation = lang === 'es' ? (photo.aiRecommendationEs || photo.aiRecommendation || '') : (photo.aiRecommendation || '');
    const room = photo.room || 'General';
    const finding: CategorizedFinding = { title, recommendation, room };

    // Skip "no issues" / satisfactory findings
    const isNoIssue = !photo.aiFindingTitle || 
      photo.aiFindingTitle === 'No Significant Issues Observed' ||
      photo.aiFindingTitle === 'No Issues Detected' ||
      photo.aiSeverity === 'minor' && photo.aiFindingTitle?.includes('Minor');

    if (isNoIssue || photo.aiSeverity === undefined) {
      continue;
    }
    
    const status = severityToStatus(photo.aiSeverity || 'minor');

    if (status === 'safety') {
      findings.safety.push(finding);
    } else if (status === 'repair') {
      findings.repair.push(finding);
    } else if (status === 'maintenance') {
      findings.maintenance.push(finding);
    } else {
      findings.maintenance.push(finding);
    }
  }

  return findings;
}

function renderAgentSummaryPage(
  ctx: PDFContext,
  inspection: InspectionRecord,
  photos: PhotoRecord[],
  lang: Language
): void {
  const { pdf, companyProfile, margin, contentWidth, pageWidth, pageHeight } = ctx;

  // Title with premium badge
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(30, 41, 59);
  const title = lang === 'es' 
    ? 'RESUMEN DE INSPECCIÓN DE PROPIEDAD' 
    : 'PROPERTY INSPECTION SUMMARY';
  pdf.text(title, pageWidth / 2, ctx.yPos, { align: 'center' });
  ctx.yPos += 6;
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100);
  const subtitle = lang === 'es' ? '(Referencia para Agente y Comprador)' : '(Agent & Buyer Reference)';
  pdf.text(subtitle, pageWidth / 2, ctx.yPos, { align: 'center' });
  pdf.setTextColor(0);
  ctx.yPos += 10;

  // Property Info Box
  pdf.setFillColor(248, 250, 252);
  pdf.setDrawColor(226, 232, 240);
  pdf.rect(margin, ctx.yPos, contentWidth, 22, 'FD');
  ctx.yPos += 6;
  
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  const propertyLabel = lang === 'es' ? 'Propiedad:' : 'Property:';
  pdf.text(propertyLabel, margin + 5, ctx.yPos);
  pdf.setFont('helvetica', 'normal');
  pdf.text(inspection.propertyAddress, margin + 35, ctx.yPos);
  ctx.yPos += 5;

  const dateLabel = lang === 'es' ? 'Fecha de Inspección:' : 'Inspection Date:';
  pdf.text(dateLabel, margin + 5, ctx.yPos);
  pdf.text(formatDate(inspection.createdAt, lang), margin + 50, ctx.yPos);
  ctx.yPos += 5;

  const inspectorLabel = lang === 'es' ? 'Inspector:' : 'Inspector:';
  const inspectorName = inspection.inspectorName || companyProfile.inspectorName || 'Inspector';
  const licenseNum = companyProfile.licenseNumber ? `, License #${companyProfile.licenseNumber}` : '';
  pdf.text(inspectorLabel, margin + 5, ctx.yPos);
  pdf.text(`${inspectorName}${licenseNum}`, margin + 30, ctx.yPos);
  ctx.yPos += 12;

  // Categorize findings
  const findings = categorizeFindings(photos, lang);

  // Helper function to draw finding category
  const drawCategory = (
    categoryTitle: string,
    colorRgb: [number, number, number],
    items: CategorizedFinding[],
    maxItems: number = 4
  ) => {
    checkNewPage(ctx, 35);
    
    // Category header with colored indicator
    pdf.setFillColor(...colorRgb);
    pdf.circle(margin + 4, ctx.yPos - 1, 3, 'F');
    
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colorRgb);
    pdf.text(categoryTitle, margin + 12, ctx.yPos);
    pdf.setTextColor(0);
    ctx.yPos += 6;

    if (items.length === 0) {
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(120);
      const noItems = lang === 'es' ? 'Sin hallazgos en esta categoría' : 'No findings in this category';
      pdf.text(noItems, margin + 8, ctx.yPos);
      pdf.setTextColor(0);
      ctx.yPos += 8;
      return;
    }

    pdf.setFontSize(9);
    const displayItems = items.slice(0, maxItems);
    
    for (const item of displayItems) {
      checkNewPage(ctx, 12);
      
      pdf.setFont('helvetica', 'normal');
      pdf.text('•', margin + 8, ctx.yPos);
      
      pdf.setFont('helvetica', 'bold');
      pdf.text(item.title, margin + 14, ctx.yPos);
      
      if (item.recommendation) {
        ctx.yPos += 4;
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(80);
        const recText = item.recommendation.length > 80 
          ? item.recommendation.substring(0, 77) + '...'
          : item.recommendation;
        pdf.text(recText, margin + 14, ctx.yPos);
        pdf.setTextColor(0);
      }
      ctx.yPos += 6;
    }

    if (items.length > maxItems) {
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(100);
      const moreText = lang === 'es' 
        ? `+ ${items.length - maxItems} hallazgo(s) adicional(es) en informe completo`
        : `+ ${items.length - maxItems} more finding(s) in full report`;
      pdf.text(moreText, margin + 14, ctx.yPos);
      pdf.setTextColor(0);
      ctx.yPos += 6;
    }
    
    ctx.yPos += 4;
  };

  // Draw categories
  const safetyConcerns = lang === 'es' ? 'PREOCUPACIONES DE SEGURIDAD' : 'SAFETY CONCERNS';
  drawCategory(safetyConcerns, [220, 38, 38], findings.safety, 3);

  const majorDefects = lang === 'es' ? 'DEFECTOS MAYORES' : 'MAJOR DEFECTS';
  drawCategory(majorDefects, [234, 88, 12], findings.repair, 3);

  const monitorItems = lang === 'es' ? 'ELEMENTOS A MONITOREAR / MANTENIMIENTO' : 'ITEMS TO MONITOR / MAINTENANCE';
  drawCategory(monitorItems, [202, 138, 4], findings.maintenance, 3);

  // UPSELL OPPORTUNITIES SECTION
  const upsells = generateUpsellRecommendations(inspection, photos, lang);
  
  if (upsells.length > 0) {
    ctx.yPos += 4;
    checkNewPage(ctx, 50);
    
    pdf.setFillColor(147, 51, 234);
    pdf.rect(margin, ctx.yPos, contentWidth, 6, 'F');
    ctx.yPos += 10;
    
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(147, 51, 234);
    const upsellTitle = lang === 'es' 
      ? 'SERVICIOS ADICIONALES RECOMENDADOS' 
      : 'RECOMMENDED ADDITIONAL SERVICES';
    pdf.text(upsellTitle, margin, ctx.yPos);
    ctx.yPos += 5;
    
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'italic');
    pdf.setTextColor(100);
    const upsellSubtitle = lang === 'es'
      ? 'Basado en los hallazgos y características de la propiedad:'
      : 'Based on findings and property characteristics:';
    pdf.text(upsellSubtitle, margin, ctx.yPos);
    pdf.setTextColor(0);
    ctx.yPos += 6;
    
    const priorityColors: Record<string, [number, number, number]> = {
      high: [220, 38, 38],
      medium: [234, 88, 12],
      low: [59, 130, 246],
    };
    
    for (const upsell of upsells) {
      checkNewPage(ctx, 14);
      
      const color = priorityColors[upsell.priority];
      
      pdf.setFillColor(...color);
      pdf.circle(margin + 4, ctx.yPos - 1, 2, 'F');
      
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(30, 41, 59);
      const serviceName = lang === 'es' ? upsell.serviceEs : upsell.service;
      pdf.text(serviceName, margin + 10, ctx.yPos);
      ctx.yPos += 4;
      
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(80);
      const reason = lang === 'es' ? upsell.reasonEs : upsell.reason;
      pdf.text(reason, margin + 10, ctx.yPos);
      pdf.setTextColor(0);
      ctx.yPos += 6;
    }
    
    ctx.yPos += 2;
  }

  // Important Notes Box
  ctx.yPos += 4;
  checkNewPage(ctx, 40);
  
  pdf.setFillColor(254, 249, 195);
  pdf.setDrawColor(202, 138, 4);
  pdf.rect(margin, ctx.yPos, contentWidth, 32, 'FD');
  ctx.yPos += 6;
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(113, 63, 18);
  const notesTitle = lang === 'es' ? 'NOTAS IMPORTANTES' : 'IMPORTANT NOTES';
  pdf.text(notesTitle, margin + 5, ctx.yPos);
  ctx.yPos += 5;
  
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  
  const notes = lang === 'es' ? [
    '• Este resumen no sustituye el informe completo de inspección.',
    '• Los hallazgos se basan en una inspección visual al momento de la evaluación.',
    '• Pueden existir problemas adicionales más allá de lo visible.',
    '• Para detalles completos, fotos y recomendaciones, consulte el informe completo.',
  ] : [
    '• This summary is not a substitute for the full inspection report.',
    '• Findings are based on a visual inspection at the time of evaluation.',
    '• Additional issues may exist beyond what was visible.',
    '• For full details, photos, and recommendations, refer to the complete inspection report.',
  ];
  
  for (const note of notes) {
    pdf.text(note, margin + 5, ctx.yPos);
    ctx.yPos += 4;
  }
  pdf.setTextColor(0);
  ctx.yPos += 8;

  // Inspector Contact Box (bottom of page)
  const contactBoxY = pageHeight - 40;
  if (ctx.yPos < contactBoxY - 10) {
    ctx.yPos = contactBoxY;
  }
  
  pdf.setFillColor(241, 245, 249);
  pdf.rect(margin, ctx.yPos, contentWidth, 25, 'F');
  ctx.yPos += 6;
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  const contactTitle = lang === 'es' ? 'CONTACTO DEL INSPECTOR' : 'INSPECTOR CONTACT';
  pdf.text(contactTitle, margin + 5, ctx.yPos);
  ctx.yPos += 5;
  
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  
  const contactLines = [];
  const inspName = inspection.inspectorName || companyProfile.inspectorName;
  if (inspName) contactLines.push(`Inspector: ${inspName}`);
  if (companyProfile.companyName) contactLines.push(`Company: ${companyProfile.companyName}`);
  
  const contactInfo = [];
  if (companyProfile.phone) contactInfo.push(companyProfile.phone);
  if (companyProfile.email) contactInfo.push(companyProfile.email);
  if (contactInfo.length > 0) contactLines.push(`Contact: ${contactInfo.join(' | ')}`);
  
  for (const line of contactLines) {
    pdf.text(line, margin + 5, ctx.yPos);
    ctx.yPos += 4;
  }

  addPageFooter(ctx);
}

/**
 * Generates a standalone 1-page Agent Summary PDF - perfect for forwarding to real estate agents.
 * This is the "Agent-Friendly Summary" that highlights key findings without the full report detail.
 */
export async function generateAgentSummaryPDF(
  inspection: InspectionRecord,
  photos: PhotoRecord[],
  reportLanguage: ReportLanguage = 'en'
): Promise<Blob> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const companyProfile = await getCompanyProfile() || getDefaultCompanyProfile();
  const companyLogo = await getCompanyLogo();
  const customRooms = await getAllCustomRooms();
  const customRoomMap = new Map(customRooms.map(r => [r.id, r]));

  const baseContext = createPDFContext(pdf);

  const generateForLanguage = (lang: Language) => {
    const ctx: PDFContext = {
      ...baseContext,
      pdf,
      companyProfile,
      companyLogo,
      customRoomMap,
      pageWidth: baseContext.pageWidth!,
      pageHeight: baseContext.pageHeight!,
      margin: baseContext.margin!,
      contentWidth: baseContext.contentWidth!,
      yPos: baseContext.yPos!,
      pageNumber: baseContext.pageNumber!,
      sectionNumber: 0,
      tocEntries: [],
      language: lang,
    };

    renderAgentSummaryPage(ctx, inspection, photos, lang);
    baseContext.pageNumber = ctx.pageNumber;
  };

  // Generate English version
  if (reportLanguage === 'en' || reportLanguage === 'both') {
    generateForLanguage('en');
  }

  // Add separator page for bilingual reports
  if (reportLanguage === 'both') {
    pdf.addPage();
    baseContext.pageNumber!++;
    
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('VERSIÓN EN ESPAÑOL', pageWidth / 2, pageHeight / 2 - 10, { align: 'center' });
    
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Spanish Version', pageWidth / 2, pageHeight / 2 + 5, { align: 'center' });
    
    pdf.setDrawColor(150);
    pdf.setLineWidth(0.5);
    pdf.line(pageWidth / 4, pageHeight / 2 + 20, pageWidth * 3 / 4, pageHeight / 2 + 20);
    
    pdf.setFontSize(8);
    pdf.setTextColor(100);
    pdf.text(`Page ${baseContext.pageNumber}`, pageWidth - 30, pageHeight - 6);
    pdf.setTextColor(0);
  }

  // Generate Spanish version
  if (reportLanguage === 'es' || reportLanguage === 'both') {
    if (reportLanguage === 'both') {
      pdf.addPage();
      baseContext.pageNumber!++;
      baseContext.yPos = 15;
    }
    generateForLanguage('es');
  }

  return pdf.output('blob');
}
