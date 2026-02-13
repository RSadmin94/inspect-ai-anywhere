import { useState, useEffect, useMemo, useCallback } from 'react';
import { X, FileText, Download, GripVertical, Eye, EyeOff, ChevronDown, ChevronUp, BookOpen, Loader2, Plus, Trash2, AlertTriangle, Wrench, Radiation, Bug, Droplets } from 'lucide-react';
import { PhotoRecord, InspectionRecord, Phrase, getAllPhrases } from '@/lib/db';
import { blobToDataUrl } from '@/lib/imageUtils';
import { Language } from '@/lib/i18n';
import { generateProfessionalReportPDF, DeferredItem, AncillarySection } from '@/lib/professionalReportPdf';
import { cn } from '@/lib/utils';
import { PhraseLibrary } from './PhraseLibrary';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ReportBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  inspection: InspectionRecord;
  photos?: PhotoRecord[] | null;
  language: Language;
  t: (key: string) => string;
}

type ReportLanguage = 'en' | 'es' | 'both';

interface PhotoGroup {
  room: string;
  photos: (PhotoRecord & { included: boolean; imageUrl?: string })[];
  collapsed: boolean;
}

const DEFAULT_RADON_SECTION: AncillarySection = {
  type: 'radon',
  enabled: false,
  title: 'Radon Testing',
  titleEs: 'Prueba de Radón',
  scope: 'Radon testing was conducted using a continuous radon monitor (CRM) placed in the lowest livable area of the property for a minimum of 48 hours.',
  scopeEs: 'La prueba de radón se realizó utilizando un monitor continuo de radón (CRM) colocado en el área habitable más baja de la propiedad durante un mínimo de 48 horas.',
  limitations: 'Radon levels can vary significantly over time due to weather, ventilation, and seasonal changes. This test provides a snapshot and may not represent long-term exposure levels.',
  limitationsEs: 'Los niveles de radón pueden variar significativamente con el tiempo debido al clima, la ventilación y los cambios estacionales. Esta prueba proporciona una instantánea y puede no representar los niveles de exposición a largo plazo.',
  findings: '',
  findingsEs: '',
  result: 'monitor',
  recommendation: 'If radon levels exceed 4.0 pCi/L, mitigation by a qualified radon professional is recommended.',
  recommendationEs: 'Si los niveles de radón exceden 4.0 pCi/L, se recomienda la mitigación por un profesional calificado en radón.',
};

const DEFAULT_WDI_SECTION: AncillarySection = {
  type: 'wdi',
  enabled: false,
  title: 'Wood-Destroying Insect (WDI) Inspection',
  titleEs: 'Inspección de Insectos Destructores de Madera',
  scope: 'A visual inspection was conducted for evidence of wood-destroying insects including termites, carpenter ants, carpenter bees, and powder post beetles.',
  scopeEs: 'Se realizó una inspección visual en busca de evidencia de insectos destructores de madera, incluidas termitas, hormigas carpinteras, abejas carpinteras y escarabajos de polvo.',
  limitations: 'This inspection is limited to visible and accessible areas. Hidden damage or active infestations in inaccessible areas cannot be detected.',
  limitationsEs: 'Esta inspección se limita a áreas visibles y accesibles. No se puede detectar daño oculto o infestaciones activas en áreas inaccesibles.',
  findings: '',
  findingsEs: '',
  result: 'monitor',
  recommendation: 'Further evaluation by a licensed pest control professional is recommended if evidence of WDI activity is observed.',
  recommendationEs: 'Se recomienda una evaluación adicional por un profesional de control de plagas con licencia si se observa evidencia de actividad de insectos destructores de madera.',
};

const DEFAULT_MOLD_SECTION: AncillarySection = {
  type: 'mold',
  enabled: false,
  title: 'Mold Assessment',
  titleEs: 'Evaluación de Moho',
  scope: 'A visual assessment was conducted for visible mold growth, water staining, and conditions conducive to mold development.',
  scopeEs: 'Se realizó una evaluación visual en busca de crecimiento visible de moho, manchas de agua y condiciones propicias para el desarrollo de moho.',
  limitations: 'This is a visual assessment only and does not include air quality testing or laboratory analysis. Mold can exist in hidden areas not accessible during inspection.',
  limitationsEs: 'Esta es solo una evaluación visual y no incluye pruebas de calidad del aire ni análisis de laboratorio. El moho puede existir en áreas ocultas no accesibles durante la inspección.',
  findings: '',
  findingsEs: '',
  result: 'monitor',
  recommendation: 'If mold-like substances are observed or suspected, testing by a certified mold inspector is recommended.',
  recommendationEs: 'Si se observan o sospechan sustancias similares al moho, se recomienda realizar pruebas por un inspector de moho certificado.',
};

export function ReportBuilder({ isOpen, onClose, inspection, photos = [], language, t }: ReportBuilderProps) {
  const safePhotos = photos ?? [];
  const [reportLanguage, setReportLanguage] = useState<ReportLanguage>('en');
  const [photoGroups, setPhotoGroups] = useState<PhotoGroup[]>([]);
  const [disclaimers, setDisclaimers] = useState<string[]>([]);
  const [showPhraseLibrary, setShowPhraseLibrary] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [deferredItems, setDeferredItems] = useState<DeferredItem[]>([]);
  const [maintenanceRecs, setMaintenanceRecs] = useState<string[]>([]);
  const [newDeferred, setNewDeferred] = useState({ area: '', reason: '' });
  const [newMaintenance, setNewMaintenance] = useState('');
  
  // Ancillary sections
  const [radonSection, setRadonSection] = useState<AncillarySection>(DEFAULT_RADON_SECTION);
  const [wdiSection, setWdiSection] = useState<AncillarySection>(DEFAULT_WDI_SECTION);
  const [moldSection, setMoldSection] = useState<AncillarySection>(DEFAULT_MOLD_SECTION);
 
   // Group photos by room
   useEffect(() => {
     const grouped = safePhotos.reduce((acc, photo) => {
       const existing = acc.find(g => g.room === photo.room);
       if (existing) {
         existing.photos.push({ ...photo, included: photo.includeInReport !== false });
       } else {
         acc.push({
           room: photo.room,
           photos: [{ ...photo, included: photo.includeInReport !== false }],
           collapsed: false,
         });
       }
       return acc;
     }, [] as PhotoGroup[]);
 
     // Load thumbnails
     grouped.forEach(group => {
       group.photos.forEach(async photo => {
         const url = await blobToDataUrl(photo.thumbnailBlob);
         setPhotoGroups(prev => prev.map(g => ({
           ...g,
           photos: g.photos.map(p => p.id === photo.id ? { ...p, imageUrl: url } : p)
         })));
       });
     });
 
     setPhotoGroups(grouped);
   }, [safePhotos]);
 
   const togglePhotoInclusion = useCallback((photoId: string) => {
     setPhotoGroups(prev => prev.map(group => ({
       ...group,
       photos: group.photos.map(p =>
         p.id === photoId ? { ...p, included: !p.included } : p
       )
     })));
   }, []);
 
   const toggleGroupInclusion = useCallback((room: string, include: boolean) => {
     setPhotoGroups(prev => prev.map(group =>
       group.room === room
         ? { ...group, photos: group.photos.map(p => ({ ...p, included: include })) }
         : group
     ));
   }, []);
 
   const toggleGroupCollapse = useCallback((room: string) => {
     setPhotoGroups(prev => prev.map(group =>
       group.room === room ? { ...group, collapsed: !group.collapsed } : group
     ));
   }, []);
 
   const moveGroup = useCallback((room: string, direction: 'up' | 'down') => {
     setPhotoGroups(prev => {
       const idx = prev.findIndex(g => g.room === room);
       if ((direction === 'up' && idx === 0) || (direction === 'down' && idx === prev.length - 1)) {
         return prev;
       }
       const newGroups = [...prev];
       const swap = direction === 'up' ? idx - 1 : idx + 1;
       [newGroups[idx], newGroups[swap]] = [newGroups[swap], newGroups[idx]];
       return newGroups;
     });
   }, []);
 
   const handleAddDisclaimer = useCallback((phrase: Phrase) => {
     const text = language === 'es' && phrase.textEs ? phrase.textEs : phrase.text;
     setDisclaimers(prev => [...prev, text]);
     setShowPhraseLibrary(false);
   }, [language]);
 
   const handleRemoveDisclaimer = useCallback((idx: number) => {
     setDisclaimers(prev => prev.filter((_, i) => i !== idx));
   }, []);
 
   const includedPhotos = useMemo(() => {
     return photoGroups.flatMap(g => g.photos.filter(p => p.included));
   }, [photoGroups]);
 
  const handleAddDeferred = useCallback(() => {
    if (newDeferred.area.trim() && newDeferred.reason.trim()) {
      setDeferredItems(prev => [...prev, { area: newDeferred.area.trim(), reason: newDeferred.reason.trim() }]);
      setNewDeferred({ area: '', reason: '' });
    }
  }, [newDeferred]);

  const handleRemoveDeferred = useCallback((idx: number) => {
    setDeferredItems(prev => prev.filter((_, i) => i !== idx));
  }, []);

  const handleAddMaintenance = useCallback(() => {
    if (newMaintenance.trim()) {
      setMaintenanceRecs(prev => [...prev, newMaintenance.trim()]);
      setNewMaintenance('');
    }
  }, [newMaintenance]);

  const handleRemoveMaintenance = useCallback((idx: number) => {
    setMaintenanceRecs(prev => prev.filter((_, i) => i !== idx));
  }, []);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const orderedPhotos = photoGroups.flatMap(g =>
        g.photos.filter(p => p.included).map((p, idx) => ({
          ...p,
          reportOrder: idx,
          includeInReport: true,
        }))
      );

      // Collect enabled ancillary sections
      const ancillarySections = [radonSection, wdiSection, moldSection].filter(s => s.enabled);

      const pdfBlob = await generateProfessionalReportPDF({
        inspection,
        photos: orderedPhotos,
        reportLanguage,
        disclaimers,
        roomOrder: photoGroups.map(g => g.room),
        includeTableOfContents: true,
        includeIntroduction: true,
        includeConclusion: true,
        deferredItems,
        maintenanceRecommendations: maintenanceRecs,
        ancillarySections,
      });

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
 
   if (!isOpen) return null;
 
   const languageOptions: { value: ReportLanguage; label: string }[] = [
     { value: 'en', label: t('english') },
     { value: 'es', label: t('spanish') },
     { value: 'both', label: t('both') },
   ];
 
   return (
     <div className="fixed inset-0 z-50 bg-black/50 animate-fade-in" onClick={onClose}>
       <div
         className="slide-panel h-[90vh] animate-slide-up"
         onClick={e => e.stopPropagation()}
       >
         <div className="slide-panel-handle" />
 
         <div className="h-full flex flex-col">
           {/* Header */}
           <div className="flex items-center justify-between px-4 pb-3 border-b border-border">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                 <FileText className="w-5 h-5 text-accent-foreground" />
               </div>
               <div>
                 <h2 className="text-lg font-semibold">{t('reportBuilder')}</h2>
                 <p className="text-xs text-muted-foreground">
                   {includedPhotos.length} / {safePhotos.length} {t('photos')}
                 </p>
               </div>
             </div>
             <button
               onClick={onClose}
               className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted touch-target"
             >
               <X className="w-5 h-5" />
             </button>
           </div>
 
            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {/* Language Selection */}
              <div className="mb-4">
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  {t('reportLanguage')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {languageOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setReportLanguage(opt.value)}
                      className={cn(
                        "h-10 rounded-xl font-medium text-sm transition-all touch-target",
                        reportLanguage === opt.value
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <Tabs defaultValue="photos" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-4">
                  <TabsTrigger value="photos" className="text-xs">{language === 'es' ? 'Fotos' : 'Photos'}</TabsTrigger>
                  <TabsTrigger value="deferred" className="text-xs">{language === 'es' ? 'Diferidos' : 'Deferred'}</TabsTrigger>
                  <TabsTrigger value="maintenance" className="text-xs">{language === 'es' ? 'Mant.' : 'Maint.'}</TabsTrigger>
                  <TabsTrigger value="disclaimers" className="text-xs">{language === 'es' ? 'Legal' : 'Legal'}</TabsTrigger>
                </TabsList>

                {/* Photos Tab */}
                <TabsContent value="photos" className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    {t('photosGroupedByRoom')}
                  </label>
                  {photoGroups.map((group, groupIdx) => (
                    <div key={group.room} className="bg-muted/50 rounded-xl overflow-hidden">
                      <div className="flex items-center gap-2 p-3">
                        <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                        <button
                          onClick={() => toggleGroupCollapse(group.room)}
                          className="flex-1 flex items-center gap-2 text-left"
                        >
                          <span className="font-medium">{t(group.room) || group.room}</span>
                          <span className="text-xs text-muted-foreground">
                            ({group.photos.filter(p => p.included).length}/{group.photos.length})
                          </span>
                          {group.collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                        </button>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => moveGroup(group.room, 'up')}
                            disabled={groupIdx === 0}
                            className="p-1.5 rounded hover:bg-secondary disabled:opacity-30"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => moveGroup(group.room, 'down')}
                            disabled={groupIdx === photoGroups.length - 1}
                            className="p-1.5 rounded hover:bg-secondary disabled:opacity-30"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toggleGroupInclusion(group.room, !group.photos.every(p => p.included))}
                            className={cn(
                              "p-1.5 rounded",
                              group.photos.every(p => p.included) ? "text-primary" : "text-muted-foreground"
                            )}
                          >
                            {group.photos.every(p => p.included) ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {!group.collapsed && (
                        <div className="px-3 pb-3 grid grid-cols-4 gap-2">
                          {group.photos.map(photo => (
                            <button
                              key={photo.id}
                              onClick={() => togglePhotoInclusion(photo.id)}
                              className={cn(
                                "relative aspect-square rounded-lg overflow-hidden border-2 transition-all",
                                photo.included ? "border-primary" : "border-transparent opacity-40"
                              )}
                            >
                              {photo.imageUrl && (
                                <img src={photo.imageUrl} alt="" className="w-full h-full object-cover" />
                              )}
                              {!photo.included && (
                                <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                                  <EyeOff className="w-4 h-4 text-muted-foreground" />
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </TabsContent>

                {/* Deferred Items Tab */}
                <TabsContent value="deferred" className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{language === 'es' ? 'Áreas no inspeccionadas o diferidas' : 'Areas not inspected or deferred'}</span>
                  </div>
                  
                  <div className="bg-muted/30 rounded-xl p-4 space-y-3">
                    <Input
                      placeholder={language === 'es' ? 'Área (ej: Ático)' : 'Area (e.g., Attic)'}
                      value={newDeferred.area}
                      onChange={(e) => setNewDeferred(prev => ({ ...prev, area: e.target.value }))}
                      className="h-10"
                    />
                    <Textarea
                      placeholder={language === 'es' ? 'Razón (ej: Acceso bloqueado por almacenamiento)' : 'Reason (e.g., Access blocked by storage)'}
                      value={newDeferred.reason}
                      onChange={(e) => setNewDeferred(prev => ({ ...prev, reason: e.target.value }))}
                      rows={2}
                    />
                    <button
                      onClick={handleAddDeferred}
                      disabled={!newDeferred.area.trim() || !newDeferred.reason.trim()}
                      className="w-full h-10 bg-secondary text-secondary-foreground rounded-lg font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4" />
                      {language === 'es' ? 'Agregar elemento diferido' : 'Add Deferred Item'}
                    </button>
                  </div>
                  
                  {deferredItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic text-center py-4">
                      {language === 'es' ? 'Sin elementos diferidos' : 'No deferred items'}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {deferredItems.map((item, idx) => (
                        <div key={idx} className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{item.area}</p>
                            <p className="text-xs text-muted-foreground">{item.reason}</p>
                          </div>
                          <button
                            onClick={() => handleRemoveDeferred(idx)}
                            className="p-1 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Maintenance Tab */}
                <TabsContent value="maintenance" className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Wrench className="w-4 h-4" />
                    <span>{language === 'es' ? 'Recomendaciones de mantenimiento (no defectos)' : 'Maintenance recommendations (non-defects)'}</span>
                  </div>
                  
                  <div className="bg-muted/30 rounded-xl p-4 space-y-3">
                    <Textarea
                      placeholder={language === 'es' ? 'Recomendación de mantenimiento...' : 'Maintenance recommendation...'}
                      value={newMaintenance}
                      onChange={(e) => setNewMaintenance(e.target.value)}
                      rows={2}
                    />
                    <button
                      onClick={handleAddMaintenance}
                      disabled={!newMaintenance.trim()}
                      className="w-full h-10 bg-secondary text-secondary-foreground rounded-lg font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4" />
                      {language === 'es' ? 'Agregar recomendación' : 'Add Recommendation'}
                    </button>
                  </div>
                  
                  {maintenanceRecs.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic text-center py-4">
                      {language === 'es' ? 'Sin recomendaciones de mantenimiento' : 'No maintenance recommendations'}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {maintenanceRecs.map((rec, idx) => (
                        <div key={idx} className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 flex items-start gap-2">
                          <Wrench className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <p className="flex-1 text-sm">{rec}</p>
                          <button
                            onClick={() => handleRemoveMaintenance(idx)}
                            className="p-1 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Disclaimers Tab */}
                <TabsContent value="disclaimers" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-muted-foreground">
                      {t('disclaimers')}
                    </label>
                    <button
                      onClick={() => setShowPhraseLibrary(true)}
                      className="text-xs text-primary flex items-center gap-1 hover:underline"
                    >
                      <BookOpen className="w-3 h-3" />
                      {t('addFromLibrary')}
                    </button>
                  </div>
                  {disclaimers.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic text-center py-4">{t('noDisclaimers')}</p>
                  ) : (
                    <div className="space-y-2">
                      {disclaimers.map((text, idx) => (
                        <div key={idx} className="bg-muted/50 rounded-lg p-3 flex items-start gap-2">
                          <p className="flex-1 text-sm">{text}</p>
                          <button
                            onClick={() => handleRemoveDisclaimer(idx)}
                            className="p-1 text-muted-foreground hover:text-destructive"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
 
           {/* Generate Button */}
           <div className="px-4 pb-safe-bottom border-t border-border pt-4">
             <button
               onClick={handleGenerate}
               disabled={isGenerating || includedPhotos.length === 0}
               className="w-full h-14 bg-accent text-accent-foreground rounded-xl font-semibold text-lg touch-target flex items-center justify-center gap-2 disabled:opacity-50"
             >
               {isGenerating ? (
                 <>
                   <Loader2 className="w-5 h-5 animate-spin" />
                   {t('generating')}
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