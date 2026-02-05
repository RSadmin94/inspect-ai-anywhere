 import { useState } from 'react';
 import { MapPin, User, ArrowRight, Clipboard } from 'lucide-react';
 
 interface NewInspectionFormProps {
  onStart: (address: string, inspectorName?: string) => Promise<unknown>;
   t: (key: string) => string;
 }
 
 export function NewInspectionForm({ onStart, t }: NewInspectionFormProps) {
   const [address, setAddress] = useState('');
   const [inspectorName, setInspectorName] = useState('');
   const [isStarting, setIsStarting] = useState(false);
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!address.trim()) return;
     
     setIsStarting(true);
     await onStart(address.trim(), inspectorName.trim() || undefined);
   };
 
   return (
     <div className="min-h-screen flex flex-col bg-background">
       {/* Header */}
       <div className="safe-top px-6 pt-8 pb-6">
         <div className="flex items-center gap-3 mb-2">
           <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center">
             <Clipboard className="w-6 h-6 text-primary-foreground" />
           </div>
           <div>
             <h1 className="text-2xl font-bold">InspectAI</h1>
             <p className="text-sm text-muted-foreground">{t('newInspection')}</p>
           </div>
         </div>
       </div>
 
       {/* Form */}
       <form onSubmit={handleSubmit} className="flex-1 px-6 pb-safe-bottom">
         <div className="space-y-6">
           {/* Property Address */}
           <div>
             <label className="text-sm font-medium text-muted-foreground mb-2 block">
               {t('propertyAddress')} *
             </label>
             <div className="relative">
               <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
               <input
                 type="text"
                 value={address}
                 onChange={e => setAddress(e.target.value)}
                 placeholder={t('enterAddress')}
                 className="w-full h-14 pl-12 pr-4 rounded-xl border border-input bg-card text-base touch-target"
                 required
               />
             </div>
           </div>
 
           {/* Inspector Name */}
           <div>
             <label className="text-sm font-medium text-muted-foreground mb-2 block">
               {t('inspectorName')}
             </label>
             <div className="relative">
               <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
               <input
                 type="text"
                 value={inspectorName}
                 onChange={e => setInspectorName(e.target.value)}
                 placeholder={t('enterName')}
                 className="w-full h-14 pl-12 pr-4 rounded-xl border border-input bg-card text-base touch-target"
               />
             </div>
           </div>
         </div>
 
         {/* Start Button */}
         <div className="mt-auto pt-8">
           <button
             type="submit"
             disabled={!address.trim() || isStarting}
             className="w-full h-14 bg-primary text-primary-foreground rounded-xl font-semibold text-lg touch-target flex items-center justify-center gap-2 disabled:opacity-50"
           >
             {t('startInspection')}
             <ArrowRight className="w-5 h-5" />
           </button>
         </div>
       </form>
     </div>
   );
 }