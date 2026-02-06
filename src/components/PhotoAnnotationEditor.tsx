import { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { AnnotationToolbar } from './AnnotationToolbar';
import { AnnotationCanvas } from './AnnotationCanvas';
import { AnnotationControls } from './AnnotationControls';
import { PhotoRecord } from '@/lib/db';
import { blobToDataUrl } from '@/lib/imageUtils';

interface PhotoAnnotationEditorProps {
  photo: PhotoRecord;
  onSave: (annotationData: string, annotatedImage: Blob) => Promise<void>;
  onCancel: () => void;
}

export function PhotoAnnotationEditor({
  photo,
  onSave,
  onCancel,
}: PhotoAnnotationEditorProps) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [currentTool, setCurrentTool] = useState<string>('freehand');
  const [currentColor, setCurrentColor] = useState<string>('#FF0000');
  const [thickness, setThickness] = useState<number>(3);
  const [isSaving, setIsSaving] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [undoStack, setUndoStack] = useState<ImageData[]>([]);
  const [redoStack, setRedoStack] = useState<ImageData[]>([]);

  useEffect(() => {
    const loadImage = async () => {
      const url = await blobToDataUrl(photo.fullImageBlob);
      setImageUrl(url);
    };
    loadImage();
  }, [photo]);

  const handleUndo = () => {
    if (undoStack.length === 0 || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Save current state to redo stack
    const currentImageData = ctx.getImageData(
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height
    );
    setRedoStack([...redoStack, currentImageData]);

    // Restore previous state
    const previousState = undoStack[undoStack.length - 1];
    ctx.putImageData(previousState, 0, 0);
    setUndoStack(undoStack.slice(0, -1));
  };

  const handleRedo = () => {
    if (redoStack.length === 0 || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Save current state to undo stack
    const currentImageData = ctx.getImageData(
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height
    );
    setUndoStack([...undoStack, currentImageData]);

    // Restore next state
    const nextState = redoStack[redoStack.length - 1];
    ctx.putImageData(nextState, 0, 0);
    setRedoStack(redoStack.slice(0, -1));
  };

  const handleClearAll = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Save current state to undo stack
    const currentImageData = ctx.getImageData(
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height
    );
    setUndoStack([...undoStack, currentImageData]);
    setRedoStack([]);

    // Clear canvas
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    // Redraw original image
    if (imageUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
      img.src = imageUrl;
    }
  };

  const handleSave = async () => {
    if (!canvasRef.current) return;
    setIsSaving(true);
    try {
      // Export canvas to blob
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) return;

        // Create annotation data
        const annotationData = JSON.stringify({
          tool: currentTool,
          color: currentColor,
          thickness,
          timestamp: Date.now(),
        });

        await onSave(annotationData, blob);
      }, 'image/png');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDraw = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Save state to undo stack
    const currentImageData = ctx.getImageData(
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height
    );
    setUndoStack([...undoStack, currentImageData]);
    setRedoStack([]);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-background border-b">
        <h2 className="text-lg font-semibold">Annotate Photo</h2>
        <button
          onClick={onCancel}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Toolbar */}
      <AnnotationToolbar
        currentTool={currentTool}
        onToolChange={setCurrentTool}
        currentColor={currentColor}
        onColorChange={setCurrentColor}
        thickness={thickness}
        onThicknessChange={setThickness}
      />

      {/* Canvas Area */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-black/50">
        {imageUrl && (
          <AnnotationCanvas
            imageUrl={imageUrl}
            tool={currentTool}
            color={currentColor}
            thickness={thickness}
            canvasRef={canvasRef}
            onDraw={handleDraw}
          />
        )}
      </div>

      {/* Controls */}
      <AnnotationControls
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClear={handleClearAll}
        onSave={handleSave}
        onCancel={onCancel}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        isSaving={isSaving}
      />
    </div>
  );
}
