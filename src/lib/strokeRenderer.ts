/**
 * Stroke rendering engine
 * Renders strokes from JSON to canvas
 * Used for both editing and exporting
 */

import { Stroke, Point } from './strokeTypes';

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
  const scale = options?.scale || 1;
  const offsetX = options?.offsetX || 0;
  const offsetY = options?.offsetY || 0;

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
        const radius = Math.sqrt(
          Math.pow(stroke.endPoint.x - stroke.startPoint.x, 2) +
            Math.pow(stroke.endPoint.y - stroke.startPoint.y, 2)
        );
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
  const x = position.x * options.scale + options.offsetX;
  const y = position.y * options.scale + options.offsetY;
  const scaledFontSize = fontSize * options.scale;

  ctx.fillStyle = ctx.strokeStyle;
  ctx.font = `${scaledFontSize}px Arial`;
  ctx.textBaseline = 'top';

  // Draw background
  const metrics = ctx.measureText(text);
  const padding = 4 * options.scale;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(x - padding, y - padding, metrics.width + padding * 2, scaledFontSize + padding * 2);

  // Draw text
  ctx.fillStyle = ctx.strokeStyle;
  ctx.fillText(text, x, y);
}

/**
 * Clear canvas
 */
export function clearCanvas(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

/**
 * Redraw canvas with base image and strokes
 */
export function redrawCanvas(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  baseImage: ImageData,
  strokes: Stroke[],
  options?: { scale?: number; offsetX?: number; offsetY?: number }
) {
  // Restore base image
  ctx.putImageData(baseImage, 0, 0);

  // Render all strokes
  renderStrokes(ctx, strokes, options);
}
