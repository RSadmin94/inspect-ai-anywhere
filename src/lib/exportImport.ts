// Export/Import functionality for inspection backup/restore
import JSZip from 'jszip';
import { 
  getDB, 
  InspectionRecord, 
  PhotoRecord, 
  getInspection, 
  getPhotosByInspection,
  saveInspection,
  savePhoto,
} from './db';

const EXPORT_SCHEMA_VERSION = 1;
const APP_VERSION = '1.2.0';

interface ExportVersion {
  appVersion: string;
  schemaVersion: number;
  exportedAt: number;
}

interface ExportedInspection {
  inspection: InspectionRecord;
  version: ExportVersion;
}

interface ImportResult {
  success: boolean;
  inspectionId?: string;
  photosImported: number;
  photosSkipped: number;
  errors: string[];
}

// Helper to create safe filenames
function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9_-]/gi, '-').substring(0, 50);
}

// Convert Blob to base64 string for JSON storage
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Remove data URL prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Convert base64 string back to Blob
function base64ToBlob(base64: string, mimeType: string = 'image/jpeg'): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

// Export a single inspection as a zip file
export async function exportInspection(inspectionId: string): Promise<Blob> {
  const inspection = await getInspection(inspectionId);
  if (!inspection) {
    throw new Error('Inspection not found');
  }

  const photos = await getPhotosByInspection(inspectionId);
  const zip = new JSZip();

  // Add version.json
  const version: ExportVersion = {
    appVersion: APP_VERSION,
    schemaVersion: EXPORT_SCHEMA_VERSION,
    exportedAt: Date.now(),
  };
  zip.file('version.json', JSON.stringify(version, null, 2));

  // Add inspection.json (without photo blobs)
  const inspectionData: ExportedInspection = {
    inspection,
    version,
  };
  zip.file('inspection.json', JSON.stringify(inspectionData, null, 2));

  // Create photos folder and add each photo
  const photosFolder = zip.folder('photos');
  if (photosFolder) {
    for (const photo of photos) {
      const photoId = sanitizeFilename(photo.id);
      
      // Create photo metadata (without blobs)
      const photoMeta = {
        id: photo.id,
        inspectionId: photo.inspectionId,
        room: photo.room,
        timestamp: photo.timestamp,
        notes: photo.notes,
        aiStatus: photo.aiStatus,
        aiFindingTitle: photo.aiFindingTitle,
        aiFindingTitleEs: photo.aiFindingTitleEs,
        aiSeverity: photo.aiSeverity,
        aiConfidence: photo.aiConfidence,
        aiDescription: photo.aiDescription,
        aiDescriptionEs: photo.aiDescriptionEs,
        aiRecommendation: photo.aiRecommendation,
        aiRecommendationEs: photo.aiRecommendationEs,
        aiCategory: photo.aiCategory,
        manualTitle: photo.manualTitle,
        manualTitleEs: photo.manualTitleEs,
        manualSeverity: photo.manualSeverity,
        manualCategory: photo.manualCategory,
        manualDescription: photo.manualDescription,
        manualDescriptionEs: photo.manualDescriptionEs,
        manualRecommendation: photo.manualRecommendation,
        manualRecommendationEs: photo.manualRecommendationEs,
        includeInReport: photo.includeInReport,
        reportOrder: photo.reportOrder,
        aiFullAnalysis: photo.aiFullAnalysis,
        annotationData: photo.annotationData,
        hasAnnotations: photo.hasAnnotations,
      };
      
      photosFolder.file(`${photoId}/meta.json`, JSON.stringify(photoMeta, null, 2));

      // Add thumbnail blob
      if (photo.thumbnailBlob) {
        const thumbBase64 = await blobToBase64(photo.thumbnailBlob);
        photosFolder.file(`${photoId}/thumbnail.b64`, thumbBase64);
      }

      // Add full image blob
      if (photo.fullImageBlob) {
        const fullBase64 = await blobToBase64(photo.fullImageBlob);
        photosFolder.file(`${photoId}/full.b64`, fullBase64);
      }

      // Add annotated image blob if exists
      if (photo.annotatedImageBlob) {
        const annotatedBase64 = await blobToBase64(photo.annotatedImageBlob);
        photosFolder.file(`${photoId}/annotated.b64`, annotatedBase64);
      }
    }
  }

  // Generate zip blob
  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
}

// Generate download filename for an inspection
export function getExportFilename(inspection: InspectionRecord): string {
  const date = new Date().toISOString().split('T')[0];
  const addressSlug = sanitizeFilename(inspection.propertyAddress);
  return `inspection-${addressSlug}-${date}.zip`;
}

// Import an inspection from a zip file
export async function importInspection(zipFile: File): Promise<ImportResult> {
  const result: ImportResult = {
    success: false,
    photosImported: 0,
    photosSkipped: 0,
    errors: [],
  };

  try {
    const zip = await JSZip.loadAsync(zipFile);

    // Check for required files
    const inspectionFile = zip.file('inspection.json');
    if (!inspectionFile) {
      result.errors.push('Missing inspection.json file');
      return result;
    }

    // Parse inspection data
    const inspectionJson = await inspectionFile.async('string');
    const exportedData: ExportedInspection = JSON.parse(inspectionJson);
    const originalInspection = exportedData.inspection;

    // Check if inspection already exists
    const existingInspection = await getInspection(originalInspection.id);
    
    // Generate new ID if inspection already exists
    let newInspectionId = originalInspection.id;
    if (existingInspection) {
      newInspectionId = `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    // Create new inspection record
    const newInspection: InspectionRecord = {
      ...originalInspection,
      id: newInspectionId,
      createdAt: existingInspection ? Date.now() : originalInspection.createdAt,
      updatedAt: Date.now(),
      photoIds: [], // Will be populated as we import photos
    };

    // Import photos
    const photosFolder = zip.folder('photos');
    if (photosFolder) {
      const photoFolders = new Set<string>();
      
      // Find all photo folders
      zip.forEach((relativePath, file) => {
        if (relativePath.startsWith('photos/') && !file.dir) {
          const parts = relativePath.split('/');
          if (parts.length >= 3) {
            photoFolders.add(parts[1]);
          }
        }
      });

      for (const photoFolder of photoFolders) {
        try {
          // Read photo metadata
          const metaFile = zip.file(`photos/${photoFolder}/meta.json`);
          if (!metaFile) {
            result.photosSkipped++;
            result.errors.push(`Missing metadata for photo ${photoFolder}`);
            continue;
          }

          const metaJson = await metaFile.async('string');
          const photoMeta = JSON.parse(metaJson);

          // Generate new photo ID if needed
          const newPhotoId = existingInspection 
            ? `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            : photoMeta.id;

          // Read blobs
          let thumbnailBlob: Blob | undefined;
          let fullImageBlob: Blob | undefined;
          let annotatedImageBlob: Blob | undefined;

          const thumbFile = zip.file(`photos/${photoFolder}/thumbnail.b64`);
          if (thumbFile) {
            const thumbBase64 = await thumbFile.async('string');
            thumbnailBlob = base64ToBlob(thumbBase64);
          }

          const fullFile = zip.file(`photos/${photoFolder}/full.b64`);
          if (fullFile) {
            const fullBase64 = await fullFile.async('string');
            fullImageBlob = base64ToBlob(fullBase64);
          }

          const annotatedFile = zip.file(`photos/${photoFolder}/annotated.b64`);
          if (annotatedFile) {
            const annotatedBase64 = await annotatedFile.async('string');
            annotatedImageBlob = base64ToBlob(annotatedBase64);
          }

          // Must have at least thumbnail and full image
          if (!thumbnailBlob || !fullImageBlob) {
            result.photosSkipped++;
            result.errors.push(`Missing image data for photo ${photoFolder}`);
            continue;
          }

          // Create photo record
          const newPhoto: PhotoRecord = {
            ...photoMeta,
            id: newPhotoId,
            inspectionId: newInspectionId,
            thumbnailBlob,
            fullImageBlob,
            annotatedImageBlob,
          };

          await savePhoto(newPhoto);
          newInspection.photoIds.push(newPhotoId);
          result.photosImported++;
        } catch (photoError) {
          result.photosSkipped++;
          result.errors.push(`Failed to import photo ${photoFolder}: ${photoError}`);
        }
      }
    }

    // Save the inspection
    await saveInspection(newInspection);
    result.success = true;
    result.inspectionId = newInspectionId;

  } catch (error) {
    result.errors.push(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

// Trigger download of a blob
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
