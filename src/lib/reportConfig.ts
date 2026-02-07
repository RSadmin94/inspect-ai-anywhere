import { Language } from './i18n';

export type ConditionStatus = 'satisfactory' | 'needs_maintenance' | 'professional_consultation' | 'not_satisfactory';

export const conditionStatusLabels: Record<ConditionStatus, { en: string; es: string }> = {
  satisfactory: { en: 'Satisfactory', es: 'Satisfactorio' },
  needs_maintenance: { en: 'Needs Maintenance', es: 'Necesita Mantenimiento' },
  professional_consultation: { en: 'Professional Consultation', es: 'Consulta Profesional' },
  not_satisfactory: { en: 'Not Satisfactory', es: 'No Satisfactorio' },
};

export function getConditionLabel(status: ConditionStatus, lang: Language): string {
  return conditionStatusLabels[status][lang];
}

// Map severity to condition status
export function severityToCondition(severity: string): ConditionStatus {
  switch (severity?.toLowerCase()) {
    case 'minor':
      return 'needs_maintenance';
    case 'moderate':
      return 'needs_maintenance';
    case 'severe':
      return 'professional_consultation';
    default:
      return 'satisfactory';
  }
}

// Professional disclaimer templates by section
export const sectionDisclaimers: Record<string, { en: string; es: string }> = {
  site_grounds: {
    en: `This inspection is not intended to address or include any geological conditions or site stability information. For information concerning these conditions, a geologist or soils engineer should be consulted. Any reference to grade is limited to only areas around the exterior of the exposed foundation or exterior walls. This inspection is visual in nature and does not attempt to determine drainage performance of the site or the condition of any underground piping, including municipal water and sewer service piping or septic systems.`,
    es: `Esta inspección no tiene la intención de abordar o incluir condiciones geológicas o información sobre la estabilidad del sitio. Para información sobre estas condiciones, se debe consultar a un geólogo o ingeniero de suelos. Cualquier referencia al nivel del terreno se limita solo a las áreas alrededor del exterior de la cimentación expuesta o paredes exteriores.`
  },
  exterior_structure: {
    en: `Our inspection of the Exterior grounds includes the surface drainage, grading, some fencing, gates, sidewalks, patios, driveways, and retaining walls adjacent to the structure. The inspection of the exterior of the building includes the cladding, trim, eaves, fascias, decks, porches, downspouts, railings, doors, windows and flashings. Areas hidden from view by finished walls or stored items cannot be judged and are not a part of this inspection.`,
    es: `Nuestra inspección del exterior incluye el drenaje superficial, nivelación, cercas, portones, aceras, patios, entradas y muros de contención adyacentes a la estructura. La inspección del exterior del edificio incluye el revestimiento, molduras, aleros, fascias, terrazas, porches, bajantes, barandillas, puertas, ventanas y tapajuntas.`
  },
  roof: {
    en: `The inspection of the roof system includes a visual examination of the surface materials, connections, penetrations and roof drainage systems. We examine the roofing material for damage and deterioration. We examine the roof system for possible leaks, damage and conditions that suggest limited remaining service life. Opinions stated herein concerning the roofing material are based on the general condition of the roof system as evidence by our visual inspection. These do not constitute a warranty that the roof is or will remain, free of leaks.`,
    es: `La inspección del sistema de techo incluye un examen visual de los materiales de superficie, conexiones, penetraciones y sistemas de drenaje del techo. Examinamos el material del techo en busca de daños y deterioro. Las opiniones expresadas aquí sobre el material del techo se basan en la condición general del sistema de techo según nuestra inspección visual.`
  },
  plumbing: {
    en: `Our inspection of the plumbing system includes a visual examination of the exposed portions of the domestic water supply, drain waste, vent, gas lines, faucets, fixtures, valves, drains, traps, exposed pipes and fittings. These items are examined for proper function, excessive or unusual wear, leakage and general state of repair. The hidden nature of piping prevents inspection of every pipe and joint connection, especially in walls, floors and ceiling voids.`,
    es: `Nuestra inspección del sistema de plomería incluye un examen visual de las porciones expuestas del suministro de agua doméstica, drenaje, ventilación, líneas de gas, grifos, accesorios, válvulas, desagües, sifones, tuberías expuestas y conexiones.`
  },
  electrical: {
    en: `Our inspection of the electrical system includes the service entrance conductors, cables, and raceways. We inspect the main service disconnecting means and sub-panels, overcurrent protection devices (fuses and breakers), and a representative number of lighting fixtures, receptacles, switches, and GFCI and/or AFCI circuit interrupters. We do not evaluate every outlet, switch and fixture in the home.`,
    es: `Nuestra inspección del sistema eléctrico incluye los conductores de entrada de servicio, cables y canalizaciones. Inspeccionamos el medio principal de desconexión del servicio y subpaneles, dispositivos de protección contra sobrecorriente (fusibles y disyuntores), y un número representativo de accesorios de iluminación, receptáculos, interruptores e interruptores de circuito GFCI y/o AFCI.`
  },
  hvac: {
    en: `This is a visual inspection limited in scope by (but not restricted to) the following conditions: The heating and cooling supply adequacy or distribution balance are not inspected. Pressure tests on coolant systems are not within the scope of this inspection; therefore no representation is made regarding coolant charge or line integrity. Judgment of system efficiency or capacity is not within the scope of this inspection.`,
    es: `Esta es una inspección visual limitada en alcance por (pero no restringida a) las siguientes condiciones: No se inspecciona la adecuación del suministro de calefacción y refrigeración o el balance de distribución. Las pruebas de presión en sistemas de refrigerante no están dentro del alcance de esta inspección.`
  },
  interior: {
    en: `Our inspection of the interior includes the walls, ceilings, floors, windows, doors, stairs, railings, fireplaces, and permanently installed fixtures. We examine these components for proper function, damage, deterioration and general state of repair. Our inspection does not include furniture, household appliances, window treatments, recreational facilities, or other non-permanent improvements.`,
    es: `Nuestra inspección del interior incluye las paredes, techos, pisos, ventanas, puertas, escaleras, barandillas, chimeneas y accesorios instalados permanentemente. Examinamos estos componentes para verificar su funcionamiento adecuado, daños, deterioro y estado general de reparación.`
  },
  kitchen: {
    en: `Our inspection of the kitchen includes the counters, cabinets, sink, faucet, garbage disposal, dishwasher, range/oven/cooktop, ventilation, and permanently installed appliances. We examine these components for proper function, damage, and general state of repair.`,
    es: `Nuestra inspección de la cocina incluye los mostradores, gabinetes, fregadero, grifo, triturador de basura, lavavajillas, estufa/horno, ventilación y electrodomésticos instalados permanentemente.`
  },
  bathroom: {
    en: `Our inspection of bathrooms includes the toilet, sink, faucet, bathtub, shower, ventilation, and permanently installed fixtures. We examine these components for proper function, water damage, and general state of repair. The inspection does not include testing of overflow drains or evaluation of the waterproofing behind tile surfaces.`,
    es: `Nuestra inspección de baños incluye el inodoro, lavabo, grifo, bañera, ducha, ventilación y accesorios instalados permanentemente. Examinamos estos componentes para verificar su funcionamiento adecuado, daños por agua y estado general de reparación.`
  },
  attic: {
    en: `Our inspection of the Attic includes a visual examination of the roof framing, plumbing, electrical, and mechanical systems. We examined these systems and components for proper function, unusual wear and general state of repair, leakage, venting and unusual or improper improvements. When low clearances and deep insulation prohibits walking in an unfinished Attic, inspection will be from the access opening only.`,
    es: `Nuestra inspección del ático incluye un examen visual del marco del techo, plomería, sistemas eléctricos y mecánicos. Examinamos estos sistemas y componentes para verificar su funcionamiento adecuado, desgaste inusual y estado general de reparación.`
  },
  basement_crawlspace: {
    en: `Many of the building's structural elements and portions of its mechanical systems are visible inside the Crawlspace. These include the foundation, portions of the structural framing, distribution systems for electricity, plumbing, and heating. Each accessible and visible component and system was examined for proper function, excessive wear or abnormal deterioration and general state of repair.`,
    es: `Muchos de los elementos estructurales del edificio y porciones de sus sistemas mecánicos son visibles dentro del espacio de acceso. Estos incluyen la cimentación, porciones del marco estructural, sistemas de distribución para electricidad, plomería y calefacción.`
  },
};

// Report introduction text
export const reportIntroduction = {
  en: `The following numbered and attached pages are your home inspection report. The report includes pictures, information, and recommendations. This inspection was performed in accordance with the current Standards of Practice and Code of Ethics of the American Society of Home Inspectors. The Standards contain certain and very important limitations, exceptions, and exclusions to the inspection. A copy is available prior to, during, and after the inspection, and it is part of the report.

The inspection is based on observation of the visible, readily accessible and apparent condition of the structure and its components on this day. The results of this inspection are not intended to make any representation regarding the presence or absence of latent or concealed defects that are not reasonably ascertainable or readily accessible in a competently performed inspection. No warranty, guarantee, or insurance by the inspection company is expressed or implied.

This report does not include inspection for wood destroying insects, mold, lead or asbestos. A representative sampling of the building components is viewed in areas that are accessible at the time of the inspection. No destructive testing or dismantling of components is performed. Not all defects will be identified during this inspection. Unexpected repairs should be anticipated.`,
  es: `Las siguientes páginas numeradas y adjuntas son su informe de inspección de la vivienda. El informe incluye fotografías, información y recomendaciones. Esta inspección se realizó de acuerdo con las Normas de Práctica y el Código de Ética actuales de la Sociedad Americana de Inspectores de Viviendas.

La inspección se basa en la observación de la condición visible, fácilmente accesible y aparente de la estructura y sus componentes en este día. Los resultados de esta inspección no pretenden hacer ninguna representación con respecto a la presencia o ausencia de defectos latentes u ocultos.`
};

export const inspectorLimitations = {
  en: [
    'Life expectancy of any component or system',
    'The causes of the need for a repair',
    'The methods, materials, and costs of corrections',
    'The suitability of the property for any specialized use',
    'Compliance or non-compliance with codes, ordinances, statutes, regulatory requirements or restrictions',
    'The market value of the property or its marketability',
    'The advisability or inadvisability of purchase of the property',
    'Any component or system that was not observed',
    'The presence or absence of pests such as wood damaging organisms, rodents, or insects',
    'Cosmetic items, underground items, or items not permanently installed'
  ],
  es: [
    'La vida útil de cualquier componente o sistema',
    'Las causas de la necesidad de una reparación',
    'Los métodos, materiales y costos de las correcciones',
    'La idoneidad de la propiedad para cualquier uso especializado',
    'El cumplimiento o incumplimiento de códigos, ordenanzas, estatutos, requisitos o restricciones reglamentarias',
    'El valor de mercado de la propiedad o su comerciabilidad',
    'La conveniencia o inconveniencia de la compra de la propiedad',
    'Cualquier componente o sistema que no fue observado',
    'La presencia o ausencia de plagas',
    'Artículos cosméticos, artículos subterráneos o artículos no instalados permanentemente'
  ]
};

// Map rooms to report sections
export const roomToSection: Record<string, { section: string; title: { en: string; es: string } }> = {
  'exterior': { section: 'exterior_structure', title: { en: 'Exterior & Structure', es: 'Exterior y Estructura' } },
  'interior': { section: 'interior', title: { en: 'Interior', es: 'Interior' } },
  'kitchen': { section: 'kitchen', title: { en: 'Kitchen', es: 'Cocina' } },
  'bath': { section: 'bathroom', title: { en: 'Bathrooms', es: 'Baños' } },
  'dining': { section: 'interior', title: { en: 'Dining Room', es: 'Comedor' } },
  'bedroom1': { section: 'interior', title: { en: 'Bedroom 1', es: 'Dormitorio 1' } },
  'bedroom2': { section: 'interior', title: { en: 'Bedroom 2', es: 'Dormitorio 2' } },
  'bedroom3': { section: 'interior', title: { en: 'Bedroom 3', es: 'Dormitorio 3' } },
  'living': { section: 'interior', title: { en: 'Living Room', es: 'Sala de Estar' } },
  'garage': { section: 'exterior_structure', title: { en: 'Garage', es: 'Garaje' } },
  'attic': { section: 'attic', title: { en: 'Attic', es: 'Ático' } },
  'basement': { section: 'basement_crawlspace', title: { en: 'Basement / Crawlspace', es: 'Sótano / Espacio de Acceso' } },
  'roof': { section: 'roof', title: { en: 'Roof', es: 'Techo' } },
  'plumbing': { section: 'plumbing', title: { en: 'Plumbing', es: 'Plomería' } },
  'electrical': { section: 'electrical', title: { en: 'Electrical', es: 'Eléctrico' } },
  'hvac': { section: 'hvac', title: { en: 'Heating & Cooling', es: 'Calefacción y Refrigeración' } },
  'other': { section: 'interior', title: { en: 'Other Areas', es: 'Otras Áreas' } },
};
