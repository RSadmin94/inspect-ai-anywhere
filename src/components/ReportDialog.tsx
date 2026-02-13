import { useState } from 'react';
import { X, FileText, Download, Loader2, Users, Sparkles, Send } from 'lucide-react';
import { generateInspectionPDF } from '@/lib/pdfGenerator';
import { generateAgentSummaryPDF } from '@/lib/pdf/agentSummaryPdf';
import { InspectionRecord, PhotoRecord } from '@/lib/db';
import { cn } from '@/lib/utils';

interface ReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  inspection: InspectionRecord;
  photos: PhotoRecord[];
  t: (key: string) => string;
}

type ReportLanguage = 'en' | 'es' | 'both';
type ReportType = 'full' | 'agent';

export function ReportDialog({ isOpen, onClose, inspection, photos, t }: ReportDialogProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<ReportLanguage>('en');
  const [reportType, setReportType] = useState<ReportType>('agent');
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      let pdfBlob: Blob;
      let filename: string;
      
      if (reportType === 'agent') {
        pdfBlob = await generateAgentSummaryPDF(inspection, photos, selectedLanguage);
        filename = `agent-summary-${inspection.propertyAddress.replace(/[^a-z0-9]/gi, '-')}-${Date.now()}.pdf`;
      } else {
        pdfBlob = await generateInspectionPDF(inspection, photos, selectedLanguage);
        filename = `inspection-${inspection.propertyAddress.replace(/[^a-z0-9]/gi, '-')}-${Date.now()}.pdf`;
      }
      
      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      onClose();
    } catch (e) {
      console.error('Failed to generate PDF:', e);
    }
    setIsGenerating(false);
  };

  const languageOptions: { value: ReportLanguage; label: string }[] = [
    { value: 'en', label: t('english') },
    { value: 'es', label: t('spanish') },
    { value: 'both', label: t('both') },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 animate-fade-in" onClick={onClose}>
      <div 
        className="slide-panel max-h-[70vh] animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="slide-panel-handle" />
        
        <div className="px-4 pb-safe-bottom overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                <FileText className="w-5 h-5 text-accent-foreground" />
              </div>
              <h2 className="text-lg font-semibold">{t('generateReport')}</h2>
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted touch-target"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Report Type Selection - Agent Summary Featured */}
          <div className="mb-5">
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Report Type
            </label>
            <div className="grid grid-cols-1 gap-3">
              {/* Agent Summary - Premium Featured Option */}
              <button
                onClick={() => setReportType('agent')}
                className={cn(
                  "relative p-4 rounded-xl border-2 text-left transition-all",
                  reportType === 'agent'
                    ? "border-primary bg-primary/5"
                    : "border-muted bg-muted/30 hover:border-muted-foreground/30"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                    reportType === 'agent' ? "bg-primary text-primary-foreground" : "bg-muted"
                  )}>
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">Agent Summary</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                        <Sparkles className="w-3 h-3" />
                        1 Page
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Agents get a 1-page summary they actually read. Perfect for forwarding.
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Send className="w-3 h-3" />
                        Easy to share
                      </span>
                      <span>•</span>
                      <span>Key findings only</span>
                    </div>
                  </div>
                </div>
                {reportType === 'agent' && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>

              {/* Full Report Option */}
              <button
                onClick={() => setReportType('full')}
                className={cn(
                  "relative p-4 rounded-xl border-2 text-left transition-all",
                  reportType === 'full'
                    ? "border-primary bg-primary/5"
                    : "border-muted bg-muted/30 hover:border-muted-foreground/30"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                    reportType === 'full' ? "bg-primary text-primary-foreground" : "bg-muted"
                  )}>
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold">Full Inspection Report</span>
                    <p className="text-sm text-muted-foreground mt-1">
                      Complete report with all findings, photos, and recommendations.
                    </p>
                  </div>
                </div>
                {reportType === 'full' && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Language Selection */}
          <div className="mb-5">
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              {t('reportLanguage')}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {languageOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSelectedLanguage(opt.value)}
                  className={cn(
                    "h-11 rounded-xl font-medium transition-all touch-target text-sm",
                    selectedLanguage === opt.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-muted/50 rounded-xl p-4 mb-5">
            <p className="text-sm text-muted-foreground">
              {(photos?.length ?? 0)} {t('photos')} • {inspection.propertyAddress}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {(photos ?? []).filter(p => p.aiStatus === 'complete').length} AI {t('aiComplete').toLowerCase()}
            </p>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full h-14 bg-accent text-accent-foreground rounded-xl font-semibold text-lg touch-target flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                {reportType === 'agent' ? 'Download Agent Summary' : t('downloadPdf')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}