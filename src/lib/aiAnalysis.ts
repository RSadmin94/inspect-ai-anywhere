 import { PhotoRecord, Severity, Category, updatePhotoAI, getPhoto } from '@/lib/db';
 import { blobToDataUrl } from '@/lib/imageUtils';
 
 // AI Analysis - Mock implementation for offline-first
 // When online, this will use actual AI when Lovable Cloud is connected
 
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
 
 export async function analyzePhoto(photoId: string): Promise<void> {
   const photo = await getPhoto(photoId);
   if (!photo) return;
 
   // Mark as analyzing
   await updatePhotoAI(photoId, { aiStatus: 'analyzing' });
 
   // Simulate AI processing time
   await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1500));
 
   // Generate mock analysis result
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