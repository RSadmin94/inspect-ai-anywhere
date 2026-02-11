 import { openDB, DBSchema, IDBPDatabase } from 'idb';
 
 export type AIStatus = 'pending_offline' | 'analyzing' | 'complete' | 'failed';
 export type Severity = 'minor' | 'moderate' | 'severe';
 export type Category = 'roofing' | 'plumbing' | 'electrical' | 'hvac' | 'foundation' | 'safety' | 'general';
 export type InspectionType = 'pre_purchase' | 'pre_listing' | 'annual' | 'insurance' | 'new_construction' | 'warranty' | 'other';
 
 export interface CustomRoom {
   id: string;
   name: string;
   nameEs?: string;
   isDefault: boolean;
   order: number;
 }
 
 export interface Phrase {
   id: string;
   text: string;
   textEs?: string;
   category: 'disclaimer' | 'note' | 'recommendation' | 'general';
   isFavorite: boolean;
   createdAt: number;
 }
 
 export interface IssuePreset {
   id: string;
   title: string;
   titleEs?: string;
   category: Category;
   severity: Severity;
   description: string;
   descriptionEs?: string;
   recommendation: string;
   recommendationEs?: string;
   createdAt: number;
 }
 
 export interface PhotoRecord {
   id: string;
   inspectionId: string;
   room: string;
   timestamp: number;
   notes: string;
   thumbnailBlob: Blob;
   fullImageBlob: Blob;
   aiStatus: AIStatus;
   aiFindingTitle?: string;
   aiFindingTitleEs?: string;
   aiSeverity?: Severity;
   aiConfidence?: number;
   aiDescription?: string;
   aiDescriptionEs?: string;
   aiRecommendation?: string;
   aiRecommendationEs?: string;
   aiCategory?: Category;
   // Manual issue (from preset or custom)
   manualTitle?: string;
   manualTitleEs?: string;
   manualSeverity?: Severity;
   manualCategory?: Category;
   manualDescription?: string;
   manualDescriptionEs?: string;
   manualRecommendation?: string;
   manualRecommendationEs?: string;
   // Report builder fields
   includeInReport?: boolean;
   reportOrder?: number;
  // Full AI analysis JSON
  aiFullAnalysis?: string;
  // Photo annotation fields
  annotationData?: string;  // JSON string of annotation metadata
  annotatedImageBlob?: Blob;  // Annotated image with drawings
  hasAnnotations?: boolean;  // Quick flag for UI
 }
 
 export interface InspectionRecord {
   id: string;
   propertyAddress: string;
   inspectorName?: string;
   createdAt: number;
   updatedAt: number;
   photoIds: string[];
   isComplete: boolean;
   // Enhanced metadata
   clientName?: string;
   inspectionType?: InspectionType;
   customRooms?: string[]; // IDs of custom rooms for this inspection
  roomNotes?: Record<string, string>; // Notes by room key
 }
 
 export interface SettingsRecord {
   key: string;
   value: string;
 }
 
 interface InspectAIDB extends DBSchema {
   photos: {
     key: string;
     value: PhotoRecord;
     indexes: { 'by-inspection': string };
   };
   inspections: {
     key: string;
     value: InspectionRecord;
     indexes: { 'by-date': number };
   };
   settings: {
     key: string;
     value: SettingsRecord;
   };
     customRooms: {
       key: string;
       value: CustomRoom;
     };
     phrases: {
       key: string;
       value: Phrase;
       indexes: { 'by-category': string; 'by-favorite': number };
     };
     issuePresets: {
       key: string;
       value: IssuePreset;
       indexes: { 'by-category': string };
     };
 }
 
 let dbInstance: IDBPDatabase<InspectAIDB> | null = null;
 
 export async function getDB(): Promise<IDBPDatabase<InspectAIDB>> {
   if (dbInstance) return dbInstance;
   
   try {
     dbInstance = await openDB<InspectAIDB>('inspectai-db', 2, {
     upgrade(db) {
       // Photos store
       if (!db.objectStoreNames.contains('photos')) {
         const photoStore = db.createObjectStore('photos', { keyPath: 'id' });
         photoStore.createIndex('by-inspection', 'inspectionId');
       }
       
       // Inspections store
       if (!db.objectStoreNames.contains('inspections')) {
         const inspectionStore = db.createObjectStore('inspections', { keyPath: 'id' });
         inspectionStore.createIndex('by-date', 'createdAt');
       }
       
       // Settings store
       if (!db.objectStoreNames.contains('settings')) {
         db.createObjectStore('settings', { keyPath: 'key' });
       }
 
       // Custom rooms store
       if (!db.objectStoreNames.contains('customRooms')) {
         db.createObjectStore('customRooms', { keyPath: 'id' });
       }
 
       // Phrases store
       if (!db.objectStoreNames.contains('phrases')) {
         const phraseStore = db.createObjectStore('phrases', { keyPath: 'id' });
         phraseStore.createIndex('by-category', 'category');
         phraseStore.createIndex('by-favorite', 'isFavorite');
       }
 
       // Issue presets store
       if (!db.objectStoreNames.contains('issuePresets')) {
         const presetStore = db.createObjectStore('issuePresets', { keyPath: 'id' });
         presetStore.createIndex('by-category', 'category');
       }
     },
   });
   
     return dbInstance;
   } catch (error) {
     console.error('Failed to initialize IndexedDB:', error);
     // Fallback: try to clear and reinitialize
     try {
       await indexedDB.deleteDatabase('inspectai-db');
       dbInstance = null;
       return await getDB();
     } catch (retryError) {
       console.error('Failed to recover from IndexedDB error:', retryError);
       throw new Error('IndexedDB initialization failed: ' + String(error));
     }
   }
 }
 
 // Photo operations
 export async function savePhoto(photo: PhotoRecord): Promise<void> {
   const db = await getDB();
   await db.put('photos', photo);
 }
 
 export async function getPhoto(id: string): Promise<PhotoRecord | undefined> {
   const db = await getDB();
   return db.get('photos', id);
 }
 
 export async function getPhotosByInspection(inspectionId: string): Promise<PhotoRecord[]> {
   const db = await getDB();
   return db.getAllFromIndex('photos', 'by-inspection', inspectionId);
 }
 
 export async function deletePhoto(id: string): Promise<void> {
   const db = await getDB();
   await db.delete('photos', id);
 }
 
 export async function getPendingPhotos(): Promise<PhotoRecord[]> {
   const db = await getDB();
   const allPhotos = await db.getAll('photos');
   return allPhotos.filter(p => p.aiStatus === 'pending_offline' || p.aiStatus === 'failed');
 }
 
 export async function updatePhotoAI(
   id: string, 
   aiData: Partial<Pick<PhotoRecord, 
     'aiStatus' | 'aiFindingTitle' | 'aiFindingTitleEs' | 'aiSeverity' | 
     'aiConfidence' | 'aiDescription' | 'aiDescriptionEs' | 
    'aiRecommendation' | 'aiRecommendationEs' | 'aiCategory' | 'aiFullAnalysis'
   >>
 ): Promise<void> {
   const db = await getDB();
   const photo = await db.get('photos', id);
   if (photo) {
     await db.put('photos', { ...photo, ...aiData });
   }
 }
 
 // Inspection operations
 export async function saveInspection(inspection: InspectionRecord): Promise<void> {
   const db = await getDB();
   await db.put('inspections', inspection);
 }
 
 export async function getInspection(id: string): Promise<InspectionRecord | undefined> {
   const db = await getDB();
   return db.get('inspections', id);
 }
 
 export async function getCurrentInspection(): Promise<InspectionRecord | undefined> {
   const db = await getDB();
   const all = await db.getAllFromIndex('inspections', 'by-date');
   return all.filter(i => !i.isComplete).pop();
 }
 
 export async function deleteInspection(id: string): Promise<void> {
   const db = await getDB();
   const photos = await getPhotosByInspection(id);
   for (const photo of photos) {
     await db.delete('photos', photo.id);
   }
   await db.delete('inspections', id);
 }
 
 // Settings operations
 export async function getSetting(key: string): Promise<string | undefined> {
   const db = await getDB();
   const setting = await db.get('settings', key);
   return setting?.value;
 }
 
 export async function setSetting(key: string, value: string): Promise<void> {
   const db = await getDB();
   await db.put('settings', { key, value });
 }
 
 // Custom room operations
 export async function saveCustomRoom(room: CustomRoom): Promise<void> {
   const db = await getDB();
   await db.put('customRooms', room);
 }
 
 export async function getAllCustomRooms(): Promise<CustomRoom[]> {
   const db = await getDB();
   return db.getAll('customRooms');
 }
 
 export async function deleteCustomRoom(id: string): Promise<void> {
   const db = await getDB();
   await db.delete('customRooms', id);
 }
 
 // Phrase operations
 export async function savePhrase(phrase: Phrase): Promise<void> {
   const db = await getDB();
   await db.put('phrases', phrase);
 }
 
 export async function getAllPhrases(): Promise<Phrase[]> {
   const db = await getDB();
   return db.getAll('phrases');
 }
 
 export async function getPhrasesByCategory(category: Phrase['category']): Promise<Phrase[]> {
   const db = await getDB();
   return db.getAllFromIndex('phrases', 'by-category', category);
 }
 
 export async function deletePhrase(id: string): Promise<void> {
   const db = await getDB();
   await db.delete('phrases', id);
 }
 
 // Issue preset operations
 export async function saveIssuePreset(preset: IssuePreset): Promise<void> {
   const db = await getDB();
   await db.put('issuePresets', preset);
 }
 
 export async function getAllIssuePresets(): Promise<IssuePreset[]> {
   const db = await getDB();
   return db.getAll('issuePresets');
 }
 
 export async function getPresetsByCategory(category: Category): Promise<IssuePreset[]> {
   const db = await getDB();
   return db.getAllFromIndex('issuePresets', 'by-category', category);
 }
 
 export async function deleteIssuePreset(id: string): Promise<void> {
   const db = await getDB();
   await db.delete('issuePresets', id);
 }

// Room order operations
export async function getRoomOrder(): Promise<string[]> {
  const order = await getSetting('roomOrder');
  return order ? JSON.parse(order) : [];
}

export async function saveRoomOrder(order: string[]): Promise<void> {
  await setSetting('roomOrder', JSON.stringify(order));
}