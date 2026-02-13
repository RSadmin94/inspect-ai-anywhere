import { useState } from 'react';
import { Clipboard, Shield, FileText, Loader2, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useLicense } from '@/hooks/useLicense';
import logo from '@/assets/logo.png';

interface WelcomePageProps {
  onComplete: () => void;
  t: (key: string) => string;
}

const TERMS_KEY = 'inspectai_terms_accepted';
const ONBOARDING_COMPLETE_KEY = 'inspectai_onboarding_complete';

export function hasCompletedOnboarding(): boolean {
  return localStorage.getItem(ONBOARDING_COMPLETE_KEY) === 'true';
}

export function WelcomePage({ onComplete, t }: WelcomePageProps) {
  const { licenseKey, setLicenseKey, verifyLicense, isVerifying, licenseState } = useLicense();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isActivating, setIsActivating] = useState(false);

  const canProceed = termsAccepted && privacyAccepted && ((licenseKey ?? '').trim().length) > 0;

  const handleActivate = async () => {
    if (!canProceed) return;
    
    setIsActivating(true);
    setError(null);

    try {
      const result = await verifyLicense();
      
      if (result?.valid && result?.status === 'active') {
        // Store acceptance
        localStorage.setItem(TERMS_KEY, new Date().toISOString());
        localStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
        onComplete();
      } else {
        setError(result?.message || 'License verification failed. Please check your license key.');
      }
    } catch (e) {
      setError('Unable to verify license. Please check your internet connection and try again.');
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="safe-top px-6 pt-8 pb-6 text-center">
        <div className="flex flex-col items-center gap-4">
          <img 
            src={logo} 
            alt="365 InspectAI Logo" 
            className="w-[120px] h-[120px] rounded-3xl shadow-lg"
          />
          <div>
            <h1 className="text-3xl font-bold text-foreground">365 InspectAI</h1>
            <p className="text-sm text-muted-foreground mt-1">Professional Home Inspection Assistant</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 pb-safe-bottom overflow-y-auto">
        <div className="max-w-md mx-auto space-y-6">
          {/* Welcome Message */}
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <h2 className="font-semibold text-foreground">Welcome, Inspector</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  365 InspectAI is a professional-grade inspection tool designed for licensed home inspectors. 
                  Your data is stored locally on your device for maximum privacy and offline capability.
                </p>
              </div>
            </div>
          </div>

          {/* Terms Summary */}
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Terms of Service Summary</h3>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1.5">
                  <li>• This app is a tool for licensed professionals</li>
                  <li>• You retain ownership of all inspection data</li>
                  <li>• Photos are only transmitted when using AI analysis</li>
                  <li>• Data is stored locally on your device</li>
                  <li>• License allows use on up to 2 devices</li>
                </ul>
                <button 
                  onClick={() => setShowTerms(true)}
                  className="text-primary text-sm font-medium mt-2 flex items-center gap-1 hover:underline"
                >
                  Read full Terms of Service <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* License Key Input */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground block">
              License Key
            </label>
            <Input
              type="text"
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
              placeholder="Enter your license key"
              className="h-12 text-base font-mono"
              disabled={isActivating}
            />
            <p className="text-xs text-muted-foreground">
              Enter the license key you received after purchase. Contact{' '}
              <a href="mailto:support@365globalsolutions.com" className="text-primary hover:underline">
                support@365globalsolutions.com
              </a>
              {' '}if you need assistance.
            </p>
          </div>

          {/* Checkboxes */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Checkbox
                id="terms"
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                disabled={isActivating}
              />
              <label htmlFor="terms" className="text-sm text-foreground cursor-pointer">
                I have read and accept the{' '}
                <button 
                  onClick={() => setShowTerms(true)}
                  className="text-primary hover:underline"
                >
                  Terms of Service
                </button>
              </label>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="privacy"
                checked={privacyAccepted}
                onCheckedChange={(checked) => setPrivacyAccepted(checked === true)}
                disabled={isActivating}
              />
              <label htmlFor="privacy" className="text-sm text-foreground cursor-pointer">
                I have read and accept the{' '}
                <button 
                  onClick={() => setShowPrivacy(true)}
                  className="text-primary hover:underline"
                >
                  Privacy Policy
                </button>
              </label>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Activate Button */}
          <Button
            onClick={handleActivate}
            disabled={!canProceed || isActivating}
            className="w-full h-14 text-lg font-semibold"
            size="lg"
          >
            {isActivating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Verifying License...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 mr-2" />
                I Accept & Activate
              </>
            )}
          </Button>

          {/* Footer */}
          <p className="text-xs text-center text-muted-foreground pb-6">
            By activating, you agree to use this application in accordance with all applicable laws and regulations governing home inspections in your jurisdiction.
          </p>
        </div>
      </div>

      {/* Terms Modal */}
      {showTerms && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
            <h1 className="font-semibold">Terms of Service</h1>
            <Button variant="ghost" size="sm" onClick={() => setShowTerms(false)}>
              Close
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <TermsContent />
          </div>
        </div>
      )}

      {/* Privacy Modal */}
      {showPrivacy && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
            <h1 className="font-semibold">Privacy Policy</h1>
            <Button variant="ghost" size="sm" onClick={() => setShowPrivacy(false)}>
              Close
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <PrivacyContent />
          </div>
        </div>
      )}
    </div>
  );
}

// Inline Terms content
function TermsContent() {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <h2>Terms of Service</h2>
      <p><strong>Last Updated:</strong> February 2025</p>
      
      <h3>1. Acceptance of Terms</h3>
      <p>By accessing and using 365 InspectAI, you agree to be bound by these Terms of Service.</p>
      
      <h3>2. Professional Use</h3>
      <p>This application is designed as a tool for licensed home inspection professionals. Users are responsible for ensuring their use complies with all applicable licensing requirements and regulations in their jurisdiction.</p>
      
      <h3>3. Data Ownership</h3>
      <p>You retain full ownership of all inspection data, photos, and reports created using this application. We do not claim any rights to your content.</p>
      
      <h3>4. Local Storage</h3>
      <p>All inspection data is stored locally on your device using IndexedDB. This enables offline functionality and ensures your data remains under your control.</p>
      
      <h3>5. AI Analysis</h3>
      <p>When using AI-powered features, photos may be temporarily transmitted to AI service providers for analysis. This only occurs when you are online and actively request analysis.</p>
      
      <h3>6. License Terms</h3>
      <p>Your license allows use on up to 2 devices. Device activations can be reset once every 30 days.</p>
      
      <h3>7. Disclaimer</h3>
      <p>This application is a tool to assist with inspections. It does not replace professional judgment or certification requirements. Users are solely responsible for the accuracy and completeness of their inspection reports.</p>
      
      <h3>8. Contact</h3>
      <p>For support inquiries: <a href="mailto:support@365globalsolutions.com">support@365globalsolutions.com</a></p>
    </div>
  );
}

// Inline Privacy content
function PrivacyContent() {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <h2>Privacy Policy</h2>
      <p><strong>Last Updated:</strong> February 2025</p>
      
      <h3>1. Data Collection</h3>
      <p>365 InspectAI is designed with a local-first architecture. The vast majority of your data never leaves your device.</p>
      
      <h3>2. What We Store Locally</h3>
      <ul>
        <li>Inspection details and metadata</li>
        <li>Photos and annotations</li>
        <li>Generated reports</li>
        <li>Company profile information</li>
        <li>License activation status</li>
      </ul>
      
      <h3>3. What May Be Transmitted</h3>
      <ul>
        <li><strong>License Verification:</strong> Your license key and device ID are sent to our servers to verify your license status.</li>
        <li><strong>AI Analysis:</strong> When you request AI analysis of a photo, that photo is temporarily sent to our AI service provider for processing.</li>
      </ul>
      
      <h3>4. Third-Party Services</h3>
      <p>We use AI services to provide photo analysis features. These services process images only when explicitly requested and do not retain your images after processing.</p>
      
      <h3>5. Data Retention</h3>
      <p>Local data remains on your device until you delete it. We do not maintain copies of your inspection data on our servers.</p>
      
      <h3>6. Your Rights</h3>
      <p>You have full control over your data. You can export, delete, or modify any inspection data at any time.</p>
      
      <h3>7. Contact</h3>
      <p>For privacy inquiries: <a href="mailto:support@365globalsolutions.com">support@365globalsolutions.com</a></p>
    </div>
  );
}
