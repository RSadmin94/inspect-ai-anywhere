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
  { id: 'summary', labelEn: 'SUMMARY', labelEs: 'RESUMEN', color: [60, 60, 60] },          // Dark gray
  { id: 'exterior', labelEn: 'EXTERIOR', labelEs: 'EXTERIOR', color: [76, 140, 43] },      // Green
  { id: 'roofing', labelEn: 'ROOFING', labelEs: 'TECHO', color: [76, 140, 43] },           // Green
  { id: 'structure', labelEn: 'STRUCTURE', labelEs: 'ESTRUCTURA', color: [128, 128, 128] }, // Gray
  { id: 'interior', labelEn: 'INTERIOR', labelEs: 'INTERIOR', color: [76, 140, 43] },      // Green
  { id: 'plumbing', labelEn: 'PLUMBING', labelEs: 'PLOMERÍA', color: [70, 130, 180] },     // Steel blue
  { id: 'electrical', labelEn: 'ELECTRICAL', labelEs: 'ELÉCTRICO', color: [212, 175, 55] }, // Gold/Yellow
  { id: 'heating', labelEn: 'HEATING', labelEs: 'CALEFACCIÓN', color: [180, 60, 60] },     // Red
  { id: 'cooling', labelEn: 'COOLING', labelEs: 'ENFRIAMIENTO', color: [70, 130, 180] },   // Steel blue
  { id: 'insulation', labelEn: 'INSULATION', labelEs: 'AISLAMIENTO', color: [128, 128, 128] }, // Gray
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
  if (roomLower === 'roof' || roomLower.includes('roof')) return 'roofing';
  
  // Exterior & outdoor areas
  if (roomLower === 'exterior' || roomLower === 'driveway' ||
      roomLower.includes('porch') || roomLower.includes('deck') || roomLower.includes('patio') ||
      roomLower === 'yard' || roomLower.includes('landscaping') || roomLower === 'pool' ||
      roomLower === 'garage') return 'exterior';
  
  // Structure / Foundation
  if (roomLower.includes('foundation') || roomLower === 'crawlspace' || roomLower === 'crawl space' ||
      roomLower.includes('basement') || roomLower.includes('structural')) return 'structure';
  
  // Interior - all livable rooms
  if (roomLower === 'interior' || roomLower.includes('bedroom') || roomLower === 'mainbedroom' ||
      roomLower.includes('living') || roomLower === 'livingroom' || 
      roomLower.includes('dining') || roomLower === 'diningroom' ||
      roomLower.includes('kitchen') || 
      roomLower.includes('bath') || roomLower === 'masterbath' || roomLower === 'halfbath' ||
      roomLower.includes('hallway') || roomLower.includes('stairs') || roomLower.includes('closet') ||
      roomLower.includes('office') || roomLower.includes('laundry') || roomLower === 'laundryroom' ||
      roomLower.includes('utility') || roomLower === 'utilityroom' ||
      roomLower.includes('fireplace') || roomLower === 'other') return 'interior';
  
  // Electrical
  if (roomLower.includes('electrical') || roomLower === 'electricalpanel') return 'electrical';
  
  // Plumbing
  if (roomLower.includes('plumbing') || roomLower === 'waterheater' || roomLower.includes('water heater') ||
      roomLower.includes('sewer')) return 'plumbing';
  
  // Heating
  if (roomLower.includes('furnace') || roomLower.includes('heating') || roomLower === 'hvac') return 'heating';
  
  // Cooling
  if (roomLower.includes('cooling') || roomLower === 'ac' || roomLower.includes('air condition')) return 'cooling';
  
  // Insulation
  if (roomLower.includes('insulation') || roomLower.includes('ventilation') || 
      roomLower === 'attic') return 'insulation';
  
  // Default fallback
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
    
    // Add clickable internal link to section page if available
    const sectionPageNum = ctx.sectionPageNumbers?.get(tab.id);
    if (sectionPageNum && sectionPageNum > 0) {
      // Create internal link to the section's page
      pdf.link(tabX, tabBarY, tabWidth, tabHeight, { pageNumber: sectionPageNum });
    }
    
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
 * Add page header with navigation tabs for a new page.
 * Also records this page for later re-drawing with complete links.
 */
export function addPageHeaderWithTabs(
  ctx: PDFContext,
  inspection: InspectionRecord,
  activeSection: string,
  lang: Language
): void {
  // Record this page so we can re-draw tabs with all links later
  if (ctx.tabbedPages) {
    ctx.tabbedPages.push({ pageNumber: ctx.pageNumber, activeSection });
  }
  drawNavigationTabs(ctx, inspection, activeSection, lang);
}

/**
 * After all sections are rendered and sectionPageNumbers is complete,
 * re-draw the tab bars on every tabbed page so all links are active.
 */
export function finalizeTabLinks(
  ctx: PDFContext,
  inspection: InspectionRecord,
  lang: Language
): void {
  if (!ctx.tabbedPages || ctx.tabbedPages.length === 0) return;
  
  const savedPage = ctx.pageNumber;
  const savedYPos = ctx.yPos;
  
  for (const { pageNumber, activeSection } of ctx.tabbedPages) {
    ctx.pdf.setPage(pageNumber);
    ctx.yPos = ctx.margin;
    drawNavigationTabs(ctx, inspection, activeSection, lang);
  }
  
  // Restore position
  ctx.pdf.setPage(savedPage);
  ctx.pageNumber = savedPage;
  ctx.yPos = savedYPos;
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
