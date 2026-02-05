 import { IssuePreset, Phrase, getAllIssuePresets, getAllPhrases, saveIssuePreset, savePhrase } from './db';
 import { generateId } from './imageUtils';
 
 const DEFAULT_PRESETS: Omit<IssuePreset, 'id' | 'createdAt'>[] = [
   // Roofing
   {
     title: 'Missing/Damaged Shingles',
     titleEs: 'Tejas Faltantes/Dañadas',
     category: 'roofing',
     severity: 'moderate',
     description: 'Several shingles are missing or damaged, exposing the roof deck to weather elements.',
     descriptionEs: 'Varias tejas están faltantes o dañadas, exponiendo la cubierta del techo a los elementos climáticos.',
     recommendation: 'Replace damaged shingles promptly to prevent water intrusion and further deterioration.',
     recommendationEs: 'Reemplace las tejas dañadas prontamente para prevenir la intrusión de agua y mayor deterioro.',
   },
   {
     title: 'Roof Flashing Deterioration',
     titleEs: 'Deterioro del Tapajuntas del Techo',
     category: 'roofing',
     severity: 'moderate',
     description: 'Flashing around penetrations shows signs of rust, lifting, or improper sealing.',
     descriptionEs: 'El tapajuntas alrededor de las penetraciones muestra signos de óxido, levantamiento o sellado inadecuado.',
     recommendation: 'Repair or replace damaged flashing to maintain weathertight seal.',
     recommendationEs: 'Repare o reemplace el tapajuntas dañado para mantener el sello hermético.',
   },
   // Plumbing
   {
     title: 'Leaking Pipe/Fixture',
     titleEs: 'Tubería/Accesorio con Fuga',
     category: 'plumbing',
     severity: 'moderate',
     description: 'Active water leak observed at pipe connection or fixture.',
     descriptionEs: 'Se observa fuga de agua activa en la conexión de tubería o accesorio.',
     recommendation: 'Have a licensed plumber repair the leak immediately to prevent water damage.',
     recommendationEs: 'Haga que un plomero con licencia repare la fuga inmediatamente para prevenir daños por agua.',
   },
   {
     title: 'Corroded/Galvanized Pipes',
     titleEs: 'Tuberías Corroídas/Galvanizadas',
     category: 'plumbing',
     severity: 'moderate',
     description: 'Galvanized or corroded pipes observed, which may restrict water flow and are prone to leaks.',
     descriptionEs: 'Se observan tuberías galvanizadas o corroídas, que pueden restringir el flujo de agua y son propensas a fugas.',
     recommendation: 'Consider replacement with modern piping materials (PEX or copper).',
     recommendationEs: 'Considere el reemplazo con materiales de tubería modernos (PEX o cobre).',
   },
   {
     title: 'Water Heater Issue',
     titleEs: 'Problema con Calentador de Agua',
     category: 'plumbing',
     severity: 'moderate',
     description: 'Water heater shows signs of age, corrosion, or improper installation.',
     descriptionEs: 'El calentador de agua muestra signos de antigüedad, corrosión o instalación inadecuada.',
     recommendation: 'Have the unit serviced or consider replacement if over 10-12 years old.',
     recommendationEs: 'Haga que la unidad sea revisada o considere el reemplazo si tiene más de 10-12 años.',
   },
   // Electrical
   {
     title: 'Exposed Wiring',
     titleEs: 'Cableado Expuesto',
     category: 'electrical',
     severity: 'severe',
     description: 'Electrical wiring is exposed without proper junction box or protection.',
     descriptionEs: 'El cableado eléctrico está expuesto sin caja de conexiones o protección adecuada.',
     recommendation: 'Have a licensed electrician properly enclose all wiring connections.',
     recommendationEs: 'Haga que un electricista con licencia encierre adecuadamente todas las conexiones de cableado.',
   },
   {
     title: 'Outdated Electrical Panel',
     titleEs: 'Panel Eléctrico Obsoleto',
     category: 'electrical',
     severity: 'moderate',
     description: 'Electrical panel is outdated (e.g., Federal Pacific, Zinsco) or shows signs of overheating.',
     descriptionEs: 'El panel eléctrico está obsoleto (ej., Federal Pacific, Zinsco) o muestra signos de sobrecalentamiento.',
     recommendation: 'Recommend evaluation and possible upgrade by a licensed electrician.',
     recommendationEs: 'Se recomienda evaluación y posible actualización por un electricista con licencia.',
   },
   {
     title: 'Missing GFCI Protection',
     titleEs: 'Falta Protección GFCI',
     category: 'electrical',
     severity: 'moderate',
     description: 'Outlets near water sources lack Ground Fault Circuit Interrupter protection.',
     descriptionEs: 'Los tomacorrientes cerca de fuentes de agua carecen de protección de interruptor de circuito por falla a tierra.',
     recommendation: 'Install GFCI outlets in kitchen, bathrooms, garage, and exterior locations.',
     recommendationEs: 'Instale tomacorrientes GFCI en cocina, baños, garaje y ubicaciones exteriores.',
   },
   // HVAC
   {
     title: 'HVAC Filter Dirty/Clogged',
     titleEs: 'Filtro HVAC Sucio/Obstruido',
     category: 'hvac',
     severity: 'minor',
     description: 'Air filter is dirty or clogged, reducing system efficiency and air quality.',
     descriptionEs: 'El filtro de aire está sucio u obstruido, reduciendo la eficiencia del sistema y la calidad del aire.',
     recommendation: 'Replace filter and maintain regular replacement schedule (every 1-3 months).',
     recommendationEs: 'Reemplace el filtro y mantenga un programa de reemplazo regular (cada 1-3 meses).',
   },
   {
     title: 'HVAC Unit Age/Condition',
     titleEs: 'Edad/Condición de Unidad HVAC',
     category: 'hvac',
     severity: 'moderate',
     description: 'HVAC system is aging or showing signs of wear that may affect performance.',
     descriptionEs: 'El sistema HVAC está envejeciendo o mostrando signos de desgaste que pueden afectar el rendimiento.',
     recommendation: 'Have system serviced annually; budget for replacement if over 15 years old.',
     recommendationEs: 'Haga que el sistema sea revisado anualmente; presupueste para reemplazo si tiene más de 15 años.',
   },
   // Foundation
   {
     title: 'Foundation Cracks',
     titleEs: 'Grietas en Cimientos',
     category: 'foundation',
     severity: 'moderate',
     description: 'Cracks observed in foundation walls or floor slab.',
     descriptionEs: 'Se observan grietas en las paredes de los cimientos o losa del piso.',
     recommendation: 'Have a structural engineer evaluate to determine if repairs are needed.',
     recommendationEs: 'Haga que un ingeniero estructural evalúe para determinar si se necesitan reparaciones.',
   },
   {
     title: 'Water Intrusion Signs',
     titleEs: 'Signos de Intrusión de Agua',
     category: 'foundation',
     severity: 'moderate',
     description: 'Evidence of water intrusion including staining, efflorescence, or moisture.',
     descriptionEs: 'Evidencia de intrusión de agua incluyendo manchas, eflorescencia o humedad.',
     recommendation: 'Identify and address water source; consider waterproofing solutions.',
     recommendationEs: 'Identifique y aborde la fuente de agua; considere soluciones de impermeabilización.',
   },
   // Safety
   {
     title: 'Missing Smoke Detector',
     titleEs: 'Detector de Humo Faltante',
     category: 'safety',
     severity: 'severe',
     description: 'Smoke detector missing or non-functional in required location.',
     descriptionEs: 'Detector de humo faltante o no funcional en ubicación requerida.',
     recommendation: 'Install smoke detectors on every level and near sleeping areas.',
     recommendationEs: 'Instale detectores de humo en cada nivel y cerca de las áreas para dormir.',
   },
   {
     title: 'Handrail Missing/Loose',
     titleEs: 'Pasamanos Faltante/Suelto',
     category: 'safety',
     severity: 'moderate',
     description: 'Stairway handrail is missing, loose, or does not meet safety standards.',
     descriptionEs: 'El pasamanos de la escalera está faltante, suelto o no cumple con los estándares de seguridad.',
     recommendation: 'Install or repair handrail to provide safe support on stairs.',
     recommendationEs: 'Instale o repare el pasamanos para proporcionar soporte seguro en las escaleras.',
   },
   // General
   {
     title: 'Moisture/Water Damage',
     titleEs: 'Humedad/Daño por Agua',
     category: 'general',
     severity: 'moderate',
     description: 'Signs of moisture damage including staining, warping, or mold growth.',
     descriptionEs: 'Signos de daño por humedad incluyendo manchas, deformación o crecimiento de moho.',
     recommendation: 'Identify moisture source and repair; remediate any mold if present.',
     recommendationEs: 'Identifique la fuente de humedad y repare; remedie cualquier moho si está presente.',
   },
   {
     title: 'Pest/Insect Evidence',
     titleEs: 'Evidencia de Plagas/Insectos',
     category: 'general',
     severity: 'moderate',
     description: 'Evidence of pest or insect activity observed.',
     descriptionEs: 'Se observa evidencia de actividad de plagas o insectos.',
     recommendation: 'Have a licensed pest control professional evaluate and treat if necessary.',
     recommendationEs: 'Haga que un profesional de control de plagas con licencia evalúe y trate si es necesario.',
   },
 ];
 
 const DEFAULT_PHRASES: Omit<Phrase, 'id' | 'createdAt'>[] = [
   // Disclaimers
   {
     text: 'This inspection is a visual examination of the accessible areas of the property and is not technically exhaustive. Concealed or latent defects may exist.',
     textEs: 'Esta inspección es un examen visual de las áreas accesibles de la propiedad y no es técnicamente exhaustiva. Pueden existir defectos ocultos o latentes.',
     category: 'disclaimer',
     isFavorite: true,
   },
   {
     text: 'The inspector is not required to move personal items, furniture, equipment, or debris that may restrict access to components.',
     textEs: 'El inspector no está obligado a mover artículos personales, muebles, equipos o escombros que puedan restringir el acceso a los componentes.',
     category: 'disclaimer',
     isFavorite: true,
   },
   {
     text: 'This report is prepared for the exclusive use of the client and is not transferable. The inspection does not include areas that are inaccessible, concealed, or require dismantling.',
     textEs: 'Este informe está preparado para uso exclusivo del cliente y no es transferible. La inspección no incluye áreas que son inaccesibles, ocultas o que requieren desmontaje.',
     category: 'disclaimer',
     isFavorite: true,
   },
   {
     text: 'The inspector does not determine code compliance, insurability, or suitability for any specific purpose.',
     textEs: 'El inspector no determina el cumplimiento del código, asegurabilidad o idoneidad para ningún propósito específico.',
     category: 'disclaimer',
     isFavorite: false,
   },
   {
     text: 'Cosmetic defects and normal wear are generally not reported unless they affect function or safety.',
     textEs: 'Los defectos cosméticos y el desgaste normal generalmente no se informan a menos que afecten la función o la seguridad.',
     category: 'disclaimer',
     isFavorite: false,
   },
   // Notes
   {
     text: 'Unable to inspect due to limited access.',
     textEs: 'No se pudo inspeccionar debido al acceso limitado.',
     category: 'note',
     isFavorite: true,
   },
   {
     text: 'Area was inaccessible at time of inspection.',
     textEs: 'El área era inaccesible al momento de la inspección.',
     category: 'note',
     isFavorite: true,
   },
   {
     text: 'Recommend further evaluation by a licensed specialist.',
     textEs: 'Se recomienda evaluación adicional por un especialista con licencia.',
     category: 'note',
     isFavorite: true,
   },
   {
     text: 'Monitor for changes over time.',
     textEs: 'Monitorear cambios con el tiempo.',
     category: 'note',
     isFavorite: false,
   },
   // Recommendations
   {
     text: 'Repair or replace as needed by a qualified contractor.',
     textEs: 'Reparar o reemplazar según sea necesario por un contratista calificado.',
     category: 'recommendation',
     isFavorite: true,
   },
   {
     text: 'Obtain estimates from licensed professionals before closing.',
     textEs: 'Obtenga presupuestos de profesionales con licencia antes del cierre.',
     category: 'recommendation',
     isFavorite: true,
   },
   {
     text: 'Regular maintenance recommended to extend service life.',
     textEs: 'Se recomienda mantenimiento regular para extender la vida útil.',
     category: 'recommendation',
     isFavorite: false,
   },
 ];
 
 export async function seedDefaultData(): Promise<void> {
   // Check if we already have data
   const existingPresets = await getAllIssuePresets();
   const existingPhrases = await getAllPhrases();
 
   // Seed presets if none exist
   if (existingPresets.length === 0) {
     for (const preset of DEFAULT_PRESETS) {
       await saveIssuePreset({
         ...preset,
         id: generateId(),
         createdAt: Date.now(),
       });
     }
     console.log(`Seeded ${DEFAULT_PRESETS.length} default issue presets`);
   }
 
   // Seed phrases if none exist
   if (existingPhrases.length === 0) {
     for (const phrase of DEFAULT_PHRASES) {
       await savePhrase({
         ...phrase,
         id: generateId(),
         createdAt: Date.now(),
       });
     }
     console.log(`Seeded ${DEFAULT_PHRASES.length} default phrases`);
   }
 }