import { PhotoRecord, InspectionRecord } from '@/lib/db';
import { Language } from '@/lib/i18n';

export interface UpsellRecommendation {
  service: string;
  serviceEs: string;
  reason: string;
  reasonEs: string;
  icon: string;
  priority: 'high' | 'medium' | 'low';
}

// Service definitions - ONLY services the inspector offers
interface ServiceDefinition {
  serviceEs: string;
  icon: string;
  priority: 'high' | 'medium' | 'low';
}

const SERVICE_DEFINITIONS: Record<string, ServiceDefinition> = {
  'Sewer Camera Inspection': { serviceEs: 'Inspección con Cámara de Alcantarillado', icon: '📹', priority: 'high' },
  'Mold Inspection': { serviceEs: 'Inspección de Moho', icon: '🔬', priority: 'high' },
  'Radon Testing': { serviceEs: 'Prueba de Radón', icon: '☢️', priority: 'medium' },
};

// Specific trigger reasons with their keywords
interface TriggerReason {
  service: string;
  reason: string;
  reasonEs: string;
  keywords: string[];
}

const KEYWORD_TRIGGERS: TriggerReason[] = [
  // Sewer Camera - Multiple specific reasons
  {
    service: 'Sewer Camera Inspection',
    reason: 'Trees or vegetation observed near sewer line',
    reasonEs: 'Se observaron árboles o vegetación cerca de la línea de alcantarillado',
    keywords: ['tree', 'trees', 'root', 'roots', 'intrusion', 'root intrusion', 'vegetation', 'mature tree', 'large tree', 'oak', 'maple', 'willow'],
  },
  {
    service: 'Sewer Camera Inspection',
    reason: 'Drainage issues or slow drains observed',
    reasonEs: 'Se observaron problemas de drenaje o desagües lentos',
    keywords: ['slow drain', 'backup', 'drain', 'drainage', 'clog', 'blockage'],
  },
  {
    service: 'Sewer Camera Inspection',
    reason: 'Older pipe materials present (cast iron, galvanized, clay)',
    reasonEs: 'Materiales de tubería antiguos presentes (hierro fundido, galvanizado, arcilla)',
    keywords: ['cast iron', 'galvanized', 'clay pipe', 'terracotta', 'orangeburg', 'bellied', 'belly', 'offset joint'],
  },
  {
    service: 'Sewer Camera Inspection',
    reason: 'Plumbing or sewer concerns identified',
    reasonEs: 'Se identificaron problemas de plomería o alcantarillado',
    keywords: ['plumb', 'sewer', 'pipe', 'main line', 'lateral'],
  },
  // Mold Inspection
  {
    service: 'Mold Inspection',
    reason: 'Water staining or moisture indicators observed',
    reasonEs: 'Se observaron manchas de agua o indicadores de humedad',
    keywords: ['water', 'moisture', 'stain', 'leak', 'damp', 'mold', 'mildew', 'humidity', 'condensation'],
  },
];

// Category triggers
const CATEGORY_TRIGGERS: { category: string; service: string; reason: string; reasonEs: string }[] = [
  { category: 'plumbing', service: 'Sewer Camera Inspection', reason: 'Plumbing defects identified during inspection', reasonEs: 'Se identificaron defectos de plomería durante la inspección' },
];

interface ReasonEntry {
  service: string;
  reason: string;
  reasonEs: string;
}

export function generateUpsellRecommendations(
  inspection: InspectionRecord,
  photos: PhotoRecord[],
  lang: Language,
  yearBuilt?: number
): UpsellRecommendation[] {
  // Track unique reasons (service + reason combination)
  const reasonsMap = new Map<string, ReasonEntry>();
  
  const addReason = (service: string, reason: string, reasonEs: string) => {
    // Only add if it's a service we offer
    if (!SERVICE_DEFINITIONS[service]) return;
    
    const key = `${service}::${reason}`;
    if (!reasonsMap.has(key)) {
      reasonsMap.set(key, { service, reason, reasonEs });
    }
  };

  // Calculate house age if year built is provided
  const currentYear = new Date().getFullYear();
  const houseAge = yearBuilt ? currentYear - yearBuilt : null;

  // Age-based recommendations
  if (houseAge !== null && yearBuilt) {
    // Older than 30 years: Sewer camera recommended
    if (houseAge > 30) {
      addReason('Sewer Camera Inspection', `Home is ${houseAge} years old; sewer line evaluation recommended`, `La casa tiene ${houseAge} años; se recomienda evaluación de la línea de alcantarillado`);
    }
  }

  // Always recommend radon testing
  addReason('Radon Testing', 'Recommended for all homes with basements or slab foundations', 'Recomendado para todas las casas con sótanos o cimientos de losa');

  // Analyze findings for trigger keywords
  for (const photo of photos) {
    // Parse full analysis JSON if available
    let observation = '';
    let implication = '';
    if (photo.aiFullAnalysis) {
      try {
        const analysis = JSON.parse(photo.aiFullAnalysis);
        observation = analysis.findings?.[0]?.observation || '';
        implication = analysis.findings?.[0]?.implication || '';
      } catch {}
    }
    
    const textToAnalyze = [
      photo.aiFindingTitle,
      photo.aiDescription,
      photo.aiRecommendation,
      observation,
      implication,
      photo.notes,
    ].filter(Boolean).join(' ').toLowerCase();

    // Check keyword triggers
    for (const trigger of KEYWORD_TRIGGERS) {
      if (trigger.keywords.some(keyword => textToAnalyze.includes(keyword))) {
        addReason(trigger.service, trigger.reason, trigger.reasonEs);
      }
    }

    // Check category triggers
    const category = photo.aiCategory?.toLowerCase() || '';
    for (const catTrigger of CATEGORY_TRIGGERS) {
      if (category.includes(catTrigger.category)) {
        addReason(catTrigger.service, catTrigger.reason, catTrigger.reasonEs);
      }
    }
  }

  // Convert to result array
  const result: UpsellRecommendation[] = [];
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  
  for (const entry of reasonsMap.values()) {
    const def = SERVICE_DEFINITIONS[entry.service];
    if (def) {
      result.push({
        service: entry.service,
        serviceEs: def.serviceEs,
        reason: entry.reason,
        reasonEs: entry.reasonEs,
        icon: def.icon,
        priority: def.priority,
      });
    }
  }

  // Sort by priority, then by service name for grouping
  result.sort((a, b) => {
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return a.service.localeCompare(b.service);
  });
  
  return result;
}

export function getUpsellLabel(priority: 'high' | 'medium' | 'low', lang: Language): string {
  const labels = {
    high: { en: 'Highly Recommended', es: 'Muy Recomendado' },
    medium: { en: 'Recommended', es: 'Recomendado' },
    low: { en: 'Consider', es: 'Considerar' },
  };
  return labels[priority][lang];
}
