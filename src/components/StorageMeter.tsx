import { useState, useEffect } from 'react';
import { HardDrive, RefreshCw } from 'lucide-react';
import { calculateStorageUsage, formatBytes, StorageBreakdown } from '@/lib/storageUtils';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/hooks/useLanguage';

export function StorageMeter() {
  const { t } = useLanguage();
  const [storage, setStorage] = useState<StorageBreakdown | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadStorage = async () => {
    setIsLoading(true);
    try {
      const breakdown = await calculateStorageUsage();
      setStorage(breakdown);
    } catch (error) {
      console.error('Failed to calculate storage:', error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadStorage();
  }, []);

  // Calculate percentage of a 500MB assumed limit for visualization
  const assumedLimitMB = 500;
  const usagePercent = storage 
    ? Math.min(100, (storage.total / (assumedLimitMB * 1024 * 1024)) * 100)
    : 0;

  return (
    <div className="bg-muted/30 rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-primary" />
          <span className="font-medium">{t('storageUsage')}</span>
        </div>
        <button
          onClick={loadStorage}
          disabled={isLoading}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : storage ? (
        <>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t('usedEstimated')}</span>
              <span className="font-medium">{formatBytes(storage.total)}</span>
            </div>
            <Progress value={usagePercent} className="h-2" />
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t('photosFull')}</span>
              <span>{formatBytes(storage.photos)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t('thumbnails')}</span>
              <span>{formatBytes(storage.thumbnails)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t('annotatedImages')}</span>
              <span>{formatBytes(storage.annotated)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t('inspections')}</span>
              <span>{formatBytes(storage.inspections)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t('settingsAndOther')}</span>
              <span>{formatBytes(storage.settings + storage.other)}</span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground italic">
            {t('storageLocalNotice')}
          </p>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">{t('unableToCalculateStorage')}</p>
      )}
    </div>
  );
}
