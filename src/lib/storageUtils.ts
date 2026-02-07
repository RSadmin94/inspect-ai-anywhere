// Storage utilities for calculating IndexedDB usage
import { getDB } from './db';

export interface StorageBreakdown {
  photos: number;
  thumbnails: number;
  annotated: number;
  inspections: number;
  settings: number;
  other: number;
  total: number;
}

// Estimate blob size in bytes
function estimateBlobSize(blob: Blob | undefined): number {
  return blob?.size || 0;
}

// Calculate total storage used by the app
export async function calculateStorageUsage(): Promise<StorageBreakdown> {
  const db = await getDB();
  
  const breakdown: StorageBreakdown = {
    photos: 0,
    thumbnails: 0,
    annotated: 0,
    inspections: 0,
    settings: 0,
    other: 0,
    total: 0,
  };

  try {
    // Calculate photo storage
    const photos = await db.getAll('photos');
    for (const photo of photos) {
      breakdown.photos += estimateBlobSize(photo.fullImageBlob);
      breakdown.thumbnails += estimateBlobSize(photo.thumbnailBlob);
      breakdown.annotated += estimateBlobSize(photo.annotatedImageBlob);
      
      // Add metadata size estimate (JSON string length * 2 for UTF-16)
      const metaSize = JSON.stringify({
        id: photo.id,
        inspectionId: photo.inspectionId,
        room: photo.room,
        notes: photo.notes,
        aiStatus: photo.aiStatus,
        aiFindingTitle: photo.aiFindingTitle,
        aiDescription: photo.aiDescription,
        aiRecommendation: photo.aiRecommendation,
        manualTitle: photo.manualTitle,
        manualDescription: photo.manualDescription,
        annotationData: photo.annotationData,
        aiFullAnalysis: photo.aiFullAnalysis,
      }).length * 2;
      breakdown.other += metaSize;
    }

    // Calculate inspection storage
    const inspections = await db.getAll('inspections');
    for (const inspection of inspections) {
      breakdown.inspections += JSON.stringify(inspection).length * 2;
    }

    // Calculate settings storage
    const settings = await db.getAll('settings');
    for (const setting of settings) {
      breakdown.settings += JSON.stringify(setting).length * 2;
    }

    // Calculate custom rooms storage
    const customRooms = await db.getAll('customRooms');
    for (const room of customRooms) {
      breakdown.other += JSON.stringify(room).length * 2;
    }

    // Calculate phrases storage
    const phrases = await db.getAll('phrases');
    for (const phrase of phrases) {
      breakdown.other += JSON.stringify(phrase).length * 2;
    }

    // Calculate issue presets storage
    const presets = await db.getAll('issuePresets');
    for (const preset of presets) {
      breakdown.other += JSON.stringify(preset).length * 2;
    }

  } catch (error) {
    console.error('Error calculating storage:', error);
  }

  // Calculate total
  breakdown.total = 
    breakdown.photos + 
    breakdown.thumbnails + 
    breakdown.annotated + 
    breakdown.inspections + 
    breakdown.settings + 
    breakdown.other;

  return breakdown;
}

// Format bytes to human-readable string
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Get storage estimate using browser API if available
export async function getEstimatedQuota(): Promise<{ usage: number; quota: number } | null> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    try {
      const estimate = await navigator.storage.estimate();
      return {
        usage: estimate.usage || 0,
        quota: estimate.quota || 0,
      };
    } catch {
      return null;
    }
  }
  return null;
}
