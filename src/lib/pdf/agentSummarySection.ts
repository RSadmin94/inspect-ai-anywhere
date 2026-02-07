import { PDFContext, FindingStatus, severityToStatus, findingStatusLabels } from './reportTypes';
import { PhotoRecord, InspectionRecord } from '@/lib/db';
import { Language } from '@/lib/i18n';
import { CompanyProfile } from '@/lib/companyProfile';
import { checkNewPage, addPageFooter, formatDate, drawDivider } from './pdfUtils';
import { generateUpsellRecommendations, UpsellRecommendation, getUpsellLabel } from './upsellRecommendations';

interface CategorizedFinding {
  title: string;
  recommendation: string;
  room: string;
}

interface CategorizedFindings {
  safety: CategorizedFinding[];
  repair: CategorizedFinding[];
  maintenance: CategorizedFinding[];
  satisfactory: CategorizedFinding[];
}

function categorizeFindings(photos: PhotoRecord[], lang: Language): CategorizedFindings {
  const findings: CategorizedFindings = {
    safety: [],
    repair: [],
    maintenance: [],
    satisfactory: [],
  };

  for (const photo of photos) {
    const title = lang === 'es' ? (photo.aiFindingTitleEs || photo.aiFindingTitle || '') : (photo.aiFindingTitle || '');
    const recommendation = lang === 'es' ? (photo.aiRecommendationEs || photo.aiRecommendation || '') : (photo.aiRecommendation || '');
    const room = photo.room || 'General';
    const finding: CategorizedFinding = { title, recommendation, room };

    // Check if this is a "no issues" / satisfactory finding
    const isNoIssue = !photo.aiFindingTitle || 
      photo.aiFindingTitle === 'No Significant Issues Observed' ||
      photo.aiFindingTitle === 'No Issues Detected' ||
      photo.aiSeverity === 'minor' && photo.aiFindingTitle?.includes('Minor');

    if (isNoIssue || photo.aiSeverity === undefined) {
      findings.satisfactory.push({ title: title || room, recommendation: lang === 'es' ? 'Sin problemas significativos observados' : 'No significant issues observed', room });
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
      // monitor status goes to maintenance
      findings.maintenance.push(finding);
    }
  }

  return findings;
}

export function addAgentSummarySection(
  ctx: PDFContext,
  inspection: InspectionRecord,
  photos: PhotoRecord[],
  lang: Language
): void {
  ctx.pdf.addPage();
  ctx.pageNumber++;
  ctx.yPos = ctx.margin;
  
  const { pdf, companyProfile, margin, contentWidth, pageWidth, pageHeight } = ctx;
  
  // Register TOC entry
  const sectionTitle = lang === 'es' 
    ? 'RESUMEN PARA AGENTES' 
    : 'AGENT-FRIENDLY SUMMARY';
  ctx.tocEntries.push({
    title: sectionTitle,
    pageNumber: ctx.pageNumber,
    level: 1,
  });

  // Header with accent bar
  pdf.setFillColor(59, 130, 246); // Blue accent
  pdf.rect(margin, ctx.yPos, contentWidth, 8, 'F');
  ctx.yPos += 12;

  // Title
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
    symbol: string,
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
      
      // Bullet point
      pdf.setFont('helvetica', 'normal');
      pdf.text('•', margin + 8, ctx.yPos);
      
      // Title and room
      pdf.setFont('helvetica', 'bold');
      const titleText = `${item.title}`;
      pdf.text(titleText, margin + 14, ctx.yPos);
      
      // Recommendation on next line
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

  // Draw four categories
  const safetyConcerns = lang === 'es' ? 'PREOCUPACIONES DE SEGURIDAD' : 'SAFETY CONCERNS';
  
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(80);
  drawCategory(safetyConcerns, [220, 38, 38], '', findings.safety, 3);

  const majorDefects = lang === 'es' ? 'DEFECTOS MAYORES' : 'MAJOR DEFECTS';
  drawCategory(majorDefects, [234, 88, 12], '', findings.repair, 3);

  const monitorItems = lang === 'es' ? 'ELEMENTOS A MONITOREAR / MANTENIMIENTO' : 'ITEMS TO MONITOR / MAINTENANCE';
  drawCategory(monitorItems, [202, 138, 4], '', findings.maintenance, 3);

  const satisfactoryItems = lang === 'es' ? 'SATISFACTORIO' : 'SATISFACTORY';
  drawCategory(satisfactoryItems, [34, 197, 94], '', findings.satisfactory, 3);

  // UPSELL OPPORTUNITIES SECTION
  const upsells = generateUpsellRecommendations(inspection, photos, lang);
  
  if (upsells.length > 0) {
    ctx.yPos += 4;
    checkNewPage(ctx, 50);
    
    // Section header
    pdf.setFillColor(147, 51, 234); // Purple accent
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
    
    // Priority colors
    const priorityColors: Record<string, [number, number, number]> = {
      high: [220, 38, 38],     // Red
      medium: [234, 88, 12],   // Orange
      low: [59, 130, 246],     // Blue
    };
    
    for (const upsell of upsells) {
      checkNewPage(ctx, 14);
      
      const color = priorityColors[upsell.priority];
      
      // Priority indicator dot (colored circle instead of emoji)
      pdf.setFillColor(...color);
      pdf.circle(margin + 4, ctx.yPos - 1, 2, 'F');
      
      // Service name (no emoji - jsPDF doesn't support them)
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(30, 41, 59);
      const serviceName = lang === 'es' ? upsell.serviceEs : upsell.service;
      pdf.text(serviceName, margin + 10, ctx.yPos);
      ctx.yPos += 4;
      
      // Reason
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
  
  pdf.setFillColor(254, 249, 195); // Light yellow
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
