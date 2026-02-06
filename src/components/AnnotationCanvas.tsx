import { useEffect, useRef, useState } from 'react';
import {
  drawArrow,
  drawCircle,
  drawLine,
  drawFreehand,
  getCanvasCoordinates,
  resizeCanvasForDevice,
  AnnotationPoint,
} from '@/lib/annotationUtils';

interface AnnotationCanvasProps {
  imageUrl: string;
  tool: string;
  color: string;
  thickness: number;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  onDraw: () => void;
}

export function AnnotationCanvas({
  imageUrl,
  tool,
  color,
  thickness,
  canvasRef,
  onDraw,
}: AnnotationCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<AnnotationPoint | null>(null);
  const [freehandPoints, setFreehandPoints] = useState<AnnotationPoint[]>([]);
  const [originalImageData, setOriginalImageData] = useState<ImageData | null>(null);

  // Initialize canvas with image
  useEffect(() => {
    if (!canvasRef.current || !imageUrl) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // Set canvas size to match image
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw image
      ctx.drawImage(img, 0, 0);

      // Save original image data for redraw
      setOriginalImageData(ctx.getImageData(0, 0, canvas.width, canvas.height));
    };
    img.src = imageUrl;
  }, [imageUrl, canvasRef]);

  // Resize canvas for responsive display
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const handleResize = () => {
      if (canvasRef.current && containerRef.current && originalImageData) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Restore original image
        ctx.putImageData(originalImageData, 0, 0);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [originalImageData]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    setIsDrawing(true);
    const point = getCanvasCoordinates(e.nativeEvent, canvasRef.current);
    setStartPoint(point);

    if (tool === 'freehand') {
      setFreehandPoints([point]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx || !originalImageData) return;

    const currentPoint = getCanvasCoordinates(e.nativeEvent, canvas);

    // Redraw original image
    ctx.putImageData(originalImageData, 0, 0);

    if (tool === 'freehand' && startPoint) {
      const newPoints = [...freehandPoints, currentPoint];
      setFreehandPoints(newPoints);
      drawFreehand(ctx, newPoints, color, thickness);
    } else if (tool === 'arrow' && startPoint) {
      drawArrow(ctx, startPoint.x, startPoint.y, currentPoint.x, currentPoint.y, color, thickness);
    } else if (tool === 'circle' && startPoint) {
      const radius = Math.sqrt(
        Math.pow(currentPoint.x - startPoint.x, 2) + Math.pow(currentPoint.y - startPoint.y, 2)
      );
      drawCircle(ctx, startPoint.x, startPoint.y, radius, color, thickness);
    } else if (tool === 'line' && startPoint) {
      drawLine(ctx, startPoint.x, startPoint.y, currentPoint.x, currentPoint.y, color, thickness);
    }
  };

  const handleMouseUp = () => {
    if (!canvasRef.current) return;

    setIsDrawing(false);
    setFreehandPoints([]);
    setStartPoint(null);

    // Save current canvas state
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      setOriginalImageData(ctx.getImageData(0, 0, canvas.width, canvas.height));
    }

    onDraw();
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    setIsDrawing(true);
    const point = getCanvasCoordinates(e.nativeEvent as any, canvasRef.current);
    setStartPoint(point);

    if (tool === 'freehand') {
      setFreehandPoints([point]);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !isDrawing) return;

    e.preventDefault();

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx || !originalImageData) return;

    const currentPoint = getCanvasCoordinates(e.nativeEvent as any, canvas);

    // Redraw original image
    ctx.putImageData(originalImageData, 0, 0);

    if (tool === 'freehand' && startPoint) {
      const newPoints = [...freehandPoints, currentPoint];
      setFreehandPoints(newPoints);
      drawFreehand(ctx, newPoints, color, thickness);
    } else if (tool === 'arrow' && startPoint) {
      drawArrow(ctx, startPoint.x, startPoint.y, currentPoint.x, currentPoint.y, color, thickness);
    } else if (tool === 'circle' && startPoint) {
      const radius = Math.sqrt(
        Math.pow(currentPoint.x - startPoint.x, 2) + Math.pow(currentPoint.y - startPoint.y, 2)
      );
      drawCircle(ctx, startPoint.x, startPoint.y, radius, color, thickness);
    } else if (tool === 'line' && startPoint) {
      drawLine(ctx, startPoint.x, startPoint.y, currentPoint.x, currentPoint.y, color, thickness);
    }
  };

  const handleTouchEnd = () => {
    if (!canvasRef.current) return;

    setIsDrawing(false);
    setFreehandPoints([]);
    setStartPoint(null);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      setOriginalImageData(ctx.getImageData(0, 0, canvas.width, canvas.height));
    }

    onDraw();
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full max-w-4xl max-h-[70vh] bg-black rounded-lg overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="w-full h-full cursor-crosshair touch-none"
        style={{ display: 'block' }}
      />
    </div>
  );
}
