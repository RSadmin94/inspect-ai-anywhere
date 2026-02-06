import { PDFContext, DeferredItem } from './reportTypes';
import { Language } from '@/lib/i18n';
import { CompanyProfile } from '@/lib/companyProfile';
import { drawSectionHeader, checkNewPage, addPageFooter, drawParagraph, drawBulletList, drawDivider } from './pdfUtils';
import { reportIntroduction, inspectorLimitations } from '@/lib/reportConfig';

export function addScopeSection(
  ctx: PDFContext,
  companyProfile: CompanyProfile,
  lang: Language
): void {
  ctx.pdf.addPage();
  ctx.pageNumber++;
  ctx.yPos = ctx.margin;
  
  const { pdf, margin, contentWidth } = ctx;
  
  // Section title
  const scopeTitle = lang === 'es' 
    ? 'ALCANCE, NORMAS Y LIMITACIONES' 
    : 'SCOPE, STANDARDS & LIMITATIONS';
  drawSectionHeader(ctx, scopeTitle);
  
  // Inspection Type Description
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  const inspectionTypeHeader = lang === 'es' ? 'TIPO DE INSPECCIÓN' : 'INSPECTION TYPE';
  pdf.text(inspectionTypeHeader, margin, ctx.yPos);
  ctx.yPos += 7;
  
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  const typeDescription = lang === 'es'
    ? 'Esta es una inspección visual general de la propiedad. No es una inspección técnicamente exhaustiva. No es una garantía de las condiciones de la propiedad.'
    : 'This is a general visual inspection of the property. It is not a technically exhaustive inspection. It is not a warranty of property conditions.';
  drawParagraph(ctx, typeDescription);
  
  ctx.yPos += 5;
  
  // Standards
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  const standardsHeader = lang === 'es' ? 'NORMAS DE PRÁCTICA' : 'STANDARDS OF PRACTICE';
  pdf.text(standardsHeader, margin, ctx.yPos);
  ctx.yPos += 7;
  
  drawParagraph(ctx, reportIntroduction[lang]);
  
  ctx.yPos += 5;
  
  // Custom Scope (from Company Profile)
  const customScope = lang === 'es'
    ? (companyProfile.scopeAndLimitationsEs || companyProfile.scopeAndLimitations)
    : companyProfile.scopeAndLimitations;
  
  if (customScope) {
    checkNewPage(ctx, 30);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    const customScopeHeader = lang === 'es' ? 'ALCANCE ESPECÍFICO' : 'SPECIFIC SCOPE';
    pdf.text(customScopeHeader, margin, ctx.yPos);
    ctx.yPos += 7;
    
    drawParagraph(ctx, customScope);
    ctx.yPos += 5;
  }
  
  // Limitations
  checkNewPage(ctx, 30);
  drawDivider(ctx);
  ctx.yPos += 5;
  
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  const limitationsHeader = lang === 'es'
    ? 'LIMITACIONES DE LA INSPECCIÓN'
    : 'INSPECTION LIMITATIONS';
  pdf.text(limitationsHeader, margin, ctx.yPos);
  ctx.yPos += 7;
  
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  const limitationsIntro = lang === 'es'
    ? 'Los inspectores de viviendas no están obligados a informar sobre:'
    : 'Home inspectors are not required to report on:';
  pdf.text(limitationsIntro, margin, ctx.yPos);
  ctx.yPos += 7;
  
  drawBulletList(ctx, inspectorLimitations[lang]);
  
  ctx.yPos += 5;
  
  // Key Exclusions Box
  checkNewPage(ctx, 40);
  
  pdf.setFillColor(255, 250, 240);
  pdf.rect(margin, ctx.yPos, contentWidth, 35, 'F');
  pdf.setDrawColor(200, 150, 100);
  pdf.rect(margin, ctx.yPos, contentWidth, 35, 'S');
  
  ctx.yPos += 6;
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  const exclusionsHeader = lang === 'es' ? 'EXCLUSIONES IMPORTANTES' : 'IMPORTANT EXCLUSIONS';
  pdf.text(exclusionsHeader, margin + 5, ctx.yPos);
  ctx.yPos += 6;
  
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  const exclusions = lang === 'es'
    ? [
        '• Inspección visual, no invasiva',
        '• Condiciones al momento de la inspección solamente',
        '• No es una inspección de código o garantía',
        '• Defectos ocultos/latentes excluidos',
      ]
    : [
        '• Visual, non-invasive inspection',
        '• Conditions at time of inspection only',
        '• Not a code or warranty inspection',
        '• Hidden/latent defects excluded',
      ];
  
  for (const exclusion of exclusions) {
    pdf.text(exclusion, margin + 5, ctx.yPos);
    ctx.yPos += 4;
  }
  
  ctx.yPos += 15;
  
  addPageFooter(ctx);
}

export function addDeferredItemsSection(
  ctx: PDFContext,
  deferredItems: DeferredItem[],
  lang: Language
): void {
  if (deferredItems.length === 0) return;
  
  ctx.pdf.addPage();
  ctx.pageNumber++;
  ctx.yPos = ctx.margin;
  
  const { pdf, margin, contentWidth } = ctx;
  
  // Section title
  const deferredTitle = lang === 'es'
    ? 'ELEMENTOS DIFERIDOS / NO INSPECCIONADOS'
    : 'DEFERRED / NOT INSPECTED ITEMS';
  drawSectionHeader(ctx, deferredTitle);
  
  // Intro
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  const deferredIntro = lang === 'es'
    ? 'Los siguientes elementos no pudieron ser inspeccionados completamente durante esta visita:'
    : 'The following items could not be fully inspected during this visit:';
  pdf.text(deferredIntro, margin, ctx.yPos);
  ctx.yPos += 10;
  
  // List of deferred items
  for (const item of deferredItems) {
    checkNewPage(ctx, 15);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`• ${item.area}`, margin + 3, ctx.yPos);
    ctx.yPos += 5;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(80);
    const reasonLines = pdf.splitTextToSize(item.reason, contentWidth - 15);
    for (const line of reasonLines) {
      pdf.text(line, margin + 8, ctx.yPos);
      ctx.yPos += 4;
    }
    pdf.setTextColor(0);
    ctx.yPos += 3;
  }
  
  // Note about re-inspection
  ctx.yPos += 10;
  pdf.setFillColor(240, 248, 255);
  pdf.rect(margin, ctx.yPos, contentWidth, 20, 'F');
  ctx.yPos += 6;
  
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'italic');
  const reinspectionNote = lang === 'es'
    ? 'Nota: Se recomienda reinspeccionar estos elementos cuando sean accesibles.'
    : 'Note: Re-inspection of these items is recommended when they become accessible.';
  const noteLines = pdf.splitTextToSize(reinspectionNote, contentWidth - 10);
  for (const line of noteLines) {
    pdf.text(line, margin + 5, ctx.yPos);
    ctx.yPos += 4;
  }
  
  addPageFooter(ctx);
}
