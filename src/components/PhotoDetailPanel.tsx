 import { useState, useEffect } from 'react';
import { PhotoRecord, Severity, Category, IssuePreset, Phrase } from '@/lib/db';
import { blobToDataUrl } from '@/lib/imageUtils';
import { Language } from '@/lib/i18n';
import { X, Trash2, Save, Sparkles, AlertTriangle, BookOpen, Layers, Maximize2, Mic, PenTool } from 'lucide-react';
import { PhotoAnnotationEditor } from './PhotoAnnotationEditor';
 import { cn } from '@/lib/utils';
import { RoomSelector } from './RoomSelector';
import { PhraseLibrary } from './PhraseLibrary';
import { IssuePresetSelector } from './IssuePresetSelector';
import { ImageLightbox } from './ImageLightbox';
import { VoiceDictationButton } from './VoiceDictationButton';
import { useVoiceDictation } from '@/hooks/useVoiceDictation';
import { getSyncQueue } from '@/lib/offlineSyncQueue';

interface PhotoDetailPanelProps {
   photo: PhotoRecord | null;
   onClose: () => void;
   onUpdate: (photoId: string, updates: Partial<PhotoRecord>) => Promise<void>;
   onDelete: (photoId: string) => Promise<void>;
   onAnalyze?: (photoId: string) => Promise<void>;
   language: Language;
   t: (key: string) => string;
   isOnline: boolean;
 }
 
 export function PhotoDetailPanel({ 
   photo, 
   onClose, 
   onUpdate, 
   onDelete,
   onAnalyze,
   language,
   t, 
   isOnline 
 }: PhotoDetailPanelProps) {
   const [imageUrl, setImageUrl] = useState<string>('');
   const [notes, setNotes] = useState('');
   const [room, setRoom] = useState('other');
   const [isDeleting, setIsDeleting] = useState(false);
   const [isAnalyzing, setIsAnalyzing] = useState(false);
   const [showPhraseLibrary, setShowPhraseLibrary] = useState(false);
   const [showIssuePresets, setShowIssuePresets] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [showAnnotation, setShowAnnotation] = useState(false);
   const [manualFinding, setManualFinding] = useState<{
     title?: string;
     severity?: Severity;
     category?: Category;
     description?: string;
     recommendation?: string;
   } | null>(null);

  const {
    isListening,
    fullTranscript,
    isSupported,
    toggleListening,
    resetTranscript,
  } = useVoiceDictation(language);

  // Append voice transcript to notes
  useEffect(() => {
    if (fullTranscript && !isListening) {
      setNotes(prev => prev ? `${prev} ${fullTranscript.trim()}` : fullTranscript.trim());
      resetTranscript();
    }
  }, [isListening, fullTranscript, resetTranscript]);

  // Setup offline sync on mount
  useEffect(() => {
    const setupSync = async () => {
      const queue = await getSyncQueue();
      // Process queue immediately
      await queue.processQueue((photoId, data, blob) =>
        onUpdate(photoId, {
          annotationData: data,
          annotatedImageBlob: blob,
          hasAnnotations: true,
        })
      );
    };
    setupSync();
  }, [onUpdate]);
 
   useEffect(() => {
     if (photo) {
       blobToDataUrl(photo.fullImageBlob).then(setImageUrl);
       setNotes(photo.notes);
       setRoom(photo.room);
       // Load manual finding if exists
       if (photo.manualTitle) {
         setManualFinding({
           title: photo.manualTitle,
           severity: photo.manualSeverity,
           category: photo.manualCategory,
           description: photo.manualDescription,
           recommendation: photo.manualRecommendation,
         });
       } else {
         setManualFinding(null);
       }
     }
   }, [photo]);
 
   if (!photo) return null;
 
   const handleSave = async () => {
     try {
       await onUpdate(photo.id, { 
         notes, 
         room,
         manualTitle: manualFinding?.title,
         manualSeverity: manualFinding?.severity,
         manualCategory: manualFinding?.category,
         manualDescription: manualFinding?.description,
         manualRecommendation: manualFinding?.recommendation,
       });
     } catch (error) {
       console.warn('Failed to save - may be offline:', error);
       // Optionally queue for sync
     }
   };

   const handleAnnotationSave = async (annotationData: string, annotatedImage: Blob) => {
     try {
       // Try to save online
       await onUpdate(photo.id, {
         annotationData,
         annotatedImageBlob: annotatedImage,
         hasAnnotations: true,
       });
       console.log('Annotation saved online');
     } catch (error) {
       // Queue for offline sync
       console.warn('Offline - queueing annotation for sync:', error);
       const queue = await getSyncQueue();
       await queue.enqueue({
         photoId: photo.id,
         action: 'save_annotation',
         payload: {
           annotationData,
           annotatedImageBlob: annotatedImage,
         },
       });
       // Show user feedback
       console.log('Annotation saved offline. Will sync when online.');
     }
     setShowAnnotation(false);
   };
 
   const handleDelete = async () => {
     setIsDeleting(true);
     await onDelete(photo.id);
     onClose();
   };
 
   const handleAnalyze = async () => {
     if (!onAnalyze) return;
     setIsAnalyzing(true);
     try {
       await onAnalyze(photo.id);
     } finally {
       setIsAnalyzing(false);
     }
   };
 
   const handleApplyPreset = (preset: IssuePreset) => {
     setManualFinding({
       title: language === 'es' && preset.titleEs ? preset.titleEs : preset.title,
       severity: preset.severity,
       category: preset.category,
       description: language === 'es' && preset.descriptionEs ? preset.descriptionEs : preset.description,
       recommendation: language === 'es' && preset.recommendationEs ? preset.recommendationEs : preset.recommendation,
     });
     setShowIssuePresets(false);
   };

   const handleInsertPhrase = (phrase: Phrase) => {
     const text = language === 'es' && phrase.textEs ? phrase.textEs : phrase.text;
     setNotes(prev => prev ? `${prev}\n${text}` : text);
     setShowPhraseLibrary(false);
   };

   const getSeverityClass = (severity?: Severity) => {
     switch (severity) {
       case 'minor': return 'severity-minor';
       case 'moderate': return 'severity-moderate';
       case 'severe': return 'severity-severe';
       default: return 'bg-muted text-muted-foreground';
     }
   };
 
   const getFindingTitle = () => {
     if (language === 'es' && photo.aiFindingTitleEs) return photo.aiFindingTitleEs;
     return photo.aiFindingTitle;
   };
 
   const getDescription = () => {
     if (language === 'es' && photo.aiDescriptionEs) return photo.aiDescriptionEs;
     return photo.aiDescription;
   };
 
   const getRecommendation = () => {
     if (language === 'es' && photo.aiRecommendationEs) return photo.aiRecommendationEs;
     return photo.aiRecommendation;
   };
 
   return (
     <div className="fixed inset-0 z-[100] bg-black/50 animate-fade-in" onClick={onClose}>
       <div 
         className="slide-panel h-[85vh] animate-slide-up"
         onClick={e => e.stopPropagation()}
       >
         <div className="slide-panel-handle" />
         
         <div className="h-full overflow-y-auto pb-safe-bottom">
           {/* Header */}
           <div className="flex items-center justify-between px-4 pb-2">
             <h2 className="text-lg font-semibold">{t('photoDetails')}</h2>
             <button 
               onClick={onClose}
               className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted touch-target"
             >
               <X className="w-5 h-5" />
             </button>
           </div>
 
           {/* Photo Preview */}
           <div className="px-4 mb-4">
              <div className="relative group">
                <img 
                  src={imageUrl} 
                  alt="" 
                  className="w-full h-64 object-cover rounded-xl cursor-pointer transition-transform hover:scale-[1.01]"
                  onClick={() => setShowLightbox(true)}
                />
                <button
                  onClick={() => setShowAnnotation(true)}
                  className="absolute top-2 right-2 w-10 h-10 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Annotate photo"
                >
                  <PenTool className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setShowLightbox(true)}
                  className="absolute top-2 right-12 w-10 h-10 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Maximize2 className="w-5 h-5" />
                </button>
                <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur rounded-lg px-2 py-1">
                  <p className="text-white text-xs">Tap to enlarge</p>
                </div>
              </div>
           </div>
 
           {/* Annotation Editor Modal */}
           {showAnnotation && (
             <PhotoAnnotationEditor
               photo={photo}
               onSave={handleAnnotationSave}
               onCancel={() => setShowAnnotation(false)}
             />
           )}

           {/* Room Select */}
           <div className="px-4 mb-4">
             <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
               {t('room')}
             </label>
               <RoomSelector value={room} onChange={setRoom} t={t} />
           </div>
 
           {/* Notes */}
           <div className="px-4 mb-4">
               <div className="flex items-center justify-between mb-1.5">
                 <label className="text-sm font-medium text-muted-foreground">
                   {t('notes')}
                 </label>
                <div className="flex items-center gap-2">
                  <VoiceDictationButton
                    isListening={isListening}
                    isSupported={isSupported}
                    onToggle={toggleListening}
                    size="sm"
                  />
                  <button
                    onClick={() => setShowPhraseLibrary(true)}
                    className="text-xs text-primary flex items-center gap-1 hover:underline"
                  >
                    <BookOpen className="w-3 h-3" />
                    {t('phraseLibrary')}
                  </button>
                </div>
               </div>
            <div className="relative">
              <textarea
                value={isListening ? `${notes} ${fullTranscript}` : notes}
                onChange={e => setNotes(e.target.value)}
                placeholder={isListening ? t('listening') : t('addNotes')}
                className={cn(
                  "w-full h-24 px-4 py-3 rounded-xl border bg-background resize-none transition-colors",
                  isListening ? "border-destructive bg-destructive/5" : "border-input"
                )}
                readOnly={isListening}
              />
              {isListening && (
                <div className="absolute top-2 right-2">
                  <span className="inline-flex items-center gap-1 text-xs text-destructive animate-pulse">
                    <Mic className="w-3 h-3" />
                    {t('recording')}
                  </span>
                </div>
              )}
            </div>
           </div>
 
             {/* Manual Finding / Issue Preset */}
             <div className="px-4 mb-4">
               <div className="flex items-center justify-between mb-3">
                 <div className="flex items-center gap-2">
                   <Layers className="w-4 h-4 text-accent" />
                   <span className="text-sm font-medium">{t('manualFinding')}</span>
                 </div>
                 <button
                   onClick={() => setShowIssuePresets(true)}
                   className="text-xs text-primary flex items-center gap-1 hover:underline"
                 >
                   {t('issuePresets')}
                 </button>
               </div>

               {manualFinding ? (
                 <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                   <div className="flex items-start justify-between gap-2">
                     <div>
                       <p className="font-semibold">{manualFinding.title}</p>
                       <p className="text-sm text-muted-foreground">
                         {t(manualFinding.category || 'general')}
                       </p>
                     </div>
                     <span className={cn(
                       "text-xs px-2 py-1 rounded-full font-medium",
                       getSeverityClass(manualFinding.severity)
                     )}>
                       {t(manualFinding.severity || 'minor')}
                     </span>
                   </div>
                   {manualFinding.description && (
                     <p className="text-sm">{manualFinding.description}</p>
                   )}
                   {manualFinding.recommendation && (
                     <div className="flex items-start gap-2 pt-2 border-t border-border">
                       <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                       <p className="text-sm">{manualFinding.recommendation}</p>
                     </div>
                   )}
                   <button
                     onClick={() => setManualFinding(null)}
                     className="text-xs text-destructive hover:underline"
                   >
                     {t('clearManual')}
                   </button>
                 </div>
               ) : (
                 <button
                   onClick={() => setShowIssuePresets(true)}
                   className="w-full h-12 border-2 border-dashed border-border rounded-xl text-muted-foreground hover:bg-muted transition-colors flex items-center justify-center gap-2"
                 >
                   <Layers className="w-4 h-4" />
                   {t('applyPreset')}
                 </button>
               )}
             </div>

           {/* AI Analysis Section */}
           <div className="px-4 mb-4">
             <div className="flex items-center gap-2 mb-3">
               <Sparkles className="w-4 h-4 text-accent" />
               <span className="text-sm font-medium">{t('aiStatus')}</span>
               <span className={cn(
                 "text-xs px-2 py-0.5 rounded-full",
                 photo.aiStatus === 'complete' && "bg-accent/10 text-accent",
                 photo.aiStatus === 'pending_offline' && "bg-muted text-muted-foreground",
                 photo.aiStatus === 'analyzing' && "bg-primary/10 text-primary",
                 photo.aiStatus === 'failed' && "bg-destructive/10 text-destructive"
               )}>
                 {t(photo.aiStatus === 'pending_offline' ? 'aiPending' : 
                    photo.aiStatus === 'analyzing' ? 'aiAnalyzing' :
                    photo.aiStatus === 'complete' ? 'aiComplete' : 'aiFailed')}
               </span>
             </div>
 
             {photo.aiStatus === 'complete' && photo.aiFindingTitle && (
               <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                 <div className="flex items-start justify-between gap-2">
                   <div>
                     <p className="font-semibold">{getFindingTitle()}</p>
                     <p className="text-sm text-muted-foreground">
                       {t(photo.aiCategory || 'general')}
                     </p>
                   </div>
                   <div className="flex items-center gap-2">
                     <span className={cn(
                       "text-xs px-2 py-1 rounded-full font-medium",
                       getSeverityClass(photo.aiSeverity)
                     )}>
                       {t(photo.aiSeverity || 'minor')}
                     </span>
                     {photo.aiConfidence && (
                       <span className="text-xs text-muted-foreground">
                         {photo.aiConfidence}%
                       </span>
                     )}
                   </div>
                 </div>
                 {getDescription() && (
                   <p className="text-sm">{getDescription()}</p>
                 )}
                 {getRecommendation() && (
                   <div className="flex items-start gap-2 pt-2 border-t border-border">
                     <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                     <p className="text-sm">{getRecommendation()}</p>
                   </div>
                 )}
               </div>
             )}
 
             {(photo.aiStatus === 'pending_offline' || photo.aiStatus === 'failed') && isOnline && onAnalyze && (
               <button
                 onClick={handleAnalyze}
                 disabled={isAnalyzing}
                 className="w-full h-12 bg-accent text-accent-foreground rounded-xl font-medium touch-target flex items-center justify-center gap-2"
               >
                 <Sparkles className="w-4 h-4" />
                 {isAnalyzing ? t('aiAnalyzing') : t('analyzeNow')}
               </button>
             )}
           </div>
 
           {/* Timestamp */}
           <div className="px-4 mb-6">
             <p className="text-xs text-muted-foreground">
               {t('timestamp')}: {new Date(photo.timestamp).toLocaleString(language === 'es' ? 'es-ES' : 'en-US')}
             </p>
           </div>
 
           {/* Actions */}
           <div className="px-4 pb-6 flex gap-3">
             <button
               onClick={handleDelete}
               disabled={isDeleting}
               className="flex-1 h-12 border border-destructive text-destructive rounded-xl font-medium touch-target flex items-center justify-center gap-2"
             >
               <Trash2 className="w-4 h-4" />
               {t('delete')}
             </button>
             <button
               onClick={handleSave}
               className="flex-1 h-12 bg-primary text-primary-foreground rounded-xl font-medium touch-target flex items-center justify-center gap-2"
             >
               <Save className="w-4 h-4" />
               {t('save')}
             </button>
           </div>
         </div>
       </div>

       {showPhraseLibrary && (
         <PhraseLibrary
           isOpen={true}
           onClose={() => setShowPhraseLibrary(false)}
           onSelect={handleInsertPhrase}
           language={language}
           t={t}
         />
       )}

       {showIssuePresets && (
         <IssuePresetSelector
           isOpen={true}
           onClose={() => setShowIssuePresets(false)}
           onSelect={handleApplyPreset}
           language={language}
           t={t}
         />
       )}

        <ImageLightbox
          imageUrl={imageUrl}
          isOpen={showLightbox}
          onClose={() => setShowLightbox(false)}
        />
     </div>
   );
 }