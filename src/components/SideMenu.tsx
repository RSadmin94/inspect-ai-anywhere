import { X, Plus, FileText, Trash2, AlertCircle, Settings } from 'lucide-react';
import { InspectionRecord } from '@/lib/db';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  inspection: InspectionRecord | null;
  pendingCount: number;
  onNewInspection: () => void;
  onAnalyzePending: () => void;
  onFinish: () => void;
  onOpenSettings: () => void;
  t: (key: string) => string;
  isOnline: boolean;
}
 
export function SideMenu({ 
  isOpen, 
  onClose, 
  inspection,
  pendingCount,
  onNewInspection,
  onAnalyzePending,
  onFinish,
  onOpenSettings,
  t,
  isOnline
}: SideMenuProps) {
   if (!isOpen) return null;
 
   return (
     <div className="fixed inset-0 z-50 bg-black/50 animate-fade-in" onClick={onClose}>
       <div 
         className="absolute left-0 top-0 bottom-0 w-[280px] bg-card shadow-2xl animate-slide-right"
         onClick={e => e.stopPropagation()}
         style={{ animation: 'slideRight 0.3s ease-out' }}
       >
         <div className="h-full flex flex-col safe-top safe-bottom">
           {/* Header */}
           <div className="flex items-center justify-between p-4 border-b border-border">
             <h2 className="text-lg font-semibold">{t('appName')}</h2>
             <button 
               onClick={onClose}
               className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted touch-target"
             >
               <X className="w-5 h-5" />
             </button>
           </div>
 
           {/* Menu Items */}
           <div className="flex-1 p-4 space-y-2">
             {/* Analyze Pending */}
             {pendingCount > 0 && isOnline && (
               <button
                 onClick={onAnalyzePending}
                 className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-accent/10 text-accent hover:bg-accent/20 transition-colors touch-target"
               >
                 <AlertCircle className="w-5 h-5" />
                 <div className="text-left">
                   <p className="font-medium">{t('analyzePending')}</p>
                   <p className="text-sm opacity-70">{pendingCount} {t('photos')}</p>
                 </div>
               </button>
             )}
 
             {/* New Inspection */}
             <button
               onClick={onNewInspection}
               className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted transition-colors touch-target"
             >
               <Plus className="w-5 h-5" />
               <span className="font-medium">{t('newInspection')}</span>
             </button>
 
              {/* Finish Inspection */}
              {inspection && !inspection.isComplete && (
                <button
                  onClick={onFinish}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted transition-colors touch-target"
                >
                  <FileText className="w-5 h-5" />
                  <span className="font-medium">{t('finishInspection')}</span>
                </button>
              )}

              {/* Settings */}
              <button
                onClick={onOpenSettings}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted transition-colors touch-target"
              >
                <Settings className="w-5 h-5" />
                <span className="font-medium">{t('settings')}</span>
              </button>
            </div>
 
           {/* Footer */}
           <div className="p-4 border-t border-border">
             <p className="text-xs text-muted-foreground text-center">
               365 InspectAI v1.0 • Offline-First PWA
             </p>
           </div>
         </div>
       </div>
 
       <style>{`
         @keyframes slideRight {
           from { transform: translateX(-100%); }
           to { transform: translateX(0); }
         }
       `}</style>
     </div>
   );
 }