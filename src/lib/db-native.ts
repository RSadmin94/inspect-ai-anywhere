// Native IndexedDB implementation without idb library to avoid compatibility issues

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
  aiRecommendation?: string;
  aiRecommendationEs?: string;
}

export interface InspectionRecord {
  id: string;
  propertyAddress: string;
  inspectorName?: string;
  clientName?: string;
  inspectionType?: InspectionType;
  createdAt: number;
  updatedAt: number;
  photoIds: string[];
  isComplete: boolean;
}

let dbInstance: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open('inspectai-db', 2);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

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
    };
  });
}

// Photo operations
export async function savePhoto(photo: PhotoRecord): Promise<void> {
  const db = await openDB();
  const tx = db.transaction('photos', 'readwrite');
  const store = tx.objectStore('photos');
  return new Promise((resolve, reject) => {
    const request = store.put(photo);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function getPhotosByInspection(inspectionId: string): Promise<PhotoRecord[]> {
  const db = await openDB();
  const tx = db.transaction('photos', 'readonly');
  const store = tx.objectStore('photos');
  const index = store.index('by-inspection');
  return new Promise((resolve, reject) => {
    const request = index.getAll(inspectionId);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

export async function deletePhoto(photoId: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction('photos', 'readwrite');
  const store = tx.objectStore('photos');
  return new Promise((resolve, reject) => {
    const request = store.delete(photoId);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function updatePhotoAI(
  photoId: string,
  aiStatus: AIStatus,
  aiFindingTitle?: string,
  aiFindingTitleEs?: string,
  aiSeverity?: Severity,
  aiConfidence?: number,
  aiRecommendation?: string,
  aiRecommendationEs?: string
): Promise<void> {
  const db = await openDB();
  const tx = db.transaction('photos', 'readwrite');
  const store = tx.objectStore('photos');
  return new Promise((resolve, reject) => {
    const getRequest = store.get(photoId);
    getRequest.onerror = () => reject(getRequest.error);
    getRequest.onsuccess = () => {
      const photo = getRequest.result;
      if (photo) {
        photo.aiStatus = aiStatus;
        photo.aiFindingTitle = aiFindingTitle;
        photo.aiFindingTitleEs = aiFindingTitleEs;
        photo.aiSeverity = aiSeverity;
        photo.aiConfidence = aiConfidence;
        photo.aiRecommendation = aiRecommendation;
        photo.aiRecommendationEs = aiRecommendationEs;
        const putRequest = store.put(photo);
        putRequest.onerror = () => reject(putRequest.error);
        putRequest.onsuccess = () => resolve();
      } else {
        reject(new Error('Photo not found'));
      }
    };
  });
}

// Inspection operations
export async function saveInspection(inspection: InspectionRecord): Promise<void> {
  const db = await openDB();
  const tx = db.transaction('inspections', 'readwrite');
  const store = tx.objectStore('inspections');
  return new Promise((resolve, reject) => {
    const request = store.put(inspection);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function getInspection(id: string): Promise<InspectionRecord | null> {
  const db = await openDB();
  const tx = db.transaction('inspections', 'readonly');
  const store = tx.objectStore('inspections');
  return new Promise((resolve, reject) => {
    const request = store.get(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || null);
  });
}

export async function getCurrentInspection(): Promise<InspectionRecord | null> {
  const db = await openDB();
  const tx = db.transaction('inspections', 'readonly');
  const store = tx.objectStore('inspections');
  const index = store.index('by-date');
  return new Promise((resolve, reject) => {
    const request = index.openCursor(null, 'prev');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const cursor = request.result;
      resolve(cursor?.value || null);
    };
  });
}

// Settings operations
export async function getSetting(key: string): Promise<string | null> {
  const db = await openDB();
  const tx = db.transaction('settings', 'readonly');
  const store = tx.objectStore('settings');
  return new Promise((resolve, reject) => {
    const request = store.get(key);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result?.value || null);
  });
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction('settings', 'readwrite');
  const store = tx.objectStore('settings');
  return new Promise((resolve, reject) => {
    const request = store.put({ key, value });
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}
