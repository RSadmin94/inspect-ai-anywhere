import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Stroke } from '../lib/strokeTypes';
import { renderStrokes } from '../lib/strokeRenderer';
import { safeCloseBitmap } from '../lib/bitmapUtils';

type Props = {
  // Adjust these to match your app:
  photoBlob: Blob | null; // original photo blob
  strokes: Stroke[];
  setStrokes: (s: Stroke[]) => void;

  // Canvas sizing (editing canvas target size)
  editWidth?: number;  // default 1024
  editHeight?: number; // default 768

  // If your UI has panning/offsets; otherwise keep 0
  offsetX?: number;
  offsetY?: number;
};

export default function AnnotationCanvas({
  photoBlob,
  strokes,
  setStrokes,
  editWidth = 1024,
  editHeight = 768,
  offsetX = 0,
  offsetY = 0,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [baseBitmap, setBaseBitmap] = useState<ImageBitmap | null>(null);

  // Create ImageBitmap from the photo blob (fast, low-memory vs ImageData)
  useEffect(() => {
    let cancelled = false;

    async function loadBaseBitmap() {
      // cleanup any prior bitmap
      setBaseBitmap((prev) => {
        safeCloseBitmap(prev);
        return null;
      });

      if (!photoBlob) return;

      try {
        const bmp = await createImageBitmap(photoBlob);
        if (cancelled) {
          safeCloseBitmap(bmp);
          return;
        }
        setBaseBitmap(bmp);
      } catch (e) {
        console.error('Failed to create ImageBitmap from photo blob', e);
      }
    }

    loadBaseBitmap();

    return () => {
      cancelled = true;
      // ensure bitmap memory is released on unmount/change
      setBaseBitmap((prev) => {
        safeCloseBitmap(prev);
        return null;
      });
    };
  }, [photoBlob]);

  // Render base + strokes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas internal resolution with DPR
    // IMPORTANT: canvas.width/height are in physical pixels
    // All drawing uses CSS coordinates (0..editWidth, 0..editHeight)
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(editWidth * dpr);
    canvas.height = Math.round(editHeight * dpr);
    canvas.style.width = `${editWidth}px`;
    canvas.style.height = `${editHeight}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Apply DPR transform once at start
    // This scales all subsequent drawing operations
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Clear in CSS coordinates
    ctx.clearRect(0, 0, editWidth, editHeight);

    // Draw base image (FAST path)
    // Use CSS coordinates, not physical pixels
    if (baseBitmap) {
      ctx.drawImage(baseBitmap, 0, 0, editWidth, editHeight);
    }

    // Draw strokes (scale=1 because we already drew base into edit space)
    renderStrokes(ctx, strokes, { scale: 1, offsetX, offsetY });
  }, [baseBitmap, strokes, editWidth, editHeight, offsetX, offsetY]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Ensure bitmap is closed when component unmounts
      setBaseBitmap((prev) => {
        safeCloseBitmap(prev);
        return null;
      });
    };
  }, []);

  // NOTE: Your pointer/touch handlers remain as-is (not shown here)
  // because this change only affects the base image memory model + redraw.

  return <canvas ref={canvasRef} className="w-full h-full touch-none" />;
}
