 export type Language = 'en' | 'es';
 
 export const translations = {
   en: {
     // App
     appName: 'InspectAI',
     language: 'English',
     switchLanguage: 'Español',
     
     // Inspection
     newInspection: 'New Inspection',
     currentInspection: 'Current Inspection',
     propertyAddress: 'Property Address',
     inspectorName: 'Inspector Name (optional)',
     startInspection: 'Start Inspection',
     finishInspection: 'Finish Inspection',
     photos: 'Photos',
     noPhotos: 'No photos yet',
     
     // Camera
     capture: 'Capture',
     capturePhoto: 'Tap to capture photo',
     
     // Photo Details
     photoDetails: 'Photo Details',
     room: 'Room/Area',
     notes: 'Notes',
     timestamp: 'Timestamp',
     delete: 'Delete',
     save: 'Save',
     
     // Rooms
     selectRoom: 'Select room...',
     exterior: 'Exterior',
     interior: 'Interior',
     kitchen: 'Kitchen',
     bathroom: 'Bathroom',
     bedroom: 'Bedroom',
     livingRoom: 'Living Room',
     basement: 'Basement',
     attic: 'Attic',
     garage: 'Garage',
     roof: 'Roof',
     other: 'Other',
     
     // AI Status
     aiStatus: 'AI Analysis',
     aiPending: 'Pending (Offline)',
     aiAnalyzing: 'Analyzing...',
     aiComplete: 'Complete',
     aiFailed: 'Failed',
     analyzeNow: 'Analyze Now',
     analyzePending: 'Analyze Pending Photos',
     
     // AI Findings
     finding: 'Finding',
     severity: 'Severity',
     confidence: 'Confidence',
     description: 'Description',
     recommendation: 'Recommendation',
     category: 'Category',
     
     // Severity Levels
     minor: 'Minor',
     moderate: 'Moderate',
     severe: 'Severe',
     
     // Categories
     roofing: 'Roofing',
     plumbing: 'Plumbing',
     electrical: 'Electrical',
     hvac: 'HVAC',
     foundation: 'Foundation',
     safety: 'Safety',
     general: 'General',
     
     // Reports
     generateReport: 'Generate Report',
     reportLanguage: 'Report Language',
     english: 'English',
     spanish: 'Spanish',
     both: 'Both',
     downloadPdf: 'Download PDF',
     reportGenerated: 'Report generated successfully',
     
     // Status Messages
     photoSaved: 'Photo saved',
     photoDeleted: 'Photo deleted',
     inspectionSaved: 'Inspection saved',
     offline: 'Offline',
     online: 'Online',
     offlineMode: 'Offline Mode - Photos saved locally',
     
     // Errors
     cameraError: 'Unable to access camera',
     storageError: 'Storage error',
     analysisFailed: 'Analysis failed',
     
     // Placeholders
     enterAddress: 'Enter property address...',
     enterName: 'Enter your name...',
     addNotes: 'Add notes about this photo...',
   },
   es: {
     // App
     appName: 'InspectAI',
     language: 'Español',
     switchLanguage: 'English',
     
     // Inspection
     newInspection: 'Nueva Inspección',
     currentInspection: 'Inspección Actual',
     propertyAddress: 'Dirección de la Propiedad',
     inspectorName: 'Nombre del Inspector (opcional)',
     startInspection: 'Iniciar Inspección',
     finishInspection: 'Finalizar Inspección',
     photos: 'Fotos',
     noPhotos: 'Sin fotos aún',
     
     // Camera
     capture: 'Capturar',
     capturePhoto: 'Toque para capturar foto',
     
     // Photo Details
     photoDetails: 'Detalles de la Foto',
     room: 'Habitación/Área',
     notes: 'Notas',
     timestamp: 'Fecha y Hora',
     delete: 'Eliminar',
     save: 'Guardar',
     
     // Rooms
     selectRoom: 'Seleccionar habitación...',
     exterior: 'Exterior',
     interior: 'Interior',
     kitchen: 'Cocina',
     bathroom: 'Baño',
     bedroom: 'Dormitorio',
     livingRoom: 'Sala de Estar',
     basement: 'Sótano',
     attic: 'Ático',
     garage: 'Garaje',
     roof: 'Techo',
     other: 'Otro',
     
     // AI Status
     aiStatus: 'Análisis de IA',
     aiPending: 'Pendiente (Sin conexión)',
     aiAnalyzing: 'Analizando...',
     aiComplete: 'Completado',
     aiFailed: 'Fallido',
     analyzeNow: 'Analizar Ahora',
     analyzePending: 'Analizar Fotos Pendientes',
     
     // AI Findings
     finding: 'Hallazgo',
     severity: 'Severidad',
     confidence: 'Confianza',
     description: 'Descripción',
     recommendation: 'Recomendación',
     category: 'Categoría',
     
     // Severity Levels
     minor: 'Menor',
     moderate: 'Moderado',
     severe: 'Grave',
     
     // Categories
     roofing: 'Techos',
     plumbing: 'Plomería',
     electrical: 'Electricidad',
     hvac: 'Climatización',
     foundation: 'Cimientos',
     safety: 'Seguridad',
     general: 'General',
     
     // Reports
     generateReport: 'Generar Informe',
     reportLanguage: 'Idioma del Informe',
     english: 'Inglés',
     spanish: 'Español',
     both: 'Ambos',
     downloadPdf: 'Descargar PDF',
     reportGenerated: 'Informe generado exitosamente',
     
     // Status Messages
     photoSaved: 'Foto guardada',
     photoDeleted: 'Foto eliminada',
     inspectionSaved: 'Inspección guardada',
     offline: 'Sin conexión',
     online: 'En línea',
     offlineMode: 'Modo sin conexión - Fotos guardadas localmente',
     
     // Errors
     cameraError: 'No se puede acceder a la cámara',
     storageError: 'Error de almacenamiento',
     analysisFailed: 'Análisis fallido',
     
     // Placeholders
     enterAddress: 'Ingrese la dirección de la propiedad...',
     enterName: 'Ingrese su nombre...',
     addNotes: 'Agregue notas sobre esta foto...',
   }
 } as const;
 
 export type TranslationKey = keyof typeof translations.en;
 
 export function getTranslation(lang: Language, key: TranslationKey): string {
   return translations[lang][key];
 }