import { jsPDF } from 'jspdf';
import { PhotoRecord, InspectionRecord, getAllCustomRooms } from '@/lib/db';
import { blobToDataUrl } from '@/lib/imageUtils';
import { Language, translations } from '@/lib/i18n';
import { CompanyProfile, getCompanyProfile, getDefaultCompanyProfile, getCompanyLogo } from '@/lib/companyProfile';
import { 
  sectionDisclaimers, 
  reportIntroduction, 
  inspectorLimitations, 
  preClosingWalkthrough,
  roomToSection,
  severityToCondition,
  getConditionLabel,
  ConditionStatus
} from '@/lib/reportConfig';

type ReportLanguage = 'en' | 'es' | 'both';

interface ReportOptions {
  inspection: InspectionRecord;
  photos: PhotoRecord[];
  reportLanguage: ReportLanguage;
  disclaimers: string[];
  roomOrder: string[];
  includeTableOfContents?: boolean;
  includeIntroduction?: boolean;
  includeConclusion?: boolean;
}

export async function generateProfessionalReportPDF(options: ReportOptions): Promise<Blob> {
  const {
    inspection,
    photos,
    reportLanguage = 'en',
    disclaimers = [],
    roomOrder = [],
    includeTableOfContents = true,
    includeIntroduction = true,
    includeConclusion = true,
  } = options;

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const companyProfile = await getCompanyProfile() || getDefaultCompanyProfile();
  const companyLogo = await getCompanyLogo();
  const customRooms = await getAllCustomRooms();
  const customRoomMap = new Map(customRooms.map(r => [r.id, r]));

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
  let yPos = margin;
  let pageNumber = 1;
  let sectionNumber = 0;

  const t = (key: keyof typeof translations.en, lang: Language) => translations[lang][key] || key;

  const getRoomName = (room: string, lang: Language): string => {
    if (room in translations[lang]) {
      return translations[lang][room as keyof typeof translations.en] || room;
    }
    const customRoom = customRoomMap.get(room);
    if (customRoom) {
      return lang === 'es' && customRoom.nameEs ? customRoom.nameEs : customRoom.name;
    }
    return room;
  };

  const addPageFooter = () => {
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100);
    pdf.text(`${companyProfile.companyName} ${companyProfile.phone || ''}`, margin, pageHeight - 10);
    pdf.text(`© ${new Date().getFullYear()} All rights reserved.`, margin, pageHeight - 6);
    pdf.text(`Inspection Report - Page ${pageNumber}`, pageWidth - margin - 40, pageHeight - 6);
    pdf.setTextColor(0);
  };

  const checkNewPage = (neededSpace: number = 40) => {
    if (yPos > pageHeight - neededSpace) {
      addPageFooter();
      pdf.addPage();
      pageNumber++;
      yPos = margin;
      return true;
    }
    return false;
  };

  const drawSectionHeader = (title: string) => {
    checkNewPage(30);
    pdf.setFillColor(240, 240, 240);
    pdf.rect(margin, yPos - 2, contentWidth, 10, 'F');
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title, margin + 3, yPos + 5);
    yPos += 15;
  };

  const drawSubsectionHeader = (number: string, title: string) => {
    checkNewPage(25);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${number} ${title}`, margin, yPos);
    yPos += 7;
  };

  const drawConditionBadge = (condition: ConditionStatus, lang: Language) => {
    const label = getConditionLabel(condition, lang);
    const colors: Record<ConditionStatus, [number, number, number]> = {
      satisfactory: [34, 139, 34],
      needs_maintenance: [255, 165, 0],
      professional_consultation: [220, 20, 60],
      not_satisfactory: [178, 34, 34],
    };
    const color = colors[condition];
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(color[0], color[1], color[2]);
    pdf.text(`Condition: ${label}`, margin, yPos);
    pdf.setTextColor(0);
    yPos += 6;
  };

  const drawTableRow = (label: string, value: string, isShaded: boolean = false) => {
    if (isShaded) {
      pdf.setFillColor(248, 248, 248);
      pdf.rect(margin, yPos - 3, contentWidth, 6, 'F');
    }
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text(label, margin + 2, yPos);
    pdf.text(value, margin + 90, yPos);
    yPos += 6;
  };

  const drawParagraph = (text: string, maxWidth: number = contentWidth) => {
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    const lines = pdf.splitTextToSize(text, maxWidth);
    for (const line of lines) {
      checkNewPage(10);
      pdf.text(line, margin, yPos);
      yPos += 4;
    }
    yPos += 2;
  };

  const drawPhoto = async (photo: PhotoRecord, index: number, lang: Language) => {
    checkNewPage(50);
    
    // Photo image
    try {
      // Use annotated image if available, otherwise thumbnail
      const imageBlob = photo.annotatedImageBlob || photo.thumbnailBlob;
      const imageUrl = await blobToDataUrl(imageBlob);
      pdf.addImage(imageUrl, 'JPEG', margin, yPos, 35, 26);
    } catch {
      pdf.setFillColor(240, 240, 240);
      pdf.rect(margin, yPos, 35, 26, 'F');
      pdf.setFontSize(8);
      pdf.text('Image unavailable', margin + 5, yPos + 13);
    }

    const textX = margin + 40;
    let textY = yPos + 4;

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

    // Condition status
    const severity = photo.manualSeverity || photo.aiSeverity;
    if (severity) {
      const condition = severityToCondition(severity);
      const conditionLabel = getConditionLabel(condition, lang);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100);
      pdf.text(`Condition: ${conditionLabel}`, textX, textY);
      textY += 5;
    }

    // Category
    const category = photo.manualCategory || photo.aiCategory;
    if (category) {
      const categoryKey = category as keyof typeof translations.en;
      const categoryText = translations[lang][categoryKey] || category;
      pdf.text(`Category: ${categoryText}`, textX, textY);
      textY += 5;
    }
    pdf.setTextColor(0);

    // Description
    const desc = lang === 'es'
      ? (photo.manualDescriptionEs || photo.aiDescriptionEs || photo.manualDescription || photo.aiDescription)
      : (photo.manualDescription || photo.aiDescription);

    if (desc) {
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      const descLines = pdf.splitTextToSize(desc, contentWidth - 45);
      for (let i = 0; i < Math.min(descLines.length, 3); i++) {
        pdf.text(descLines[i], textX, textY);
        textY += 4;
      }
    }

    // Recommendation
    const rec = lang === 'es'
      ? (photo.manualRecommendationEs || photo.aiRecommendationEs || photo.manualRecommendation || photo.aiRecommendation)
      : (photo.manualRecommendation || photo.aiRecommendation);

    if (rec) {
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(8);
      const recLines = pdf.splitTextToSize(`Recommendation: ${rec}`, contentWidth - 45);
      for (let i = 0; i < Math.min(recLines.length, 2); i++) {
        pdf.text(recLines[i], textX, textY);
        textY += 4;
      }
    }

    yPos += 32;
  };

  // ============== COVER PAGE ==============
  const addCoverPage = async (lang: Language) => {
    // Company logo
    if (companyLogo) {
      try {
        pdf.addImage(companyLogo, 'PNG', pageWidth / 2 - 25, yPos, 50, 25);
        yPos += 35;
      } catch {
        yPos += 10;
      }
    }

    // Report title
    pdf.setFontSize(28);
    pdf.setFont('helvetica', 'bold');
    const reportTitle = lang === 'es' ? 'Informe de Inspección de Bienes Raíces' : 'Real Estate Inspection Report';
    pdf.text(reportTitle, pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Date
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    const dateStr = new Date(inspection.createdAt).toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    pdf.text(dateStr, pageWidth / 2, yPos, { align: 'center' });
    yPos += 20;

    // Company name
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text(companyProfile.companyName, pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Client info
    if (inspection.clientName) {
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(inspection.clientName, pageWidth / 2, yPos, { align: 'center' });
      yPos += 8;
    }

    // Property address
    pdf.setFontSize(11);
    pdf.text(inspection.propertyAddress, pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Represented by (if agent info exists)
    if (companyProfile.inspectorName || inspection.inspectorName) {
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      const inspectorLabel = lang === 'es' ? 'Inspector' : 'Inspector';
      pdf.text(`${inspectorLabel}: ${inspection.inspectorName || companyProfile.inspectorName}`, pageWidth / 2, yPos, { align: 'center' });
      yPos += 20;
    }

    // Company info at bottom
    yPos = pageHeight - 60;
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(80);
    const confidentialText = lang === 'es' ? 'Confidencial y Propietario' : 'Confidential and Proprietary';
    pdf.text(confidentialText, pageWidth / 2, yPos, { align: 'center' });
    yPos += 6;
    pdf.text(companyProfile.companyName, pageWidth / 2, yPos, { align: 'center' });
    yPos += 5;
    if (companyProfile.address) {
      pdf.text(`${companyProfile.address}`, pageWidth / 2, yPos, { align: 'center' });
      yPos += 5;
    }
    if (companyProfile.city && companyProfile.state) {
      pdf.text(`${companyProfile.city}, ${companyProfile.state} ${companyProfile.zip || ''}`, pageWidth / 2, yPos, { align: 'center' });
      yPos += 5;
    }
    if (companyProfile.website) {
      pdf.text(companyProfile.website, pageWidth / 2, yPos, { align: 'center' });
      yPos += 5;
    }
    if (companyProfile.email) {
      pdf.text(companyProfile.email, pageWidth / 2, yPos, { align: 'center' });
      yPos += 5;
    }
    if (companyProfile.phone) {
      pdf.text(companyProfile.phone, pageWidth / 2, yPos, { align: 'center' });
    }
    pdf.setTextColor(0);

    addPageFooter();
  };

  // ============== CLIENT INFORMATION PAGE ==============
  const addClientInfoPage = (lang: Language) => {
    pdf.addPage();
    pageNumber++;
    yPos = margin;

    const clientInfoTitle = lang === 'es' ? 'Información del Cliente' : 'Client Information';
    drawSectionHeader(clientInfoTitle);

    drawTableRow(lang === 'es' ? 'Nombre del Cliente:' : 'Client Name:', inspection.clientName || 'N/A', true);
    drawTableRow(lang === 'es' ? 'Dirección de la Propiedad:' : 'Property Address:', inspection.propertyAddress, false);
    
    const dateStr = new Date(inspection.createdAt).toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US');
    drawTableRow(lang === 'es' ? 'Fecha de Inspección:' : 'Inspection Date:', dateStr, true);
    
    const timeStr = new Date(inspection.createdAt).toLocaleTimeString(lang === 'es' ? 'es-ES' : 'en-US');
    drawTableRow(lang === 'es' ? 'Hora de Inspección:' : 'Inspection Time:', timeStr, false);
    
    drawTableRow(lang === 'es' ? 'Inspector:' : 'Inspector:', inspection.inspectorName || companyProfile.inspectorName || 'N/A', true);

    if (inspection.inspectionType) {
      const typeKey = `inspectionType_${inspection.inspectionType}` as keyof typeof translations.en;
      const typeLabel = translations[lang][typeKey] || inspection.inspectionType;
      drawTableRow(lang === 'es' ? 'Tipo de Inspección:' : 'Inspection Type:', typeLabel, false);
    }

    addPageFooter();
  };

  // ============== INTRODUCTION PAGE ==============
  const addIntroductionPage = (lang: Language) => {
    pdf.addPage();
    pageNumber++;
    yPos = margin;

    const introTitle = lang === 'es' ? 'Información del Informe' : 'Report Information';
    drawSectionHeader(introTitle);

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    const introHeader = lang === 'es' ? 'INTRODUCCIÓN' : 'INTRODUCTION';
    pdf.text(introHeader, margin, yPos);
    yPos += 8;

    drawParagraph(reportIntroduction[lang]);

    // Custom Scope and Limitations (if provided)
    const customScope = lang === 'es' 
      ? (companyProfile.scopeAndLimitationsEs || companyProfile.scopeAndLimitations)
      : companyProfile.scopeAndLimitations;
    
    if (customScope) {
      yPos += 5;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      const scopeHeader = lang === 'es' ? 'ALCANCE Y LIMITACIONES' : 'SCOPE AND LIMITATIONS';
      pdf.text(scopeHeader, margin, yPos);
      yPos += 6;
      drawParagraph(customScope);
    }

    yPos += 5;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    const limitationsHeader = lang === 'es' 
      ? 'Los inspectores de viviendas no están obligados a informar sobre:' 
      : 'Home inspectors are not required to report on:';
    pdf.text(limitationsHeader, margin, yPos);
    yPos += 6;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    for (const limitation of inspectorLimitations[lang]) {
      checkNewPage(8);
      pdf.text(`• ${limitation}`, margin + 3, yPos);
      yPos += 5;
    }

    addPageFooter();
  };

  // ============== SUMMARY PAGE ==============
  const addSummaryPage = async (lang: Language) => {
    pdf.addPage();
    pageNumber++;
    yPos = margin;

    const summaryTitle = lang === 'es' ? 'Resumen del Informe de Inspección' : 'Inspection Report Summary';
    drawSectionHeader(summaryTitle);

    // Group photos by room and find issues
    const issuesByRoom = new Map<string, PhotoRecord[]>();
    for (const photo of photos) {
      const severity = photo.manualSeverity || photo.aiSeverity;
      if (severity) {
        const existing = issuesByRoom.get(photo.room) || [];
        existing.push(photo);
        issuesByRoom.set(photo.room, existing);
      }
    }

    // Summary by room
    for (const room of roomOrder) {
      const roomPhotos = issuesByRoom.get(room);
      if (!roomPhotos || roomPhotos.length === 0) continue;

      checkNewPage(20);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text(getRoomName(room, lang), margin, yPos);
      yPos += 6;

      for (const photo of roomPhotos) {
        const title = lang === 'es'
          ? (photo.manualTitleEs || photo.aiFindingTitleEs || photo.manualTitle || photo.aiFindingTitle)
          : (photo.manualTitle || photo.aiFindingTitle);
        
        if (title) {
          checkNewPage(10);
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'normal');
          const severity = photo.manualSeverity || photo.aiSeverity;
          const condition = severityToCondition(severity || 'minor');
          pdf.text(`• ${title} - ${getConditionLabel(condition, lang)}`, margin + 5, yPos);
          yPos += 5;
        }
      }
      yPos += 3;
    }

    addPageFooter();
  };

  // ============== DETAILED FINDINGS ==============
  const addDetailedFindings = async (lang: Language) => {
    pdf.addPage();
    pageNumber++;
    yPos = margin;

    const detailTitle = lang === 'es' ? 'Detalle del Informe de Inspección' : 'Inspection Report Detail';
    drawSectionHeader(detailTitle);

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

    for (const [room, roomPhotos] of groupedByRoom) {
      if (roomPhotos.length === 0) continue;

      sectionNumber++;
      const sectionInfo = roomToSection[room] || { section: 'interior', title: { en: room, es: room } };
      const disclaimer = sectionDisclaimers[sectionInfo.section];

      // Section header
      checkNewPage(40);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${sectionNumber}. ${getRoomName(room, lang)}`, margin, yPos);
      yPos += 8;

      // Section disclaimer
      if (disclaimer) {
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'italic');
        pdf.setTextColor(80);
        const disclaimerLines = pdf.splitTextToSize(disclaimer[lang], contentWidth);
        for (let i = 0; i < Math.min(disclaimerLines.length, 4); i++) {
          checkNewPage(6);
          pdf.text(disclaimerLines[i], margin, yPos);
          yPos += 4;
        }
        pdf.setTextColor(0);
        yPos += 5;
      }

      // Photos in this room
      let subsectionNumber = 0;
      for (const photo of roomPhotos) {
        subsectionNumber++;
        drawSubsectionHeader(`${sectionNumber}.${subsectionNumber}`, 
          (lang === 'es' 
            ? (photo.manualTitleEs || photo.aiFindingTitleEs || photo.manualTitle || photo.aiFindingTitle || 'Observación')
            : (photo.manualTitle || photo.aiFindingTitle || 'Observation')));

        // Condition
        const severity = photo.manualSeverity || photo.aiSeverity;
        if (severity) {
          drawConditionBadge(severityToCondition(severity), lang);
        }

        // Photo and details
        await drawPhoto(photo, subsectionNumber, lang);

        // Comments/Notes
        if (photo.notes) {
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'bold');
          pdf.text(lang === 'es' ? 'Comentarios:' : 'Comments:', margin, yPos);
          yPos += 5;
          pdf.setFont('helvetica', 'normal');
          const noteLines = pdf.splitTextToSize(photo.notes, contentWidth);
          for (const line of noteLines.slice(0, 3)) {
            checkNewPage(6);
            pdf.text(line, margin, yPos);
            yPos += 4;
          }
          yPos += 3;
        }
      }

      addPageFooter();
    }
  };

  // ============== CONCLUSION PAGE ==============
  const addConclusionPage = (lang: Language) => {
    pdf.addPage();
    pageNumber++;
    yPos = margin;

    const conclusionTitle = lang === 'es' ? 'Conclusión del Informe' : 'Report Conclusion';
    drawSectionHeader(conclusionTitle);

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    const walkthroughTitle = lang === 'es' ? 'RECORRIDO PREVIO AL CIERRE' : 'PRE-CLOSING WALK THROUGH';
    pdf.text(walkthroughTitle, margin, yPos);
    yPos += 8;

    drawParagraph(preClosingWalkthrough[lang]);

    // Custom Disclaimer from Company Profile
    const customDisclaimer = lang === 'es'
      ? (companyProfile.customDisclaimerEs || companyProfile.customDisclaimer)
      : companyProfile.customDisclaimer;
    
    if (customDisclaimer) {
      yPos += 10;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      const disclaimerTitle = lang === 'es' ? 'EXENCIÓN DE RESPONSABILIDAD' : 'DISCLAIMER';
      pdf.text(disclaimerTitle, margin, yPos);
      yPos += 8;
      drawParagraph(customDisclaimer);
    }

    // Custom Liability Statement from Company Profile
    const liabilityStatement = lang === 'es'
      ? (companyProfile.liabilityStatementEs || companyProfile.liabilityStatement)
      : companyProfile.liabilityStatement;
    
    if (liabilityStatement) {
      yPos += 10;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      const liabilityTitle = lang === 'es' ? 'DECLARACIÓN DE RESPONSABILIDAD' : 'LIABILITY STATEMENT';
      pdf.text(liabilityTitle, margin, yPos);
      yPos += 8;
      drawParagraph(liabilityStatement);
    }

    // Additional disclaimers from report options
    if (disclaimers.length > 0) {
      yPos += 10;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      const additionalTitle = lang === 'es' ? 'Descargos Adicionales' : 'Additional Disclaimers';
      pdf.text(additionalTitle, margin, yPos);
      yPos += 8;

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      for (const disclaimer of disclaimers) {
        checkNewPage(10);
        const lines = pdf.splitTextToSize(`• ${disclaimer}`, contentWidth);
        for (const line of lines) {
          pdf.text(line, margin, yPos);
          yPos += 4;
        }
        yPos += 2;
      }
    }

    addPageFooter();
  };

  // ============== CERTIFICATIONS PAGE ==============
  const addCertificationsPage = (lang: Language) => {
    if (!companyProfile.certifications || companyProfile.certifications.length === 0) return;

    pdf.addPage();
    pageNumber++;
    yPos = margin;

    const certTitle = lang === 'es' ? 'Certificaciones y Afiliaciones' : 'Certifications And Affiliations';
    drawSectionHeader(certTitle);

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    for (const cert of companyProfile.certifications) {
      checkNewPage(8);
      pdf.text(`• ${cert}`, margin, yPos);
      yPos += 6;
    }

    if (companyProfile.licenseNumber) {
      yPos += 5;
      pdf.setFont('helvetica', 'bold');
      const licenseLabel = lang === 'es' ? 'Número de Licencia:' : 'License Number:';
      pdf.text(`${licenseLabel} ${companyProfile.licenseNumber}`, margin, yPos);
    }

    addPageFooter();
  };

  // ============== GENERATE REPORT ==============
  const generateForLanguage = async (lang: Language) => {
    await addCoverPage(lang);
    addClientInfoPage(lang);
    
    if (includeIntroduction) {
      addIntroductionPage(lang);
    }
    
    await addSummaryPage(lang);
    await addDetailedFindings(lang);
    
    if (includeConclusion) {
      addConclusionPage(lang);
    }
    
    addCertificationsPage(lang);
  };

  // Generate report
  if (reportLanguage === 'en' || reportLanguage === 'both') {
    await generateForLanguage('en');
  }

  if (reportLanguage === 'both') {
    pdf.addPage();
    pageNumber++;
    yPos = margin + 20;
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Versión en Español', pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Spanish Version', pageWidth / 2, yPos, { align: 'center' });
    addPageFooter();
  }

  if (reportLanguage === 'es' || reportLanguage === 'both') {
    await generateForLanguage('es');
  }

  return pdf.output('blob');
}
