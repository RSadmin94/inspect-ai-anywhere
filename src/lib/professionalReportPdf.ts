import { jsPDF } from 'jspdf';
import { PhotoRecord, InspectionRecord, getAllCustomRooms } from '@/lib/db';
import { Language } from '@/lib/i18n';
import { CompanyProfile, getCompanyProfile, getDefaultCompanyProfile, getCompanyLogo } from '@/lib/companyProfile';
import {
  ReportLanguage,
  ReportOptions,
  PDFContext,
  DeferredItem,
  AncillarySection,
  createPDFContext,
  addPageFooter,
} from '@/lib/pdf';
import { addCoverPage } from '@/lib/pdf/coverPage';
import { addTableOfContentsPlaceholder, fillTableOfContents } from '@/lib/pdf/tableOfContents';
import { addSummarySection } from '@/lib/pdf/summarySection';
import { addScopeSection, addDeferredItemsSection } from '@/lib/pdf/scopeSection';
import { addFindingsSection } from '@/lib/pdf/findingsSection';
import { addMaintenanceSection, addDisclaimersSection, addCredentialsSection, addAncillarySection } from '@/lib/pdf/conclusionSection';
import { addAgentSummarySection } from '@/lib/pdf/agentSummarySection';

export type { ReportLanguage, ReportOptions, DeferredItem, AncillarySection };

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
    deferredItems = [],
    maintenanceRecommendations = [],
    ancillarySections = [],
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

  // Create base PDF context
  const baseContext = createPDFContext(pdf);
  
  // Generate report for each language
  const generateForLanguage = async (lang: Language) => {
    // Create fresh context for this language
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

    // 1. Cover Page
    await addCoverPage(ctx, inspection, lang);
    
    // 2. Agent-Friendly 1-Page Summary (standalone, can be forwarded separately)
    addAgentSummarySection(ctx, inspection, photos, lang);
    
    // 3. Table of Contents (placeholder - we'll fill it in later)
    let tocPageNumber = 0;
    if (includeTableOfContents) {
      tocPageNumber = addTableOfContentsPlaceholder(ctx, lang);
    }
    
    // 4. Inspection Summary (MOST IMPORTANT)
    await addSummarySection(ctx, inspection, photos, roomOrder, lang);
    
    // 5. System-by-System Findings
    await addFindingsSection(ctx, photos, roomOrder, lang);
    
    // 6. Deferred / Not Inspected Items
    if (deferredItems.length > 0) {
      addDeferredItemsSection(ctx, deferredItems, lang);
    }
    
    // 7. Maintenance Recommendations
    if (maintenanceRecommendations.length > 0) {
      addMaintenanceSection(ctx, maintenanceRecommendations, lang);
    }
    
    // 8. Ancillary Sections (Radon, WDI, Mold)
    for (const section of ancillarySections) {
      if (section.enabled) {
        addAncillarySection(ctx, section, lang);
      }
    }
    
    // 9. Scope, Standards & Limitations (moved towards end)
    if (includeIntroduction) {
      addScopeSection(ctx, companyProfile, lang);
    }
    
    // 9. Disclaimers
    if (includeConclusion) {
      addDisclaimersSection(ctx, companyProfile, disclaimers, lang);
    }
    
    // 10. Inspector Credentials & Contact
    addCredentialsSection(ctx, companyProfile, lang);
    
    // Fill in Table of Contents with actual page numbers
    if (includeTableOfContents && tocPageNumber > 0) {
      fillTableOfContents(ctx, tocPageNumber, ctx.tocEntries, lang);
    }
    
    // Update base context page number for next language
    baseContext.pageNumber = ctx.pageNumber;
  };

  // Generate English version
  if (reportLanguage === 'en' || reportLanguage === 'both') {
    await generateForLanguage('en');
  }

  // Add separator page for bilingual reports
  if (reportLanguage === 'both') {
    pdf.addPage();
    baseContext.pageNumber!++;
    
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Spanish version divider page
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('VERSIÓN EN ESPAÑOL', pageWidth / 2, pageHeight / 2 - 10, { align: 'center' });
    
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Spanish Version', pageWidth / 2, pageHeight / 2 + 5, { align: 'center' });
    
    // Decorative line
    pdf.setDrawColor(150);
    pdf.setLineWidth(0.5);
    pdf.line(pageWidth / 4, pageHeight / 2 + 20, pageWidth * 3 / 4, pageHeight / 2 + 20);
    
    // Page footer
    pdf.setFontSize(8);
    pdf.setTextColor(100);
    pdf.text(`Page ${baseContext.pageNumber}`, pageWidth - 30, pageHeight - 6);
    pdf.setTextColor(0);
  }

  // Generate Spanish version
  if (reportLanguage === 'es' || reportLanguage === 'both') {
    await generateForLanguage('es');
  }

  return pdf.output('blob');
}

// Re-export the simple PDF generator for backward compatibility
export { generateInspectionPDF } from '@/lib/pdfGenerator';
export { generateReportPDF } from '@/lib/reportPdfGenerator';
