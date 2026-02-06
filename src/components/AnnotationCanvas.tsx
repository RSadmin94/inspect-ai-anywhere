import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Stroke, StrokeType, Point, generateStrokeId, decimatePoints } from '../lib/strokeTypes';
import { renderStrokes } from '../lib/strokeRenderer';
import { safeCloseBitmap } from '../lib/bitmapUtils';

interface Props {
  imageUrl: string;
  tool: StrokeType;
  color: string;
  thickness: number;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  onStrokeComplete: (stroke: Stroke) => void;
  strokes: Stroke[];
}

export function AnnotationCanvas({
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

  // Redraw canvas when strokes or base image change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !baseBitmap) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match image
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = canvas.parentElement?.clientWidth || 800;
    const aspectRatio = baseBitmap.height / baseBitmap.width;
    const displayHeight = displayWidth * aspectRatio;

    canvas.width = Math.round(displayWidth * dpr);
    canvas.height = Math.round(displayHeight * dpr);
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, displayWidth, displayHeight);
    ctx.drawImage(baseBitmap, 0, 0, displayWidth, displayHeight);

    renderStrokes(ctx, strokes, { scale: 1, offsetX: 0, offsetY: 0 });
  }, [baseBitmap, strokes, canvasRef]);

  const getPointerPosition = useCallback((e: React.PointerEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      pressure: e.pressure,
    };
  }, [canvasRef]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    const point = getPointerPosition(e);
    setIsDrawing(true);
    setStartPoint(point);
    setCurrentPoints([point]);
  }, [getPointerPosition]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
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
      const displayWidth = canvas.clientWidth;
      const displayHeight = canvas.clientHeight;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, displayWidth, displayHeight);
      ctx.drawImage(baseBitmap, 0, 0, displayWidth, displayHeight);
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
    }
  }, [isDrawing, tool, getPointerPosition, canvasRef, baseBitmap, strokes, currentPoints, color, thickness]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
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
  }, [isDrawing, startPoint, tool, color, thickness, currentPoints, getPointerPosition, onStrokeComplete]);

  return (
    <div ref={containerRef} className="relative max-w-full max-h-full">
      <canvas
        ref={canvasRef}
        className="touch-none cursor-crosshair max-w-full rounded-lg"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />
    </div>
  );
}

export default AnnotationCanvas;
