import { PDFContext } from './reportTypes';
import { Language } from '@/lib/i18n';
import { CompanyProfile } from '@/lib/companyProfile';
import { drawSectionHeader, checkNewPage, addPageFooter, drawParagraph, drawBulletList, drawDivider } from './pdfUtils';

export function addMaintenanceSection(
  ctx: PDFContext,
  recommendations: string[],
  lang: Language
): void {
  if (recommendations.length === 0) return;
  
  ctx.pdf.addPage();
  ctx.pageNumber++;
  ctx.yPos = ctx.margin;
  
  const { pdf, margin, contentWidth } = ctx;
  
  // Section title
  const maintenanceTitle = lang === 'es'
    ? 'RECOMENDACIONES DE MANTENIMIENTO'
    : 'MAINTENANCE RECOMMENDATIONS';
  drawSectionHeader(ctx, maintenanceTitle);
  
  // Intro note
  pdf.setFillColor(240, 255, 240);
  pdf.rect(margin, ctx.yPos, contentWidth, 15, 'F');
  ctx.yPos += 5;
  
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'italic');
  const noteText = lang === 'es'
    ? 'Nota: Estas son recomendaciones de mantenimiento general, no defectos. No afectan las negociaciones.'
    : 'Note: These are general maintenance recommendations, not defects. They do not affect negotiations.';
  const noteLines = pdf.splitTextToSize(noteText, contentWidth - 10);
  for (const line of noteLines) {
    pdf.text(line, margin + 5, ctx.yPos);
    ctx.yPos += 4;
  }
  ctx.yPos += 10;
  
  // List recommendations
  pdf.setFont('helvetica', 'normal');
  drawBulletList(ctx, recommendations);
  
  addPageFooter(ctx);
}

export function addDisclaimersSection(
  ctx: PDFContext,
  companyProfile: CompanyProfile,
  additionalDisclaimers: string[],
  lang: Language
): void {
  ctx.pdf.addPage();
  ctx.pageNumber++;
  ctx.yPos = ctx.margin;
  
  const { pdf, margin, contentWidth } = ctx;
  
  // Section title
  const disclaimersTitle = lang === 'es'
    ? 'DESCARGOS DE RESPONSABILIDAD'
    : 'DISCLAIMERS';
  drawSectionHeader(ctx, disclaimersTitle);
  
  // Custom Disclaimer from Company Profile
  const customDisclaimer = lang === 'es'
    ? (companyProfile.customDisclaimerEs || companyProfile.customDisclaimer)
    : companyProfile.customDisclaimer;
  
  if (customDisclaimer) {
    checkNewPage(ctx, 30);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    const disclaimerTitle = lang === 'es' ? 'EXENCIÓN DE RESPONSABILIDAD' : 'DISCLAIMER';
    pdf.text(disclaimerTitle, margin, ctx.yPos);
    ctx.yPos += 8;
    
    drawParagraph(ctx, customDisclaimer);
    ctx.yPos += 5;
  }
  
  // Liability Statement from Company Profile
  const liabilityStatement = lang === 'es'
    ? (companyProfile.liabilityStatementEs || companyProfile.liabilityStatement)
    : companyProfile.liabilityStatement;
  
  if (liabilityStatement) {
    checkNewPage(ctx, 30);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    const liabilityTitle = lang === 'es' ? 'DECLARACIÓN DE RESPONSABILIDAD' : 'LIABILITY STATEMENT';
    pdf.text(liabilityTitle, margin, ctx.yPos);
    ctx.yPos += 8;
    
    drawParagraph(ctx, liabilityStatement);
    ctx.yPos += 5;
  }
  
  // Standard Legal Disclaimers
  checkNewPage(ctx, 40);
  drawDivider(ctx);
  ctx.yPos += 5;
  
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  const legalHeader = lang === 'es' ? 'AVISOS LEGALES' : 'LEGAL NOTICES';
  pdf.text(legalHeader, margin, ctx.yPos);
  ctx.yPos += 8;
  
  const standardDisclaimers = lang === 'es'
    ? [
        'Este informe no constituye una garantía de las condiciones de la propiedad.',
        'No se hacen predicciones sobre el rendimiento futuro de ningún sistema.',
        'Se recomienda encarecidamente la evaluación por especialistas con licencia donde se indique.',
        'Este informe está destinado únicamente para el cliente nombrado.',
        'La reproducción o distribución sin autorización está prohibida.',
      ]
    : [
        'This report does not constitute a warranty of property conditions.',
        'No predictions are made regarding future performance of any system.',
        'Evaluation by licensed specialists is strongly encouraged where noted.',
        'This report is intended solely for the named client.',
        'Reproduction or distribution without authorization is prohibited.',
      ];
  
  drawBulletList(ctx, standardDisclaimers);
  
  // Additional disclaimers from report options
  if (additionalDisclaimers.length > 0) {
    ctx.yPos += 10;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    const additionalTitle = lang === 'es' ? 'Descargos Adicionales' : 'Additional Disclaimers';
    pdf.text(additionalTitle, margin, ctx.yPos);
    ctx.yPos += 8;
    
    drawBulletList(ctx, additionalDisclaimers);
  }
  
  addPageFooter(ctx);
}

export function addCredentialsSection(
  ctx: PDFContext,
  companyProfile: CompanyProfile,
  lang: Language
): void {
  ctx.pdf.addPage();
  ctx.pageNumber++;
  ctx.yPos = ctx.margin;
  
  const { pdf, margin, contentWidth, pageWidth } = ctx;
  
  // Section title
  const credentialsTitle = lang === 'es'
    ? 'CREDENCIALES DEL INSPECTOR E INFORMACIÓN DE CONTACTO'
    : 'INSPECTOR CREDENTIALS & CONTACT INFO';
  drawSectionHeader(ctx, credentialsTitle);
  
  // Company Logo
  // (Logo would be added here if we stored it as base64)
  
  // Company Name
  ctx.yPos += 5;
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text(companyProfile.companyName, pageWidth / 2, ctx.yPos, { align: 'center' });
  ctx.yPos += 10;
  
  // Tagline
  if (companyProfile.tagline) {
    const tagline = lang === 'es' && companyProfile.taglineEs
      ? companyProfile.taglineEs
      : companyProfile.tagline;
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'italic');
    pdf.text(tagline, pageWidth / 2, ctx.yPos, { align: 'center' });
    ctx.yPos += 10;
  }
  
  // Inspector Name
  if (companyProfile.inspectorName) {
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(companyProfile.inspectorName, pageWidth / 2, ctx.yPos, { align: 'center' });
    ctx.yPos += 8;
  }
  
  // License Number
  if (companyProfile.licenseNumber) {
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    const licenseLabel = lang === 'es' ? 'Número de Licencia' : 'License Number';
    pdf.text(`${licenseLabel}: ${companyProfile.licenseNumber}`, pageWidth / 2, ctx.yPos, { align: 'center' });
    ctx.yPos += 15;
  }
  
  // Certifications
  if (companyProfile.certifications && companyProfile.certifications.length > 0) {
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    const certHeader = lang === 'es' ? 'Certificaciones y Afiliaciones' : 'Certifications & Affiliations';
    pdf.text(certHeader, margin, ctx.yPos);
    ctx.yPos += 8;
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    for (const cert of companyProfile.certifications) {
      checkNewPage(ctx, 8);
      pdf.text(`• ${cert}`, margin + 5, ctx.yPos);
      ctx.yPos += 6;
    }
    ctx.yPos += 10;
  }
  
  // Contact Information Box
  drawDivider(ctx);
  ctx.yPos += 5;
  
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  const contactHeader = lang === 'es' ? 'Información de Contacto' : 'Contact Information';
  pdf.text(contactHeader, margin, ctx.yPos);
  ctx.yPos += 10;
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  
  if (companyProfile.address) {
    pdf.text(companyProfile.address, margin, ctx.yPos);
    ctx.yPos += 6;
  }
  
  if (companyProfile.city && companyProfile.state) {
    pdf.text(`${companyProfile.city}, ${companyProfile.state} ${companyProfile.zip || ''}`, margin, ctx.yPos);
    ctx.yPos += 6;
  }
  
  if (companyProfile.phone) {
    const phoneLabel = lang === 'es' ? 'Teléfono' : 'Phone';
    pdf.text(`${phoneLabel}: ${companyProfile.phone}`, margin, ctx.yPos);
    ctx.yPos += 6;
  }
  
  if (companyProfile.email) {
    pdf.text(`Email: ${companyProfile.email}`, margin, ctx.yPos);
    ctx.yPos += 6;
  }
  
  if (companyProfile.website) {
    const websiteLabel = lang === 'es' ? 'Sitio Web' : 'Website';
    pdf.text(`${websiteLabel}: ${companyProfile.website}`, margin, ctx.yPos);
    ctx.yPos += 6;
  }
  
  // Footer message
  ctx.yPos += 15;
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'italic');
  pdf.setTextColor(100);
  const thankYouText = lang === 'es'
    ? 'Gracias por elegir nuestros servicios de inspección. Estamos a su disposición para cualquier consulta.'
    : 'Thank you for choosing our inspection services. We are available for any questions or concerns.';
  const thankYouLines = pdf.splitTextToSize(thankYouText, contentWidth);
  for (const line of thankYouLines) {
    pdf.text(line, pageWidth / 2, ctx.yPos, { align: 'center' });
    ctx.yPos += 5;
  }
  pdf.setTextColor(0);
  
  addPageFooter(ctx);
}
