 import { Mic, MicOff, Square } from 'lucide-react';
 import { cn } from '@/lib/utils';
 
 interface VoiceDictationButtonProps {
   isListening: boolean;
   isSupported: boolean;
   onToggle: () => void;
   className?: string;
   size?: 'sm' | 'md' | 'lg';
 }
 
 export function VoiceDictationButton({
   isListening,
   isSupported,
   onToggle,
   className,
   size = 'md',
 }: VoiceDictationButtonProps) {
   if (!isSupported) return null;
 
   const sizeClasses = {
     sm: 'w-8 h-8',
     md: 'w-10 h-10',
     lg: 'w-12 h-12',
   };
 
   const iconSizes = {
     sm: 'w-4 h-4',
     md: 'w-5 h-5',
     lg: 'w-6 h-6',
   };
 
   return (
     <button
       onClick={onToggle}
       className={cn(
         'rounded-full flex items-center justify-center touch-target transition-all',
         isListening 
           ? 'bg-destructive text-destructive-foreground animate-pulse' 
           : 'bg-primary/10 text-primary hover:bg-primary/20',
         sizeClasses[size],
         className
       )}
       title={isListening ? 'Stop recording' : 'Start voice dictation'}
     >
       {isListening ? (
         <Square className={iconSizes[size]} />
       ) : (
         <Mic className={iconSizes[size]} />
       )}
     </button>
   );
 }