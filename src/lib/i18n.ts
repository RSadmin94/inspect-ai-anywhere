 export type Language = 'en' | 'es';
 
 export const translations = {
  en: {
    // App
    appName: '365 InspectAI',
     language: 'English',
     switchLanguage: 'Español',
     
     // Inspection
     newInspection: 'New Inspection',
      inspection: 'Inspection',
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
     diningRoom: 'Dining Room',
     mainBedroom: 'Main Bedroom',
     bedroom2: 'Bedroom 2',
     bedroom3: 'Bedroom 3',
     livingRoom: 'Living Room',
     basement: 'Basement',
     attic: 'Attic',
      garage: 'Garage',
      roof: 'Roof',
      electricalPanel: 'Electrical Panel',
      ac: 'AC',
      waterHeater: 'Water Heater',
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
       
       // New features
       addCustomRoom: 'Add custom room',
       enterRoomName: 'Enter room name',
       add: 'Add',
       cancel: 'Cancel',
       
       // Phrase Library
       phraseLibrary: 'Phrase Library',
       searchPhrases: 'Search phrases...',
       addPhrase: 'Add Phrase',
       phraseText: 'Phrase text',
       enterPhrase: 'Enter phrase...',
       enterPhraseEs: 'Enter phrase in Spanish...',
       noPhrases: 'No phrases yet',
       all: 'All',
       disclaimer: 'Disclaimer',
       note: 'Note',
       optional: 'optional',
       update: 'Update',
       
       // Issue Presets
       issuePresets: 'Issue Presets',
       searchPresets: 'Search presets...',
       addPreset: 'Add Preset',
       noPresets: 'No presets yet',
       title: 'Title',
       applyPreset: 'Apply Preset',
       manualFinding: 'Manual Finding',
       clearManual: 'Clear Manual Finding',
       
       // Report Builder
       reportBuilder: 'Report Builder',
       photosGroupedByRoom: 'Photos grouped by room',
       disclaimers: 'Disclaimers',
       addFromLibrary: 'Add from library',
       noDisclaimers: 'No disclaimers added',
       generating: 'Generating...',
       
       // Quick Capture
       quickCapture: 'Quick Capture',
       done: 'Done',
       
       // Voice Dictation
       recording: 'Recording',
       listening: 'Listening...',
       tapToSpeak: 'Tap to speak',
       roomNotes: 'Room Notes',
       noNotesYet: 'Tap mic to start dictating',
       otherRooms: 'Other rooms',
       clear: 'Clear',
       rooms: 'rooms',
       
       // Enhanced Inspection
       clientName: 'Client Name',
       enterClientName: 'Enter client name...',
       inspectionType: 'Inspection Type',
       selectType: 'Select type...',
       pre_purchase: 'Pre-Purchase',
       pre_listing: 'Pre-Listing',
       annual: 'Annual',
       insurance: 'Insurance',
       new_construction: 'New Construction',
       warranty: 'Warranty',
       
        // Report Review
        reportReview: 'Report Review',
        overview: 'Overview',
        findings: 'Findings',
        inspectionDetails: 'Inspection Details',
        summary: 'Summary',
        totalPhotos: 'Total Photos',
        noFindingsYet: 'No findings recorded yet',
        noRoomNotes: 'No room notes recorded',
        
        // Settings
        settings: 'Settings',
        companyProfile: 'Company Profile',
      },
  es: {
    // App
    appName: '365 InspectAI',
     language: 'Español',
     switchLanguage: 'English',
     
     // Inspection
     newInspection: 'Nueva Inspección',
      inspection: 'Inspección',
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
     diningRoom: 'Comedor',
     mainBedroom: 'Dormitorio Principal',
     bedroom2: 'Dormitorio 2',
     bedroom3: 'Dormitorio 3',
     livingRoom: 'Sala de Estar',
     basement: 'Sótano',
     attic: 'Ático',
      garage: 'Garaje',
      roof: 'Techo',
      electricalPanel: 'Panel Eléctrico',
      ac: 'Aire Acondicionado',
      waterHeater: 'Calentador de Agua',
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
       
       // New features
       addCustomRoom: 'Agregar habitación personalizada',
       enterRoomName: 'Ingrese nombre de habitación',
       add: 'Agregar',
       cancel: 'Cancelar',
       
       // Phrase Library
       phraseLibrary: 'Biblioteca de Frases',
       searchPhrases: 'Buscar frases...',
       addPhrase: 'Agregar Frase',
       phraseText: 'Texto de frase',
       enterPhrase: 'Ingrese frase...',
       enterPhraseEs: 'Ingrese frase en español...',
       noPhrases: 'Sin frases aún',
       all: 'Todos',
       disclaimer: 'Descargo',
       note: 'Nota',
       optional: 'opcional',
       update: 'Actualizar',
       
       // Issue Presets
       issuePresets: 'Preajustes de Problemas',
       searchPresets: 'Buscar preajustes...',
       addPreset: 'Agregar Preajuste',
       noPresets: 'Sin preajustes aún',
       title: 'Título',
       applyPreset: 'Aplicar Preajuste',
       manualFinding: 'Hallazgo Manual',
       clearManual: 'Limpiar Hallazgo Manual',
       
       // Report Builder
       reportBuilder: 'Constructor de Informe',
       photosGroupedByRoom: 'Fotos agrupadas por habitación',
       disclaimers: 'Descargos de Responsabilidad',
       addFromLibrary: 'Agregar de biblioteca',
       noDisclaimers: 'Sin descargos agregados',
       generating: 'Generando...',
       
       // Quick Capture
       quickCapture: 'Captura Rápida',
       done: 'Listo',
       
       // Voice Dictation
       recording: 'Grabando',
       listening: 'Escuchando...',
       tapToSpeak: 'Toque para hablar',
       roomNotes: 'Notas de Habitación',
       noNotesYet: 'Toque el mic para dictar',
       otherRooms: 'Otras habitaciones',
       clear: 'Limpiar',
       rooms: 'habitaciones',
       
       // Enhanced Inspection
       clientName: 'Nombre del Cliente',
       enterClientName: 'Ingrese nombre del cliente...',
       inspectionType: 'Tipo de Inspección',
       selectType: 'Seleccionar tipo...',
       pre_purchase: 'Pre-Compra',
       pre_listing: 'Pre-Venta',
       annual: 'Anual',
       insurance: 'Seguro',
       new_construction: 'Nueva Construcción',
       warranty: 'Garantía',
       
        // Report Review
        reportReview: 'Revisar Reporte',
        overview: 'Resumen',
        findings: 'Hallazgos',
        inspectionDetails: 'Detalles de Inspección',
        summary: 'Estadísticas',
        totalPhotos: 'Fotos Totales',
        noFindingsYet: 'Sin hallazgos registrados',
        noRoomNotes: 'Sin notas de habitación',
        
        // Settings
        settings: 'Configuración',
        companyProfile: 'Perfil de la Empresa',
      }
} as const;
 
 export type TranslationKey = keyof typeof translations.en;
 
 export function getTranslation(lang: Language, key: TranslationKey): string {
   return translations[lang][key];
 }