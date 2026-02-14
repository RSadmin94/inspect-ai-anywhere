 import { useState, useRef, useEffect } from 'react';
 import { PhotoRecord } from '@/lib/db';
 import { blobToDataUrl } from '@/lib/imageUtils';
 import { cn } from '@/lib/utils';
 import { Clock, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
 
 interface PhotoGalleryProps {
   photos: PhotoRecord[] | null | undefined;
   selectedPhotoId: string | null;
   onSelectPhoto: (photo: PhotoRecord) => void;
   t: (key: string) => string;
 }
 
 export function PhotoGallery({ photos, selectedPhotoId, onSelectPhoto, t }: PhotoGalleryProps) {
   const [thumbnailUrls, setThumbnailUrls] = useState<Record<string, string>>({});
   const scrollRef = useRef<HTMLDivElement>(null);
 
   useEffect(() => {
     async function loadThumbnails() {
       const list = photos ?? [];
       const urls: Record<string, string> = {};
       for (const photo of list) {
         if (!thumbnailUrls[photo.id]) {
           urls[photo.id] = await blobToDataUrl(photo.thumbnailBlob);
         }
       }
       if (Object.keys(urls).length > 0) {
         setThumbnailUrls(prev => ({ ...prev, ...urls }));
       }
     }
     loadThumbnails();
   }, [photos]);
 
   const getAIStatusIcon = (status: PhotoRecord['aiStatus']) => {
     switch (status) {
       case 'pending_offline':
         return <Clock className="w-3 h-3 text-ai-pending" />;
       case 'analyzing':
         return <Loader2 className="w-3 h-3 text-ai-analyzing animate-spin" />;
       case 'complete':
         return <CheckCircle className="w-3 h-3 text-ai-complete" />;
       case 'failed':
         return <AlertCircle className="w-3 h-3 text-ai-failed" />;
     }
   };
 
   if (!photos?.length) {
     return (
       <div className="h-20 flex items-center justify-center text-muted-foreground text-sm">
         {t('noPhotos')}
       </div>
     );
   }
 
   return (
     <div 
       ref={scrollRef}
       className="scroll-smooth-x flex gap-2 px-4 py-2"
     >
       {(photos ?? []).map((photo) => (
         <button
           key={photo.id}
           onClick={() => onSelectPhoto(photo)}
           className="relative flex-shrink-0"
         >
           <img
             src={thumbnailUrls[photo.id] || ''}
             alt=""
             className={cn(
               "photo-thumb",
               selectedPhotoId === photo.id && "selected"
             )}
           />
           {/* AI status indicator */}
           <div className="absolute bottom-1 right-1 bg-card/90 backdrop-blur rounded-full p-0.5">
             {getAIStatusIcon(photo.aiStatus)}
           </div>
         </button>
       ))}
     </div>
   );
 }