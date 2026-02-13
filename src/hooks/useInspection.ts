 import { useState, useEffect, useCallback } from 'react';
 import { 
   InspectionRecord, 
   PhotoRecord,
   InspectionType,
   saveInspection, 
   getInspection,
   getCurrentInspection,
   savePhoto,
   getPhotosByInspection,
   deletePhoto as deletePhotoFromDB,
   updatePhotoAI
 } from '@/lib/db-native';
 import { processImage, generateId } from '@/lib/imageUtils';
 
 export function useInspection() {
   const [inspection, setInspection] = useState<InspectionRecord | null>(null);
   const [photos, setPhotos] = useState<PhotoRecord[]>([]);
   const [isLoading, setIsLoading] = useState(false);
 
  // Load current inspection on mount
  useEffect(() => {
    async function load() {
      try {
        const current = await getCurrentInspection();
        if (current) {
          setInspection(current);
          const loadedPhotos = await getPhotosByInspection(current.id);
          setPhotos(loadedPhotos.sort((a, b) => b.timestamp - a.timestamp));
        }
      } catch (e) {
        console.error('Failed to load inspection:', e);
        // Continue anyway - app can work without persisted data
      }
    }
    load();
  }, []);
 
   const startInspection = useCallback(async (
     propertyAddress: string, 
     inspectorName?: string,
     clientName?: string,
     inspectionType?: InspectionType
   ) => {
     try {
       const newInspection: InspectionRecord = {
         id: generateId(),
         propertyAddress,
         inspectorName,
         clientName,
         inspectionType,
         createdAt: Date.now(),
         updatedAt: Date.now(),
         photoIds: [],
         isComplete: false,
       };
       await saveInspection(newInspection);
       setInspection(newInspection);
       setPhotos([]);
       console.log('Inspection started:', newInspection);
       return newInspection;
     } catch (e) {
       console.error('Failed to start inspection:', e);
       // Create in-memory inspection if DB fails
       const memoryInspection: InspectionRecord = {
         id: generateId(),
         propertyAddress,
         inspectorName,
         clientName,
         inspectionType,
         createdAt: Date.now(),
         updatedAt: Date.now(),
         photoIds: [],
         isComplete: false,
       };
       setInspection(memoryInspection);
       setPhotos([]);
       return memoryInspection;
     }
   }, []);
 
   const updateInspection = useCallback(async (updates: Partial<InspectionRecord>) => {
     if (!inspection) {
       console.warn('No inspection to update');
       return;
     }
     try {
       const updated = { ...inspection, ...updates, updatedAt: Date.now() };
       await saveInspection(updated);
       setInspection(updated);
     } catch (e) {
       console.error('Failed to update inspection:', e);
     }
   }, [inspection]);
 
  const updateRoomNotes = useCallback(async (room: string, notes: string) => {
    if (!inspection) return;
    const currentNotes = inspection.roomNotes || {};
    const updatedNotes = { ...currentNotes, [room]: notes };
    const updated = { ...inspection, roomNotes: updatedNotes, updatedAt: Date.now() };
    await saveInspection(updated);
    setInspection(updated);
  }, [inspection]);

  const appendRoomNotes = useCallback(async (room: string, text: string) => {
    if (!inspection) return;
    const currentNotes = inspection.roomNotes || {};
    const existingNotes = currentNotes[room] || '';
    const newNotes = existingNotes ? `${existingNotes} ${text}` : text;
    await updateRoomNotes(room, newNotes.trim());
  }, [inspection, updateRoomNotes]);

  const clearRoomNotes = useCallback(async (room: string) => {
    if (!inspection) return;
    const currentNotes = inspection.roomNotes || {};
    const { [room]: _, ...rest } = currentNotes;
    const updated = { ...inspection, roomNotes: rest, updatedAt: Date.now() };
    await saveInspection(updated);
    setInspection(updated);
  }, [inspection]);

   const capturePhoto = useCallback(async (imageBlob: Blob, room: string = 'other') => {
     if (!inspection) {
       console.error('No inspection in progress for photo capture');
       return null;
     }
 
     try {
       const { thumbnail, fullImage } = await processImage(imageBlob);
     
     const newPhoto: PhotoRecord = {
       id: generateId(),
       inspectionId: inspection.id,
       room,
       timestamp: Date.now(),
       notes: '',
       thumbnailBlob: thumbnail,
       fullImageBlob: fullImage,
       aiStatus: 'pending_offline',
     };
 
       await savePhoto(newPhoto);
       
       const updatedInspection = {
         ...inspection,
         photoIds: [...(inspection.photoIds ?? []), newPhoto.id],
         updatedAt: Date.now(),
       };
       await saveInspection(updatedInspection);
       setInspection(updatedInspection);
       setPhotos(prev => [newPhoto, ...prev]);
       console.log('Photo captured:', newPhoto.id);
       return newPhoto;
     } catch (e) {
       console.error('Failed to capture photo:', e);
       return null;
     }
   }, [inspection]);
 
   const updatePhoto = useCallback(async (photoId: string, updates: Partial<PhotoRecord>) => {
     const photo = photos.find(p => p.id === photoId);
     if (!photo) return;
 
     const updatedPhoto = { ...photo, ...updates };
     await savePhoto(updatedPhoto);
     setPhotos(prev => prev.map(p => p.id === photoId ? updatedPhoto : p));
   }, [photos]);
 
   const deletePhoto = useCallback(async (photoId: string) => {
     if (!inspection) return;
 
     await deletePhotoFromDB(photoId);
     
     const updatedInspection = {
       ...inspection,
       photoIds: (inspection.photoIds ?? []).filter(id => id !== photoId),
       updatedAt: Date.now(),
     };
     await saveInspection(updatedInspection);
     setInspection(updatedInspection);
     
     setPhotos(prev => prev.filter(p => p.id !== photoId));
   }, [inspection]);
 
   const updatePhotoWithAI = useCallback(async (photoId: string, aiData: Parameters<typeof updatePhotoAI>[1]) => {
     await updatePhotoAI(photoId, aiData);
     setPhotos(prev => prev.map(p => p.id === photoId ? { ...p, ...(aiData as Partial<PhotoRecord>) } : p));
   }, []);
 
  const finishInspection = useCallback(async () => {
    if (!inspection) return;
    await updateInspection({ isComplete: true });
  }, [inspection, updateInspection]);

  const refreshPhotos = useCallback(async () => {
    if (!inspection) return;
    const loadedPhotos = await getPhotosByInspection(inspection.id);
    setPhotos(loadedPhotos.sort((a, b) => b.timestamp - a.timestamp));
  }, [inspection]);

  const loadInspection = useCallback(async (inspectionId: string) => {
    const loaded = await getInspection(inspectionId);
    if (loaded) {
      setInspection(loaded);
      const loadedPhotos = await getPhotosByInspection(loaded.id);
      setPhotos(loadedPhotos.sort((a, b) => b.timestamp - a.timestamp));
    }
  }, []);

  return {
    inspection,
    photos,
    isLoading,
    startInspection,
    updateInspection,
    capturePhoto,
    updatePhoto,
    deletePhoto,
    updatePhotoWithAI,
    finishInspection,
    refreshPhotos,
    loadInspection,
    updateRoomNotes,
    appendRoomNotes,
    clearRoomNotes,
  };
}