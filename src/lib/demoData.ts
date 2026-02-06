import { InspectionRecord, PhotoRecord, saveInspection, savePhoto, Severity, Category, InspectionType } from '@/lib/db';

// Import demo images
import foundationCrack from '@/assets/demo/foundation-crack.jpg';
import roofDamage from '@/assets/demo/roof-damage.jpg';
import plumbingLeak from '@/assets/demo/plumbing-leak.jpg';
import electricalIssue from '@/assets/demo/electrical-issue.jpg';

async function urlToBlob(url: string): Promise<Blob> {
  const response = await fetch(url);
  return response.blob();
}

export async function loadDemoInspection(): Promise<{ inspection: InspectionRecord; photos: PhotoRecord[] }> {
  const inspectionId = `demo-${Date.now()}`;
  const now = Date.now();
  
  const inspection: InspectionRecord = {
    id: inspectionId,
    propertyAddress: '1234 Oak Valley Drive, Austin, TX 78701',
    clientName: 'Johnson Family Trust',
    inspectorName: 'Sarah Mitchell, CPI #12847',
    inspectionType: 'pre_purchase' as InspectionType,
    createdAt: now,
    updatedAt: now,
    photoIds: [],
    isComplete: false,
  };

  await saveInspection(inspection);

  const demoPhotos: Array<{
    imageUrl: string;
    room: string;
    titleEn: string;
    titleEs: string;
    descEn: string;
    descEs: string;
    severity: Severity;
    category: Category;
  }> = [
    {
      imageUrl: foundationCrack,
      room: 'exterior',
      titleEn: 'Foundation Crack with Water Intrusion',
      titleEs: 'Grieta en Cimentación con Infiltración de Agua',
      descEn: 'Significant vertical crack observed in the northeast corner of the foundation wall. Evidence of water intrusion and efflorescence present. Recommend evaluation by a structural engineer.',
      descEs: 'Se observa una grieta vertical significativa en la esquina noreste del muro de cimentación. Evidencia de infiltración de agua y eflorescencia. Se recomienda evaluación por un ingeniero estructural.',
      severity: 'severe' as Severity,
      category: 'foundation' as Category,
    },
    {
      imageUrl: roofDamage,
      room: 'exterior',
      titleEn: 'Damaged Roof Shingles',
      titleEs: 'Tejas del Techo Dañadas',
      descEn: 'Multiple shingles missing or damaged near the roof peak. Exposed underlayment visible. Immediate repair recommended to prevent water damage.',
      descEs: 'Múltiples tejas faltantes o dañadas cerca del pico del techo. Membrana expuesta visible. Se recomienda reparación inmediata para prevenir daños por agua.',
      severity: 'moderate' as Severity,
      category: 'roofing' as Category,
    },
    {
      imageUrl: plumbingLeak,
      room: 'kitchen',
      titleEn: 'Active Plumbing Leak Under Sink',
      titleEs: 'Fuga de Plomería Activa Bajo el Fregadero',
      descEn: 'Active leak detected at P-trap connection under kitchen sink. Water pooling in cabinet base. Requires immediate attention by a licensed plumber.',
      descEs: 'Fuga activa detectada en la conexión del sifón bajo el fregadero de la cocina. Agua acumulada en la base del gabinete. Requiere atención inmediata por un plomero licenciado.',
      severity: 'severe' as Severity,
      category: 'plumbing' as Category,
    },
    {
      imageUrl: electricalIssue,
      room: 'bedroom1',
      titleEn: 'Electrical Outlet Fire Hazard',
      titleEs: 'Riesgo de Incendio en Tomacorriente',
      descEn: 'Burn marks and melted plastic observed on electrical outlet. Indicates overheating and potential arc fault. Immediate evaluation by licensed electrician required. Do not use until repaired.',
      descEs: 'Se observan marcas de quemadura y plástico derretido en el tomacorriente. Indica sobrecalentamiento y posible falla de arco. Requiere evaluación inmediata por electricista licenciado. No usar hasta ser reparado.',
      severity: 'severe' as Severity,
      category: 'electrical' as Category,
    },
  ];

  const photos: PhotoRecord[] = [];
  const photoIds: string[] = [];

  for (let i = 0; i < demoPhotos.length; i++) {
    const demo = demoPhotos[i];
    const blob = await urlToBlob(demo.imageUrl);
    const photoId = `demo-photo-${now}-${i}`;
    
    const photo: PhotoRecord = {
      id: photoId,
      inspectionId,
      room: demo.room,
      timestamp: now - (demoPhotos.length - i) * 300000, // Stagger timestamps
      thumbnailBlob: blob,
      fullImageBlob: blob, // Use same for demo
      notes: '',
      aiStatus: 'complete',
      includeInReport: true,
      reportOrder: i,
      aiFindingTitle: demo.titleEn,
      aiFindingTitleEs: demo.titleEs,
      aiDescription: demo.descEn,
      aiDescriptionEs: demo.descEs,
      aiSeverity: demo.severity,
      aiCategory: demo.category,
      aiConfidence: 92 - i * 3, // Vary confidence slightly
    };

    await savePhoto(photo);
    photos.push(photo);
    photoIds.push(photoId);
  }

  // Update inspection with photo IDs
  inspection.photoIds = photoIds;
  await saveInspection(inspection);

  return { inspection, photos };
}
