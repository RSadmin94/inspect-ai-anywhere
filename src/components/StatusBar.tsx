import { Wifi, WifiOff, Globe, LayoutDashboard } from 'lucide-react';
import { motion } from 'framer-motion';
 import { cn } from '@/lib/utils';
 
 interface StatusBarProps {
   isOnline: boolean;
   photoCount: number;
   language: string;
   onToggleLanguage: () => void;
  onGoToDashboard?: () => void;
   t: (key: string) => string;
 }
 
export function StatusBar({ isOnline, photoCount, language, onToggleLanguage, onGoToDashboard, t }: StatusBarProps) {
   return (
     <div className="flex items-center justify-between px-4 py-2 bg-card border-b border-border safe-top">
      {/* Left section: Dashboard + Online status */}
      <div className="flex items-center gap-3">
        {onGoToDashboard && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onGoToDashboard}
            className="flex items-center gap-2 text-sm px-3 py-2 rounded-xl bg-gradient-to-r from-primary/20 to-accent/20 text-primary border border-primary/30 hover:border-primary/50 hover:shadow-[0_0_15px_rgba(var(--primary),0.3)] transition-all duration-300 touch-target backdrop-blur-sm"
            title="Go to Dashboard"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="font-medium">Dashboard</span>
          </motion.button>
        )}
        <div className={cn(
          "flex items-center gap-1.5 text-sm",
          isOnline ? "text-accent" : "text-muted-foreground"
        )}>
          {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
          <span>{isOnline ? t('online') : t('offline')}</span>
        </div>
       </div>
 
       {/* Photo count */}
       <div className="text-sm font-medium">
         {photoCount} {t('photos')}
       </div>
 
       {/* Language toggle */}
       <button
         onClick={onToggleLanguage}
         className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full bg-secondary touch-target"
       >
         <Globe className="w-4 h-4" />
         <span>{language === 'en' ? 'ES' : 'EN'}</span>
       </button>
     </div>
   );
 }