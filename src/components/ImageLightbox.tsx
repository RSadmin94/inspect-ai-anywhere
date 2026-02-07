import { useState, useEffect, useRef } from 'react';
 import { X, ZoomIn, ZoomOut, RotateCw, PenTool } from 'lucide-react';
 import { motion, AnimatePresence } from 'framer-motion';
 import { cn } from '@/lib/utils';
 
 interface ImageLightboxProps {
   imageUrl: string;
   isOpen: boolean;
   onClose: () => void;
   onAnnotate?: () => void;
 }
 
 export function ImageLightbox({ imageUrl, isOpen, onClose, onAnnotate }: ImageLightboxProps) {
   const [scale, setScale] = useState(1);
   const [rotation, setRotation] = useState(0);
  const lastTapRef = useRef(0);
 
   useEffect(() => {
     if (isOpen) {
       setScale(1);
       setRotation(0);
     }
   }, [isOpen]);
 
   useEffect(() => {
     const handleKeyDown = (e: KeyboardEvent) => {
       if (!isOpen) return;
       if (e.key === 'Escape') onClose();
       if (e.key === '+' || e.key === '=') setScale(s => Math.min(s + 0.25, 4));
       if (e.key === '-') setScale(s => Math.max(s - 0.25, 0.5));
       if (e.key === 'r') setRotation(r => r + 90);
     };
     window.addEventListener('keydown', handleKeyDown);
     return () => window.removeEventListener('keydown', handleKeyDown);
   }, [isOpen, onClose]);
 
   const handleZoomIn = () => setScale(s => Math.min(s + 0.5, 4));
   const handleZoomOut = () => setScale(s => Math.max(s - 0.5, 0.5));
   const handleRotate = () => setRotation(r => r + 90);
  
  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      // Double tap - toggle zoom
      setScale(s => s === 1 ? 2 : 1);
    }
    lastTapRef.current = now;
  };
 
   return (
     <AnimatePresence>
       {isOpen && (
         <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-black/95 flex flex-col"
           onClick={onClose}
         >
           {/* Header Controls */}
            <div className="flex items-center justify-between p-4 safe-top">
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); handleZoomOut(); }}
                  className="w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                >
                  <ZoomOut className="w-5 h-5" />
                </button>
                <span className="text-white text-sm font-medium min-w-[60px] text-center">
                  {Math.round(scale * 100)}%
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); handleZoomIn(); }}
                  className="w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                >
                  <ZoomIn className="w-5 h-5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleRotate(); }}
                  className="w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                >
                  <RotateCw className="w-5 h-5" />
                </button>
                {onAnnotate && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onAnnotate(); }}
                    className="w-10 h-10 rounded-full bg-primary/80 backdrop-blur flex items-center justify-center text-white hover:bg-primary transition-colors"
                    title="Annotate"
                  >
                    <PenTool className="w-5 h-5" />
                  </button>
                )}
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
 
           {/* Image Container */}
           <div 
             className="flex-1 flex items-center justify-center overflow-hidden p-4"
            onClick={(e) => {
              e.stopPropagation();
              handleDoubleTap();
            }}
           >
             <motion.img
               src={imageUrl}
               alt=""
              className="max-w-full max-h-full object-contain select-none touch-none"
               style={{
                 transform: `scale(${scale}) rotate(${rotation}deg)`,
                 transition: 'transform 0.2s ease-out',
               }}
              draggable={false}
             />
           </div>
 
           {/* Footer hint */}
           <div className="p-4 text-center safe-bottom">
             <p className="text-white/50 text-xs">
               Pinch to zoom • Double-tap to reset • Swipe to pan
             </p>
           </div>
         </motion.div>
       )}
     </AnimatePresence>
   );
 }