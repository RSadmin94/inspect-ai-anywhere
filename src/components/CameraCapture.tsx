 import { useRef, useCallback, useState, useEffect } from 'react';
import { Camera, X, RotateCcw, Mic, Square } from 'lucide-react';
 import { cn } from '@/lib/utils';
import { useVoiceDictation } from '@/hooks/useVoiceDictation';
import { LiveNotesPanel } from './LiveNotesPanel';
 
 interface CameraCaptureProps {
   onCapture: (blob: Blob) => Promise<void>;
   t: (key: string) => string;
  language?: 'en' | 'es';
  onDictation?: (text: string, room: string) => void;
  currentRoom: string;
  roomNotes: Record<string, string>;
  onClearRoomNotes: (room: string) => void;
 }
 
export function CameraCapture({ 
  onCapture, 
  t, 
  language = 'en', 
  onDictation,
  currentRoom,
  roomNotes,
  onClearRoomNotes,
}: CameraCaptureProps) {
   const videoRef = useRef<HTMLVideoElement>(null);
   const canvasRef = useRef<HTMLCanvasElement>(null);
   const [stream, setStream] = useState<MediaStream | null>(null);
   const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
   const [isCapturing, setIsCapturing] = useState(false);
   const [error, setError] = useState<string | null>(null);

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
      onDictation(fullTranscript.trim(), currentRoom);
      resetTranscript();
    }
  }, [isListening, fullTranscript, onDictation, resetTranscript, currentRoom]);
 
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
         await onCapture(blob);
       }
       setIsCapturing(false);
     }, 'image/jpeg', 0.9);
   }, [onCapture, isCapturing]);
 
   const toggleCamera = useCallback(() => {
     setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
     setTimeout(startCamera, 100);
   }, [startCamera]);
 
   if (error) {
     return (
       <div className="flex-1 flex items-center justify-center bg-muted">
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
    <div className="relative flex-1 bg-black z-0 min-h-[300px]">
      {/* Live Notes Panel */}
      <LiveNotesPanel
        roomNotes={roomNotes}
        currentRoom={currentRoom}
        isListening={isListening}
        currentTranscript={fullTranscript}
        onClearRoomNotes={onClearRoomNotes}
        t={t}
      />
      
       <video
         ref={videoRef}
         autoPlay
         playsInline
         muted
         className="w-full h-full object-cover"
       />
       <canvas ref={canvasRef} className="hidden" />
       
       {/* Camera controls */}
       <div className="absolute bottom-0 inset-x-0 safe-bottom pb-6">
         <div className="flex items-center justify-center gap-8">
          {/* Voice dictation button */}
          {isSupported && (
            <button
              onClick={toggleListening}
              className={cn(
                "w-12 h-12 rounded-full backdrop-blur flex items-center justify-center touch-target transition-all",
                isListening 
                  ? "bg-destructive text-destructive-foreground animate-pulse" 
                  : "bg-black/50 text-white"
              )}
            >
              {isListening ? <Square className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          )}
          
          {/* Main capture button */}
          <button
            onClick={handleCapture}
            disabled={isCapturing}
            className={cn(
              "capture-btn no-select",
              isCapturing && "opacity-50"
            )}
            aria-label={t('capture')}
          >
            <Camera className="w-8 h-8 text-primary-foreground" />
          </button>
          
          {/* Flip camera button */}
           <button
             onClick={toggleCamera}
             className="w-12 h-12 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white touch-target"
           >
             <RotateCcw className="w-5 h-5" />
           </button>
         </div>
       </div>
 
       {/* Flash effect */}
       {isCapturing && (
         <div className="absolute inset-0 bg-white animate-fade-in pointer-events-none" />
       )}
     </div>
   );
 }