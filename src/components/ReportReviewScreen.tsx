 import { useState, useEffect, useMemo } from 'react';
 import { 
   X, FileText, Download, ChevronDown, ChevronUp, MapPin, User, Calendar, 
   Building, AlertTriangle, CheckCircle, Clock, Camera, MessageSquare,
   Loader2, Eye, EyeOff, BookOpen
 } from 'lucide-react';
 import { PhotoRecord, InspectionRecord, Phrase, getAllPhrases, Category, Severity } from '@/lib/db';
 import { blobToDataUrl } from '@/lib/imageUtils';
 import { Language } from '@/lib/i18n';
 import { generateReportPDF } from '@/lib/reportPdfGenerator';
 import { cn } from '@/lib/utils';
 import { PhraseLibrary } from './PhraseLibrary';
 
 interface ReportReviewScreenProps {
   isOpen: boolean;
   onClose: () => void;
   inspection: InspectionRecord;
   photos: PhotoRecord[];
   language: Language;
   t: (key: string) => string;
 }
 
 type ReportLanguage = 'en' | 'es' | 'both';
type TabType = 'overview' | 'findings' | 'photos';
 
 const SEVERITY_ORDER: Severity[] = ['severe', 'moderate', 'minor'];
 const SEVERITY_COLORS: Record<Severity, string> = {
   severe: 'text-destructive',
   moderate: 'text-amber-500',
   minor: 'text-muted-foreground',
 };
 
 export function ReportReviewScreen({ isOpen, onClose, inspection, photos, language, t }: ReportReviewScreenProps) {
   const [activeTab, setActiveTab] = useState<TabType>('overview');
   const [reportLanguage, setReportLanguage] = useState<ReportLanguage>('en');
   const [isGenerating, setIsGenerating] = useState(false);
   const [disclaimers, setDisclaimers] = useState<string[]>([]);
   const [showPhraseLibrary, setShowPhraseLibrary] = useState(false);
   const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
   const [includedPhotos, setIncludedPhotos] = useState<Set<string>>(new Set(photos.map(p => p.id)));
 
   // Load photo thumbnails
   useEffect(() => {
     photos.forEach(async (photo) => {
       if (!photoUrls[photo.id]) {
         const url = await blobToDataUrl(photo.thumbnailBlob);
         setPhotoUrls(prev => ({ ...prev, [photo.id]: url }));
       }
     });
   }, [photos]);
 
   // Statistics
   const stats = useMemo(() => {
     const analyzed = photos.filter(p => p.aiStatus === 'complete');
     const findings = photos.filter(p => p.aiFindingTitle || p.manualTitle);
     const bySeverity = {
       severe: findings.filter(p => (p.aiSeverity || p.manualSeverity) === 'severe').length,
       moderate: findings.filter(p => (p.aiSeverity || p.manualSeverity) === 'moderate').length,
       minor: findings.filter(p => (p.aiSeverity || p.manualSeverity) === 'minor').length,
     };
     const byCategory = photos.reduce((acc, p) => {
       const cat = p.aiCategory || p.manualCategory || 'general';
       acc[cat] = (acc[cat] || 0) + 1;
       return acc;
     }, {} as Record<string, number>);
     
     return { analyzed: analyzed.length, findings: findings.length, bySeverity, byCategory };
   }, [photos]);
 
   // Group photos by room
   const photosByRoom = useMemo(() => {
     return photos.reduce((acc, photo) => {
       if (!acc[photo.room]) acc[photo.room] = [];
       acc[photo.room].push(photo);
       return acc;
     }, {} as Record<string, PhotoRecord[]>);
   }, [photos]);
 
   // Room notes
   const roomNotes = inspection.roomNotes || {};
   const roomsWithNotes = Object.entries(roomNotes).filter(([_, notes]) => notes?.trim());
 
   const handleGenerate = async () => {
     setIsGenerating(true);
     try {
       const selectedPhotos = photos
         .filter(p => includedPhotos.has(p.id))
         .map((p, idx) => ({ ...p, reportOrder: idx, includeInReport: true }));
 
       const pdfBlob = await generateReportPDF(
         inspection,
         selectedPhotos,
         reportLanguage,
         disclaimers,
         Object.keys(photosByRoom)
       );
 
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
 
   const togglePhoto = (photoId: string) => {
     setIncludedPhotos(prev => {
       const next = new Set(prev);
       if (next.has(photoId)) next.delete(photoId);
       else next.add(photoId);
       return next;
     });
   };
 
   const handleAddDisclaimer = (phrase: Phrase) => {
     const text = language === 'es' && phrase.textEs ? phrase.textEs : phrase.text;
     setDisclaimers(prev => [...prev, text]);
     setShowPhraseLibrary(false);
   };
 
   if (!isOpen) return null;
 
   const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
     { id: 'overview', label: t('overview'), icon: <FileText className="w-4 h-4" /> },
      { id: 'findings', label: `${t('findings')} & ${t('notes')}`, icon: <AlertTriangle className="w-4 h-4" /> },
     { id: 'photos', label: t('photos'), icon: <Camera className="w-4 h-4" /> },
   ];
 
   return (
     <div className="fixed inset-0 z-50 bg-background flex flex-col">
       {/* Header */}
       <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
         <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
             <FileText className="w-5 h-5 text-primary" />
           </div>
           <div>
             <h1 className="font-semibold">{t('reportReview')}</h1>
             <p className="text-xs text-muted-foreground truncate max-w-[200px]">
               {inspection.propertyAddress}
             </p>
           </div>
         </div>
         <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted">
           <X className="w-5 h-5" />
         </button>
       </div>
 
       {/* Tabs */}
       <div className="flex border-b border-border bg-card">
         {tabs.map(tab => (
           <button
             key={tab.id}
             onClick={() => setActiveTab(tab.id)}
             className={cn(
               "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors",
               activeTab === tab.id 
                 ? "text-primary border-b-2 border-primary" 
                 : "text-muted-foreground"
             )}
           >
             {tab.icon}
             <span className="hidden sm:inline">{tab.label}</span>
           </button>
         ))}
       </div>
 
       {/* Content */}
       <div className="flex-1 overflow-y-auto">
         {activeTab === 'overview' && (
           <div className="p-4 space-y-6">
             {/* Inspection Details */}
             <div className="bg-card rounded-xl p-4 border border-border">
               <h2 className="font-semibold mb-4">{t('inspectionDetails')}</h2>
               <div className="space-y-3">
                 <div className="flex items-center gap-3">
                   <MapPin className="w-4 h-4 text-muted-foreground" />
                   <span className="text-sm">{inspection.propertyAddress}</span>
                 </div>
                 {inspection.clientName && (
                   <div className="flex items-center gap-3">
                     <User className="w-4 h-4 text-muted-foreground" />
                     <span className="text-sm">{inspection.clientName}</span>
                   </div>
                 )}
                 {inspection.inspectorName && (
                   <div className="flex items-center gap-3">
                     <Building className="w-4 h-4 text-muted-foreground" />
                     <span className="text-sm">{inspection.inspectorName}</span>
                   </div>
                 )}
                 <div className="flex items-center gap-3">
                   <Calendar className="w-4 h-4 text-muted-foreground" />
                   <span className="text-sm">{new Date(inspection.createdAt).toLocaleDateString()}</span>
                 </div>
               </div>
             </div>
 
             {/* Statistics */}
             <div className="bg-card rounded-xl p-4 border border-border">
               <h2 className="font-semibold mb-4">{t('summary')}</h2>
               <div className="grid grid-cols-2 gap-4">
                 <div className="bg-muted/50 rounded-lg p-3 text-center">
                   <div className="text-2xl font-bold text-primary">{photos.length}</div>
                   <div className="text-xs text-muted-foreground">{t('totalPhotos')}</div>
                 </div>
                 <div className="bg-muted/50 rounded-lg p-3 text-center">
                   <div className="text-2xl font-bold text-primary">{stats.findings}</div>
                   <div className="text-xs text-muted-foreground">{t('findings')}</div>
                 </div>
               </div>
               
               {/* Severity breakdown */}
               <div className="mt-4 space-y-2">
                 <div className="flex items-center justify-between text-sm">
                   <span className="flex items-center gap-2">
                     <span className="w-3 h-3 rounded-full bg-destructive" />
                     {t('severe')}
                   </span>
                   <span className="font-medium">{stats.bySeverity.severe}</span>
                 </div>
                 <div className="flex items-center justify-between text-sm">
                   <span className="flex items-center gap-2">
                     <span className="w-3 h-3 rounded-full bg-amber-500" />
                     {t('moderate')}
                   </span>
                   <span className="font-medium">{stats.bySeverity.moderate}</span>
                 </div>
                 <div className="flex items-center justify-between text-sm">
                   <span className="flex items-center gap-2">
                     <span className="w-3 h-3 rounded-full bg-muted-foreground" />
                     {t('minor')}
                   </span>
                   <span className="font-medium">{stats.bySeverity.minor}</span>
                 </div>
               </div>
             </div>
 
             {/* Language Selection */}
             <div className="bg-card rounded-xl p-4 border border-border">
               <h2 className="font-semibold mb-3">{t('reportLanguage')}</h2>
               <div className="grid grid-cols-3 gap-2">
                 {(['en', 'es', 'both'] as ReportLanguage[]).map(lang => (
                   <button
                     key={lang}
                     onClick={() => setReportLanguage(lang)}
                     className={cn(
                       "py-2 px-3 rounded-lg text-sm font-medium transition-colors",
                       reportLanguage === lang
                         ? "bg-primary text-primary-foreground"
                         : "bg-muted text-muted-foreground"
                     )}
                   >
                     {lang === 'en' ? t('english') : lang === 'es' ? t('spanish') : t('both')}
                   </button>
                 ))}
               </div>
             </div>
           </div>
         )}
 
         {activeTab === 'findings' && (
           <div className="p-4 space-y-4">
              {/* Room Notes Section */}
              {roomsWithNotes.length > 0 && (
                <div className="bg-card rounded-xl p-4 border border-border">
                  <h2 className="font-semibold mb-3 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    {t('roomNotes')}
                  </h2>
                  <div className="space-y-3">
                    {roomsWithNotes.map(([room, notes]) => (
                      <div key={room} className="bg-muted/50 rounded-lg p-3">
                        <h3 className="text-sm font-medium mb-1">{t(room)}</h3>
                        <p className="text-sm text-muted-foreground">{notes}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Findings by Severity */}
             {SEVERITY_ORDER.map(severity => {
               const findings = photos.filter(p => 
                 (p.aiSeverity === severity || p.manualSeverity === severity) && 
                 (p.aiFindingTitle || p.manualTitle)
               );
               if (findings.length === 0) return null;
               
               return (
                 <div key={severity}>
                   <h3 className={cn("font-semibold mb-2 capitalize", SEVERITY_COLORS[severity])}>
                     {t(severity)} ({findings.length})
                   </h3>
                   <div className="space-y-2">
                     {findings.map(photo => (
                       <div key={photo.id} className="bg-card rounded-lg p-3 border border-border flex gap-3">
                         {photoUrls[photo.id] && (
                           <img src={photoUrls[photo.id]} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                         )}
                         <div className="flex-1 min-w-0">
                           <h4 className="font-medium text-sm truncate">
                             {photo.manualTitle || photo.aiFindingTitle}
                           </h4>
                           <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                             {photo.manualDescription || photo.aiDescription}
                           </p>
                           <div className="flex items-center gap-2 mt-2">
                             <span className="text-xs bg-muted px-2 py-0.5 rounded">
                               {t(photo.room)}
                             </span>
                             <span className="text-xs bg-muted px-2 py-0.5 rounded">
                               {t(photo.aiCategory || photo.manualCategory || 'general')}
                             </span>
                           </div>
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
               );
             })}
             
              {stats.findings === 0 && roomsWithNotes.length === 0 && (
               <div className="text-center py-12 text-muted-foreground">
                 <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                 <p>{t('noFindingsYet')}</p>
               </div>
             )}

              {/* Disclaimers Section */}
              <div className="bg-card rounded-xl p-4 border border-border">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold">{t('disclaimers')}</h2>
                  <button
                    onClick={() => setShowPhraseLibrary(true)}
                    className="text-xs text-primary flex items-center gap-1"
                  >
                    <BookOpen className="w-3 h-3" />
                    {t('addFromLibrary')}
                  </button>
                </div>
                {disclaimers.length > 0 ? (
                  <div className="space-y-2">
                    {disclaimers.map((text, idx) => (
                      <div key={idx} className="bg-muted/50 rounded-lg p-3 flex items-start gap-2">
                        <p className="flex-1 text-sm">{text}</p>
                        <button
                          onClick={() => setDisclaimers(prev => prev.filter((_, i) => i !== idx))}
                          className="p-1 text-muted-foreground hover:text-destructive"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">{t('noDisclaimers')}</p>
                )}
              </div>
           </div>
         )}
 
         {activeTab === 'photos' && (
           <div className="p-4 space-y-4">
             {Object.entries(photosByRoom).map(([room, roomPhotos]) => (
               <div key={room} className="bg-card rounded-xl border border-border overflow-hidden">
                 <div className="flex items-center justify-between p-3 bg-muted/50">
                   <span className="font-medium">{t(room)}</span>
                   <span className="text-xs text-muted-foreground">
                     {roomPhotos.filter(p => includedPhotos.has(p.id)).length}/{roomPhotos.length}
                   </span>
                 </div>
                 <div className="p-3 grid grid-cols-4 gap-2">
                   {roomPhotos.map(photo => (
                     <button
                       key={photo.id}
                       onClick={() => togglePhoto(photo.id)}
                       className={cn(
                         "relative aspect-square rounded-lg overflow-hidden border-2 transition-all",
                         includedPhotos.has(photo.id) ? "border-primary" : "border-transparent opacity-40"
                       )}
                     >
                       {photoUrls[photo.id] && (
                         <img src={photoUrls[photo.id]} className="w-full h-full object-cover" />
                       )}
                       {!includedPhotos.has(photo.id) && (
                         <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                           <EyeOff className="w-4 h-4" />
                         </div>
                       )}
                     </button>
                   ))}
                 </div>
               </div>
             ))}
           </div>
         )}
       </div>
 
       {/* Generate Button */}
       <div className="p-4 border-t border-border bg-card safe-bottom">
         <button
           onClick={handleGenerate}
           disabled={isGenerating || includedPhotos.size === 0}
           className="w-full h-14 bg-primary text-primary-foreground rounded-xl font-semibold text-lg flex items-center justify-center gap-2 disabled:opacity-50"
         >
           {isGenerating ? (
             <>
               <Loader2 className="w-5 h-5 animate-spin" />
               {t('generating')}
             </>
           ) : (
             <>
               <Download className="w-5 h-5" />
               {t('downloadPdf')} ({includedPhotos.size} {t('photos')})
             </>
           )}
         </button>
       </div>
 
       {showPhraseLibrary && (
         <PhraseLibrary
           isOpen={true}
           onClose={() => setShowPhraseLibrary(false)}
           onSelect={handleAddDisclaimer}
           language={language}
           t={t}
           filterCategory="disclaimer"
         />
       )}
     </div>
   );
 }