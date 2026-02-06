/**
 * Production-hardened stroke rendering engine
 * - Uses ImageBitmap for base (not ImageData)
 * - ctx.save()/restore() per stroke (prevents state bleed)
 * - Improved text rendering (font stack + pixel snapping)
 * - Deterministic rendering from JSON
 */

import { Stroke, Point } from './strokeTypes';

export type BaseImageSource = ImageBitmap | HTMLImageElement | HTMLCanvasElement | OffscreenCanvas;

export function renderStrokes(
  ctx: CanvasRenderingContext2D,
  strokes: Stroke[],
  options?: {
    scale?: number;
    offsetX?: number;
    offsetY?: number;
  }
) {
  const scale = options?.scale || 1;
  const offsetX = options?.offsetX || 0;
  const offsetY = options?.offsetY || 0;

  for (const stroke of strokes) {
    renderStroke(ctx, stroke, { scale, offsetX, offsetY });
  }
}

export function renderStroke(
  ctx: CanvasRenderingContext2D,
  stroke: Stroke,
  options?: {
    scale?: number;
    offsetX?: number;
    offsetY?: number;
  }
) {
  const scale = options?.scale ?? 1;
  const offsetX = options?.offsetX ?? 0;
  const offsetY = options?.offsetY ?? 0;

  ctx.save();
  try {
    // Reset common state that can bleed in from elsewhere
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.setLineDash([]);

    ctx.strokeStyle = stroke.color;
    ctx.fillStyle = stroke.color;
    ctx.lineWidth = stroke.thickness * scale;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    switch (stroke.type) {
      case 'freehand':
        renderFreehand(ctx, stroke.points, { scale, offsetX, offsetY });
        break;

      case 'arrow':
        if (stroke.startPoint && stroke.endPoint) {
          renderArrow(ctx, stroke.startPoint, stroke.endPoint, stroke.color, stroke.thickness * scale, {
            scale,
            offsetX,
            offsetY,
          });
        }
        break;

      case 'circle':
        if (stroke.startPoint && stroke.endPoint) {
          const dx = stroke.endPoint.x - stroke.startPoint.x;
          const dy = stroke.endPoint.y - stroke.startPoint.y;
          const radius = Math.sqrt(dx * dx + dy * dy);
          renderCircle(ctx, stroke.startPoint, radius, { scale, offsetX, offsetY });
        }
        break;

      case 'line':
        if (stroke.startPoint && stroke.endPoint) {
          renderLine(ctx, stroke.startPoint, stroke.endPoint, { scale, offsetX, offsetY });
        }
        break;

      case 'text':
        if (stroke.startPoint && stroke.text) {
          renderText(ctx, stroke.text, stroke.startPoint, stroke.fontSize || 16, {
            scale,
            offsetX,
            offsetY,
          });
        }
        break;
    }
  } finally {
    ctx.restore();
  }
}

function renderFreehand(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  options: { scale: number; offsetX: number; offsetY: number }
) {
  if (points.length < 2) return;

  ctx.beginPath();
  ctx.moveTo(points[0].x * options.scale + options.offsetX, points[0].y * options.scale + options.offsetY);

  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x * options.scale + options.offsetX, points[i].y * options.scale + options.offsetY);
  }

  ctx.stroke();
}

function renderArrow(
  ctx: CanvasRenderingContext2D,
  from: Point,
  to: Point,
  color: string,
  thickness: number,
  options: { scale: number; offsetX: number; offsetY: number }
) {
  const fromX = from.x * options.scale + options.offsetX;
  const fromY = from.y * options.scale + options.offsetY;
  const toX = to.x * options.scale + options.offsetX;
  const toY = to.y * options.scale + options.offsetY;

  const headlen = 15 * options.scale;
  const angle = Math.atan2(toY - fromY, toX - fromX);

  // Draw line
  ctx.strokeStyle = color;
  ctx.lineWidth = thickness;
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();

  // Draw arrowhead
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
}

function renderCircle(
  ctx: CanvasRenderingContext2D,
  center: Point,
  radius: number,
  options: { scale: number; offsetX: number; offsetY: number }
) {
  const centerX = center.x * options.scale + options.offsetX;
  const centerY = center.y * options.scale + options.offsetY;
  const scaledRadius = radius * options.scale;

  ctx.beginPath();
  ctx.arc(centerX, centerY, scaledRadius, 0, 2 * Math.PI);
  ctx.stroke();
}

function renderLine(
  ctx: CanvasRenderingContext2D,
  from: Point,
  to: Point,
  options: { scale: number; offsetX: number; offsetY: number }
) {
  const fromX = from.x * options.scale + options.offsetX;
  const fromY = from.y * options.scale + options.offsetY;
  const toX = to.x * options.scale + options.offsetX;
  const toY = to.y * options.scale + options.offsetY;

  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();
}

function renderText(
  ctx: CanvasRenderingContext2D,
  text: string,
  position: Point,
  fontSize: number,
  options: { scale: number; offsetX: number; offsetY: number }
) {
  // Pixel snapping: reduces blur on scaled export
  const x = Math.round(position.x * options.scale + options.offsetX);
  const y = Math.round(position.y * options.scale + options.offsetY);

  const scaledFontSize = fontSize * options.scale;

  // Use a consistent font stack across platforms (Android/Windows/iOS)
  ctx.font = `${scaledFontSize}px system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif`;
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';

  // Background box
  const metrics = ctx.measureText(text);
  const padding = 4 * options.scale;

  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(x - padding, y - padding, Math.ceil(metrics.width + padding * 2), Math.ceil(scaledFontSize + padding * 2));
  ctx.restore();

  // Text
  ctx.fillStyle = String(ctx.strokeStyle);
  ctx.fillText(text, x, y);
}

/**
 * Clear canvas
 */
export function clearCanvas(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

/**
 * Redraw canvas with base image and strokes (PRODUCTION VERSION)
 * Uses ImageBitmap instead of ImageData for better mobile performance
 */
export function redrawCanvas(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  base: BaseImageSource | null,
  strokes: Stroke[],
  options?: { scale?: number; offsetX?: number; offsetY?: number }
) {
  // Clear
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw base (FAST path using drawImage instead of putImageData)
  if (base) {
    // @ts-expect-error OffscreenCanvas may exist depending on TS lib
    ctx.drawImage(base as any, 0, 0, canvas.width, canvas.height);
  }

  // Draw strokes
  renderStrokes(ctx, strokes, options);
}

/**
 * Helper: Convert blob to ImageBitmap
 * Avoids decoding into JS-owned ImageData (better for mobile)
 */
export async function blobToImageBitmap(blob: Blob): Promise<ImageBitmap> {
  return await createImageBitmap(blob);
}
