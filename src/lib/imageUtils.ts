 import imageCompression from 'browser-image-compression';
 
 const MAX_DIMENSION = 2048;
 const THUMBNAIL_SIZE = 128;
 const COMPRESSION_QUALITY = 0.8;
 
 export async function processImage(file: File | Blob): Promise<{ thumbnail: Blob; fullImage: Blob }> {
   // Create full-size compressed image
   const fullImageOptions = {
     maxWidthOrHeight: MAX_DIMENSION,
     useWebWorker: true,
     initialQuality: COMPRESSION_QUALITY,
     fileType: 'image/jpeg' as const,
   };
   
   const fullImage = await imageCompression(file as File, fullImageOptions);
   
   // Create thumbnail
   const thumbnailOptions = {
     maxWidthOrHeight: THUMBNAIL_SIZE,
     useWebWorker: true,
     initialQuality: 0.7,
     fileType: 'image/jpeg' as const,
   };
   
   const thumbnail = await imageCompression(file as File, thumbnailOptions);
   
   return { thumbnail, fullImage };
 }
 
 export function blobToDataUrl(blob: Blob): Promise<string> {
   return new Promise((resolve, reject) => {
     const reader = new FileReader();
     reader.onloadend = () => resolve(reader.result as string);
     reader.onerror = reject;
     reader.readAsDataURL(blob);
   });
 }
 
 export function generateId(): string {
   return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
 }