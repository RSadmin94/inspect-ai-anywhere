/**
 * Safe bitmap close helper
 * Works across all browsers and handles missing close() gracefully
 */

export function safeCloseBitmap(bmp: ImageBitmap | null): void {
  if (bmp && typeof (bmp as any).close === 'function') {
    try {
      (bmp as any).close();
    } catch (e) {
      console.warn('Failed to close ImageBitmap:', e);
    }
  }
}
