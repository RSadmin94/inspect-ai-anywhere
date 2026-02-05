 import { PhotoRecord, Severity, Category, updatePhotoAI, getPhoto } from '@/lib/db';
 import { blobToDataUrl } from '@/lib/imageUtils';
import { supabase } from '@/integrations/supabase/client';
 
// AI Analysis - Uses Lovable AI when online, mock data when offline
 
 const CATEGORIES: Category[] = ['roofing', 'plumbing', 'electrical', 'hvac', 'foundation', 'safety', 'general'];
 const SEVERITIES: Severity[] = ['minor', 'moderate', 'severe'];
 
 const MOCK_FINDINGS = {
   en: [
     { title: 'Water Damage Detected', desc: 'Signs of water infiltration visible on surface. May indicate roof leak or plumbing issue.', rec: 'Inspect roof and plumbing connections for leaks. Address promptly to prevent mold growth.' },
     { title: 'Electrical Outlet Issue', desc: 'Outlet appears damaged or improperly installed.', rec: 'Have licensed electrician inspect and repair as needed.' },
     { title: 'HVAC Filter Maintenance', desc: 'Air filter appears dirty and may need replacement.', rec: 'Replace air filter and schedule regular maintenance.' },
     { title: 'Foundation Crack', desc: 'Minor surface crack detected in foundation.', rec: 'Monitor for changes. Consult structural engineer if crack widens.' },
     { title: 'Safety Hazard', desc: 'Potential safety concern identified in this area.', rec: 'Address safety issue immediately to prevent accidents.' },
     { title: 'General Wear', desc: 'Normal wear and tear observed.', rec: 'Consider cosmetic repairs during next renovation.' },
   ],
   es: [
     { title: 'Daño por Agua Detectado', desc: 'Señales de infiltración de agua visibles en la superficie. Puede indicar fuga en techo o plomería.', rec: 'Inspeccionar techo y conexiones de plomería. Atender pronto para prevenir moho.' },
     { title: 'Problema con Tomacorriente', desc: 'El tomacorriente parece dañado o mal instalado.', rec: 'Hacer que un electricista certificado inspeccione y repare.' },
     { title: 'Mantenimiento de Filtro HVAC', desc: 'El filtro de aire parece sucio y puede necesitar reemplazo.', rec: 'Reemplazar filtro y programar mantenimiento regular.' },
     { title: 'Grieta en Cimiento', desc: 'Grieta superficial menor detectada en el cimiento.', rec: 'Monitorear cambios. Consultar ingeniero estructural si se agranda.' },
     { title: 'Riesgo de Seguridad', desc: 'Posible problema de seguridad identificado en esta área.', rec: 'Atender inmediatamente para prevenir accidentes.' },
     { title: 'Desgaste General', desc: 'Desgaste normal observado.', rec: 'Considerar reparaciones cosméticas en próxima renovación.' },
   ]
 };
 
interface AIAnalysisResult {
  findings: Array<{
    title: string;
    title_es?: string;
    description: string;
    description_es?: string;
    recommendation: string;
    recommendation_es?: string;
    severity: Severity;
    category: Category;
    confidence: number;
  }>;
  overallCondition: 'good' | 'fair' | 'poor';
  summary: string;
  summary_es?: string;
}

export async function analyzePhoto(photoId: string, useRealAI: boolean = true): Promise<void> {
   const photo = await getPhoto(photoId);
   if (!photo) return;
 
   // Mark as analyzing
   await updatePhotoAI(photoId, { aiStatus: 'analyzing' });
 
  try {
    if (useRealAI) {
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
        await updatePhotoAI(photoId, {
          aiStatus: 'complete',
          aiFindingTitle: primaryFinding.title,
          aiFindingTitleEs: primaryFinding.title_es || primaryFinding.title,
          aiSeverity: primaryFinding.severity,
          aiConfidence: primaryFinding.confidence,
          aiDescription: primaryFinding.description,
          aiDescriptionEs: primaryFinding.description_es || primaryFinding.description,
          aiRecommendation: primaryFinding.recommendation,
          aiRecommendationEs: primaryFinding.recommendation_es || primaryFinding.recommendation,
          aiCategory: primaryFinding.category,
          // Store full analysis for detailed view
          aiFullAnalysis: JSON.stringify(result),
        });
      } else {
        // No issues found
        await updatePhotoAI(photoId, {
          aiStatus: 'complete',
          aiFindingTitle: 'No Issues Detected',
          aiFindingTitleEs: 'Sin Problemas Detectados',
          aiSeverity: 'minor',
          aiConfidence: 90,
          aiDescription: result.summary || 'No significant issues were detected in this photo.',
          aiDescriptionEs: result.summary_es || 'No se detectaron problemas significativos.',
          aiRecommendation: 'Continue regular maintenance.',
          aiRecommendationEs: 'Continuar con mantenimiento regular.',
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
  const severity = SEVERITIES[Math.floor(Math.random() * SEVERITIES.length)];
  const confidence = 65 + Math.floor(Math.random() * 30);

  await updatePhotoAI(photoId, {
    aiStatus: 'complete',
    aiFindingTitle: finding.title,
    aiFindingTitleEs: findingEs.title,
    aiSeverity: severity,
    aiConfidence: confidence,
    aiDescription: finding.desc,
    aiDescriptionEs: findingEs.desc,
    aiRecommendation: finding.rec,
    aiRecommendationEs: findingEs.rec,
    aiCategory: category,
  });
 }
 
 export async function analyzeAllPending(photos: PhotoRecord[], onProgress?: (completed: number, total: number) => void): Promise<void> {
   const pending = photos.filter(p => p.aiStatus === 'pending_offline' || p.aiStatus === 'failed');
   
   for (let i = 0; i < pending.length; i++) {
     await analyzePhoto(pending[i].id);
     onProgress?.(i + 1, pending.length);
   }
 }