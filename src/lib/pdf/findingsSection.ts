import { PDFContext, FindingStatus, severityToStatus, findingStatusLabels, findingStatusColors } from './reportTypes';
import { PhotoRecord } from '@/lib/db';
import { Language, translations } from '@/lib/i18n';
import { blobToDataUrl } from '@/lib/imageUtils';
import { drawSectionHeader, drawSubsectionHeader, checkNewPage, addPageFooter, getRoomName, addTocEntry } from './pdfUtils';
import { sectionDisclaimers, roomToSection, severityToCondition, getConditionLabel } from '@/lib/reportConfig';

async function drawPhoto(ctx: PDFContext, photo: PhotoRecord, lang: Language): Promise<void> {
  const { pdf, margin, contentWidth } = ctx;
  
  checkNewPage(ctx, 50);
  
  // Photo image
  try {
    const imageBlob = photo.annotatedImageBlob || photo.thumbnailBlob;
    const imageUrl = await blobToDataUrl(imageBlob);
    pdf.addImage(imageUrl, 'JPEG', margin, ctx.yPos, 35, 26);
  } catch {
    pdf.setFillColor(240, 240, 240);
    pdf.rect(margin, ctx.yPos, 35, 26, 'F');
    pdf.setFontSize(8);
    pdf.text('Image unavailable', margin + 5, ctx.yPos + 13);
  }

  const textX = margin + 40;
  let textY = ctx.yPos + 4;

  // Finding title
  const title = lang === 'es'
    ? (photo.manualTitleEs || photo.aiFindingTitleEs || photo.manualTitle || photo.aiFindingTitle)
    : (photo.manualTitle || photo.aiFindingTitle || photo.manualTitleEs || photo.aiFindingTitleEs);

  if (title) {
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title, textX, textY);
    textY += 5;
  }

  // Status label with color
  const severity = photo.manualSeverity || photo.aiSeverity;
  if (severity) {
    const status = severityToStatus(severity);
    const statusLabel = findingStatusLabels[status][lang];
    const statusColor = findingStatusColors[status];
    
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
    
    // Draw status badge
    const badgeWidth = pdf.getTextWidth(statusLabel) + 6;
    pdf.roundedRect(textX, textY - 3, badgeWidth, 5, 1, 1, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.text(statusLabel, textX + 3, textY);
    pdf.setTextColor(0);
    textY += 7;
  }

  // Category
  const category = photo.manualCategory || photo.aiCategory;
  if (category) {
    const categoryKey = category as keyof typeof translations.en;
    const categoryText = translations[lang][categoryKey] || category;
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100);
    pdf.text(`Category: ${categoryText}`, textX, textY);
    textY += 4;
    pdf.setTextColor(0);
  }

  // Observation/Description (What is visible)
  const desc = lang === 'es'
    ? (photo.manualDescriptionEs || photo.aiDescriptionEs || photo.manualDescription || photo.aiDescription)
    : (photo.manualDescription || photo.aiDescription);

  if (desc) {
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    const obsLabel = lang === 'es' ? 'Observación:' : 'Observation:';
    pdf.text(obsLabel, textX, textY);
    textY += 4;
    
    pdf.setFont('helvetica', 'normal');
    const descLines = pdf.splitTextToSize(desc, contentWidth - 45);
    for (let i = 0; i < Math.min(descLines.length, 3); i++) {
      pdf.text(descLines[i], textX, textY);
      textY += 3.5;
    }
  }

  // Recommendation (What to do next)
  const rec = lang === 'es'
    ? (photo.manualRecommendationEs || photo.aiRecommendationEs || photo.manualRecommendation || photo.aiRecommendation)
    : (photo.manualRecommendation || photo.aiRecommendation);

  if (rec) {
    textY += 2;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    const recLabel = lang === 'es' ? 'Recomendación:' : 'Recommendation:';
    pdf.text(recLabel, textX, textY);
    textY += 4;
    
    pdf.setFont('helvetica', 'italic');
    const recLines = pdf.splitTextToSize(rec, contentWidth - 45);
    for (let i = 0; i < Math.min(recLines.length, 2); i++) {
      pdf.text(recLines[i], textX, textY);
      textY += 3.5;
    }
  }

  ctx.yPos += 35;
}

export async function addFindingsSection(
  ctx: PDFContext,
  photos: PhotoRecord[],
  roomOrder: string[],
  lang: Language
): Promise<void> {
  ctx.pdf.addPage();
  ctx.pageNumber++;
  ctx.yPos = ctx.margin;
  
  const { pdf, margin, contentWidth } = ctx;
  
  // Section title
  const findingsTitle = lang === 'es' ? 'HALLAZGOS DETALLADOS DE LA INSPECCIÓN' : 'DETAILED INSPECTION FINDINGS';
  drawSectionHeader(ctx, findingsTitle);
  
  // Intro paragraph
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  const introText = lang === 'es'
    ? 'La siguiente sección proporciona hallazgos detallados organizados por área/sistema de la propiedad.'
    : 'The following section provides detailed findings organized by property area/system.';
  pdf.text(introText, margin, ctx.yPos);
  ctx.yPos += 10;
  
  // Group photos by room
  const groupedByRoom = new Map<string, PhotoRecord[]>();
  for (const room of roomOrder) {
    groupedByRoom.set(room, []);
  }
  for (const photo of photos) {
    const existing = groupedByRoom.get(photo.room) || [];
    existing.push(photo);
    groupedByRoom.set(photo.room, existing);
  }
  
  let systemNumber = 0;
  
  for (const [room, roomPhotos] of groupedByRoom) {
    if (roomPhotos.length === 0) continue;
    
    systemNumber++;
    const sectionInfo = roomToSection[room] || { section: 'interior', title: { en: room, es: room } };
    const disclaimer = sectionDisclaimers[sectionInfo.section];
    
    // Room/System header
    checkNewPage(ctx, 50);
    
    // Add to ToC at level 2
    const roomName = getRoomName(room, lang, ctx.customRoomMap);
    addTocEntry(ctx, `  ${roomName}`, 2);
    
    // System header with background
    pdf.setFillColor(230, 240, 250);
    pdf.rect(margin, ctx.yPos - 2, contentWidth, 12, 'F');
    
    pdf.setFontSize(13);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${systemNumber}. ${roomName}`, margin + 3, ctx.yPos + 6);
    ctx.yPos += 16;
    
    // System overview
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    const overviewLabel = lang === 'es' ? 'Resumen del Sistema' : 'System Overview';
    pdf.text(overviewLabel, margin, ctx.yPos);
    ctx.yPos += 6;
    
    // General condition based on findings
    const severities = roomPhotos.map(p => p.manualSeverity || p.aiSeverity).filter(Boolean);
    let generalCondition = lang === 'es' ? 'Satisfactorio' : 'Satisfactory';
    if (severities.some(s => s === 'severe')) {
      generalCondition = lang === 'es' ? 'Deficiente' : 'Deficient';
    } else if (severities.some(s => s === 'moderate')) {
      generalCondition = lang === 'es' ? 'Marginal' : 'Marginal';
    }
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    const conditionLabel = lang === 'es' ? 'Condición General:' : 'General Condition:';
    pdf.text(`${conditionLabel} ${generalCondition}`, margin, ctx.yPos);
    ctx.yPos += 5;
    
    const itemsLabel = lang === 'es' ? 'Elementos Documentados:' : 'Items Documented:';
    pdf.text(`${itemsLabel} ${roomPhotos.length}`, margin, ctx.yPos);
    ctx.yPos += 8;
    
    // Section disclaimer (once per section)
    if (disclaimer) {
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(80);
      const disclaimerLines = pdf.splitTextToSize(disclaimer[lang], contentWidth);
      for (let i = 0; i < Math.min(disclaimerLines.length, 3); i++) {
        checkNewPage(ctx, 6);
        pdf.text(disclaimerLines[i], margin, ctx.yPos);
        ctx.yPos += 3.5;
      }
      pdf.setTextColor(0);
      ctx.yPos += 5;
    }
    
    // Observations header
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    const obsHeader = lang === 'es' ? 'Observaciones y Hallazgos' : 'Observations & Findings';
    pdf.text(obsHeader, margin, ctx.yPos);
    ctx.yPos += 8;
    
    // Photos in this room (max 3 per issue as per spec)
    let findingNumber = 0;
    for (const photo of roomPhotos.slice(0, 10)) { // Limit to prevent massive reports
      findingNumber++;
      
      // Finding subheader
      const findingTitle = lang === 'es'
        ? (photo.manualTitleEs || photo.aiFindingTitleEs || photo.manualTitle || photo.aiFindingTitle || 'Observación')
        : (photo.manualTitle || photo.aiFindingTitle || 'Observation');
      
      drawSubsectionHeader(ctx, `${systemNumber}.${findingNumber}`, findingTitle);
      
      // Draw the photo with all details
      await drawPhoto(ctx, photo, lang);
      
      // Comments/Notes
      if (photo.notes) {
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        const commentsLabel = lang === 'es' ? 'Comentarios:' : 'Comments:';
        pdf.text(commentsLabel, margin, ctx.yPos);
        ctx.yPos += 4;
        
        pdf.setFont('helvetica', 'normal');
        const noteLines = pdf.splitTextToSize(photo.notes, contentWidth);
        for (const line of noteLines.slice(0, 2)) {
          checkNewPage(ctx, 5);
          pdf.text(line, margin, ctx.yPos);
          ctx.yPos += 3.5;
        }
        ctx.yPos += 3;
      }
    }
    
    ctx.yPos += 5;
    addPageFooter(ctx);
  }
}
