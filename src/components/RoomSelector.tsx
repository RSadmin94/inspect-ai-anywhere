  import { useState, useEffect, useCallback, useRef } from 'react';
 import { ChevronDown, Plus, X, GripVertical } from 'lucide-react';
 import { CustomRoom, getAllCustomRooms, saveCustomRoom, deleteCustomRoom, getRoomOrder, saveRoomOrder } from '@/lib/db';
 import { generateId } from '@/lib/imageUtils';
 import { cn } from '@/lib/utils';
 
const DEFAULT_ROOMS = [
  // Main areas
  'exterior', 'interior', 'livingRoom', 'diningRoom', 'kitchen',
  // Bedrooms  
  'mainBedroom', 'bedroom2', 'bedroom3', 'bedroom4',
  // Bathrooms
  'bathroom', 'masterBath', 'halfBath',
  // Utility
  'laundryRoom', 'utilityRoom', 'garage', 'basement', 'crawlSpace', 'attic',
  // Outdoor
  'deck', 'patio', 'pool', 'driveway', 'roof',
  // Systems
  'electricalPanel', 'ac', 'waterHeater', 'furnace',
  // Other spaces
  'hallway', 'stairs', 'closet', 'office', 'fireplace', 'other'
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
  const [roomOrder, setRoomOrder] = useState<string[]>([]);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverItem, setDragOverItem] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);
 
   useEffect(() => {
     getAllCustomRooms().then(setCustomRooms);
    getRoomOrder().then(setRoomOrder);
   }, []);
 
  // Get ordered list of all rooms (default + custom)
  const getAllRooms = useCallback(() => {
    const order = roomOrder ?? [];
    const allRoomIds = [...DEFAULT_ROOMS, ...(customRooms ?? []).map(r => r.id)];
    
    if (order.length === 0) {
      return allRoomIds;
    }
    
    // Sort by saved order, put unordered items at the end
    const orderedRooms = [...allRoomIds].sort((a, b) => {
      const aIndex = order.indexOf(a);
      const bIndex = order.indexOf(b);
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
    
    return orderedRooms;
  }, [customRooms, roomOrder]);

  const handleDragStart = useCallback((roomId: string) => {
    setDraggedItem(roomId);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, roomId: string) => {
    e.preventDefault();
    if (draggedItem && draggedItem !== roomId) {
      setDragOverItem(roomId);
    }
  }, [draggedItem]);

  const handleDragEnd = useCallback(async () => {
    if (draggedItem && dragOverItem && draggedItem !== dragOverItem) {
      const orderedRooms = getAllRooms();
      const newOrder = [...orderedRooms];
      const draggedIndex = newOrder.indexOf(draggedItem);
      const targetIndex = newOrder.indexOf(dragOverItem);
      
      if (draggedIndex !== -1 && targetIndex !== -1) {
        newOrder.splice(draggedIndex, 1);
        newOrder.splice(targetIndex, 0, draggedItem);
        setRoomOrder(newOrder);
        await saveRoomOrder(newOrder);
      }
    }
    setDraggedItem(null);
    setDragOverItem(null);
  }, [draggedItem, dragOverItem, getAllRooms]);

   const handleAddCustomRoom = useCallback(async () => {
     if (!newRoomName.trim()) return;
     
     const room: CustomRoom = {
       id: generateId(),
       name: newRoomName.trim(),
       isDefault: false,
       order: (customRooms ?? []).length + DEFAULT_ROOMS.length,
     };
     
     await saveCustomRoom(room);
     setCustomRooms(prev => [...prev, room]);
      // Add to room order
      const newOrder = [...(roomOrder ?? []), room.id];
      setRoomOrder(newOrder);
      await saveRoomOrder(newOrder);
     onChange(room.id);
     setNewRoomName('');
     setIsAddingCustom(false);
     setIsOpen(false);
    }, [newRoomName, customRooms.length, onChange, roomOrder]);
 
   const handleDeleteCustomRoom = useCallback(async (id: string) => {
     await deleteCustomRoom(id);
     setCustomRooms(prev => prev.filter(r => r.id !== id));
    // Remove from room order
    const newOrder = (roomOrder ?? []).filter(roomId => roomId !== id);
    setRoomOrder(newOrder);
    await saveRoomOrder(newOrder);
     if (value === id) onChange('other');
    }, [value, onChange, roomOrder]);
 
   const getDisplayName = (roomValue: string) => {
     if (DEFAULT_ROOMS.includes(roomValue as typeof DEFAULT_ROOMS[number])) {
       return t(roomValue);
     }
     const custom = (customRooms ?? []).find(r => r.id === roomValue);
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
               className="absolute top-full left-0 mt-1 z-[70] w-56 max-h-80 overflow-y-auto bg-background border border-border rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
               {/* Reorder toggle */}
               <button
                 onClick={() => setIsReordering(!isReordering)}
                 className={cn(
                   "w-full px-3 py-2 text-left text-xs font-medium flex items-center gap-2 border-b border-border",
                   isReordering ? "bg-primary/10 text-primary" : "bg-muted/50 text-muted-foreground hover:bg-muted"
                 )}
               >
                 <GripVertical className="w-3 h-3" />
                 {isReordering ? 'Done reordering' : 'Reorder rooms'}
               </button>
               
               {getAllRooms().map(roomId => {
                 const isDefault = DEFAULT_ROOMS.includes(roomId as typeof DEFAULT_ROOMS[number]);
                 const customRoom = (customRooms ?? []).find(r => r.id === roomId);
                 const displayName = isDefault ? t(roomId) : customRoom?.name || roomId;
                 const isDragging = draggedItem === roomId;
                 const isDragOver = dragOverItem === roomId;
                 
                 return (
                   <div
                     key={roomId}
                     draggable={isReordering}
                     onDragStart={() => handleDragStart(roomId)}
                     onDragOver={(e) => handleDragOver(e, roomId)}
                     onDragEnd={handleDragEnd}
                     className={cn(
                       "flex items-center transition-all",
                       isDragging && "opacity-50 bg-primary/5",
                       isDragOver && "border-t-2 border-primary"
                     )}
                   >
                     {isReordering && (
                       <div className="p-2 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
                         <GripVertical className="w-4 h-4" />
                       </div>
                     )}
                     <button
                       onClick={() => { if (!isReordering) { onChange(roomId); setIsOpen(false); } }}
                       className={cn(
                         "flex-1 px-3 py-2 text-left text-sm bg-background hover:bg-muted transition-colors",
                         value === roomId && "bg-primary/10 text-primary",
                         isReordering && "cursor-default"
                       )}
                     >
                       {displayName}
                     </button>
                     {!isDefault && customRoom && !isReordering && (
                       <button
                         onClick={() => handleDeleteCustomRoom(roomId)}
                         className="p-2 text-destructive hover:bg-destructive/10 rounded"
                       >
                         <X className="w-3 h-3" />
                       </button>
                     )}
                   </div>
                 );
               })}
               
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
 
   // Non-compact (full) view with reordering
   return (
     <div className="space-y-2">
       <div className="relative">
         <button
           onClick={() => setIsOpen(!isOpen)}
           className="w-full h-12 px-4 pr-10 rounded-xl border border-input bg-background text-left touch-target flex items-center"
         >
           {getDisplayName(value)}
         </button>
         <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
         
         {isOpen && (
           <>
             <div className="fixed inset-0 z-[60]" onClick={() => setIsOpen(false)} />
             <div 
               className="absolute top-full left-0 right-0 mt-1 z-[70] max-h-80 overflow-y-auto bg-background border border-border rounded-xl shadow-2xl"
               onClick={(e) => e.stopPropagation()}
             >
               {/* Reorder toggle */}
               <button
                 onClick={() => setIsReordering(!isReordering)}
                 className={cn(
                   "w-full px-3 py-2 text-left text-xs font-medium flex items-center gap-2 border-b border-border",
                   isReordering ? "bg-primary/10 text-primary" : "bg-muted/50 text-muted-foreground hover:bg-muted"
                 )}
               >
                 <GripVertical className="w-3 h-3" />
                 {isReordering ? 'Done reordering' : 'Reorder rooms'}
               </button>
               
               {getAllRooms().map(roomId => {
                 const isDefault = DEFAULT_ROOMS.includes(roomId as typeof DEFAULT_ROOMS[number]);
                 const customRoom = (customRooms ?? []).find(r => r.id === roomId);
                 const displayName = isDefault ? t(roomId) : customRoom?.name || roomId;
                 const isDragging = draggedItem === roomId;
                 const isDragOver = dragOverItem === roomId;
                 
                 return (
                   <div
                     key={roomId}
                     draggable={isReordering}
                     onDragStart={() => handleDragStart(roomId)}
                     onDragOver={(e) => handleDragOver(e, roomId)}
                     onDragEnd={handleDragEnd}
                   className={cn(
                       "flex items-center transition-all",
                       isDragging && "opacity-50 bg-primary/5",
                       isDragOver && "border-t-2 border-primary"
                   )}
                 >
                     {isReordering && (
                       <div className="p-2 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
                         <GripVertical className="w-4 h-4" />
                       </div>
                     )}
                       <button
                       onClick={() => { if (!isReordering) { onChange(roomId); setIsOpen(false); } }}
                         className={cn(
                           "flex-1 px-3 py-2 text-left text-sm bg-background hover:bg-muted transition-colors",
                           value === roomId && "bg-primary/10 text-primary",
                           isReordering && "cursor-default"
                         )}
                       >
                         {displayName}
                       </button>
                     {!isDefault && customRoom && !isReordering && (
                       <button
                         onClick={() => handleDeleteCustomRoom(roomId)}
                         className="p-2 text-destructive hover:bg-destructive/10 rounded"
                       >
                         <X className="w-3 h-3" />
                       </button>
                     )}
                     </div>
                 );
               })}
               
               <div className="border-t border-border my-1" />
               <button
                 onClick={() => setIsAddingCustom(true)}
                 className="w-full px-3 py-2 text-left text-sm text-primary bg-background hover:bg-muted flex items-center gap-2"
               >
                 <Plus className="w-4 h-4" />
                 {t('addCustomRoom')}
               </button>
             </div>
           </>
         )}
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