/**
 * Offline Sync Queue
 * Queues annotation saves when offline
 * Retries with exponential backoff when online
 * Simple, no Firebase complexity
 */

export interface SyncQueueItem {
  id: string;
  photoId: string;
  action: 'save_annotation';
  payload: {
    annotationData: string;
    annotatedImageBlob: Blob;
  };
  revision: number;  // ← Revision gating to prevent stale overwrites
  timestamp: number; // ← When this edit was made
  retries: number;
  createdAt: number;
  lastRetryAt?: number;
}

const QUEUE_STORE_NAME = 'annotation_sync_queue';
const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY_MS = 1000; // 1 second
const MAX_RETRY_DELAY_MS = 60000; // 1 minute

export class OfflineSyncQueue {
  private db: IDBDatabase | null = null;
  private isProcessing = false;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('inspect_ai_db', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = event => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(QUEUE_STORE_NAME)) {
          db.createObjectStore(QUEUE_STORE_NAME, { keyPath: 'id' });
        }
      };
    });
  }

  /**
   * Add item to sync queue
   */
  async enqueue(item: Omit<SyncQueueItem, 'id' | 'retries' | 'createdAt'>): Promise<string> {
    if (!this.db) await this.init();

    const id = `${item.photoId}_${item.timestamp}`;
    const queueItem: SyncQueueItem = {
      ...item,
      id,
      retries: 0,
      createdAt: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([QUEUE_STORE_NAME], 'readwrite');
      const store = tx.objectStore(QUEUE_STORE_NAME);
      const request = store.add(queueItem);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(id);
    });
  }

  /**
   * Get all queued items
   */
  async getQueue(): Promise<SyncQueueItem[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([QUEUE_STORE_NAME], 'readonly');
      const store = tx.objectStore(QUEUE_STORE_NAME);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  /**
   * Remove item from queue
   */
  async dequeue(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([QUEUE_STORE_NAME], 'readwrite');
      const store = tx.objectStore(QUEUE_STORE_NAME);
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Update retry count
   */
  async updateRetry(id: string, retries: number): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([QUEUE_STORE_NAME], 'readwrite');
      const store = tx.objectStore(QUEUE_STORE_NAME);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const item = getRequest.result;
        if (item) {
          item.retries = retries;
          item.lastRetryAt = Date.now();
          const updateRequest = store.put(item);
          updateRequest.onerror = () => reject(updateRequest.error);
          updateRequest.onsuccess = () => resolve();
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  /**
   * Process queue (retry failed items)
   * Includes revision gating to prevent stale overwrites
   */
  async processQueue(
    onSave: (photoId: string, data: string, blob: Blob, revision: number) => Promise<void>,
    getPhotoRevision?: (photoId: string) => Promise<number>
  ): Promise<void> {
    if (this.isProcessing) return;
    if (!navigator.onLine) return;

    this.isProcessing = true;

    try {
      const queue = await this.getQueue();

      for (const item of queue) {
        // Check if should retry
        const shouldRetry = this.shouldRetry(item);
        if (!shouldRetry) {
          // Max retries exceeded, remove from queue
          await this.dequeue(item.id);
          console.warn(`Sync failed for ${item.photoId} after ${MAX_RETRIES} retries`);
          continue;
        }

        try {
          // Revision gating: only apply if this is newer than or equal to what's stored
          // This prevents older edits from overwriting newer ones if queue drains out of order
          if (getPhotoRevision) {
            const currentRev = await getPhotoRevision(item.photoId);
            if (item.revision < currentRev) {
              // Stale item (older than what we already have). Drop it.
              await this.dequeue(item.id);
              console.log(`Skipped stale edit for photo ${item.photoId} (rev ${item.revision} < stored ${currentRev})`);
              continue;
            }
          }

          // Attempt to sync (only if revision is current or newer)
          await onSave(
            item.photoId,
            item.payload.annotationData,
            item.payload.annotatedImageBlob,
            item.revision
          );

          // Success - remove from queue
          await this.dequeue(item.id);
          console.log(`Synced annotation for photo ${item.photoId} (rev ${item.revision})`);
        } catch (error) {
          // Retry later
          await this.updateRetry(item.id, item.retries + 1);
          console.warn(`Sync retry ${item.retries + 1} for photo ${item.photoId}:`, error);
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Check if item should be retried
   */
  private shouldRetry(item: SyncQueueItem): boolean {
    if (item.retries >= MAX_RETRIES) return false;

    // Exponential backoff
    const delayMs = Math.min(
      INITIAL_RETRY_DELAY_MS * Math.pow(2, item.retries),
      MAX_RETRY_DELAY_MS
    );

    const lastRetry = item.lastRetryAt || item.createdAt;
    const timeSinceLastRetry = Date.now() - lastRetry;

    return timeSinceLastRetry >= delayMs;
  }

  /**
   * Get queue size
   */
  async getQueueSize(): Promise<number> {
    const queue = await this.getQueue();
    return queue.length;
  }

  /**
   * Clear entire queue (use with caution)
   */
  async clearQueue(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([QUEUE_STORE_NAME], 'readwrite');
      const store = tx.objectStore(QUEUE_STORE_NAME);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

// Singleton instance
let syncQueue: OfflineSyncQueue | null = null;

export async function getSyncQueue(): Promise<OfflineSyncQueue> {
  if (!syncQueue) {
    syncQueue = new OfflineSyncQueue();
    await syncQueue.init();
  }
  return syncQueue;
}

/**
 * Setup automatic sync when online
 * @param onSave Callback to save annotation (called with revision number)
 * @param getPhotoRevision Optional callback to get current stored revision (for revision gating)
 */
export function setupAutoSync(
  onSave: (photoId: string, data: string, blob: Blob, revision: number) => Promise<void>,
  getPhotoRevision?: (photoId: string) => Promise<number>
) {
  // Listen for online event
  window.addEventListener('online', async () => {
    console.log('Back online - processing sync queue');
    const queue = await getSyncQueue();
    await queue.processQueue(onSave, getPhotoRevision);
  });

  // Also process periodically (every 30 seconds when online)
  setInterval(async () => {
    if (navigator.onLine) {
      const queue = await getSyncQueue();
      await queue.processQueue(onSave, getPhotoRevision);
    }
  }, 30000);
}
