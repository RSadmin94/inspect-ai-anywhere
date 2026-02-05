 import { useState } from 'react';
 import { X, FileText, Download, Loader2 } from 'lucide-react';
 import { generateInspectionPDF } from '@/lib/pdfGenerator';
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
 
 export function ReportDialog({ isOpen, onClose, inspection, photos, t }: ReportDialogProps) {
   const [selectedLanguage, setSelectedLanguage] = useState<ReportLanguage>('en');
   const [isGenerating, setIsGenerating] = useState(false);
 
   if (!isOpen) return null;
 
   const handleGenerate = async () => {
     setIsGenerating(true);
     try {
       const pdfBlob = await generateInspectionPDF(inspection, photos, selectedLanguage);
       
       // Create download link
       const url = URL.createObjectURL(pdfBlob);
       const a = document.createElement('a');
       a.href = url;
       a.download = `inspection-${inspection.propertyAddress.replace(/[^a-z0-9]/gi, '-')}-${Date.now()}.pdf`;
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
         className="slide-panel max-h-[50vh] animate-slide-up"
         onClick={e => e.stopPropagation()}
       >
         <div className="slide-panel-handle" />
         
         <div className="px-4 pb-safe-bottom">
           {/* Header */}
           <div className="flex items-center justify-between mb-6">
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
 
           {/* Language Selection */}
           <div className="mb-6">
             <label className="text-sm font-medium text-muted-foreground mb-3 block">
               {t('reportLanguage')}
             </label>
             <div className="grid grid-cols-3 gap-2">
               {languageOptions.map(opt => (
                 <button
                   key={opt.value}
                   onClick={() => setSelectedLanguage(opt.value)}
                   className={cn(
                     "h-12 rounded-xl font-medium transition-all touch-target",
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
           <div className="bg-muted/50 rounded-xl p-4 mb-6">
             <p className="text-sm text-muted-foreground">
               {photos.length} {t('photos')} • {inspection.propertyAddress}
             </p>
             <p className="text-xs text-muted-foreground mt-1">
               {photos.filter(p => p.aiStatus === 'complete').length} AI {t('aiComplete').toLowerCase()}
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
                 {t('downloadPdf')}
               </>
             )}
           </button>
         </div>
       </div>
     </div>
   );
 }