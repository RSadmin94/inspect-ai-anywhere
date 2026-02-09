import { jsPDF } from 'jspdf';
import { PDFContext } from './reportTypes';
import { Language } from '@/lib/i18n';
import { InspectionRecord } from '@/lib/db';
import { formatDate } from './pdfUtils';

// Define the section tabs for the report navigation
export interface SectionTab {
  id: string;
  labelEn: string;
  labelEs: string;
  color: [number, number, number]; // RGB
}

// Navigation tabs matching the reference report layout
export const SECTION_TABS: SectionTab[] = [
  { id: 'summary', labelEn: 'SUMMARY', labelEs: 'RESUMEN', color: [60, 60, 60] },        // Dark gray
  { id: 'roofing', labelEn: 'ROOFING', labelEs: 'TECHO', color: [76, 140, 43] },         // Green
  { id: 'exterior', labelEn: 'EXTERIOR', labelEs: 'EXTERIOR', color: [76, 140, 43] },    // Green
  { id: 'structure', labelEn: 'STRUCTURE', labelEs: 'ESTRUCTURA', color: [128, 128, 128] }, // Gray
  { id: 'electrical', labelEn: 'ELECTRICAL', labelEs: 'ELÉCTRICO', color: [212, 175, 55] }, // Gold/Yellow
  { id: 'heating', labelEn: 'HEATING', labelEs: 'CALEFACCIÓN', color: [180, 60, 60] },   // Red
  { id: 'cooling', labelEn: 'COOLING', labelEs: 'ENFRIAMIENTO', color: [70, 130, 180] }, // Steel blue
  { id: 'insulation', labelEn: 'INSULATION', labelEs: 'AISLAMIENTO', color: [128, 128, 128] }, // Gray
  { id: 'plumbing', labelEn: 'PLUMBING', labelEs: 'PLOMERÍA', color: [70, 130, 180] },   // Steel blue
  { id: 'interior', labelEn: 'INTERIOR', labelEs: 'INTERIOR', color: [76, 140, 43] },    // Green
];

// Reference tab that appears below main tabs
export const REFERENCE_TAB: SectionTab = {
  id: 'reference',
  labelEn: 'REFERENCE',
  labelEs: 'REFERENCIA',
  color: [107, 142, 35], // Olive green
};

/**
 * Map room names to their corresponding section tab ID
 */
export function roomToTabId(room: string): string {
  const roomLower = room.toLowerCase();
  
  // Roofing
  if (roomLower.includes('roof') || roomLower === 'attic') return 'roofing';
  
  // Exterior
  if (roomLower.includes('exterior') || roomLower === 'garage' || roomLower === 'driveway' ||
      roomLower.includes('porch') || roomLower.includes('deck') || roomLower.includes('patio') ||
      roomLower === 'yard' || roomLower.includes('landscaping')) return 'exterior';
  
  // Structure
  if (roomLower.includes('foundation') || roomLower === 'crawlSpace' || roomLower.includes('basement') ||
      roomLower.includes('structural')) return 'structure';
  
  // Electrical
  if (roomLower.includes('electrical') || roomLower === 'electricalPanel') return 'electrical';
  
  // Heating
  if (roomLower.includes('furnace') || roomLower.includes('heating') || roomLower === 'hvac') return 'heating';
  
  // Cooling
  if (roomLower.includes('cooling') || roomLower === 'ac' || roomLower.includes('air condition')) return 'cooling';
  
  // Insulation
  if (roomLower.includes('insulation') || roomLower.includes('ventilation')) return 'insulation';
  
  // Plumbing
  if (roomLower.includes('plumbing') || roomLower === 'waterHeater' || roomLower.includes('water heater') ||
      roomLower.includes('sewer')) return 'plumbing';
  
  // Interior (default for rooms inside the house)
  return 'interior';
}

/**
 * Get the section tab label for a given tab ID
 */
export function getSectionLabel(tabId: string, lang: Language): string {
  const tab = SECTION_TABS.find(t => t.id === tabId) || SECTION_TABS[SECTION_TABS.length - 1];
  return lang === 'es' ? tab.labelEs : tab.labelEn;
}

/**
 * Draw the navigation tabs header on a page
 * This creates the colored tab bar similar to the reference report
 */
export function drawNavigationTabs(
  ctx: PDFContext,
  inspection: InspectionRecord,
  activeSection: string,
  lang: Language
): void {
  const { pdf, margin, pageWidth, companyProfile } = ctx;
  
  let yPos = margin - 5;
  
  // Section title (large, bold) - e.g., "SUMMARY", "ROOFING"
  const sectionLabel = getSectionLabel(activeSection, lang);
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text(sectionLabel, margin, yPos + 5);
  
  // Report info on right side
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100);
  const reportNum = `Report No. ${inspection.id.substring(0, 8)}`;
  pdf.text(reportNum, pageWidth - margin, yPos, { align: 'right' });
  
  if (companyProfile.website) {
    pdf.text(companyProfile.website, pageWidth - margin, yPos + 4, { align: 'right' });
  }
  pdf.setTextColor(0);
  
  // Property address and date below title
  yPos += 8;
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  const addressDate = `${inspection.propertyAddress}    ${formatDate(inspection.createdAt, lang)}`;
  pdf.text(addressDate, margin, yPos);
  yPos += 6;
  
  // Draw the navigation tabs bar
  const tabBarY = yPos;
  const tabHeight = 6;
  const totalTabsWidth = pageWidth - (margin * 2);
  const tabWidth = totalTabsWidth / SECTION_TABS.length;
  
  for (let i = 0; i < SECTION_TABS.length; i++) {
    const tab = SECTION_TABS[i];
    const tabX = margin + (i * tabWidth);
    const isActive = tab.id === activeSection;
    
    // Draw tab background
    if (isActive) {
      // Active tab - slightly brighter/highlighted
      pdf.setFillColor(tab.color[0], tab.color[1], tab.color[2]);
    } else {
      // Inactive tab - slightly darker
      pdf.setFillColor(
        Math.max(0, tab.color[0] - 20),
        Math.max(0, tab.color[1] - 20),
        Math.max(0, tab.color[2] - 20)
      );
    }
    
    pdf.rect(tabX, tabBarY, tabWidth, tabHeight, 'F');
    
    // Draw tab text
    pdf.setFontSize(5.5);
    pdf.setFont('helvetica', isActive ? 'bold' : 'normal');
    pdf.setTextColor(255, 255, 255);
    
    const label = lang === 'es' ? tab.labelEs : tab.labelEn;
    const textWidth = pdf.getTextWidth(label);
    const textX = tabX + (tabWidth - textWidth) / 2;
    pdf.text(label, textX, tabBarY + 4.2);
  }
  
  // Reset text color
  pdf.setTextColor(0);
  
  // Draw REFERENCE tab below (olive green)
  yPos = tabBarY + tabHeight + 1;
  const refTabWidth = 22;
  pdf.setFillColor(REFERENCE_TAB.color[0], REFERENCE_TAB.color[1], REFERENCE_TAB.color[2]);
  pdf.rect(margin, yPos, refTabWidth, 5, 'F');
  
  pdf.setFontSize(5);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(255, 255, 255);
  const refLabel = lang === 'es' ? REFERENCE_TAB.labelEs : REFERENCE_TAB.labelEn;
  pdf.text(refLabel, margin + 2, yPos + 3.5);
  pdf.setTextColor(0);
  
  // Update context yPos to after the header
  ctx.yPos = yPos + 10;
}

/**
 * Add page header with navigation tabs for a new page
 */
export function addPageHeaderWithTabs(
  ctx: PDFContext,
  inspection: InspectionRecord,
  activeSection: string,
  lang: Language
): void {
  drawNavigationTabs(ctx, inspection, activeSection, lang);
}

/**
 * Check if new page is needed and add header with tabs
 */
export function checkNewPageWithHeader(
  ctx: PDFContext,
  inspection: InspectionRecord,
  activeSection: string,
  lang: Language,
  neededSpace: number = 40
): boolean {
  if (ctx.yPos > ctx.pageHeight - neededSpace) {
    // Add footer to current page
    const { pdf, companyProfile, pageWidth, pageHeight, margin, pageNumber } = ctx;
    
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100);
    pdf.text(`${companyProfile.companyName}`, margin, pageHeight - 10);
    pdf.text(`Page ${pageNumber}`, pageWidth - margin - 15, pageHeight - 6);
    pdf.setTextColor(0);
    
    // Add new page
    ctx.pdf.addPage();
    ctx.pageNumber++;
    ctx.yPos = ctx.margin;
    
    // Add header with tabs to new page
    addPageHeaderWithTabs(ctx, inspection, activeSection, lang);
    
    return true;
  }
  return false;
}
