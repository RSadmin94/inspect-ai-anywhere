import { X, Shield } from 'lucide-react';

interface PrivacyPolicyProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PrivacyPolicy({ isOpen, onClose }: PrivacyPolicyProps) {
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
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Privacy Policy</h2>
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
            <h3 className="font-semibold text-foreground mb-2">1. Overview</h3>
            <p>
              365 InspectAI ("we", "our", "the App") is committed to protecting your privacy. 
              This Privacy Policy explains how we handle your data.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground mb-2">2. Data Storage</h3>
            <p>
              <strong>Local Storage:</strong> All inspection data, photos, and reports are 
              stored locally on your device using IndexedDB. We do not store your inspection 
              data on external servers.
            </p>
            <p className="mt-2">
              <strong>Offline-First:</strong> The App is designed to work offline. Your data 
              remains on your device and under your control.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground mb-2">3. Data We Process</h3>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li><strong>Inspection Data:</strong> Property addresses, client names, photos, notes, and findings you create</li>
              <li><strong>Device Identifier:</strong> A locally-generated device ID for license verification</li>
              <li><strong>License Key:</strong> Your license key for activation purposes</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-foreground mb-2">4. AI Photo Analysis</h3>
            <p>
              When you use AI analysis features while online:
            </p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Photos are sent to AI service providers for analysis</li>
              <li>Photos are processed to generate findings and recommendations</li>
              <li>We do not permanently store your photos on AI servers</li>
              <li>AI analysis is optional and requires internet connectivity</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-foreground mb-2">5. License Verification</h3>
            <p>
              For license verification, we transmit:
            </p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Your license key (hashed)</li>
              <li>A device identifier</li>
            </ul>
            <p className="mt-2">
              This data is used solely to verify your license and manage device activations. 
              No inspection data is transmitted during license verification.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground mb-2">6. Data We Do NOT Collect</h3>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Personal information beyond what you enter in inspections</li>
              <li>Location data</li>
              <li>Usage analytics or tracking data</li>
              <li>Contact lists or device data unrelated to the App</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-foreground mb-2">7. No Sale of Data</h3>
            <p>
              We do not sell, rent, or trade your personal data or inspection information 
              to third parties.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground mb-2">8. Data Retention</h3>
            <p>
              Your inspection data is stored locally on your device until you delete it. 
              You have full control over your data. Deleting an inspection removes all 
              associated photos and data from your device.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground mb-2">9. Your Rights</h3>
            <p>You have the right to:</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Access all your data (it's stored locally on your device)</li>
              <li>Export your inspections for backup</li>
              <li>Delete any or all of your inspection data</li>
              <li>Use the App without AI features (data stays local)</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-foreground mb-2">10. Changes to This Policy</h3>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of 
              significant changes through the App.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground mb-2">11. Contact</h3>
            <p>
              For privacy-related questions, please contact support through the App.
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
