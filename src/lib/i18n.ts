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
      masterBath: 'Master Bath',
      halfBath: 'Half Bath',
      diningRoom: 'Dining Room',
      mainBedroom: 'Main Bedroom',
      bedroom2: 'Bedroom 2',
      bedroom3: 'Bedroom 3',
      bedroom4: 'Bedroom 4',
      livingRoom: 'Living Room',
      basement: 'Basement',
      crawlSpace: 'Crawl Space',
      attic: 'Attic',
      garage: 'Garage',
      laundryRoom: 'Laundry Room',
      utilityRoom: 'Utility Room',
      deck: 'Deck',
      patio: 'Patio',
      pool: 'Pool/Spa',
      driveway: 'Driveway',
      roof: 'Roof',
      electricalPanel: 'Electrical Panel',
      ac: 'AC/HVAC',
      waterHeater: 'Water Heater',
      furnace: 'Furnace',
      hallway: 'Hallway',
      stairs: 'Stairs',
      closet: 'Closet',
      office: 'Office/Den',
      fireplace: 'Fireplace',
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

        // Loading & errors
        loading: 'Loading...',
        pleaseCreateInspectionFirst: 'Please create an inspection first',
        allPhotosAnalyzed: 'All photos analyzed',
        demoLoaded: 'Demo inspection loaded with 4 sample photos!',
        failedToLoadDemo: 'Failed to load demo inspection',
        noInspectionToExport: 'No inspection to export',
        inspectionExported: 'Inspection exported successfully',
        failedToExport: 'Failed to export inspection',
        pleaseSelectZip: 'Please select a .zip file',
        failedToImport: 'Failed to import inspection',
        importedPhotosCount: 'Imported {count} photos',
        photosSkipped: 'skipped',

        // Dashboard
        dashboard: 'Dashboard',
        welcomeToPro: 'Welcome to 365 InspectAI Pro',
        photosCaptured: 'Photos Captured',
        reportsReady: 'Reports Ready',
        exportInspection: 'Export Inspection',
        importInspection: 'Import Inspection',
        transferDevices: 'Transfer Devices',
        noData: 'No Data',
        exporting: 'Exporting...',
        importing: 'Importing...',
        fromDevice: 'From Device',
        startNewAudit: 'Start a new property audit',
        ready: 'Ready',

        // Drop zone
        dropImagesHere: 'Drop your images here',
        dragImagesHere: 'Drag images here to upload',
        orClickToBrowse: 'or click to browse your files',
        imageFormatInfo: 'PNG, JPG, WEBP • Max 50MB',

        // Room selector
        doneReordering: 'Done reordering',
        reorderRooms: 'Reorder rooms',

        // Dashboard features
        aiPoweredAnalysis: 'AI-Powered Analysis',
        aiPoweredDescription: 'AI detects defects and issues from photos automatically',
        offlineFirstDesign: 'Offline-First Design',
        offlineFirstDescription: 'Work without internet, sync when connected',
        professionalReportsDesc: 'Generate PDF reports with findings and recommendations',

        // Welcome / onboarding
        professionalAssistant: 'Professional Home Inspection Assistant',
        welcomeInspector: 'Welcome, Inspector',
        welcomeMessage: '365 InspectAI is a professional-grade inspection tool designed for licensed home inspectors. Your data is stored locally on your device for maximum privacy and offline capability.',
        termsSummary: 'Terms of Service Summary',
        termsItem1: 'This app is a tool for licensed professionals',
        termsItem2: 'You retain ownership of all inspection data',
        termsItem3: 'Photos are only transmitted when using AI analysis',
        termsItem4: 'Data is stored locally on your device',
        termsItem5: 'License allows use on up to 2 devices',
        readFullTerms: 'Read full Terms of Service',
        enterLicenseKey: 'Enter your license key',
        licenseKeyHelp: 'Enter the license key you received after purchase. Contact support if you need assistance.',
        iAcceptTermsPrefix: 'I have read and accept the ',
        iAcceptPrivacyPrefix: 'I have read and accept the ',
        activateLicense: 'Activate License',
        termsOfService: 'Terms of Service',
        privacyPolicy: 'Privacy Policy',
        annotationSaved: 'Annotation saved',
        annotatePhoto: 'Annotate photo',
        saveAnnotation: 'Save annotation',
        agentSummary: 'Agent Summary',
        keyFindingsOnly: 'Key findings only',
        fullInspectionReport: 'Full Inspection Report',
        downloadAgentSummary: 'Download Agent Summary',
        licenseKeyLabel: 'License Key',
        verifyingLicense: 'Verifying License...',
        iAcceptActivate: 'I Accept & Activate',
        activateFooter: 'By activating, you agree to use this application in accordance with all applicable laws and regulations governing home inspections in your jurisdiction.',
        close: 'Close',

        // ReportDialog
        onePage: '1 Page',
        agentSummaryDesc: 'Agents get a 1-page summary they actually read. Perfect for forwarding.',
        easyToShare: 'Easy to share',
        completeReportDesc: 'Complete report with all findings, photos, and recommendations.',

        // PhotoDetailPanel
        annotationSavedOffline: 'Annotation saved offline',
        failedToSaveAnnotation: 'Failed to save annotation',
        tapToEnlarge: 'Tap to enlarge',

        // AppSidebar / badges
        pro: 'Pro',

        // AnnotationControls
        undo: 'Undo',
        redo: 'Redo',
        clearAllAnnotations: 'Clear all annotations',
        saving: 'Saving...',

        // VoiceDictationButton
        stopRecording: 'Stop recording',
        startVoiceDictation: 'Start voice dictation',

        // NotFound
        pageNotFound: 'Oops! Page not found',
        returnToHome: 'Return to Home',

        // SideMenu footer
        appVersionFooter: '365 InspectAI v1.0 • Offline-First PWA',

        // StorageMeter
        storageUsage: 'Storage Usage',
        usedEstimated: 'Used (Estimated)',
        photosFull: 'Photos (Full)',
        thumbnails: 'Thumbnails',
        annotatedImages: 'Annotated Images',
        inspections: 'Inspections',
        settingsAndOther: 'Settings & Other',
        storageLocalNotice: 'Storage is local to this device. Delete inspections to free space.',
        unableToCalculateStorage: 'Unable to calculate storage',

        // LicenseSettings
        licenseSettings: 'License Settings',
        enterLicenseToActivate: 'Enter your license key to activate all features',
        status: 'Status',
        devices: 'Devices',
        createInspections: 'Create Inspections',
        exportPdfAlways: 'Export PDF',
        alwaysAvailable: '✓ (Always available)',
        offlineGracePeriod: 'Offline Grace Period',
        daysRemaining: 'days remaining',
        graceExpiredNotice: 'Grace period expired. Connect to internet to re-verify license.',
        deviceId: 'Device ID',
        verifyLicense: 'Verify License',
        resetDevices: 'Reset Devices',
        resetDevicesTooltip: 'Reset all device activations (once per 30 days)',
        deviceLimitReachedNotice: 'Device limit reached. Use "Reset Devices" to clear all activations (30-day cooldown applies).',
        connectToVerify: 'Connect to the internet to verify or reset your license.',
        internetRequiredVerify: 'Internet connection required to verify license',
        internetRequiredReset: 'Internet connection required to reset devices',
        licenseVerifiedSuccess: 'License verified successfully!',
        licenseVerifyFailed: 'License verification failed',
        failedResetDevices: 'Failed to reset devices',
        devicesResetVerifyAgain: 'Devices reset. Please verify again on this device.',
        active: 'Active',
        invalid: 'Invalid',
        deviceLimit: 'Device Limit',
        inactive: 'Inactive',
        licenseTierBlocked: 'Your license tier does not include this feature',

        // ReportBuilder tabs
        deferred: 'Deferred',
        maint: 'Maint.',
        legal: 'Legal',
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
      masterBath: 'Baño Principal',
      halfBath: 'Medio Baño',
      diningRoom: 'Comedor',
      mainBedroom: 'Dormitorio Principal',
      bedroom2: 'Dormitorio 2',
      bedroom3: 'Dormitorio 3',
      bedroom4: 'Dormitorio 4',
      livingRoom: 'Sala de Estar',
      basement: 'Sótano',
      crawlSpace: 'Espacio de Rastreo',
      attic: 'Ático',
      garage: 'Garaje',
      laundryRoom: 'Lavandería',
      utilityRoom: 'Cuarto de Servicio',
      deck: 'Terraza',
      patio: 'Patio',
      pool: 'Piscina/Spa',
      driveway: 'Entrada',
      roof: 'Techo',
      electricalPanel: 'Panel Eléctrico',
      ac: 'Aire Acondicionado',
      waterHeater: 'Calentador de Agua',
      furnace: 'Caldera',
      hallway: 'Pasillo',
      stairs: 'Escaleras',
      closet: 'Closet',
      office: 'Oficina/Estudio',
      fireplace: 'Chimenea',
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

        // Loading & errors
        loading: 'Cargando...',
        pleaseCreateInspectionFirst: 'Por favor cree una inspección primero',
        allPhotosAnalyzed: 'Todas las fotos analizadas',
        demoLoaded: '¡Demo de inspección cargada con 4 fotos de ejemplo!',
        failedToLoadDemo: 'Error al cargar la inspección de demostración',
        noInspectionToExport: 'No hay inspección para exportar',
        inspectionExported: 'Inspección exportada exitosamente',
        failedToExport: 'Error al exportar inspección',
        pleaseSelectZip: 'Por favor seleccione un archivo .zip',
        failedToImport: 'Error al importar inspección',
        importedPhotosCount: 'Importadas {count} fotos',
        photosSkipped: 'omitidas',

        // Dashboard
        dashboard: 'Panel de control',
        welcomeToPro: 'Bienvenido a 365 InspectAI Pro',
        photosCaptured: 'Fotos Capturadas',
        reportsReady: 'Informes Listos',
        exportInspection: 'Exportar Inspección',
        importInspection: 'Importar Inspección',
        transferDevices: 'Transferir entre Dispositivos',
        noData: 'Sin Datos',
        exporting: 'Exportando...',
        importing: 'Importando...',
        fromDevice: 'Desde Dispositivo',
        startNewAudit: 'Iniciar una nueva auditoría de propiedad',
        ready: 'Listo',

        // Drop zone
        dropImagesHere: 'Suelte sus imágenes aquí',
        dragImagesHere: 'Arrastre imágenes aquí para subir',
        orClickToBrowse: 'o haga clic para buscar archivos',
        imageFormatInfo: 'PNG, JPG, WEBP • Máx 50MB',

        // Room selector
        doneReordering: 'Listo con el orden',
        reorderRooms: 'Reordenar habitaciones',

        // Dashboard features
        aiPoweredAnalysis: 'Análisis con IA',
        aiPoweredDescription: 'La IA detecta defectos y problemas de las fotos automáticamente',
        offlineFirstDesign: 'Diseño Sin Conexión',
        offlineFirstDescription: 'Trabaje sin internet, sincronice cuando esté conectado',
        professionalReportsDesc: 'Generar informes PDF con hallazgos y recomendaciones',

        // Welcome / onboarding
        professionalAssistant: 'Asistente Profesional de Inspección de Hogares',
        welcomeInspector: 'Bienvenido, Inspector',
        welcomeMessage: '365 InspectAI es una herramienta de inspección de nivel profesional diseñada para inspectores de hogares con licencia. Sus datos se almacenan localmente en su dispositivo para máxima privacidad y capacidad sin conexión.',
        termsSummary: 'Resumen de Términos de Servicio',
        termsItem1: 'Esta aplicación es una herramienta para profesionales con licencia',
        termsItem2: 'Usted conserva la propiedad de todos los datos de inspección',
        termsItem3: 'Las fotos solo se transmiten al usar análisis con IA',
        termsItem4: 'Los datos se almacenan localmente en su dispositivo',
        termsItem5: 'La licencia permite uso en hasta 2 dispositivos',
        readFullTerms: 'Leer Términos de Servicio completos',
        enterLicenseKey: 'Ingrese su clave de licencia',
        licenseKeyHelp: 'Ingrese la clave de licencia que recibió después de la compra. Contacte a soporte si necesita ayuda.',
        iAcceptTermsPrefix: 'He leído y acepto los ',
        iAcceptPrivacyPrefix: 'He leído y acepto la ',
        activateLicense: 'Activar Licencia',
        termsOfService: 'Términos de Servicio',
        privacyPolicy: 'Política de Privacidad',
        annotationSaved: 'Anotación guardada',
        annotatePhoto: 'Anotar foto',
        saveAnnotation: 'Guardar anotación',
        agentSummary: 'Resumen para Agente',
        keyFindingsOnly: 'Solo hallazgos clave',
        fullInspectionReport: 'Informe de Inspección Completo',
        downloadAgentSummary: 'Descargar Resumen para Agente',
        licenseKeyLabel: 'Clave de Licencia',
        verifyingLicense: 'Verificando Licencia...',
        iAcceptActivate: 'Acepto y Activo',
        activateFooter: 'Al activar, acepta utilizar esta aplicación de acuerdo con todas las leyes y regulaciones aplicables que rigen las inspecciones de hogares en su jurisdicción.',
        close: 'Cerrar',

        // ReportDialog
        onePage: '1 Página',
        agentSummaryDesc: 'Los agentes reciben un resumen de 1 página que realmente leen. Perfecto para reenviar.',
        easyToShare: 'Fácil de compartir',
        completeReportDesc: 'Informe completo con todos los hallazgos, fotos y recomendaciones.',

        // PhotoDetailPanel
        annotationSavedOffline: 'Anotación guardada sin conexión',
        failedToSaveAnnotation: 'Error al guardar la anotación',
        tapToEnlarge: 'Toque para ampliar',

        // AppSidebar / badges
        pro: 'Pro',

        // AnnotationControls
        undo: 'Deshacer',
        redo: 'Rehacer',
        clearAllAnnotations: 'Borrar todas las anotaciones',
        saving: 'Guardando...',

        // VoiceDictationButton
        stopRecording: 'Detener grabación',
        startVoiceDictation: 'Iniciar dictado por voz',

        // NotFound
        pageNotFound: '¡Ups! Página no encontrada',
        returnToHome: 'Volver al Inicio',

        // SideMenu footer
        appVersionFooter: '365 InspectAI v1.0 • PWA sin conexión',

        // StorageMeter
        storageUsage: 'Uso de Almacenamiento',
        usedEstimated: 'Usado (Estimado)',
        photosFull: 'Fotos (Completas)',
        thumbnails: 'Miniaturas',
        annotatedImages: 'Imágenes Anotadas',
        inspections: 'Inspecciones',
        settingsAndOther: 'Configuración y Otros',
        storageLocalNotice: 'El almacenamiento es local en este dispositivo. Elimine inspecciones para liberar espacio.',
        unableToCalculateStorage: 'No se puede calcular el almacenamiento',

        // LicenseSettings
        licenseSettings: 'Configuración de Licencia',
        enterLicenseToActivate: 'Ingrese su clave de licencia para activar todas las funciones',
        status: 'Estado',
        devices: 'Dispositivos',
        createInspections: 'Crear Inspecciones',
        exportPdfAlways: 'Exportar PDF',
        alwaysAvailable: '✓ (Siempre disponible)',
        offlineGracePeriod: 'Período de Gracia Sin Conexión',
        daysRemaining: 'días restantes',
        graceExpiredNotice: 'Período de gracia expirado. Conéctese a internet para reverificar la licencia.',
        deviceId: 'ID del Dispositivo',
        verifyLicense: 'Verificar Licencia',
        resetDevices: 'Restablecer Dispositivos',
        resetDevicesTooltip: 'Restablecer todas las activaciones de dispositivos (una vez cada 30 días)',
        deviceLimitReachedNotice: 'Límite de dispositivos alcanzado. Use "Restablecer Dispositivos" para borrar todas las activaciones (aplica enfriamiento de 30 días).',
        connectToVerify: 'Conéctese a internet para verificar o restablecer su licencia.',
        internetRequiredVerify: 'Se requiere conexión a internet para verificar la licencia',
        internetRequiredReset: 'Se requiere conexión a internet para restablecer dispositivos',
        licenseVerifiedSuccess: '¡Licencia verificada exitosamente!',
        licenseVerifyFailed: 'Error al verificar la licencia',
        failedResetDevices: 'Error al restablecer dispositivos',
        devicesResetVerifyAgain: 'Dispositivos restablecidos. Por favor verifique nuevamente en este dispositivo.',
        active: 'Activo',
        invalid: 'Inválido',
        deviceLimit: 'Límite de Dispositivos',
        inactive: 'Inactivo',
        licenseTierBlocked: 'Su nivel de licencia no incluye esta función',

        // ReportBuilder tabs
        deferred: 'Diferidos',
        maint: 'Mant.',
        legal: 'Legal',
      }
} as const;
 
 export type TranslationKey = keyof typeof translations.en;
 
 export function getTranslation(lang: Language, key: TranslationKey): string {
   return translations[lang][key];
 }