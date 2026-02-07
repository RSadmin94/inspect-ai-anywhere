/**
 * Production-ready PhotoAnnotationEditor
 * - Stroke-based undo/redo (1KB per action vs 12MB)
 * - Guardrails: max undo steps, point decimation, micro-stroke merging
 * - Full-resolution export
 * - Offline-capable
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { AnnotationToolbar } from './AnnotationToolbar';
import { AnnotationCanvas } from './AnnotationCanvas';
import { AnnotationControls } from './AnnotationControls';
import { PhotoRecord } from '@/lib/db';
import { blobToDataUrl } from '@/lib/imageUtils';
import { Stroke, StrokeType, shouldMergeWithPrevious, mergeStrokes, estimateStrokeSize } from '@/lib/strokeTypes';
import { renderStrokes } from '@/lib/strokeRenderer';

interface PhotoAnnotationEditorProps {
  photo: PhotoRecord;
  onSave: (annotationData: string, annotatedImage: Blob) => Promise<void>;
  onCancel: () => void;
}

// Guardrails
const MAX_UNDO_STEPS = 50;
const MAX_STROKES_PER_SESSION = 500;
const MAX_MEMORY_MB = 50; // Max memory for strokes

export function PhotoAnnotationEditor({
  photo,
  onSave,
  onCancel,
}: PhotoAnnotationEditorProps) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [currentTool, setCurrentTool] = useState<StrokeType>('freehand');
  const [currentColor, setCurrentColor] = useState<string>('#FF0000');
  const [thickness, setThickness] = useState<number>(3);
  const [isSaving, setIsSaving] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Stroke-based state (replaces ImageData)
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [undoStack, setUndoStack] = useState<Stroke[][]>([]);
  const [redoStack, setRedoStack] = useState<Stroke[][]>([]);
  const [totalMemory, setTotalMemory] = useState(0);

  // Load image
  useEffect(() => {
    const loadImage = async () => {
      const url = await blobToDataUrl(photo.fullImageBlob);
      setImageUrl(url);
    };
    loadImage();
  }, [photo]);

  // Calculate total memory usage
  const updateMemoryUsage = useCallback((newStrokes: Stroke[]) => {
    const total = newStrokes.reduce((sum, stroke) => sum + estimateStrokeSize(stroke), 0);
    setTotalMemory(total);

    if (total > MAX_MEMORY_MB * 1024 * 1024) {
      console.warn(`Memory usage (${(total / 1024 / 1024).toFixed(1)}MB) exceeds limit`);
    }
  }, []);

  const handleStrokeComplete = useCallback(
    (stroke: Stroke) => {
      // Check guardrails
      if (strokes.length >= MAX_STROKES_PER_SESSION) {
        console.warn('Max strokes per session reached');
        return;
      }

      let newStrokes = [...strokes, stroke];

      // Try to merge with previous stroke if it's a micro-stroke
      if (strokes.length > 0 && shouldMergeWithPrevious(stroke, strokes[strokes.length - 1])) {
        const lastStroke = strokes[strokes.length - 1];
        const merged = mergeStrokes(lastStroke, stroke);
        newStrokes = [...strokes.slice(0, -1), merged];
      }

      setStrokes(newStrokes);

      // Save to undo stack (but limit depth)
      setUndoStack(prev => {
        const updated = [...prev, strokes];
        if (updated.length > MAX_UNDO_STEPS) {
          updated.shift(); // Remove oldest
        }
        return updated;
      });

      // Clear redo stack
      setRedoStack([]);

      updateMemoryUsage(newStrokes);
    },
    [strokes, updateMemoryUsage]
  );

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;

    // Save current state to redo
    setRedoStack(prev => [...prev, strokes]);

    // Restore previous state
    const previousStrokes = undoStack[undoStack.length - 1];
    setStrokes(previousStrokes);
    setUndoStack(prev => prev.slice(0, -1));

    updateMemoryUsage(previousStrokes);
  }, [undoStack, strokes, updateMemoryUsage]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;

    // Save current state to undo
    setUndoStack(prev => [...prev, strokes]);

    // Restore next state
    const nextStrokes = redoStack[redoStack.length - 1];
    setStrokes(nextStrokes);
    setRedoStack(prev => prev.slice(0, -1));

    updateMemoryUsage(nextStrokes);
  }, [redoStack, strokes, updateMemoryUsage]);

  const handleClearAll = useCallback(() => {
    // Save current state to undo
    if (strokes.length > 0) {
      setUndoStack(prev => [...prev, strokes]);
      setRedoStack([]);
    }

    setStrokes([]);
    updateMemoryUsage([]);
  }, [strokes, updateMemoryUsage]);

  const handleSave = useCallback(async () => {
    if (!canvasRef.current) return;

    setIsSaving(true);
    try {
      // Create full-resolution canvas for export
      const fullCanvas = document.createElement('canvas');
      
      const ctx = fullCanvas.getContext('2d');
      if (!ctx) {
        setIsSaving(false);
        return;
      }

      // Load full image and wait for it
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = imageUrl;
      });

      fullCanvas.width = img.width;
      fullCanvas.height = img.height;

      // Draw full image
      ctx.drawImage(img, 0, 0);

      // Render all strokes at full resolution
      renderStrokes(ctx, strokes, { scale: 1, offsetX: 0, offsetY: 0 });

      // Export to blob and wait for it
      const blob = await new Promise<Blob | null>((resolve) => {
        fullCanvas.toBlob(resolve, 'image/png');
      });

      if (!blob) {
        console.error('Failed to create annotation blob');
        setIsSaving(false);
        return;
      }

      // Create annotation metadata
      const annotationData = JSON.stringify({
        strokeCount: strokes.length,
        timestamp: Date.now(),
        tools: [...new Set(strokes.map(s => s.type))],
        colors: [...new Set(strokes.map(s => s.color))],
        memoryUsage: totalMemory,
      });

      await onSave(annotationData, blob);
    } catch (error) {
      console.error('Failed to save annotation:', error);
    } finally {
      setIsSaving(false);
    }
  }, [strokes, imageUrl, totalMemory, onSave]);

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-background border-b">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">Annotate Photo</h2>
          <div className="text-xs text-muted-foreground">
            {strokes.length} strokes • {(totalMemory / 1024).toFixed(1)}KB
          </div>
        </div>
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
        onToolChange={setCurrentTool as (tool: string) => void}
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
            onStrokeComplete={handleStrokeComplete}
            strokes={strokes}
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
