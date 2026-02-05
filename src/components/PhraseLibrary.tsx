 import { useState, useEffect, useCallback, useMemo } from 'react';
 import { X, Search, Star, Plus, Edit2, Trash2, BookOpen } from 'lucide-react';
 import { Phrase, getAllPhrases, savePhrase, deletePhrase } from '@/lib/db';
 import { generateId } from '@/lib/imageUtils';
 import { cn } from '@/lib/utils';
 import { Language } from '@/lib/i18n';
 
 interface PhraseLibraryProps {
   isOpen: boolean;
   onClose: () => void;
   onSelect: (phrase: Phrase) => void;
   language: Language;
   t: (key: string) => string;
   filterCategory?: Phrase['category'];
 }
 
 const CATEGORIES: Phrase['category'][] = ['disclaimer', 'note', 'recommendation', 'general'];
 
 export function PhraseLibrary({ isOpen, onClose, onSelect, language, t, filterCategory }: PhraseLibraryProps) {
   const [phrases, setPhrases] = useState<Phrase[]>([]);
   const [search, setSearch] = useState('');
   const [activeCategory, setActiveCategory] = useState<Phrase['category'] | 'all'>('all');
   const [isAdding, setIsAdding] = useState(false);
   const [editingPhrase, setEditingPhrase] = useState<Phrase | null>(null);
   const [formData, setFormData] = useState({ text: '', textEs: '', category: 'general' as Phrase['category'] });
 
   useEffect(() => {
     getAllPhrases().then(setPhrases);
   }, []);
 
   const filteredPhrases = useMemo(() => {
     let result = phrases;
     if (filterCategory) {
       result = result.filter(p => p.category === filterCategory);
     } else if (activeCategory !== 'all') {
       result = result.filter(p => p.category === activeCategory);
     }
     if (search) {
       const searchLower = search.toLowerCase();
       result = result.filter(p => 
         p.text.toLowerCase().includes(searchLower) ||
         (p.textEs && p.textEs.toLowerCase().includes(searchLower))
       );
     }
     return result.sort((a, b) => {
       if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
       return b.createdAt - a.createdAt;
     });
   }, [phrases, activeCategory, filterCategory, search]);
 
   const handleSave = useCallback(async () => {
     if (!formData.text.trim()) return;
     
     const phrase: Phrase = editingPhrase ? {
       ...editingPhrase,
       text: formData.text.trim(),
       textEs: formData.textEs.trim() || undefined,
       category: formData.category,
     } : {
       id: generateId(),
       text: formData.text.trim(),
       textEs: formData.textEs.trim() || undefined,
       category: formData.category,
       isFavorite: false,
       createdAt: Date.now(),
     };
     
     await savePhrase(phrase);
     setPhrases(prev => editingPhrase 
       ? prev.map(p => p.id === phrase.id ? phrase : p)
       : [...prev, phrase]
     );
     setFormData({ text: '', textEs: '', category: 'general' });
     setIsAdding(false);
     setEditingPhrase(null);
   }, [formData, editingPhrase]);
 
   const handleToggleFavorite = useCallback(async (phrase: Phrase) => {
     const updated = { ...phrase, isFavorite: !phrase.isFavorite };
     await savePhrase(updated);
     setPhrases(prev => prev.map(p => p.id === updated.id ? updated : p));
   }, []);
 
   const handleDelete = useCallback(async (id: string) => {
     await deletePhrase(id);
     setPhrases(prev => prev.filter(p => p.id !== id));
   }, []);
 
   const startEdit = (phrase: Phrase) => {
     setEditingPhrase(phrase);
     setFormData({ text: phrase.text, textEs: phrase.textEs || '', category: phrase.category });
     setIsAdding(true);
   };
 
   const getPhraseText = (phrase: Phrase) => {
     return language === 'es' && phrase.textEs ? phrase.textEs : phrase.text;
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
                 <BookOpen className="w-5 h-5 text-accent-foreground" />
               </div>
               <h2 className="text-lg font-semibold">{t('phraseLibrary')}</h2>
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
                 placeholder={t('searchPhrases')}
                 className="w-full h-10 pl-10 pr-4 rounded-lg border border-input bg-background text-sm"
               />
             </div>
           </div>
 
           {/* Category Tabs */}
           {!filterCategory && (
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
           )}
 
           {/* Content */}
           <div className="flex-1 overflow-y-auto px-4 pb-safe-bottom">
             {isAdding ? (
               <div className="space-y-4 py-4">
                 <div>
                   <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                     {t('phraseText')} (English)
                   </label>
                   <textarea
                     value={formData.text}
                     onChange={e => setFormData(prev => ({ ...prev, text: e.target.value }))}
                     className="w-full h-24 px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none"
                     placeholder={t('enterPhrase')}
                   />
                 </div>
                 <div>
                   <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                     {t('phraseText')} (Español) - {t('optional')}
                   </label>
                   <textarea
                     value={formData.textEs}
                     onChange={e => setFormData(prev => ({ ...prev, textEs: e.target.value }))}
                     className="w-full h-24 px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none"
                     placeholder={t('enterPhraseEs')}
                   />
                 </div>
                 <div>
                   <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                     {t('category')}
                   </label>
                   <select
                     value={formData.category}
                     onChange={e => setFormData(prev => ({ ...prev, category: e.target.value as Phrase['category'] }))}
                     className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm"
                   >
                     {CATEGORIES.map(cat => (
                       <option key={cat} value={cat}>{t(cat)}</option>
                     ))}
                   </select>
                 </div>
                 <div className="flex gap-2">
                   <button
                     onClick={handleSave}
                     className="flex-1 h-10 bg-primary text-primary-foreground rounded-lg font-medium text-sm"
                   >
                     {editingPhrase ? t('update') : t('save')}
                   </button>
                   <button
                     onClick={() => { setIsAdding(false); setEditingPhrase(null); setFormData({ text: '', textEs: '', category: 'general' }); }}
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
                   {t('addPhrase')}
                 </button>
                 
                 {filteredPhrases.length === 0 ? (
                   <div className="text-center py-8 text-muted-foreground">
                     {t('noPhrases')}
                   </div>
                 ) : (
                   <div className="space-y-2">
                     {filteredPhrases.map(phrase => (
                       <div
                         key={phrase.id}
                         className="bg-muted/50 rounded-xl p-3 group"
                       >
                         <div className="flex items-start gap-2">
                           <button
                             onClick={() => onSelect(phrase)}
                             className="flex-1 text-left text-sm"
                           >
                             {getPhraseText(phrase)}
                           </button>
                           <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button
                               onClick={() => handleToggleFavorite(phrase)}
                               className={cn(
                                 "p-1.5 rounded",
                                 phrase.isFavorite ? "text-yellow-500" : "text-muted-foreground hover:text-yellow-500"
                               )}
                             >
                               <Star className={cn("w-4 h-4", phrase.isFavorite && "fill-current")} />
                             </button>
                             <button
                               onClick={() => startEdit(phrase)}
                               className="p-1.5 rounded text-muted-foreground hover:text-foreground"
                             >
                               <Edit2 className="w-4 h-4" />
                             </button>
                             <button
                               onClick={() => handleDelete(phrase.id)}
                               className="p-1.5 rounded text-muted-foreground hover:text-destructive"
                             >
                               <Trash2 className="w-4 h-4" />
                             </button>
                           </div>
                         </div>
                         <div className="flex items-center gap-2 mt-2">
                           <span className="text-xs px-2 py-0.5 rounded-full bg-secondary">
                             {t(phrase.category)}
                           </span>
                           {phrase.isFavorite && (
                             <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                           )}
                         </div>
                       </div>
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