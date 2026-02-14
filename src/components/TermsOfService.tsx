import { X, FileText } from 'lucide-react';
import type { Language } from '@/lib/i18n';

interface TermsOfServiceProps {
  isOpen: boolean;
  onClose: () => void;
  language?: Language;
}

const CONTENT = {
  en: {
    title: 'Terms of Service',
    lastUpdated: 'Last Updated: February 2026',
    sections: [
      { heading: '1. Acceptance of Terms', body: 'By using 365 InspectAI ("the App"), you agree to these Terms of Service. If you do not agree, do not use the App.' },
      { heading: '2. Description of Service', body: '365 InspectAI is a property inspection tool that assists inspectors in documenting property conditions, capturing photos, and generating reports. The App is a tool; the inspector is solely responsible for all inspection findings, conclusions, and recommendations.' },
      { heading: '3. User Responsibilities', body: 'You acknowledge and agree that:', list: ['You are a qualified property inspector or acting under proper supervision', 'All inspection content, findings, and reports are your sole responsibility', 'You will verify all AI-generated suggestions before including them in reports', 'You will comply with all applicable laws and professional standards'] },
      { heading: '4. AI Features', body: 'The App includes AI-powered photo analysis features. When online, photos may be sent to AI service providers for analysis. AI suggestions are provided as assistance only and should always be reviewed and verified by a qualified professional before use.' },
      { heading: '5. Data Storage', body: 'All inspection data, photos, and reports are stored locally on your device by default. The App operates in an offline-first manner. You are responsible for backing up your data.' },
      { heading: '6. Limitation of Liability', body: 'THE APP IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND. 365 INSPECTAI SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE APP. THE APP IS A TOOL; IT DOES NOT REPLACE PROFESSIONAL JUDGMENT OR EXPERTISE.' },
      { heading: '7. Indemnification', body: 'You agree to indemnify and hold harmless 365 InspectAI from any claims, damages, or expenses arising from your use of the App, your inspection reports, or your violation of these Terms.' },
      { heading: '8. Changes to Terms', body: 'We may update these Terms at any time. Continued use of the App after changes constitutes acceptance of the new Terms.' },
      { heading: '9. Contact', body: 'For questions about these Terms, please contact support through the App.' },
    ],
    footer: '© 2026 365 InspectAI. All rights reserved.',
  },
  es: {
    title: 'Términos de Servicio',
    lastUpdated: 'Última actualización: Febrero 2026',
    sections: [
      { heading: '1. Aceptación de los Términos', body: 'Al usar 365 InspectAI ("la App"), usted acepta estos Términos de Servicio. Si no está de acuerdo, no utilice la App.' },
      { heading: '2. Descripción del Servicio', body: '365 InspectAI es una herramienta de inspección de propiedades que asiste a los inspectores en la documentación de condiciones de la propiedad, captura de fotos y generación de informes. La App es una herramienta; el inspector es el único responsable de todos los hallazgos, conclusiones y recomendaciones de la inspección.' },
      { heading: '3. Responsabilidades del Usuario', body: 'Usted reconoce y acepta que:', list: ['Es un inspector de propiedades calificado o actúa bajo supervisión adecuada', 'Todo el contenido de inspección, hallazgos e informes es su exclusiva responsabilidad', 'Verificará todas las sugerencias generadas por IA antes de incluirlas en informes', 'Cumplirá con todas las leyes y estándares profesionales aplicables'] },
      { heading: '4. Funciones de IA', body: 'La App incluye funciones de análisis fotográfico con IA. Cuando esté en línea, las fotos pueden enviarse a proveedores de servicios de IA para análisis. Las sugerencias de IA se proporcionan únicamente como asistencia y siempre deben ser revisadas y verificadas por un profesional calificado antes de su uso.' },
      { heading: '5. Almacenamiento de Datos', body: 'Todos los datos de inspección, fotos e informes se almacenan localmente en su dispositivo por defecto. La App opera de forma offline-first. Usted es responsable de respaldar sus datos.' },
      { heading: '6. Limitación de Responsabilidad', body: 'LA APP SE PROPORCIONA "TAL CUAL" SIN GARANTÍA DE NINGÚN TIPO. 365 INSPECTAI NO SERÁ RESPONSABLE DE DAÑOS INDIRECTOS, INCIDENTALES, ESPECIALES, CONSECUENCIALES O PUNITIVOS DERIVADOS DEL USO DE LA APP. LA APP ES UNA HERRAMIENTA; NO REEMPLAZA EL JUICIO O LA EXPERIENCIA PROFESIONAL.' },
      { heading: '7. Indemnización', body: 'Usted acepta indemnizar y eximir de responsabilidad a 365 InspectAI por cualquier reclamación, daño o gasto que surja de su uso de la App, sus informes de inspección o su violación de estos Términos.' },
      { heading: '8. Cambios a los Términos', body: 'Podemos actualizar estos Términos en cualquier momento. El uso continuado de la App después de los cambios constituye la aceptación de los nuevos Términos.' },
      { heading: '9. Contacto', body: 'Para preguntas sobre estos Términos, contacte al soporte a través de la App.' },
    ],
    footer: '© 2026 365 InspectAI. Todos los derechos reservados.',
  },
};

export function TermsOfService({ isOpen, onClose, language = 'en' }: TermsOfServiceProps) {
  if (!isOpen) return null;

  const c = CONTENT[language];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 animate-fade-in" onClick={onClose}>
      <div
        className="fixed inset-x-4 top-[5%] bottom-[5%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[600px] bg-card rounded-2xl shadow-xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">{c.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-muted-foreground">
          <p className="text-foreground font-medium">{c.lastUpdated}</p>

          {c.sections.map((section, i) => (
            <section key={i}>
              <h3 className="font-semibold text-foreground mb-2">{section.heading}</h3>
              <p>{section.body}</p>
              {section.list && (
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  {section.list.map((item, j) => (
                    <li key={j}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          <p className="text-xs text-muted-foreground pt-4 border-t border-border">{c.footer}</p>
        </div>
      </div>
    </div>
  );
}
