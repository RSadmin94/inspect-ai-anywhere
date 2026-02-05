 import { useState, useEffect, useCallback, useMemo } from 'react';
 import { X, Plus, Search, AlertTriangle, Edit2, Trash2 } from 'lucide-react';
 import { IssuePreset, Category, Severity, getAllIssuePresets, saveIssuePreset, deleteIssuePreset } from '@/lib/db';
 import { generateId } from '@/lib/imageUtils';
 import { cn } from '@/lib/utils';
 import { Language } from '@/lib/i18n';
 
 interface IssuePresetSelectorProps {
   isOpen: boolean;
   onClose: () => void;
   onSelect: (preset: IssuePreset) => void;
   language: Language;
   t: (key: string) => string;
 }
 
 const CATEGORIES: Category[] = ['roofing', 'plumbing', 'electrical', 'hvac', 'foundation', 'safety', 'general'];
 const SEVERITIES: Severity[] = ['minor', 'moderate', 'severe'];
 
 export function IssuePresetSelector({ isOpen, onClose, onSelect, language, t }: IssuePresetSelectorProps) {
   const [presets, setPresets] = useState<IssuePreset[]>([]);
   const [search, setSearch] = useState('');
   const [activeCategory, setActiveCategory] = useState<Category | 'all'>('all');
   const [isAdding, setIsAdding] = useState(false);
   const [editingPreset, setEditingPreset] = useState<IssuePreset | null>(null);
   const [formData, setFormData] = useState({
     title: '',
     titleEs: '',
     category: 'general' as Category,
     severity: 'moderate' as Severity,
     description: '',
     descriptionEs: '',
     recommendation: '',
     recommendationEs: '',
   });
 
   useEffect(() => {
     getAllIssuePresets().then(setPresets);
   }, []);
 
   const filteredPresets = useMemo(() => {
     let result = presets;
     if (activeCategory !== 'all') {
       result = result.filter(p => p.category === activeCategory);
     }
     if (search) {
       const searchLower = search.toLowerCase();
       result = result.filter(p =>
         p.title.toLowerCase().includes(searchLower) ||
         (p.titleEs && p.titleEs.toLowerCase().includes(searchLower))
       );
     }
     return result.sort((a, b) => b.createdAt - a.createdAt);
   }, [presets, activeCategory, search]);
 
   const handleSave = useCallback(async () => {
     if (!formData.title.trim()) return;
 
     const preset: IssuePreset = editingPreset ? {
       ...editingPreset,
       ...formData,
       title: formData.title.trim(),
       titleEs: formData.titleEs.trim() || undefined,
       description: formData.description.trim(),
       descriptionEs: formData.descriptionEs.trim() || undefined,
       recommendation: formData.recommendation.trim(),
       recommendationEs: formData.recommendationEs.trim() || undefined,
     } : {
       id: generateId(),
       ...formData,
       title: formData.title.trim(),
       titleEs: formData.titleEs.trim() || undefined,
       description: formData.description.trim(),
       descriptionEs: formData.descriptionEs.trim() || undefined,
       recommendation: formData.recommendation.trim(),
       recommendationEs: formData.recommendationEs.trim() || undefined,
       createdAt: Date.now(),
     };
 
     await saveIssuePreset(preset);
     setPresets(prev => editingPreset
       ? prev.map(p => p.id === preset.id ? preset : p)
       : [...prev, preset]
     );
     resetForm();
   }, [formData, editingPreset]);
 
   const resetForm = () => {
     setFormData({
       title: '', titleEs: '', category: 'general', severity: 'moderate',
       description: '', descriptionEs: '', recommendation: '', recommendationEs: ''
     });
     setIsAdding(false);
     setEditingPreset(null);
   };
 
   const startEdit = (preset: IssuePreset) => {
     setEditingPreset(preset);
     setFormData({
       title: preset.title,
       titleEs: preset.titleEs || '',
       category: preset.category,
       severity: preset.severity,
       description: preset.description,
       descriptionEs: preset.descriptionEs || '',
       recommendation: preset.recommendation,
       recommendationEs: preset.recommendationEs || '',
     });
     setIsAdding(true);
   };
 
   const handleDelete = useCallback(async (id: string) => {
     await deleteIssuePreset(id);
     setPresets(prev => prev.filter(p => p.id !== id));
   }, []);
 
   const getSeverityClass = (severity: Severity) => {
     switch (severity) {
       case 'minor': return 'severity-minor';
       case 'moderate': return 'severity-moderate';
       case 'severe': return 'severity-severe';
     }
   };
 
   const getPresetTitle = (preset: IssuePreset) => {
     return language === 'es' && preset.titleEs ? preset.titleEs : preset.title;
   };
 
   if (!isOpen) return null;
 
   return (
     <div className="fixed inset-0 z-50 bg-black/50 animate-fade-in" onClick={onClose}>
       <div
         className="slide-panel h-[85vh] animate-slide-up"
         onClick={e => e.stopPropagation()}
       >
         <div className="slide-panel-handle" />
 
         <div className="h-full flex flex-col">
           {/* Header */}
           <div className="flex items-center justify-between px-4 pb-3 border-b border-border">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                 <AlertTriangle className="w-5 h-5 text-accent-foreground" />
               </div>
               <h2 className="text-lg font-semibold">{t('issuePresets')}</h2>
             </div>
             <button
               onClick={onClose}
               className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted touch-target"
             >
               <X className="w-5 h-5" />
             </button>
           </div>
 
           {/* Search */}
           <div className="px-4 py-3">
             <div className="relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
               <input
                 type="text"
                 value={search}
                 onChange={e => setSearch(e.target.value)}
                 placeholder={t('searchPresets')}
                 className="w-full h-10 pl-10 pr-4 rounded-lg border border-input bg-background text-sm"
               />
             </div>
           </div>
 
           {/* Category Tabs */}
           <div className="px-4 pb-3 flex gap-2 overflow-x-auto">
             <button
               onClick={() => setActiveCategory('all')}
               className={cn(
                 "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                 activeCategory === 'all' ? "bg-primary text-primary-foreground" : "bg-secondary"
               )}
             >
               {t('all')}
             </button>
             {CATEGORIES.map(cat => (
               <button
                 key={cat}
                 onClick={() => setActiveCategory(cat)}
                 className={cn(
                   "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                   activeCategory === cat ? "bg-primary text-primary-foreground" : "bg-secondary"
                 )}
               >
                 {t(cat)}
               </button>
             ))}
           </div>
 
           {/* Content */}
           <div className="flex-1 overflow-y-auto px-4 pb-safe-bottom">
             {isAdding ? (
               <div className="space-y-4 py-4">
                 <div className="grid grid-cols-2 gap-3">
                   <div>
                     <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                       {t('title')} (EN) *
                     </label>
                     <input
                       type="text"
                       value={formData.title}
                       onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                       className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm"
                     />
                   </div>
                   <div>
                     <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                       {t('title')} (ES)
                     </label>
                     <input
                       type="text"
                       value={formData.titleEs}
                       onChange={e => setFormData(prev => ({ ...prev, titleEs: e.target.value }))}
                       className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm"
                     />
                   </div>
                 </div>
 
                 <div className="grid grid-cols-2 gap-3">
                   <div>
                     <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                       {t('category')}
                     </label>
                     <select
                       value={formData.category}
                       onChange={e => setFormData(prev => ({ ...prev, category: e.target.value as Category }))}
                       className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm"
                     >
                       {CATEGORIES.map(cat => (
                         <option key={cat} value={cat}>{t(cat)}</option>
                       ))}
                     </select>
                   </div>
                   <div>
                     <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                       {t('severity')}
                     </label>
                     <select
                       value={formData.severity}
                       onChange={e => setFormData(prev => ({ ...prev, severity: e.target.value as Severity }))}
                       className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm"
                     >
                       {SEVERITIES.map(sev => (
                         <option key={sev} value={sev}>{t(sev)}</option>
                       ))}
                     </select>
                   </div>
                 </div>
 
                 <div>
                   <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                     {t('description')} (EN)
                   </label>
                   <textarea
                     value={formData.description}
                     onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                     className="w-full h-20 px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none"
                   />
                 </div>
 
                 <div>
                   <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                     {t('recommendation')} (EN)
                   </label>
                   <textarea
                     value={formData.recommendation}
                     onChange={e => setFormData(prev => ({ ...prev, recommendation: e.target.value }))}
                     className="w-full h-20 px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none"
                   />
                 </div>
 
                 <div className="flex gap-2">
                   <button
                     onClick={handleSave}
                     className="flex-1 h-10 bg-primary text-primary-foreground rounded-lg font-medium text-sm"
                   >
                     {editingPreset ? t('update') : t('save')}
                   </button>
                   <button
                     onClick={resetForm}
                     className="h-10 px-4 bg-secondary rounded-lg text-sm"
                   >
                     {t('cancel')}
                   </button>
                 </div>
               </div>
             ) : (
               <>
                 <button
                   onClick={() => setIsAdding(true)}
                   className="w-full h-12 border-2 border-dashed border-border rounded-xl text-muted-foreground hover:bg-muted transition-colors flex items-center justify-center gap-2 mb-4"
                 >
                   <Plus className="w-4 h-4" />
                   {t('addPreset')}
                 </button>
 
                 {filteredPresets.length === 0 ? (
                   <div className="text-center py-8 text-muted-foreground">
                     {t('noPresets')}
                   </div>
                 ) : (
                   <div className="space-y-2">
                     {filteredPresets.map(preset => (
                       <button
                         key={preset.id}
                         onClick={() => onSelect(preset)}
                         className="w-full bg-muted/50 rounded-xl p-3 text-left group hover:bg-muted transition-colors"
                       >
                         <div className="flex items-start justify-between gap-2">
                           <div className="flex-1">
                             <p className="font-medium">{getPresetTitle(preset)}</p>
                             <div className="flex items-center gap-2 mt-1">
                               <span className="text-xs px-2 py-0.5 rounded-full bg-secondary">
                                 {t(preset.category)}
                               </span>
                               <span className={cn(
                                 "text-xs px-2 py-0.5 rounded-full font-medium",
                                 getSeverityClass(preset.severity)
                               )}>
                                 {t(preset.severity)}
                               </span>
                             </div>
                           </div>
                           <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button
                               onClick={e => { e.stopPropagation(); startEdit(preset); }}
                               className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-secondary"
                             >
                               <Edit2 className="w-4 h-4" />
                             </button>
                             <button
                               onClick={e => { e.stopPropagation(); handleDelete(preset.id); }}
                               className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                             >
                               <Trash2 className="w-4 h-4" />
                             </button>
                           </div>
                         </div>
                       </button>
                     ))}
                   </div>
                 )}
               </>
             )}
           </div>
         </div>
       </div>
     </div>
   );
 }