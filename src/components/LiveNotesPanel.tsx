 import { useState } from 'react';
 import { ChevronUp, ChevronDown, Mic, FileText, Trash2 } from 'lucide-react';
 import { cn } from '@/lib/utils';
 
 interface LiveNotesPanelProps {
   roomNotes: Record<string, string>;
   currentRoom: string;
   isListening: boolean;
   currentTranscript: string;
   onClearRoomNotes: (room: string) => void;
   t: (key: string) => string;
 }
 
 export function LiveNotesPanel({
   roomNotes,
   currentRoom,
   isListening,
   currentTranscript,
   onClearRoomNotes,
   t,
 }: LiveNotesPanelProps) {
   const [isExpanded, setIsExpanded] = useState(true);
   
   const currentRoomNotes = roomNotes[currentRoom] || '';
   const displayNotes = currentTranscript 
     ? `${currentRoomNotes} ${currentTranscript}`.trim()
     : currentRoomNotes;
   
   return (
     <div className="absolute top-0 inset-x-0 z-20">
       {/* Collapsed Header */}
       <button
         onClick={() => setIsExpanded(!isExpanded)}
         className={cn(
           "w-full flex items-center justify-between px-4 py-2 transition-all",
           "bg-black/70 backdrop-blur text-white",
           isListening && "bg-destructive/80"
         )}
       >
         <div className="flex items-center gap-2">
           {isListening ? (
             <Mic className="w-4 h-4 animate-pulse" />
           ) : (
             <FileText className="w-4 h-4" />
           )}
           <span className="text-sm font-medium">
             {isListening ? t('recording') : t('roomNotes')}: {t(currentRoom)}
           </span>
         </div>
         {isExpanded ? (
           <ChevronUp className="w-4 h-4" />
         ) : (
           <ChevronDown className="w-4 h-4" />
         )}
       </button>
       
       {/* Expanded Panel */}
       {isExpanded && (
        <div className="bg-black/80 backdrop-blur text-white">
           {/* Current Room Notes */}
          <div className="px-4 py-3">
             <div className="flex items-center justify-between mb-1">
               <span className="text-xs text-white/60 uppercase tracking-wide">
                 {t(currentRoom)}
               </span>
               {currentRoomNotes && (
                 <button
                   onClick={() => onClearRoomNotes(currentRoom)}
                   className="text-xs text-white/40 hover:text-white/60 flex items-center gap-1"
                 >
                   <Trash2 className="w-3 h-3" />
                   {t('clear')}
                 </button>
               )}
             </div>
             {displayNotes ? (
               <p className={cn(
                 "text-sm leading-relaxed",
                 isListening && "animate-pulse"
               )}>
                 {displayNotes}
                 {isListening && <span className="inline-block w-1 h-4 bg-white ml-1 animate-pulse" />}
               </p>
             ) : (
               <p className="text-sm text-white/40 italic">
                 {isListening ? t('listening') : t('noNotesYet')}
               </p>
             )}
           </div>
         </div>
       )}
     </div>
   );
 }