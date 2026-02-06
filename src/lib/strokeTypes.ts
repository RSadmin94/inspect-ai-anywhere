/**
 * Stroke-based annotation system
 * Replaces ImageData snapshots with lightweight stroke history
 * Memory: 1KB per stroke vs 12MB per ImageData
 */

export interface Point {
  x: number;
  y: number;
  pressure?: number; // For stylus support
}

export type StrokeType = 'freehand' | 'arrow' | 'circle' | 'line' | 'text';

export interface Stroke {
  id: string;
  type: StrokeType;
  color: string;
  thickness: number;
  points: Point[];
  // For shapes (arrow, circle, line)
  startPoint?: Point;
  endPoint?: Point;
  // For text
  text?: string;
  fontSize?: number;
  // Metadata
  timestamp: number;
  // Optimization: decimated points for storage
  decimatedPoints?: Point[];
}

export interface AnnotationState {
  strokes: Stroke[];
  undoStack: Stroke[][];
  redoStack: Stroke[][];
}

/**
 * Decimate points to reduce storage
 * Removes points that don't significantly change the path
 * Reduces points by 50-80% with minimal visual difference
 */
export function decimatePoints(points: Point[], tolerance: number = 2): Point[] {
  if (points.length <= 2) return points;

  const decimated: Point[] = [points[0]];

  for (let i = 1; i < points.length - 1; i++) {
    const prev = decimated[decimated.length - 1];
    const curr = points[i];
    const next = points[i + 1];

    // Calculate distance from current point to line between prev and next
    const distance = pointToLineDistance(curr, prev, next);

    if (distance > tolerance) {
      decimated.push(curr);
    }
  }

  decimated.push(points[points.length - 1]);
  return decimated;
}

/**
 * Calculate perpendicular distance from point to line
 */
function pointToLineDistance(point: Point, lineStart: Point, lineEnd: Point): number {
  const A = point.x - lineStart.x;
  const B = point.y - lineStart.y;
  const C = lineEnd.x - lineStart.x;
  const D = lineEnd.y - lineStart.y;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  if (lenSq !== 0) param = dot / lenSq;

  let xx: number, yy: number;

  if (param < 0) {
    xx = lineStart.x;
    yy = lineStart.y;
  } else if (param > 1) {
    xx = lineEnd.x;
    yy = lineEnd.y;
  } else {
    xx = lineStart.x + param * C;
    yy = lineStart.y + param * D;
  }

  const dx = point.x - xx;
  const dy = point.y - yy;

  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Merge micro-strokes (very short strokes that are likely accidental)
 */
export function shouldMergeWithPrevious(stroke: Stroke, previousStroke: Stroke | null): boolean {
  if (!previousStroke) return false;
  if (stroke.type !== previousStroke.type) return false;
  if (stroke.color !== previousStroke.color) return false;
  if (stroke.thickness !== previousStroke.thickness) return false;

  // Merge if stroke is very short (< 5 points) and same tool
  if (stroke.points.length < 5) {
    // Check if close in time (within 500ms)
    if (stroke.timestamp - previousStroke.timestamp < 500) {
      return true;
    }
  }

  return false;
}

/**
 * Merge two freehand strokes
 */
export function mergeStrokes(stroke1: Stroke, stroke2: Stroke): Stroke {
  return {
    ...stroke1,
    points: [...stroke1.points, ...stroke2.points],
    timestamp: Math.max(stroke1.timestamp, stroke2.timestamp),
  };
}

/**
 * Create unique stroke ID
 */
export function generateStrokeId(): string {
  return `stroke_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Serialize stroke for storage
 */
export function serializeStroke(stroke: Stroke): string {
  return JSON.stringify({
    ...stroke,
    // Store decimated points instead of full points
    points: stroke.decimatedPoints || decimatePoints(stroke.points),
    decimatedPoints: undefined, // Don't double-store
  });
}

/**
 * Deserialize stroke from storage
 */
export function deserializeStroke(json: string): Stroke {
  const data = JSON.parse(json);
  return {
    ...data,
    // Points are already decimated from storage
    points: data.points,
  };
}

/**
 * Calculate approximate memory size of stroke
 */
export function estimateStrokeSize(stroke: Stroke): number {
  const pointsSize = stroke.points.length * 16; // ~16 bytes per point
  const overhead = 200; // metadata, strings, etc
  return pointsSize + overhead;
}
