 import { openDB, DBSchema, IDBPDatabase } from 'idb';
 
 export type AIStatus = 'pending_offline' | 'analyzing' | 'complete' | 'failed';
 export type Severity = 'minor' | 'moderate' | 'severe';
 export type Category = 'roofing' | 'plumbing' | 'electrical' | 'hvac' | 'foundation' | 'safety' | 'general';
 
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
 }
 
 export interface InspectionRecord {
   id: string;
   propertyAddress: string;
   inspectorName?: string;
   createdAt: number;
   updatedAt: number;
   photoIds: string[];
   isComplete: boolean;
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
 }
 
 let dbInstance: IDBPDatabase<InspectAIDB> | null = null;
 
 export async function getDB(): Promise<IDBPDatabase<InspectAIDB>> {
   if (dbInstance) return dbInstance;
   
   dbInstance = await openDB<InspectAIDB>('inspectai-db', 1, {
     upgrade(db) {
       // Photos store
       const photoStore = db.createObjectStore('photos', { keyPath: 'id' });
       photoStore.createIndex('by-inspection', 'inspectionId');
       
       // Inspections store
       const inspectionStore = db.createObjectStore('inspections', { keyPath: 'id' });
       inspectionStore.createIndex('by-date', 'createdAt');
       
       // Settings store
       db.createObjectStore('settings', { keyPath: 'key' });
     },
   });
   
   return dbInstance;
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
     'aiRecommendation' | 'aiRecommendationEs' | 'aiCategory'
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