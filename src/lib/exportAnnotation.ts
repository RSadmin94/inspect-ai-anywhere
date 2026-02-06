/**
 * Export annotated image at full resolution
 * Handles DPR correctly and maintains scale consistency
 */

import { Stroke } from './strokeTypes';
import { renderStrokes } from './strokeRenderer';

export interface ExportOptions {
  fullResWidth: number;
  fullResHeight: number;
  editCssWidth: number;
  editCssHeight: number;
  offsetX?: number;
  offsetY?: number;
}

/**
 * Export annotated image at full resolution
 * 
 * Key points:
 * - Editing canvas: CSS coordinates (1024x768)
 * - Export canvas: Physical pixels (full resolution)
 * - Scale factor: fullResWidth / editCssWidth
 * - Offsets scaled consistently
 */
export async function exportAnnotatedImage(
  baseBlob: Blob,
  strokes: Stroke[],
  options: ExportOptions
): Promise<Blob> {
  const {
    fullResWidth,
    fullResHeight,
    editCssWidth,
    editCssHeight,
    offsetX = 0,
    offsetY = 0,
  } = options;

  // Create off-screen canvas at full resolution
  const canvas = new OffscreenCanvas(fullResWidth, fullResHeight);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  // Load base image
  const baseBitmap = await createImageBitmap(baseBlob);

  try {
    // Draw base image at full resolution
    // NO DPR transform needed - we're drawing at physical pixels directly
    ctx.drawImage(baseBitmap, 0, 0, fullResWidth, fullResHeight);

    // Calculate scale from edit space to export space
    const scale = fullResWidth / editCssWidth;

    // Scale offsets consistently
    const scaledOffsetX = offsetX * scale;
    const scaledOffsetY = offsetY * scale;

    // Render strokes at full resolution with proper scaling
    renderStrokes(ctx, strokes, {
      scale,
      offsetX: scaledOffsetX,
      offsetY: scaledOffsetY,
    });

    // Convert canvas to blob
    const blob = await canvas.convertToBlob({ type: 'image/png' });
    return blob;
  } finally {
    baseBitmap.close();
  }
}

/**
 * Verify corner dots are aligned (for testing)
 * Place dots at corners and center, export, verify alignment
 */
export async function createTestImage(
  width: number,
  height: number
): Promise<Blob> {
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  // White background
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, width, height);

  // Draw corner dots (red)
  ctx.fillStyle = 'red';
  const dotSize = Math.max(2, width / 200); // Scale with image size

  // Top-left
  ctx.fillRect(0, 0, dotSize, dotSize);
  // Top-right
  ctx.fillRect(width - dotSize, 0, dotSize, dotSize);
  // Bottom-left
  ctx.fillRect(0, height - dotSize, dotSize, dotSize);
  // Bottom-right
  ctx.fillRect(width - dotSize, height - dotSize, dotSize, dotSize);
  // Center
  ctx.fillRect(width / 2 - dotSize / 2, height / 2 - dotSize / 2, dotSize, dotSize);

  return await canvas.convertToBlob({ type: 'image/png' });
}
