 import { useState, useEffect, useCallback } from 'react';
 import { ChevronDown, Plus, X } from 'lucide-react';
 import { CustomRoom, getAllCustomRooms, saveCustomRoom, deleteCustomRoom } from '@/lib/db';
 import { generateId } from '@/lib/imageUtils';
 import { cn } from '@/lib/utils';
 
 const DEFAULT_ROOMS = [
   'exterior', 'interior', 'kitchen', 'bathroom', 'bedroom', 
   'livingRoom', 'basement', 'attic', 'garage', 'roof', 'other'
 ] as const;
 
 interface RoomSelectorProps {
   value: string;
   onChange: (room: string) => void;
   t: (key: string) => string;
   compact?: boolean;
 }
 
 export function RoomSelector({ value, onChange, t, compact = false }: RoomSelectorProps) {
   const [customRooms, setCustomRooms] = useState<CustomRoom[]>([]);
   const [isAddingCustom, setIsAddingCustom] = useState(false);
   const [newRoomName, setNewRoomName] = useState('');
   const [isOpen, setIsOpen] = useState(false);
 
   useEffect(() => {
     getAllCustomRooms().then(setCustomRooms);
   }, []);
 
   const handleAddCustomRoom = useCallback(async () => {
     if (!newRoomName.trim()) return;
     
     const room: CustomRoom = {
       id: generateId(),
       name: newRoomName.trim(),
       isDefault: false,
       order: customRooms.length + DEFAULT_ROOMS.length,
     };
     
     await saveCustomRoom(room);
     setCustomRooms(prev => [...prev, room]);
     onChange(room.id);
     setNewRoomName('');
     setIsAddingCustom(false);
     setIsOpen(false);
   }, [newRoomName, customRooms.length, onChange]);
 
   const handleDeleteCustomRoom = useCallback(async (id: string) => {
     await deleteCustomRoom(id);
     setCustomRooms(prev => prev.filter(r => r.id !== id));
     if (value === id) onChange('other');
   }, [value, onChange]);
 
   const getDisplayName = (roomValue: string) => {
     if (DEFAULT_ROOMS.includes(roomValue as typeof DEFAULT_ROOMS[number])) {
       return t(roomValue);
     }
     const custom = customRooms.find(r => r.id === roomValue);
     return custom?.name || roomValue;
   };
 
   if (compact) {
     return (
       <div className="relative">
         <button
           onClick={() => setIsOpen(!isOpen)}
           className="h-10 px-3 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium flex items-center gap-2"
         >
           {getDisplayName(value)}
           <ChevronDown className="w-4 h-4" />
         </button>
         
         {isOpen && (
           <>
            <div className="fixed inset-0 z-[60]" onClick={() => setIsOpen(false)} />
            <div 
              className="absolute top-full left-0 mt-1 z-[70] w-48 max-h-64 overflow-y-auto bg-background border border-border rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
               {DEFAULT_ROOMS.map(room => (
                 <button
                   key={room}
                   onClick={() => { onChange(room); setIsOpen(false); }}
                   className={cn(
                    "w-full px-3 py-2 text-left text-sm bg-background hover:bg-muted transition-colors",
                     value === room && "bg-primary/10 text-primary"
                   )}
                 >
                   {t(room)}
                 </button>
               ))}
               {customRooms.length > 0 && (
                 <>
                   <div className="border-t border-border my-1" />
                   {customRooms.map(room => (
                     <div key={room.id} className="flex items-center">
                       <button
                         onClick={() => { onChange(room.id); setIsOpen(false); }}
                         className={cn(
                        "flex-1 px-3 py-2 text-left text-sm bg-background hover:bg-muted transition-colors",
                           value === room.id && "bg-primary/10 text-primary"
                         )}
                       >
                         {room.name}
                       </button>
                       <button
                         onClick={() => handleDeleteCustomRoom(room.id)}
                         className="p-2 text-destructive hover:bg-destructive/10 rounded"
                       >
                         <X className="w-3 h-3" />
                       </button>
                     </div>
                   ))}
                 </>
               )}
               <div className="border-t border-border my-1" />
               {isAddingCustom ? (
                 <div className="p-2">
                   <input
                     type="text"
                     value={newRoomName}
                     onChange={e => setNewRoomName(e.target.value)}
                     onKeyDown={e => e.key === 'Enter' && handleAddCustomRoom()}
                     placeholder={t('addCustomRoom')}
                    className="w-full h-8 px-2 text-sm rounded border border-input bg-card"
                     autoFocus
                   />
                   <div className="flex gap-1 mt-1">
                     <button
                       onClick={handleAddCustomRoom}
                       className="flex-1 h-7 text-xs bg-primary text-primary-foreground rounded"
                     >
                       {t('add')}
                     </button>
                     <button
                       onClick={() => { setIsAddingCustom(false); setNewRoomName(''); }}
                       className="flex-1 h-7 text-xs bg-secondary rounded"
                     >
                       {t('cancel')}
                     </button>
                   </div>
                 </div>
               ) : (
                 <button
                   onClick={() => setIsAddingCustom(true)}
                  className="w-full px-3 py-2 text-left text-sm text-primary bg-background hover:bg-muted flex items-center gap-2"
                 >
                   <Plus className="w-4 h-4" />
                   {t('addCustomRoom')}
                 </button>
               )}
             </div>
           </>
         )}
       </div>
     );
   }
 
   return (
     <div className="space-y-2">
       <div className="relative">
         <select
           value={DEFAULT_ROOMS.includes(value as typeof DEFAULT_ROOMS[number]) ? value : 
                  customRooms.some(r => r.id === value) ? value : 'other'}
           onChange={e => onChange(e.target.value)}
           className="w-full h-12 px-4 pr-10 rounded-xl border border-input bg-background appearance-none touch-target"
         >
           {DEFAULT_ROOMS.map(room => (
             <option key={room} value={room}>{t(room)}</option>
           ))}
           {customRooms.map(room => (
             <option key={room.id} value={room.id}>{room.name}</option>
           ))}
         </select>
         <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
       </div>
       
       {isAddingCustom ? (
         <div className="flex gap-2">
           <input
             type="text"
             value={newRoomName}
             onChange={e => setNewRoomName(e.target.value)}
             onKeyDown={e => e.key === 'Enter' && handleAddCustomRoom()}
             placeholder={t('enterRoomName')}
             className="flex-1 h-10 px-3 rounded-lg border border-input bg-background text-sm"
             autoFocus
           />
           <button
             onClick={handleAddCustomRoom}
             className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
           >
             {t('add')}
           </button>
           <button
             onClick={() => { setIsAddingCustom(false); setNewRoomName(''); }}
             className="h-10 px-3 rounded-lg bg-secondary text-sm"
           >
             <X className="w-4 h-4" />
           </button>
         </div>
       ) : (
         <button
           onClick={() => setIsAddingCustom(true)}
           className="flex items-center gap-2 text-sm text-primary hover:underline"
         >
           <Plus className="w-4 h-4" />
           {t('addCustomRoom')}
         </button>
       )}
     </div>
   );
 }