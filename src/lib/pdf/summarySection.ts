import { PDFContext, FindingStatus, severityToStatus, findingStatusLabels, findingStatusColors } from './reportTypes';
import { PhotoRecord, InspectionRecord } from '@/lib/db';
import { Language } from '@/lib/i18n';
import { drawSectionHeader, checkNewPage, addPageFooter, getRoomName, drawDivider } from './pdfUtils';

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
  
  const { pdf, margin, contentWidth, pageWidth } = ctx;
  
  // Section title
  const summaryTitle = lang === 'es' ? 'RESUMEN DE INSPECCIÓN' : 'INSPECTION SUMMARY';
  drawSectionHeader(ctx, summaryTitle);
  
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
  
  // Safety Concerns
  const safetyConcerns = categorized.safety;
  if (safetyConcerns.length > 0) {
    checkNewPage(ctx, 30);
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(findingStatusColors.safety[0], findingStatusColors.safety[1], findingStatusColors.safety[2]);
    const safetyLabel = lang === 'es' ? 'PREOCUPACIONES DE SEGURIDAD' : 'SAFETY CONCERNS';
    pdf.text(safetyLabel, margin, ctx.yPos);
    ctx.yPos += 8;
    pdf.setTextColor(0);
    
    for (const finding of safetyConcerns) {
      checkNewPage(ctx, 15);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`• ${finding.title}`, margin + 3, ctx.yPos);
      ctx.yPos += 5;
      
      if (finding.recommendation) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        const recLines = pdf.splitTextToSize(finding.recommendation, contentWidth - 10);
        pdf.text(recLines[0], margin + 6, ctx.yPos);
        ctx.yPos += 6;
      }
    }
    ctx.yPos += 5;
  }
  
  // Major Defects (Repair Needed)
  const majorDefects = categorized.repair;
  if (majorDefects.length > 0) {
    checkNewPage(ctx, 30);
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(findingStatusColors.repair[0], findingStatusColors.repair[1], findingStatusColors.repair[2]);
    const repairLabel = lang === 'es' ? 'DEFECTOS MAYORES' : 'MAJOR DEFECTS';
    pdf.text(repairLabel, margin, ctx.yPos);
    ctx.yPos += 8;
    pdf.setTextColor(0);
    
    for (const finding of majorDefects) {
      checkNewPage(ctx, 15);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`• ${finding.title}`, margin + 3, ctx.yPos);
      ctx.yPos += 5;
      
      if (finding.recommendation) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        const recLines = pdf.splitTextToSize(finding.recommendation, contentWidth - 10);
        pdf.text(recLines[0], margin + 6, ctx.yPos);
        ctx.yPos += 6;
      }
    }
    ctx.yPos += 5;
  }
  
  // Items to Monitor / Maintenance
  const monitorItems = [...categorized.maintenance, ...categorized.monitor];
  if (monitorItems.length > 0) {
    checkNewPage(ctx, 30);
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(findingStatusColors.maintenance[0], findingStatusColors.maintenance[1], findingStatusColors.maintenance[2]);
    const monitorLabel = lang === 'es' ? 'ELEMENTOS A MONITOREAR / MANTENIMIENTO' : 'ITEMS TO MONITOR / MAINTENANCE';
    pdf.text(monitorLabel, margin, ctx.yPos);
    ctx.yPos += 8;
    pdf.setTextColor(0);
    
    for (const finding of monitorItems) {
      checkNewPage(ctx, 15);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`• ${finding.title}`, margin + 3, ctx.yPos);
      ctx.yPos += 5;
      
      if (finding.recommendation) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        const recLines = pdf.splitTextToSize(finding.recommendation, contentWidth - 10);
        pdf.text(recLines[0], margin + 6, ctx.yPos);
        ctx.yPos += 6;
      }
    }
    ctx.yPos += 5;
  }
  
  // No findings message
  if (safetyConcerns.length === 0 && majorDefects.length === 0 && monitorItems.length === 0) {
    checkNewPage(ctx, 20);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    const noFindingsText = lang === 'es'
      ? 'No se identificaron defectos significativos durante esta inspección.'
      : 'No significant defects were identified during this inspection.';
    pdf.text(noFindingsText, margin, ctx.yPos);
    ctx.yPos += 10;
  }
  
  // Inspector's Notes (optional, controlled)
  ctx.yPos += 10;
  drawDivider(ctx);
  ctx.yPos += 5;
  
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  const notesTitle = lang === 'es' ? 'Notas del Inspector' : "Inspector's Notes";
  pdf.text(notesTitle, margin, ctx.yPos);
  ctx.yPos += 7;
  
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  
  // Professional commentary based on findings
  let commentary = '';
  if (safetyConcerns.length > 0) {
    commentary = lang === 'es'
      ? 'Se observaron varias condiciones que requieren atención inmediata antes del cierre. Se recomienda encarecidamente la evaluación por especialistas con licencia.'
      : 'Several conditions were observed that warrant immediate attention prior to closing. Evaluation by licensed specialists is strongly recommended.';
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
