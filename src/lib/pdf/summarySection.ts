import { PDFContext, FindingStatus, severityToStatus, findingStatusLabels, findingStatusColors } from './reportTypes';
import { PhotoRecord, InspectionRecord } from '@/lib/db';
import { Language } from '@/lib/i18n';
import { drawSectionHeader, checkNewPage, addPageFooter, getRoomName, drawDivider } from './pdfUtils';
import { addPageHeaderWithTabs, checkNewPageWithHeader } from './pageHeader';

interface CategorizedFinding {
  photo: PhotoRecord;
  title: string;
  room: string;
  status: FindingStatus;
  recommendation?: string;
}

function categorizeFinding(photo: PhotoRecord, lang: Language): CategorizedFinding | null {
  const severity = photo.manualSeverity || photo.aiSeverity;
  if (!severity) return null;
  
  const title = lang === 'es'
    ? (photo.manualTitleEs || photo.aiFindingTitleEs || photo.manualTitle || photo.aiFindingTitle)
    : (photo.manualTitle || photo.aiFindingTitle || photo.manualTitleEs || photo.aiFindingTitleEs);
  
  if (!title) return null;
  
  const recommendation = lang === 'es'
    ? (photo.manualRecommendationEs || photo.aiRecommendationEs || photo.manualRecommendation || photo.aiRecommendation)
    : (photo.manualRecommendation || photo.aiRecommendation);
  
  return {
    photo,
    title,
    room: photo.room,
    status: severityToStatus(severity),
    recommendation: recommendation || undefined,
  };
}

export async function addSummarySection(
  ctx: PDFContext,
  inspection: InspectionRecord,
  photos: PhotoRecord[],
  roomOrder: string[],
  lang: Language
): Promise<void> {
  ctx.pdf.addPage();
  ctx.pageNumber++;
  ctx.yPos = ctx.margin;
  
  // Register summary section page number for clickable navigation
  ctx.sectionPageNumbers.set('summary', ctx.pageNumber);
  
  const { pdf, margin, contentWidth, pageWidth } = ctx;

  
  // Add tabbed header for Summary section
  addPageHeaderWithTabs(ctx, inspection, 'summary', lang);
  
  // Intro paragraph
  ctx.yPos += 5;
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  const introText = lang === 'es'
    ? 'Este resumen destaca las condiciones más importantes observadas durante la inspección. Consulte el informe completo para obtener detalles adicionales.'
    : 'This summary highlights the most significant conditions observed during the inspection. Please refer to the full report for additional details.';
  const introLines = pdf.splitTextToSize(introText, contentWidth);
  for (const line of introLines) {
    pdf.text(line, margin, ctx.yPos);
    ctx.yPos += 4;
  }
  ctx.yPos += 10;
  
  // SYSTEMS OVERVIEW - Show all inspected areas with their condition
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  const overviewTitle = lang === 'es' ? 'RESUMEN DE SISTEMAS INSPECCIONADOS' : 'INSPECTED SYSTEMS OVERVIEW';
  pdf.text(overviewTitle, margin, ctx.yPos);
  ctx.yPos += 8;
  
  // Group photos by room and determine overall condition for each
  const roomConditions = new Map<string, { photos: PhotoRecord[]; worstSeverity: string | null }>();
  
  for (const room of roomOrder) {
    roomConditions.set(room, { photos: [], worstSeverity: null });
  }
  
  for (const photo of photos) {
    const roomData = roomConditions.get(photo.room);
    if (roomData) {
      roomData.photos.push(photo);
      const severity = photo.manualSeverity || photo.aiSeverity;
      if (severity) {
        if (!roomData.worstSeverity || 
            (severity === 'severe') ||
            (severity === 'moderate' && roomData.worstSeverity !== 'severe')) {
          roomData.worstSeverity = severity;
        }
      }
    }
  }
  
  // Draw systems table
  const colWidths = [contentWidth * 0.5, contentWidth * 0.25, contentWidth * 0.25];
  
  // Table header
  pdf.setFillColor(241, 245, 249);
  pdf.rect(margin, ctx.yPos - 3, contentWidth, 8, 'F');
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  const systemHeader = lang === 'es' ? 'Sistema/Área' : 'System/Area';
  const conditionHeader = lang === 'es' ? 'Condición' : 'Condition';
  const itemsHeader = lang === 'es' ? 'Elementos' : 'Items';
  pdf.text(systemHeader, margin + 3, ctx.yPos);
  pdf.text(conditionHeader, margin + colWidths[0] + 3, ctx.yPos);
  pdf.text(itemsHeader, margin + colWidths[0] + colWidths[1] + 3, ctx.yPos);
  ctx.yPos += 8;
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  
  for (const [room, data] of roomConditions) {
    if (data.photos.length === 0) continue;
    
    checkNewPageWithHeader(ctx, inspection, 'summary', lang, 8);
    
    const roomName = getRoomName(room, lang, ctx.customRoomMap);
    
    // Determine condition label and color
    let conditionLabel: string;
    let conditionColor: [number, number, number];
    
    if (data.worstSeverity === 'severe') {
      conditionLabel = lang === 'es' ? 'Necesita Atención' : 'Needs Attention';
      conditionColor = [220, 38, 38]; // Red
    } else if (data.worstSeverity === 'moderate') {
      conditionLabel = lang === 'es' ? 'Marginal' : 'Marginal';
      conditionColor = [234, 88, 12]; // Orange
    } else if (data.worstSeverity === 'minor') {
      conditionLabel = lang === 'es' ? 'Mantenimiento' : 'Maintenance';
      conditionColor = [202, 138, 4]; // Yellow
    } else {
      conditionLabel = lang === 'es' ? 'Satisfactorio' : 'Satisfactory';
      conditionColor = [34, 197, 94]; // Green
    }
    
    // Room name
    pdf.setTextColor(0);
    pdf.text(roomName, margin + 3, ctx.yPos);
    
    // Condition with color
    pdf.setTextColor(...conditionColor);
    pdf.text(conditionLabel, margin + colWidths[0] + 3, ctx.yPos);
    
    // Item count
    pdf.setTextColor(0);
    pdf.text(`${data.photos.length}`, margin + colWidths[0] + colWidths[1] + 3, ctx.yPos);
    
    ctx.yPos += 6;
  }
  
  ctx.yPos += 10;
  drawDivider(ctx);
  ctx.yPos += 10;
  
  // Categorize all findings
  const categorized: Record<FindingStatus, CategorizedFinding[]> = {
    safety: [],
    repair: [],
    maintenance: [],
    monitor: [],
    satisfactory: [],
  };
  
  for (const photo of photos) {
    const finding = categorizeFinding(photo, lang);
    if (finding) {
      categorized[finding.status].push(finding);
    }
  }
  
  // KEY FINDINGS SECTION
  const safetyConcerns = categorized.safety;
  const majorDefects = categorized.repair;
  const monitorItems = [...categorized.maintenance, ...categorized.monitor];
  
  if (safetyConcerns.length > 0 || majorDefects.length > 0 || monitorItems.length > 0) {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    const keyFindingsTitle = lang === 'es' ? 'HALLAZGOS CLAVE' : 'KEY FINDINGS';
    pdf.text(keyFindingsTitle, margin, ctx.yPos);
    ctx.yPos += 10;
  }
  
  // Safety Concerns
  if (safetyConcerns.length > 0) {
    checkNewPageWithHeader(ctx, inspection, 'summary', lang, 30);
    
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(findingStatusColors.safety[0], findingStatusColors.safety[1], findingStatusColors.safety[2]);
    const safetyLabel = lang === 'es' ? 'Preocupaciones de Seguridad' : 'Safety Concerns';
    pdf.text(safetyLabel, margin, ctx.yPos);
    ctx.yPos += 7;
    pdf.setTextColor(0);
    
    for (const finding of safetyConcerns) {
      checkNewPageWithHeader(ctx, inspection, 'summary', lang, 15);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`• ${finding.title}`, margin + 3, ctx.yPos);
      ctx.yPos += 5;
      
      if (finding.recommendation) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        const recLines = pdf.splitTextToSize(finding.recommendation, contentWidth - 10);
        pdf.text(recLines[0], margin + 6, ctx.yPos);
        ctx.yPos += 5;
      }
    }
    ctx.yPos += 5;
  }
  
  // Major Defects (Repair Needed)
  if (majorDefects.length > 0) {
    checkNewPageWithHeader(ctx, inspection, 'summary', lang, 30);
    
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(findingStatusColors.repair[0], findingStatusColors.repair[1], findingStatusColors.repair[2]);
    const repairLabel = lang === 'es' ? 'Defectos Mayores' : 'Major Defects';
    pdf.text(repairLabel, margin, ctx.yPos);
    ctx.yPos += 7;
    pdf.setTextColor(0);
    
    for (const finding of majorDefects) {
      checkNewPageWithHeader(ctx, inspection, 'summary', lang, 15);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`• ${finding.title}`, margin + 3, ctx.yPos);
      ctx.yPos += 5;
      
      if (finding.recommendation) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        const recLines = pdf.splitTextToSize(finding.recommendation, contentWidth - 10);
        pdf.text(recLines[0], margin + 6, ctx.yPos);
        ctx.yPos += 5;
      }
    }
    ctx.yPos += 5;
  }
  
  // Items to Monitor / Maintenance
  if (monitorItems.length > 0) {
    checkNewPageWithHeader(ctx, inspection, 'summary', lang, 30);
    
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(findingStatusColors.maintenance[0], findingStatusColors.maintenance[1], findingStatusColors.maintenance[2]);
    const monitorLabel = lang === 'es' ? 'Elementos a Monitorear' : 'Items to Monitor';
    pdf.text(monitorLabel, margin, ctx.yPos);
    ctx.yPos += 7;
    pdf.setTextColor(0);
    
    for (const finding of monitorItems) {
      checkNewPageWithHeader(ctx, inspection, 'summary', lang, 15);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`• ${finding.title}`, margin + 3, ctx.yPos);
      ctx.yPos += 5;
      
      if (finding.recommendation) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        const recLines = pdf.splitTextToSize(finding.recommendation, contentWidth - 10);
        pdf.text(recLines[0], margin + 6, ctx.yPos);
        ctx.yPos += 5;
      }
    }
    ctx.yPos += 5;
  }
  
  // Overall assessment note
  ctx.yPos += 5;
  drawDivider(ctx);
  ctx.yPos += 5;
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  const notesTitle = lang === 'es' ? 'Evaluación General' : 'Overall Assessment';
  pdf.text(notesTitle, margin, ctx.yPos);
  ctx.yPos += 7;
  
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  
  // Professional commentary based on findings
  let commentary = '';
  if (safetyConcerns.length > 0) {
    commentary = lang === 'es'
      ? 'Se observaron varias condiciones que pueden requerir atención inmediata. Se recomienda una evaluación adicional por profesionales calificados y con licencia.'
      : 'Several conditions were observed that may require prompt attention. Further evaluation by qualified, licensed professionals is recommended.';
  } else if (majorDefects.length > 0) {
    commentary = lang === 'es'
      ? 'Se observaron condiciones que justifican una evaluación adicional antes del cierre.'
      : 'Conditions were observed that warrant further evaluation prior to closing.';
  } else {
    commentary = lang === 'es'
      ? 'La propiedad se encontró en condición general satisfactoria al momento de la inspección.'
      : 'The property was found to be in generally satisfactory condition at the time of inspection.';
  }
  
  const commentaryLines = pdf.splitTextToSize(commentary, contentWidth);
  for (const line of commentaryLines) {
    pdf.text(line, margin, ctx.yPos);
    ctx.yPos += 4;
  }
  
  addPageFooter(ctx);
}
