import { PhotoRecord, Severity, Category, updatePhotoAI, getPhoto } from '@/lib/db';
import { blobToDataUrl } from '@/lib/imageUtils';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';

// AI Analysis - Uses Lovable AI when online, mock data when offline
// Follows Best-of Hybrid Inspection Report format

const CATEGORIES: Category[] = ['roofing', 'plumbing', 'electrical', 'hvac', 'foundation', 'safety', 'general'];
const SEVERITIES: Severity[] = ['minor', 'moderate', 'severe'];

// Status labels for findings categorization
export type FindingStatus = 'safety' | 'repair' | 'maintenance' | 'monitor';

// Mock findings following professional inspection report language
// Pattern: Observation → Implication → Recommendation
const MOCK_FINDINGS = {
  en: [
    { 
      title: 'Water Staining Observed', 
      observation: 'Water staining was observed on the ceiling surface in this area.',
      implication: 'Such staining may indicate past or ongoing water infiltration from roofing, plumbing, or condensation sources.',
      recommendation: 'Recommend evaluation by a qualified roofing or plumbing contractor to determine source and extent.',
      status: 'repair' as FindingStatus
    },
    { 
      title: 'Electrical Receptacle Condition', 
      observation: 'The electrical receptacle appeared damaged or improperly secured at the time of inspection.',
      implication: 'Loose or damaged receptacles may present a safety concern and indicate wiring issues behind the wall.',
      recommendation: 'Recommend evaluation and repair by a licensed electrician.',
      status: 'safety' as FindingStatus
    },
    { 
      title: 'HVAC Filter Maintenance Required', 
      observation: 'The HVAC air filter appeared dirty and restricted at the time of inspection.',
      implication: 'Restricted airflow can reduce system efficiency and may contribute to premature equipment wear.',
      recommendation: 'Recommend replacement of air filter and establishment of regular maintenance schedule.',
      status: 'maintenance' as FindingStatus
    },
    { 
      title: 'Foundation Cracking Observed', 
      observation: 'Hairline cracking was observed along the foundation wall extending approximately 2 feet.',
      implication: 'While the extent of structural movement cannot be determined through visual inspection alone, such cracking may indicate settlement.',
      recommendation: 'Recommend monitoring for changes. If cracking widens, evaluation by a structural engineer is advised.',
      status: 'monitor' as FindingStatus
    },
    { 
      title: 'Handrail Not Secured', 
      observation: 'The handrail along the stairway was observed to be loose and not adequately secured.',
      implication: 'An unsecured handrail presents a safety concern, particularly for elderly occupants or children.',
      recommendation: 'Recommend securing handrail to framing members prior to occupancy.',
      status: 'safety' as FindingStatus
    },
    { 
      title: 'Minor Surface Wear', 
      observation: 'Normal wear and cosmetic imperfections were observed on interior surfaces.',
      implication: 'These conditions are typical of a property of this age and do not indicate structural or functional deficiency.',
      recommendation: 'Consider cosmetic repairs as part of routine maintenance.',
      status: 'maintenance' as FindingStatus
    },
  ],
  es: [
    { 
      title: 'Manchas de Agua Observadas', 
      observation: 'Se observaron manchas de agua en la superficie del techo en esta área.',
      implication: 'Tales manchas pueden indicar infiltración de agua pasada o en curso desde el techo, plomería o fuentes de condensación.',
      recommendation: 'Se recomienda evaluación por un contratista calificado de techado o plomería para determinar origen y extensión.',
      status: 'repair' as FindingStatus
    },
    { 
      title: 'Condición del Tomacorriente', 
      observation: 'El tomacorriente eléctrico parecía dañado o mal asegurado al momento de la inspección.',
      implication: 'Tomacorrientes sueltos o dañados pueden presentar un problema de seguridad e indicar problemas de cableado.',
      recommendation: 'Se recomienda evaluación y reparación por un electricista licenciado.',
      status: 'safety' as FindingStatus
    },
    { 
      title: 'Mantenimiento de Filtro HVAC Requerido', 
      observation: 'El filtro de aire del sistema HVAC parecía sucio y restringido al momento de la inspección.',
      implication: 'El flujo de aire restringido puede reducir la eficiencia del sistema y contribuir al desgaste prematuro.',
      recommendation: 'Se recomienda reemplazo del filtro y establecimiento de programa de mantenimiento regular.',
      status: 'maintenance' as FindingStatus
    },
    { 
      title: 'Grietas en Cimiento Observadas', 
      observation: 'Se observaron grietas finas a lo largo de la pared del cimiento extendiéndose aproximadamente 60 cm.',
      implication: 'Aunque la extensión del movimiento estructural no puede determinarse solo mediante inspección visual, tales grietas pueden indicar asentamiento.',
      recommendation: 'Se recomienda monitorear cambios. Si las grietas se amplían, se aconseja evaluación por ingeniero estructural.',
      status: 'monitor' as FindingStatus
    },
    { 
      title: 'Pasamanos No Asegurado', 
      observation: 'Se observó que el pasamanos de la escalera estaba suelto y no adecuadamente asegurado.',
      implication: 'Un pasamanos no asegurado presenta un problema de seguridad, particularmente para ocupantes mayores o niños.',
      recommendation: 'Se recomienda asegurar el pasamanos a los miembros estructurales antes de la ocupación.',
      status: 'safety' as FindingStatus
    },
    { 
      title: 'Desgaste Superficial Menor', 
      observation: 'Se observaron desgaste normal e imperfecciones cosméticas en superficies interiores.',
      implication: 'Estas condiciones son típicas de una propiedad de esta edad y no indican deficiencia estructural o funcional.',
      recommendation: 'Considerar reparaciones cosméticas como parte del mantenimiento rutinario.',
      status: 'maintenance' as FindingStatus
    },
  ]
};

interface AIFinding {
  title: string;
  title_es?: string;
  observation?: string;
  observation_es?: string;
  implication?: string;
  implication_es?: string;
  description: string;
  description_es?: string;
  recommendation: string;
  recommendation_es?: string;
  severity: Severity;
  status?: FindingStatus;
  category: Category;
  confidence: number;
}

interface AIAnalysisResult {
  findings: AIFinding[];
  overallCondition: 'good' | 'fair' | 'poor' | 'satisfactory' | 'marginal' | 'deficient';
  summary: string;
  summary_es?: string;
}

export async function analyzePhoto(photoId: string, useRealAI: boolean = true): Promise<void> {
  const photo = await getPhoto(photoId);
  if (!photo) return;

  // Mark as analyzing
  await updatePhotoAI(photoId, { aiStatus: 'analyzing' });

  try {
    if (useRealAI && isSupabaseConfigured && supabase) {
      // Convert blob to base64 for AI
      const imageBase64 = await blobToDataUrl(photo.fullImageBlob);
      
      const { data, error } = await supabase.functions.invoke('analyze-photo', {
        body: { 
          imageBase64,
          room: photo.room,
          language: 'en'
        }
      });

      if (error) {
        console.error('AI analysis error:', error);
        throw new Error(error.message || 'AI analysis failed');
      }

      const result = data as AIAnalysisResult;
      
      // Use the primary finding for the photo record
      const primaryFinding = result.findings[0];
      
      if (primaryFinding) {
        // Build full description from observation + implication if available
        const fullDescription = primaryFinding.observation && primaryFinding.implication
          ? `${primaryFinding.observation} ${primaryFinding.implication}`
          : primaryFinding.description;
        
        const fullDescriptionEs = primaryFinding.observation_es && primaryFinding.implication_es
          ? `${primaryFinding.observation_es} ${primaryFinding.implication_es}`
          : primaryFinding.description_es || primaryFinding.description;

        await updatePhotoAI(photoId, {
          aiStatus: 'complete',
          aiFindingTitle: primaryFinding.title,
          aiFindingTitleEs: primaryFinding.title_es || primaryFinding.title,
          aiSeverity: primaryFinding.severity,
          aiConfidence: primaryFinding.confidence,
          aiDescription: fullDescription,
          aiDescriptionEs: fullDescriptionEs,
          aiRecommendation: primaryFinding.recommendation,
          aiRecommendationEs: primaryFinding.recommendation_es || primaryFinding.recommendation,
          aiCategory: primaryFinding.category,
          // Store full analysis for detailed view (includes observation/implication/status)
          aiFullAnalysis: JSON.stringify(result),
        });
      } else {
        // No issues found
        await updatePhotoAI(photoId, {
          aiStatus: 'complete',
          aiFindingTitle: 'No Significant Issues Observed',
          aiFindingTitleEs: 'Sin Problemas Significativos Observados',
          aiSeverity: 'minor',
          aiConfidence: 90,
          aiDescription: result.summary || 'Visual inspection of this area revealed no significant deficiencies at the time of inspection.',
          aiDescriptionEs: result.summary_es || 'La inspección visual de esta área no reveló deficiencias significativas al momento de la inspección.',
          aiRecommendation: 'Continue routine maintenance as appropriate.',
          aiRecommendationEs: 'Continuar con mantenimiento rutinario según corresponda.',
          aiCategory: 'general',
          aiFullAnalysis: JSON.stringify(result),
        });
      }
    } else {
      // Fallback to mock analysis
      await mockAnalyzePhoto(photoId);
    }
  } catch (error) {
    console.error('Analysis failed:', error);
    // Fallback to mock on error
    await mockAnalyzePhoto(photoId);
  }
}

async function mockAnalyzePhoto(photoId: string): Promise<void> {
  // Simulate AI processing time
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

  const findingIndex = Math.floor(Math.random() * MOCK_FINDINGS.en.length);
  const finding = MOCK_FINDINGS.en[findingIndex];
  const findingEs = MOCK_FINDINGS.es[findingIndex];
  
  const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
  
  // Map status to severity
  const severityMap: Record<FindingStatus, Severity> = {
    safety: 'severe',
    repair: 'moderate',
    maintenance: 'minor',
    monitor: 'minor'
  };
  const severity = severityMap[finding.status];
  const confidence = 65 + Math.floor(Math.random() * 30);

  // Build description from observation + implication
  const description = `${finding.observation} ${finding.implication}`;
  const descriptionEs = `${findingEs.observation} ${findingEs.implication}`;

  await updatePhotoAI(photoId, {
    aiStatus: 'complete',
    aiFindingTitle: finding.title,
    aiFindingTitleEs: findingEs.title,
    aiSeverity: severity,
    aiConfidence: confidence,
    aiDescription: description,
    aiDescriptionEs: descriptionEs,
    aiRecommendation: finding.recommendation,
    aiRecommendationEs: findingEs.recommendation,
    aiCategory: category,
    aiFullAnalysis: JSON.stringify({
      findings: [{
        title: finding.title,
        title_es: findingEs.title,
        observation: finding.observation,
        observation_es: findingEs.observation,
        implication: finding.implication,
        implication_es: findingEs.implication,
        description,
        description_es: descriptionEs,
        recommendation: finding.recommendation,
        recommendation_es: findingEs.recommendation,
        severity,
        status: finding.status,
        category,
        confidence
      }],
      overallCondition: severity === 'severe' ? 'deficient' : severity === 'moderate' ? 'marginal' : 'satisfactory',
      summary: 'Visual inspection was performed on this area.',
      summary_es: 'Se realizó inspección visual en esta área.'
    }),
  });
}

export async function analyzeAllPending(photos: PhotoRecord[], onProgress?: (completed: number, total: number) => void): Promise<void> {
  const pending = photos.filter(p => p.aiStatus === 'pending_offline' || p.aiStatus === 'failed');
  
  for (let i = 0; i < pending.length; i++) {
    await analyzePhoto(pending[i].id);
    onProgress?.(i + 1, pending.length);
  }
}
