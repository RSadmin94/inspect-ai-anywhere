import { jsPDF } from 'jspdf';
import { PhotoRecord, InspectionRecord } from '@/lib/db';
import { CompanyProfile } from '@/lib/companyProfile';
import { Language } from '@/lib/i18n';

export type ReportLanguage = 'en' | 'es' | 'both';

// Finding status labels for categorization
export type FindingStatus = 'safety' | 'repair' | 'maintenance' | 'monitor' | 'satisfactory';

export const findingStatusLabels: Record<FindingStatus, { en: string; es: string }> = {
  safety: { en: 'Safety Concern', es: 'Preocupación de Seguridad' },
  repair: { en: 'Repair Recommended', es: 'Reparación Recomendada' },
  maintenance: { en: 'Maintenance', es: 'Mantenimiento' },
  monitor: { en: 'Monitor', es: 'Monitorear' },
  satisfactory: { en: 'Satisfactory', es: 'Satisfactorio' },
};

export const findingStatusColors: Record<FindingStatus, [number, number, number]> = {
  safety: [220, 38, 38],      // Red
  repair: [234, 88, 12],      // Orange
  maintenance: [202, 138, 4], // Yellow
  monitor: [100, 149, 237],   // Blue
  satisfactory: [34, 197, 94], // Green
};

// Map severity to finding status
export function severityToStatus(severity: string): FindingStatus {
  switch (severity?.toLowerCase()) {
    case 'severe':
      return 'safety';
    case 'moderate':
      return 'repair';
    case 'minor':
      return 'maintenance';
    default:
      return 'monitor';
  }
}

export interface DeferredItem {
  area: string;
  reason: string;
}

// Ancillary section types (Radon, WDI, Mold)
export type AncillarySectionType = 'radon' | 'wdi' | 'mold';
export type AncillaryResult = 'safety' | 'repair' | 'maintenance' | 'monitor' | 'satisfactory' | 'not_tested';

export interface AncillarySection {
  type: AncillarySectionType;
  enabled: boolean;
  title: string;
  titleEs?: string;
  scope: string;
  scopeEs?: string;
  limitations: string;
  limitationsEs?: string;
  findings: string;
  findingsEs?: string;
  result: AncillaryResult;
  recommendation: string;
  recommendationEs?: string;
  photoIds?: string[]; // Optional photos associated with this section
}

export interface ReportOptions {
  inspection: InspectionRecord;
  photos: PhotoRecord[];
  reportLanguage: ReportLanguage;
  disclaimers: string[];
  roomOrder: string[];
  includeTableOfContents?: boolean;
  includeIntroduction?: boolean;
  includeConclusion?: boolean;
  deferredItems?: DeferredItem[];
  maintenanceRecommendations?: string[];
  ancillarySections?: AncillarySection[];
}

export interface PDFContext {
  pdf: jsPDF;
  companyProfile: CompanyProfile;
  companyLogo: string | null;
  customRoomMap: Map<string, { id: string; name: string; nameEs?: string }>;
  pageWidth: number;
  pageHeight: number;
  margin: number;
  contentWidth: number;
  yPos: number;
  pageNumber: number;
  sectionNumber: number;
  tocEntries: TOCEntry[];
  language: Language;
  // Section page numbers for navigation tab links
  sectionPageNumbers: Map<string, number>;
  // Track pages that have tab headers so we can re-draw them at the end
  tabbedPages: Array<{ pageNumber: number; activeSection: string }>;
}

export interface TOCEntry {
  title: string;
  pageNumber: number;
  level: number;
}

// Section configuration for Table of Contents
export interface SectionConfig {
  id: string;
  titleEn: string;
  titleEs: string;
  includeInToc: boolean;
}

export const REPORT_SECTIONS: SectionConfig[] = [
  { id: 'cover', titleEn: 'Cover Page', titleEs: 'Página de Portada', includeInToc: false },
  { id: 'agent-summary', titleEn: 'Agent-Friendly Summary', titleEs: 'Resumen para Agentes', includeInToc: true },
  { id: 'toc', titleEn: 'Table of Contents', titleEs: 'Índice', includeInToc: false },
  { id: 'summary', titleEn: 'Inspection Summary', titleEs: 'Resumen de Inspección', includeInToc: true },
  { id: 'scope', titleEn: 'Scope, Standards & Limitations', titleEs: 'Alcance, Normas y Limitaciones', includeInToc: true },
  { id: 'findings', titleEn: 'System-by-System Findings', titleEs: 'Hallazgos por Sistema', includeInToc: true },
  { id: 'deferred', titleEn: 'Deferred / Not Inspected Items', titleEs: 'Elementos Diferidos / No Inspeccionados', includeInToc: true },
  { id: 'maintenance', titleEn: 'Maintenance Recommendations', titleEs: 'Recomendaciones de Mantenimiento', includeInToc: true },
  { id: 'radon', titleEn: 'Radon Testing', titleEs: 'Prueba de Radón', includeInToc: true },
  { id: 'wdi', titleEn: 'Wood-Destroying Insect Inspection', titleEs: 'Inspección de Insectos Destructores de Madera', includeInToc: true },
  { id: 'mold', titleEn: 'Mold Assessment', titleEs: 'Evaluación de Moho', includeInToc: true },
  { id: 'disclaimers', titleEn: 'Disclaimers', titleEs: 'Descargos de Responsabilidad', includeInToc: true },
  { id: 'credentials', titleEn: 'Inspector Credentials', titleEs: 'Credenciales del Inspector', includeInToc: true },
];
