 import { useRef, useCallback, useState, useEffect } from 'react';
import { Camera, X, RotateCcw, Zap, Mic, Square } from 'lucide-react';
 import { RoomSelector } from './RoomSelector';
 import { cn } from '@/lib/utils';
import { useVoiceDictation } from '@/hooks/useVoiceDictation';
 
 interface QuickCaptureModeProps {
   onCapture: (blob: Blob, room: string) => Promise<void>;
   onClose: () => void;
   t: (key: string) => string;
  language?: 'en' | 'es';
  onDictation?: (text: string) => void;
 }
 
export function QuickCaptureMode({ onCapture, onClose, t, language = 'en', onDictation }: QuickCaptureModeProps) {
   const videoRef = useRef<HTMLVideoElement>(null);
   const canvasRef = useRef<HTMLCanvasElement>(null);
   const [stream, setStream] = useState<MediaStream | null>(null);
   const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
   const [isCapturing, setIsCapturing] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const [stickyRoom, setStickyRoom] = useState('other');
   const [captureCount, setCaptureCount] = useState(0);

  const {
    isListening,
    fullTranscript,
    isSupported,
    toggleListening,
    resetTranscript,
  } = useVoiceDictation(language);

  // Send transcript when done listening
  useEffect(() => {
    if (!isListening && fullTranscript && onDictation) {
      onDictation(fullTranscript.trim());
      resetTranscript();
    }
  }, [isListening, fullTranscript, onDictation, resetTranscript]);
 
   const startCamera = useCallback(async () => {
     try {
       if (stream) {
         stream.getTracks().forEach(track => track.stop());
       }
 
       const newStream = await navigator.mediaDevices.getUserMedia({
         video: {
           facingMode,
           width: { ideal: 1920 },
           height: { ideal: 1080 },
         },
         audio: false,
       });
 
       setStream(newStream);
       if (videoRef.current) {
         videoRef.current.srcObject = newStream;
       }
       setError(null);
     } catch (err) {
       console.error('Camera error:', err);
       setError(t('cameraError'));
     }
   }, [facingMode, stream, t]);
 
   useEffect(() => {
     startCamera();
     return () => {
       if (stream) {
         stream.getTracks().forEach(track => track.stop());
       }
     };
   }, []);
 
   useEffect(() => {
     if (stream && videoRef.current) {
       videoRef.current.srcObject = stream;
     }
   }, [stream]);
 
   const handleCapture = useCallback(async () => {
     if (!videoRef.current || !canvasRef.current || isCapturing) return;
 
     setIsCapturing(true);
 
     const video = videoRef.current;
     const canvas = canvasRef.current;
 
     canvas.width = video.videoWidth;
     canvas.height = video.videoHeight;
 
     const ctx = canvas.getContext('2d');
     if (!ctx) return;
 
     ctx.drawImage(video, 0, 0);
 
     canvas.toBlob(async (blob) => {
       if (blob) {
         await onCapture(blob, stickyRoom);
         setCaptureCount(prev => prev + 1);
       }
       setIsCapturing(false);
     }, 'image/jpeg', 0.9);
   }, [onCapture, isCapturing, stickyRoom]);
 
   const toggleCamera = useCallback(() => {
     setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
     setTimeout(startCamera, 100);
   }, [startCamera]);
 
   if (error) {
     return (
       <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
         <div className="text-center p-6">
           <Camera className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
           <p className="text-muted-foreground">{error}</p>
           <button
             onClick={startCamera}
             className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg touch-target"
           >
             Retry
           </button>
         </div>
       </div>
     );
   }
 
   return (
     <div className="fixed inset-0 z-50 bg-black">
       {/* Header */}
       <div className="absolute top-0 inset-x-0 safe-top z-10 p-4 bg-gradient-to-b from-black/60 to-transparent">
         <div className="flex items-center justify-between">
           <div className="flex items-center gap-2">
             <Zap className="w-5 h-5 text-yellow-400" />
             <span className="text-white font-medium">{t('quickCapture')}</span>
             {captureCount > 0 && (
               <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                 {captureCount}
               </span>
             )}
           </div>
           <button
             onClick={onClose}
             className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 backdrop-blur text-white touch-target"
           >
             <X className="w-5 h-5" />
           </button>
         </div>
       </div>
 
       {/* Sticky Room Selector */}
       <div className="absolute top-20 inset-x-0 z-10 flex justify-center">
         <div className="bg-black/50 backdrop-blur rounded-full px-2 py-1">
           <RoomSelector
             value={stickyRoom}
             onChange={setStickyRoom}
             t={t}
             compact
           />
         </div>
       </div>
 
       {/* Video */}
       <video
         ref={videoRef}
         autoPlay
         playsInline
         muted
         className="w-full h-full object-cover"
       />
       <canvas ref={canvasRef} className="hidden" />
 
       {/* Camera controls */}
       <div className="absolute bottom-0 inset-x-0 safe-bottom pb-6 bg-gradient-to-t from-black/60 to-transparent pt-20">
         <div className="flex items-center justify-center gap-8">
          {/* Voice dictation button */}
          {isSupported && (
            <button
              onClick={toggleListening}
              className={cn(
                "w-14 h-14 rounded-full backdrop-blur flex items-center justify-center touch-target transition-all",
                isListening 
                  ? "bg-destructive text-destructive-foreground animate-pulse" 
                  : "bg-white/20 text-white"
              )}
            >
              {isListening ? <Square className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>
          )}

          {/* Main capture button - larger for quick mode */}
           <button
            onClick={handleCapture}
            disabled={isCapturing}
            className={cn(
              "w-24 h-24 rounded-full bg-white flex items-center justify-center transition-transform active:scale-95",
              isCapturing && "opacity-50"
            )}
            aria-label={t('capture')}
           >
            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center">
              <Camera className="w-10 h-10 text-primary-foreground" />
            </div>
           </button>
 
          {/* Flip camera button */}
           <button
            onClick={toggleCamera}
            className="w-14 h-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white touch-target"
           >
            <RotateCcw className="w-6 h-6" />
           </button>
         </div>
       </div>
      
      {/* Dictation indicator */}
      {isListening && (
        <div className="absolute top-32 inset-x-0 flex justify-center">
          <div className="bg-destructive text-destructive-foreground px-4 py-2 rounded-full flex items-center gap-2 animate-pulse">
            <Mic className="w-4 h-4" />
            <span className="text-sm font-medium">{t('recording')}...</span>
          </div>
        </div>
      )}
      
      {/* Show transcript preview */}
      {fullTranscript && (
        <div className="absolute top-44 inset-x-4">
          <div className="bg-black/70 backdrop-blur text-white px-4 py-3 rounded-xl">
            <p className="text-sm">{fullTranscript}</p>
          </div>
        </div>
      )}
 
       {/* Flash effect */}
       {isCapturing && (
         <div className="absolute inset-0 bg-white animate-fade-in pointer-events-none" />
       )}
     </div>
   );
 }