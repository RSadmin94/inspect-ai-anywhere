import { jsPDF } from 'jspdf';
import { PhotoRecord, InspectionRecord } from '@/lib/db';
import { CompanyProfile } from '@/lib/companyProfile';
import { Language } from '@/lib/i18n';

export type ReportLanguage = 'en' | 'es' | 'both';

// Finding status labels for categorization
export type FindingStatus = 'safety' | 'repair' | 'maintenance' | 'monitor';

export const findingStatusLabels: Record<FindingStatus, { en: string; es: string }> = {
  safety: { en: 'Safety Concern', es: 'Preocupación de Seguridad' },
  repair: { en: 'Repair Needed', es: 'Reparación Necesaria' },
  maintenance: { en: 'Maintenance', es: 'Mantenimiento' },
  monitor: { en: 'Monitor', es: 'Monitorear' },
};

export const findingStatusColors: Record<FindingStatus, [number, number, number]> = {
  safety: [220, 20, 60],    // Red
  repair: [255, 140, 0],    // Orange
  maintenance: [255, 193, 7], // Yellow
  monitor: [100, 149, 237],  // Blue
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
  { id: 'toc', titleEn: 'Table of Contents', titleEs: 'Índice', includeInToc: false },
  { id: 'summary', titleEn: 'Inspection Summary', titleEs: 'Resumen de Inspección', includeInToc: true },
  { id: 'scope', titleEn: 'Scope, Standards & Limitations', titleEs: 'Alcance, Normas y Limitaciones', includeInToc: true },
  { id: 'findings', titleEn: 'System-by-System Findings', titleEs: 'Hallazgos por Sistema', includeInToc: true },
  { id: 'deferred', titleEn: 'Deferred / Not Inspected Items', titleEs: 'Elementos Diferidos / No Inspeccionados', includeInToc: true },
  { id: 'maintenance', titleEn: 'Maintenance Recommendations', titleEs: 'Recomendaciones de Mantenimiento', includeInToc: true },
  { id: 'disclaimers', titleEn: 'Disclaimers', titleEs: 'Descargos de Responsabilidad', includeInToc: true },
  { id: 'credentials', titleEn: 'Inspector Credentials', titleEs: 'Credenciales del Inspector', includeInToc: true },
];
