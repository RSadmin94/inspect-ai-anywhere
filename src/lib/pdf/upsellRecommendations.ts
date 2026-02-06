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

// All available upsell services
const UPSELL_SERVICES: UpsellRecommendation[] = [
  {
    service: 'Mold Inspection',
    serviceEs: 'Inspección de Moho',
    reason: 'Water staining or moisture indicators observed',
    reasonEs: 'Se observaron manchas de agua o indicadores de humedad',
    icon: '🔬',
    priority: 'high',
  },
  {
    service: 'Sewer Camera Inspection',
    serviceEs: 'Inspección con Cámara de Alcantarillado',
    reason: 'Plumbing age, drainage concerns, or trees near sewer line identified',
    reasonEs: 'Se identificaron antigüedad de plomería, problemas de drenaje, o árboles cerca de la línea de alcantarillado',
    icon: '📹',
    priority: 'high',
  },
  {
    service: 'Radon Testing',
    serviceEs: 'Prueba de Radón',
    reason: 'Recommended for all homes with basements or slab foundations',
    reasonEs: 'Recomendado para todas las casas con sótanos o cimientos de losa',
    icon: '☢️',
    priority: 'medium',
  },
  {
    service: 'Electrical Panel Inspection',
    serviceEs: 'Inspección del Panel Eléctrico',
    reason: 'Older electrical system or aluminum wiring indicators',
    reasonEs: 'Sistema eléctrico antiguo o indicadores de cableado de aluminio',
    icon: '⚡',
    priority: 'high',
  },
  {
    service: 'HVAC Duct Cleaning Assessment',
    serviceEs: 'Evaluación de Limpieza de Ductos HVAC',
    reason: 'Visible debris or age of HVAC system',
    reasonEs: 'Escombros visibles o antigüedad del sistema HVAC',
    icon: '🌬️',
    priority: 'low',
  },
  {
    service: 'Chimney/Fireplace Inspection',
    serviceEs: 'Inspección de Chimenea/Hogar',
    reason: 'Wood-burning fireplace present; safety evaluation recommended',
    reasonEs: 'Chimenea de leña presente; se recomienda evaluación de seguridad',
    icon: '🔥',
    priority: 'medium',
  },
  {
    service: 'Pool/Spa Inspection',
    serviceEs: 'Inspección de Piscina/Spa',
    reason: 'Pool or spa equipment requires specialized evaluation',
    reasonEs: 'El equipo de piscina o spa requiere evaluación especializada',
    icon: '🏊',
    priority: 'medium',
  },
  {
    service: 'Termite/WDO Inspection',
    serviceEs: 'Inspección de Termitas/WDO',
    reason: 'Wood damage or conducive conditions observed',
    reasonEs: 'Se observaron daños en la madera o condiciones propicias',
    icon: '🐜',
    priority: 'high',
  },
  {
    service: 'Foundation/Structural Evaluation',
    serviceEs: 'Evaluación de Cimientos/Estructural',
    reason: 'Cracking or settlement indicators warrant specialist review',
    reasonEs: 'Los indicadores de agrietamiento o asentamiento justifican revisión especializada',
    icon: '🏗️',
    priority: 'high',
  },
  {
    service: 'Lead Paint Testing',
    serviceEs: 'Prueba de Pintura con Plomo',
    reason: 'Home built before 1978 may contain lead-based paint',
    reasonEs: 'Casa construida antes de 1978 puede contener pintura a base de plomo',
    icon: '🎨',
    priority: 'medium',
  },
  {
    service: 'Asbestos Testing',
    serviceEs: 'Prueba de Asbesto',
    reason: 'Older materials present that may contain asbestos',
    reasonEs: 'Materiales antiguos presentes que pueden contener asbesto',
    icon: '⚠️',
    priority: 'high',
  },
  {
    service: 'Well Water Testing',
    serviceEs: 'Prueba de Agua de Pozo',
    reason: 'Private well system requires water quality testing',
    reasonEs: 'El sistema de pozo privado requiere prueba de calidad del agua',
    icon: '💧',
    priority: 'high',
  },
  {
    service: 'Septic System Inspection',
    serviceEs: 'Inspección del Sistema Séptico',
    reason: 'Septic system present; pump and inspection recommended',
    reasonEs: 'Sistema séptico presente; se recomienda bombeo e inspección',
    icon: '🚽',
    priority: 'high',
  },
];

// Keywords that trigger specific upsell recommendations
const TRIGGER_KEYWORDS: Record<string, string[]> = {
  'Mold Inspection': ['water', 'moisture', 'stain', 'leak', 'damp', 'mold', 'mildew', 'humidity', 'condensation'],
  'Sewer Camera Inspection': [
    'plumb', 'drain', 'sewer', 'pipe', 'slow drain', 'backup', 'cast iron', 'galvanized',
    // Tree/root intrusion triggers
    'tree', 'trees', 'root', 'roots', 'intrusion', 'root intrusion', 'vegetation', 
    'mature tree', 'large tree', 'oak', 'maple', 'willow', 'main line', 'lateral',
    'clay pipe', 'terracotta', 'orangeburg', 'bellied', 'belly', 'offset joint'
  ],
  'Electrical Panel Inspection': ['electric', 'panel', 'wiring', 'outlet', 'aluminum', 'fuse', 'breaker', 'knob and tube'],
  'Chimney/Fireplace Inspection': ['chimney', 'fireplace', 'flue', 'hearth', 'wood burn'],
  'Termite/WDO Inspection': ['wood', 'rot', 'decay', 'bore', 'termite', 'pest', 'insect', 'fungus'],
  'Foundation/Structural Evaluation': ['foundation', 'crack', 'settlement', 'structural', 'bow', 'shift', 'movement'],
  'HVAC Duct Cleaning Assessment': ['hvac', 'duct', 'air quality', 'filter', 'debris'],
};

// Categories that trigger specific upsells
const CATEGORY_TRIGGERS: Record<string, string[]> = {
  'plumbing': ['Sewer Camera Inspection'],
  'electrical': ['Electrical Panel Inspection'],
  'foundation': ['Foundation/Structural Evaluation'],
  'roofing': ['Chimney/Fireplace Inspection'],
  'hvac': ['HVAC Duct Cleaning Assessment'],
};

export function generateUpsellRecommendations(
  inspection: InspectionRecord,
  photos: PhotoRecord[],
  lang: Language,
  yearBuilt?: number
): UpsellRecommendation[] {
  const recommendations: Set<string> = new Set();
  const result: UpsellRecommendation[] = [];

  // Calculate house age if year built is provided
  const currentYear = new Date().getFullYear();
  const houseAge = yearBuilt ? currentYear - yearBuilt : null;

  // Age-based recommendations
  if (houseAge !== null && yearBuilt) {
    // Pre-1978: Lead paint risk
    if (yearBuilt < 1978) {
      recommendations.add('Lead Paint Testing');
    }
    
    // Pre-1980: Asbestos risk
    if (yearBuilt < 1980) {
      recommendations.add('Asbestos Testing');
    }
    
    // Older than 30 years: Sewer camera recommended
    if (houseAge > 30) {
      recommendations.add('Sewer Camera Inspection');
    }
    
    // Older than 40 years: Electrical inspection
    if (houseAge > 40) {
      recommendations.add('Electrical Panel Inspection');
    }
  }

  // Always recommend radon testing (universal recommendation)
  recommendations.add('Radon Testing');

  // Analyze findings for trigger keywords
  for (const photo of photos) {
    // Parse full analysis JSON if available for observation/implication
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
    for (const [service, keywords] of Object.entries(TRIGGER_KEYWORDS)) {
      if (keywords.some(keyword => textToAnalyze.includes(keyword))) {
        recommendations.add(service);
      }
    }

    // Check category triggers
    const category = photo.aiCategory?.toLowerCase() || '';
    for (const [cat, services] of Object.entries(CATEGORY_TRIGGERS)) {
      if (category.includes(cat)) {
        services.forEach(s => recommendations.add(s));
      }
    }

    // Severity-based triggers
    if (photo.aiSeverity === 'severe') {
      // High severity findings often warrant specialist evaluation
      if (category.includes('foundation') || category.includes('structural')) {
        recommendations.add('Foundation/Structural Evaluation');
      }
      if (category.includes('electric')) {
        recommendations.add('Electrical Panel Inspection');
      }
    }
  }

  // Convert to result array, sorted by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  
  for (const serviceName of recommendations) {
    const service = UPSELL_SERVICES.find(s => s.service === serviceName);
    if (service) {
      result.push(service);
    }
  }

  // Sort by priority and limit to top 5
  result.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  
  return result.slice(0, 5);
}

export function getUpsellLabel(priority: 'high' | 'medium' | 'low', lang: Language): string {
  const labels = {
    high: { en: 'Highly Recommended', es: 'Muy Recomendado' },
    medium: { en: 'Recommended', es: 'Recomendado' },
    low: { en: 'Consider', es: 'Considerar' },
  };
  return labels[priority][lang];
}
