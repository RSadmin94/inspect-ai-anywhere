import { X, Shield } from 'lucide-react';
import type { Language } from '@/lib/i18n';

interface PrivacyPolicyProps {
  isOpen: boolean;
  onClose: () => void;
  language?: Language;
}

const CONTENT = {
  en: {
    title: 'Privacy Policy',
    lastUpdated: 'Last Updated: February 2026',
    sections: [
      { heading: '1. Overview', body: '365 InspectAI ("we", "our", "the App") is committed to protecting your privacy. This Privacy Policy explains how we handle your data.' },
      { heading: '2. Data Storage', body: null, list: [
        'Local Storage: All inspection data, photos, and reports are stored locally on your device using IndexedDB. We do not store your inspection data on external servers.',
        'Offline-First: The App is designed to work offline. Your data remains on your device and under your control.',
      ]},
      { heading: '3. Data We Process', body: null, list: [
        'Inspection Data: Property addresses, client names, photos, notes, and findings you create',
        'Device Identifier: A locally-generated device ID for license verification',
        'License Key: Your license key for activation purposes',
      ]},
      { heading: '4. AI Photo Analysis', body: 'When you use AI analysis features while online:', list: [
        'Photos are sent to AI service providers for analysis',
        'Photos are processed to generate findings and recommendations',
        'We do not permanently store your photos on AI servers',
        'AI analysis is optional and requires internet connectivity',
      ]},
      { heading: '5. License Verification', body: 'For license verification, we transmit: Your license key (hashed) and a device identifier. This data is used solely to verify your license and manage device activations. No inspection data is transmitted during license verification.' },
      { heading: '6. Data We Do NOT Collect', body: null, list: [
        'Personal information beyond what you enter in inspections',
        'Location data',
        'Usage analytics or tracking data',
        'Contact lists or device data unrelated to the App',
      ]},
      { heading: '7. No Sale of Data', body: 'We do not sell, rent, or trade your personal data or inspection information to third parties.' },
      { heading: '8. Data Retention', body: 'Your inspection data is stored locally on your device until you delete it. You have full control over your data. Deleting an inspection removes all associated photos and data from your device.' },
      { heading: '9. Your Rights', body: 'You have the right to:', list: [
        'Access all your data (it\'s stored locally on your device)',
        'Export your inspections for backup',
        'Delete any or all of your inspection data',
        'Use the App without AI features (data stays local)',
      ]},
      { heading: '10. Changes to This Policy', body: 'We may update this Privacy Policy from time to time. We will notify you of significant changes through the App.' },
      { heading: '11. Contact', body: 'For privacy-related questions, please contact support through the App.' },
    ],
    footer: '© 2026 365 InspectAI. All rights reserved.',
  },
  es: {
    title: 'Política de Privacidad',
    lastUpdated: 'Última actualización: Febrero 2026',
    sections: [
      { heading: '1. Descripción General', body: '365 InspectAI ("nosotros", "nuestra", "la App") está comprometido con proteger su privacidad. Esta Política de Privacidad explica cómo manejamos sus datos.' },
      { heading: '2. Almacenamiento de Datos', body: null, list: [
        'Almacenamiento Local: Todos los datos de inspección, fotos e informes se almacenan localmente en su dispositivo usando IndexedDB. No almacenamos sus datos de inspección en servidores externos.',
        'Offline-First: La App está diseñada para funcionar sin conexión. Sus datos permanecen en su dispositivo y bajo su control.',
      ]},
      { heading: '3. Datos que Procesamos', body: null, list: [
        'Datos de Inspección: Direcciones de propiedades, nombres de clientes, fotos, notas y hallazgos que usted crea',
        'Identificador de Dispositivo: Un ID de dispositivo generado localmente para verificación de licencia',
        'Clave de Licencia: Su clave de licencia para propósitos de activación',
      ]},
      { heading: '4. Análisis Fotográfico con IA', body: 'Cuando usa las funciones de análisis con IA mientras está en línea:', list: [
        'Las fotos se envían a proveedores de servicios de IA para análisis',
        'Las fotos se procesan para generar hallazgos y recomendaciones',
        'No almacenamos permanentemente sus fotos en servidores de IA',
        'El análisis con IA es opcional y requiere conectividad a internet',
      ]},
      { heading: '5. Verificación de Licencia', body: 'Para la verificación de licencia, transmitimos: su clave de licencia (hasheada) y un identificador de dispositivo. Estos datos se utilizan únicamente para verificar su licencia y gestionar las activaciones de dispositivos. No se transmite ningún dato de inspección durante la verificación de licencia.' },
      { heading: '6. Datos que NO Recopilamos', body: null, list: [
        'Información personal más allá de lo que ingresa en las inspecciones',
        'Datos de ubicación',
        'Datos de análisis de uso o seguimiento',
        'Listas de contactos o datos del dispositivo no relacionados con la App',
      ]},
      { heading: '7. No Vendemos Datos', body: 'No vendemos, alquilamos ni comercializamos sus datos personales o información de inspección con terceros.' },
      { heading: '8. Retención de Datos', body: 'Sus datos de inspección se almacenan localmente en su dispositivo hasta que los elimine. Usted tiene control total sobre sus datos. Eliminar una inspección elimina todas las fotos y datos asociados de su dispositivo.' },
      { heading: '9. Sus Derechos', body: 'Usted tiene derecho a:', list: [
        'Acceder a todos sus datos (se almacenan localmente en su dispositivo)',
        'Exportar sus inspecciones como respaldo',
        'Eliminar cualquier o todos sus datos de inspección',
        'Usar la App sin funciones de IA (los datos permanecen locales)',
      ]},
      { heading: '10. Cambios a Esta Política', body: 'Podemos actualizar esta Política de Privacidad de vez en cuando. Le notificaremos cambios significativos a través de la App.' },
      { heading: '11. Contacto', body: 'Para preguntas relacionadas con la privacidad, contacte al soporte a través de la App.' },
    ],
    footer: '© 2026 365 InspectAI. Todos los derechos reservados.',
  },
};

export function PrivacyPolicy({ isOpen, onClose, language = 'en' }: PrivacyPolicyProps) {
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
            <Shield className="w-5 h-5 text-primary" />
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
              {section.body && <p>{section.body}</p>}
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
