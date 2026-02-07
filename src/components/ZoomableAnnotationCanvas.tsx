import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Stroke, StrokeType, Point, generateStrokeId, decimatePoints } from '../lib/strokeTypes';
import { renderStrokes } from '../lib/strokeRenderer';
import { safeCloseBitmap } from '../lib/bitmapUtils';
import { ZoomIn, ZoomOut, Move } from 'lucide-react';

interface Props {
  imageUrl: string;
  tool: StrokeType;
  color: string;
  thickness: number;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  onStrokeComplete: (stroke: Stroke) => void;
  strokes: Stroke[];
}

interface ViewTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export function ZoomableAnnotationCanvas({
  imageUrl,
  tool,
  color,
  thickness,
  canvasRef,
  onStrokeComplete,
  strokes,
}: Props) {
  const [baseBitmap, setBaseBitmap] = useState<ImageBitmap | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Zoom/pan state
  const [transform, setTransform] = useState<ViewTransform>({ scale: 1, offsetX: 0, offsetY: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panMode, setPanMode] = useState(false);
  const lastPanPoint = useRef<{ x: number; y: number } | null>(null);
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });
  
  // Pinch zoom state
  const lastPinchDistance = useRef<number | null>(null);

  // Load base image as ImageBitmap
  useEffect(() => {
    let cancelled = false;

    async function loadImage() {
      setBaseBitmap((prev) => {
        safeCloseBitmap(prev);
        return null;
      });

      if (!imageUrl) return;

      try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const bmp = await createImageBitmap(blob);
        if (cancelled) {
          safeCloseBitmap(bmp);
          return;
        }
        setBaseBitmap(bmp);
      } catch (e) {
        console.error('Failed to load image:', e);
      }
    }

    loadImage();

    return () => {
      cancelled = true;
      setBaseBitmap((prev) => {
        safeCloseBitmap(prev);
        return null;
      });
    };
  }, [imageUrl]);

  // Redraw canvas when strokes, base image, or transform changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !baseBitmap) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match container
    const dpr = window.devicePixelRatio || 1;
    const containerWidth = canvas.parentElement?.clientWidth || 800;
    const aspectRatio = baseBitmap.height / baseBitmap.width;
    const containerHeight = containerWidth * aspectRatio;

    canvas.width = Math.round(containerWidth * dpr);
    canvas.height = Math.round(containerHeight * dpr);
    canvas.style.width = `${containerWidth}px`;
    canvas.style.height = `${containerHeight}px`;
    
    setDisplaySize({ width: containerWidth, height: containerHeight });

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, containerWidth, containerHeight);
    
    // Apply zoom/pan transform
    ctx.save();
    ctx.translate(transform.offsetX, transform.offsetY);
    ctx.scale(transform.scale, transform.scale);
    
    // Draw image at natural size (scaled by transform)
    const imageDisplayWidth = containerWidth;
    const imageDisplayHeight = containerHeight;
    ctx.drawImage(baseBitmap, 0, 0, imageDisplayWidth, imageDisplayHeight);

    // Render strokes (they're stored in display coordinates, not transformed)
    renderStrokes(ctx, strokes, { scale: 1, offsetX: 0, offsetY: 0 });
    
    ctx.restore();
  }, [baseBitmap, strokes, canvasRef, transform]);

  // Convert screen coordinates to canvas coordinates (accounting for zoom/pan)
  const screenToCanvas = useCallback((screenX: number, screenY: number): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const x = (screenX - rect.left - transform.offsetX) / transform.scale;
    const y = (screenY - rect.top - transform.offsetY) / transform.scale;
    return { x, y };
  }, [canvasRef, transform]);

  const getPointerPosition = useCallback((e: React.PointerEvent): Point => {
    const point = screenToCanvas(e.clientX, e.clientY);
    return { ...point, pressure: e.pressure };
  }, [screenToCanvas]);

  // Handle pinch zoom
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastPinchDistance.current = Math.sqrt(dx * dx + dy * dy);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastPinchDistance.current !== null) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const delta = distance / lastPinchDistance.current;
      
      // Calculate pinch center
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
        const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
        
        setTransform(prev => {
          const newScale = Math.max(0.5, Math.min(4, prev.scale * delta));
          // Adjust offset to zoom toward pinch center
          const scaleChange = newScale / prev.scale;
          const newOffsetX = centerX - (centerX - prev.offsetX) * scaleChange;
          const newOffsetY = centerY - (centerY - prev.offsetY) * scaleChange;
          
          return { scale: newScale, offsetX: newOffsetX, offsetY: newOffsetY };
        });
      }
      
      lastPinchDistance.current = distance;
    }
  }, [canvasRef]);

  const handleTouchEnd = useCallback(() => {
    lastPinchDistance.current = null;
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    
    // Check for pan mode or right-click
    if (panMode || e.button === 2) {
      setIsPanning(true);
      lastPanPoint.current = { x: e.clientX, y: e.clientY };
      return;
    }
    
    const point = getPointerPosition(e);
    setIsDrawing(true);
    setStartPoint(point);
    setCurrentPoints([point]);
  }, [panMode, getPointerPosition]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    // Handle panning
    if (isPanning && lastPanPoint.current) {
      const dx = e.clientX - lastPanPoint.current.x;
      const dy = e.clientY - lastPanPoint.current.y;
      setTransform(prev => ({
        ...prev,
        offsetX: prev.offsetX + dx,
        offsetY: prev.offsetY + dy,
      }));
      lastPanPoint.current = { x: e.clientX, y: e.clientY };
      return;
    }
    
    if (!isDrawing) return;

    const point = getPointerPosition(e);

    if (tool === 'freehand') {
      setCurrentPoints(prev => [...prev, point]);

      // Draw preview
      const canvas = canvasRef.current;
      if (!canvas || !baseBitmap) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, displaySize.width, displaySize.height);
      
      // Apply transform
      ctx.save();
      ctx.translate(transform.offsetX, transform.offsetY);
      ctx.scale(transform.scale, transform.scale);
      
      ctx.drawImage(baseBitmap, 0, 0, displaySize.width, displaySize.height);
      renderStrokes(ctx, strokes, { scale: 1, offsetX: 0, offsetY: 0 });

      // Draw current stroke preview
      const allPoints = [...currentPoints, point];
      if (allPoints.length >= 2) {
        ctx.strokeStyle = color;
        ctx.lineWidth = thickness;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(allPoints[0].x, allPoints[0].y);
        for (let i = 1; i < allPoints.length; i++) {
          ctx.lineTo(allPoints[i].x, allPoints[i].y);
        }
        ctx.stroke();
      }
      
      ctx.restore();
    }
  }, [isPanning, isDrawing, tool, getPointerPosition, canvasRef, baseBitmap, strokes, currentPoints, color, thickness, transform, displaySize]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (isPanning) {
      setIsPanning(false);
      lastPanPoint.current = null;
      return;
    }
    
    if (!isDrawing || !startPoint) return;

    const endPoint = getPointerPosition(e);
    let stroke: Stroke;

    switch (tool) {
      case 'freehand': {
        const points = [...currentPoints, endPoint];
        stroke = {
          id: generateStrokeId(),
          type: 'freehand',
          color,
          thickness,
          points,
          decimatedPoints: decimatePoints(points),
          timestamp: Date.now(),
        };
        break;
      }
      case 'arrow':
        stroke = {
          id: generateStrokeId(),
          type: 'arrow',
          color,
          thickness,
          points: [startPoint, endPoint],
          startPoint,
          endPoint,
          timestamp: Date.now(),
        };
        break;
      case 'circle':
        stroke = {
          id: generateStrokeId(),
          type: 'circle',
          color,
          thickness,
          points: [startPoint, endPoint],
          startPoint,
          endPoint,
          timestamp: Date.now(),
        };
        break;
      case 'line':
        stroke = {
          id: generateStrokeId(),
          type: 'line',
          color,
          thickness,
          points: [startPoint, endPoint],
          startPoint,
          endPoint,
          timestamp: Date.now(),
        };
        break;
      case 'text': {
        const text = prompt('Enter text:');
        if (!text) {
          setIsDrawing(false);
          setStartPoint(null);
          setCurrentPoints([]);
          return;
        }
        stroke = {
          id: generateStrokeId(),
          type: 'text',
          color,
          thickness,
          points: [startPoint],
          startPoint,
          text,
          fontSize: 16,
          timestamp: Date.now(),
        };
        break;
      }
      default:
        setIsDrawing(false);
        setStartPoint(null);
        setCurrentPoints([]);
        return;
    }

    onStrokeComplete(stroke);
    setIsDrawing(false);
    setStartPoint(null);
    setCurrentPoints([]);
  }, [isPanning, isDrawing, startPoint, tool, color, thickness, currentPoints, getPointerPosition, onStrokeComplete]);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    setTransform(prev => ({
      ...prev,
      scale: Math.min(4, prev.scale * 1.5),
    }));
  }, []);

  const handleZoomOut = useCallback(() => {
    setTransform(prev => ({
      ...prev,
      scale: Math.max(0.5, prev.scale / 1.5),
    }));
  }, []);

  const handleResetZoom = useCallback(() => {
    setTransform({ scale: 1, offsetX: 0, offsetY: 0 });
  }, []);

  return (
    <div ref={containerRef} className="relative max-w-full max-h-full">
      {/* Zoom Controls */}
      <div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
        <button
          onClick={handleZoomIn}
          className="w-9 h-9 rounded-lg bg-black/60 backdrop-blur text-white flex items-center justify-center hover:bg-black/80 transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <button
          onClick={handleZoomOut}
          className="w-9 h-9 rounded-lg bg-black/60 backdrop-blur text-white flex items-center justify-center hover:bg-black/80 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <button
          onClick={() => setPanMode(!panMode)}
          className={`w-9 h-9 rounded-lg backdrop-blur text-white flex items-center justify-center transition-colors ${
            panMode ? 'bg-primary/80' : 'bg-black/60 hover:bg-black/80'
          }`}
          title="Pan Mode"
        >
          <Move className="w-5 h-5" />
        </button>
        {transform.scale !== 1 && (
          <button
            onClick={handleResetZoom}
            className="w-9 h-9 rounded-lg bg-black/60 backdrop-blur text-white text-xs font-bold flex items-center justify-center hover:bg-black/80 transition-colors"
            title="Reset Zoom"
          >
            {Math.round(transform.scale * 100)}%
          </button>
        )}
      </div>
      
      <canvas
        ref={canvasRef}
        className={`touch-none max-w-full rounded-lg ${panMode ? 'cursor-grab' : 'cursor-crosshair'}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onContextMenu={(e) => e.preventDefault()}
      />
      
      {/* Pan hint */}
      {transform.scale > 1 && !panMode && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/60 backdrop-blur text-white text-xs">
          Pinch or use Move button to pan
        </div>
      )}
    </div>
  );
}
