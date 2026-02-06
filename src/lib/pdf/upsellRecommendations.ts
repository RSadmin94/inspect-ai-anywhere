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

// Service definitions (icon and priority only)
interface ServiceDefinition {
  serviceEs: string;
  icon: string;
  priority: 'high' | 'medium' | 'low';
}

const SERVICE_DEFINITIONS: Record<string, ServiceDefinition> = {
  'Sewer Camera Inspection': { serviceEs: 'Inspección con Cámara de Alcantarillado', icon: '📹', priority: 'high' },
  'Mold Inspection': { serviceEs: 'Inspección de Moho', icon: '🔬', priority: 'high' },
  'Radon Testing': { serviceEs: 'Prueba de Radón', icon: '☢️', priority: 'medium' },
  'Electrical Panel Inspection': { serviceEs: 'Inspección del Panel Eléctrico', icon: '⚡', priority: 'high' },
  'HVAC Duct Cleaning Assessment': { serviceEs: 'Evaluación de Limpieza de Ductos HVAC', icon: '🌬️', priority: 'low' },
  'Chimney/Fireplace Inspection': { serviceEs: 'Inspección de Chimenea/Hogar', icon: '🔥', priority: 'medium' },
  'Pool/Spa Inspection': { serviceEs: 'Inspección de Piscina/Spa', icon: '🏊', priority: 'medium' },
  'Termite/WDO Inspection': { serviceEs: 'Inspección de Termitas/WDO', icon: '🐜', priority: 'high' },
  'Foundation/Structural Evaluation': { serviceEs: 'Evaluación de Cimientos/Estructural', icon: '🏗️', priority: 'high' },
  'Lead Paint Testing': { serviceEs: 'Prueba de Pintura con Plomo', icon: '🎨', priority: 'medium' },
  'Asbestos Testing': { serviceEs: 'Prueba de Asbesto', icon: '⚠️', priority: 'high' },
  'Well Water Testing': { serviceEs: 'Prueba de Agua de Pozo', icon: '💧', priority: 'high' },
  'Septic System Inspection': { serviceEs: 'Inspección del Sistema Séptico', icon: '🚽', priority: 'high' },
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
  // Electrical
  {
    service: 'Electrical Panel Inspection',
    reason: 'Electrical system concerns or older wiring observed',
    reasonEs: 'Se observaron problemas del sistema eléctrico o cableado antiguo',
    keywords: ['electric', 'panel', 'wiring', 'outlet', 'aluminum', 'fuse', 'breaker', 'knob and tube'],
  },
  // Chimney
  {
    service: 'Chimney/Fireplace Inspection',
    reason: 'Wood-burning fireplace present; safety evaluation recommended',
    reasonEs: 'Chimenea de leña presente; se recomienda evaluación de seguridad',
    keywords: ['chimney', 'fireplace', 'flue', 'hearth', 'wood burn'],
  },
  // Termite
  {
    service: 'Termite/WDO Inspection',
    reason: 'Wood damage or conducive conditions observed',
    reasonEs: 'Se observaron daños en la madera o condiciones propicias',
    keywords: ['wood', 'rot', 'decay', 'bore', 'termite', 'pest', 'insect', 'fungus'],
  },
  // Foundation
  {
    service: 'Foundation/Structural Evaluation',
    reason: 'Cracking or settlement indicators warrant specialist review',
    reasonEs: 'Los indicadores de agrietamiento o asentamiento justifican revisión especializada',
    keywords: ['foundation', 'crack', 'settlement', 'structural', 'bow', 'shift', 'movement'],
  },
  // HVAC
  {
    service: 'HVAC Duct Cleaning Assessment',
    reason: 'Visible debris or HVAC system concerns',
    reasonEs: 'Escombros visibles o problemas del sistema HVAC',
    keywords: ['hvac', 'duct', 'air quality', 'filter', 'debris'],
  },
  // Well
  {
    service: 'Well Water Testing',
    reason: 'Private well system requires water quality testing',
    reasonEs: 'El sistema de pozo privado requiere prueba de calidad del agua',
    keywords: ['well', 'well water', 'private well'],
  },
  // Septic
  {
    service: 'Septic System Inspection',
    reason: 'Septic system present; pump and inspection recommended',
    reasonEs: 'Sistema séptico presente; se recomienda bombeo e inspección',
    keywords: ['septic', 'septic system', 'septic tank', 'leach field', 'drain field'],
  },
  // Pool
  {
    service: 'Pool/Spa Inspection',
    reason: 'Pool or spa equipment requires specialized evaluation',
    reasonEs: 'El equipo de piscina o spa requiere evaluación especializada',
    keywords: ['pool', 'spa', 'hot tub', 'swimming'],
  },
];

// Category triggers with specific reasons
const CATEGORY_TRIGGERS: { category: string; service: string; reason: string; reasonEs: string }[] = [
  { category: 'plumbing', service: 'Sewer Camera Inspection', reason: 'Plumbing defects identified during inspection', reasonEs: 'Se identificaron defectos de plomería durante la inspección' },
  { category: 'electrical', service: 'Electrical Panel Inspection', reason: 'Electrical defects identified during inspection', reasonEs: 'Se identificaron defectos eléctricos durante la inspección' },
  { category: 'foundation', service: 'Foundation/Structural Evaluation', reason: 'Foundation concerns identified during inspection', reasonEs: 'Se identificaron problemas de cimientos durante la inspección' },
  { category: 'roofing', service: 'Chimney/Fireplace Inspection', reason: 'Roof/chimney area requires specialized evaluation', reasonEs: 'El área del techo/chimenea requiere evaluación especializada' },
  { category: 'hvac', service: 'HVAC Duct Cleaning Assessment', reason: 'HVAC system concerns identified', reasonEs: 'Se identificaron problemas del sistema HVAC' },
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
    const key = `${service}::${reason}`;
    if (!reasonsMap.has(key)) {
      reasonsMap.set(key, { service, reason, reasonEs });
    }
  };

  // Calculate house age if year built is provided
  const currentYear = new Date().getFullYear();
  const houseAge = yearBuilt ? currentYear - yearBuilt : null;

  // Age-based recommendations with specific reasons
  if (houseAge !== null && yearBuilt) {
    if (yearBuilt < 1978) {
      addReason('Lead Paint Testing', 'Home built before 1978 may contain lead-based paint', 'Casa construida antes de 1978 puede contener pintura a base de plomo');
    }
    
    if (yearBuilt < 1980) {
      addReason('Asbestos Testing', 'Home built before 1980 may contain asbestos materials', 'Casa construida antes de 1980 puede contener materiales con asbesto');
    }
    
    if (houseAge > 30) {
      addReason('Sewer Camera Inspection', `Home is ${houseAge} years old; sewer line evaluation recommended`, `La casa tiene ${houseAge} años; se recomienda evaluación de la línea de alcantarillado`);
    }
    
    if (houseAge > 40) {
      addReason('Electrical Panel Inspection', `Home is ${houseAge} years old; electrical system evaluation recommended`, `La casa tiene ${houseAge} años; se recomienda evaluación del sistema eléctrico`);
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

    // Check keyword triggers - each trigger has its own specific reason
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

    // Severity-based triggers
    if (photo.aiSeverity === 'severe') {
      if (category.includes('foundation') || category.includes('structural')) {
        addReason('Foundation/Structural Evaluation', 'Severe structural concerns require specialist evaluation', 'Problemas estructurales severos requieren evaluación especializada');
      }
      if (category.includes('electric')) {
        addReason('Electrical Panel Inspection', 'Severe electrical concerns require specialist evaluation', 'Problemas eléctricos severos requieren evaluación especializada');
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
  
  // Limit to top 8 recommendations (increased since we show specific reasons)
  return result.slice(0, 8);
}

export function getUpsellLabel(priority: 'high' | 'medium' | 'low', lang: Language): string {
  const labels = {
    high: { en: 'Highly Recommended', es: 'Muy Recomendado' },
    medium: { en: 'Recommended', es: 'Recomendado' },
    low: { en: 'Consider', es: 'Considerar' },
  };
  return labels[priority][lang];
}
