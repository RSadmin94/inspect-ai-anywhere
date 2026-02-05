import { Wifi, WifiOff, Globe, Home } from 'lucide-react';
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
          <button
            onClick={onGoToDashboard}
            className="flex items-center gap-1.5 text-sm px-2 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors touch-target"
            title="Go to Dashboard"
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </button>
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