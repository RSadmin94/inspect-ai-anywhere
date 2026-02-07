import { X, FileText } from 'lucide-react';

interface TermsOfServiceProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TermsOfService({ isOpen, onClose }: TermsOfServiceProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 animate-fade-in" onClick={onClose}>
      <div
        className="fixed inset-x-4 top-[5%] bottom-[5%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[600px] bg-card rounded-2xl shadow-xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Terms of Service</h2>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-muted-foreground">
          <p className="text-foreground font-medium">Last Updated: February 2026</p>

          <section>
            <h3 className="font-semibold text-foreground mb-2">1. Acceptance of Terms</h3>
            <p>
              By using 365 InspectAI ("the App"), you agree to these Terms of Service. 
              If you do not agree, do not use the App.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground mb-2">2. Description of Service</h3>
            <p>
              365 InspectAI is a property inspection tool that assists inspectors in 
              documenting property conditions, capturing photos, and generating reports. 
              The App is a tool; the inspector is solely responsible for all inspection 
              findings, conclusions, and recommendations.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground mb-2">3. User Responsibilities</h3>
            <p>You acknowledge and agree that:</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>You are a qualified property inspector or acting under proper supervision</li>
              <li>All inspection content, findings, and reports are your sole responsibility</li>
              <li>You will verify all AI-generated suggestions before including them in reports</li>
              <li>You will comply with all applicable laws and professional standards</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-foreground mb-2">4. AI Features</h3>
            <p>
              The App includes AI-powered photo analysis features. When online, photos may 
              be sent to AI service providers for analysis. AI suggestions are provided as 
              assistance only and should always be reviewed and verified by a qualified 
              professional before use.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground mb-2">5. Data Storage</h3>
            <p>
              All inspection data, photos, and reports are stored locally on your device 
              by default. The App operates in an offline-first manner. You are responsible 
              for backing up your data.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground mb-2">6. Limitation of Liability</h3>
            <p>
              THE APP IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND. 365 INSPECTAI 
              SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, 
              OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE APP. THE APP IS A TOOL; 
              IT DOES NOT REPLACE PROFESSIONAL JUDGMENT OR EXPERTISE.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground mb-2">7. Indemnification</h3>
            <p>
              You agree to indemnify and hold harmless 365 InspectAI from any claims, 
              damages, or expenses arising from your use of the App, your inspection 
              reports, or your violation of these Terms.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground mb-2">8. Changes to Terms</h3>
            <p>
              We may update these Terms at any time. Continued use of the App after 
              changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground mb-2">9. Contact</h3>
            <p>
              For questions about these Terms, please contact support through the App.
            </p>
          </section>

          <p className="text-xs text-muted-foreground pt-4 border-t border-border">
            © 2026 365 InspectAI. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
