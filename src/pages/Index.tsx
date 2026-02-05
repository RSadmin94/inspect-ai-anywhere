import { useState, useCallback } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useInspection } from '@/hooks/useInspection';
import { PhotoRecord } from '@/lib/db';
import { analyzePhoto, analyzeAllPending } from '@/lib/aiAnalysis';

import { NewInspectionForm } from '@/components/NewInspectionForm';
import { StatusBar } from '@/components/StatusBar';
import { InspectionHeader } from '@/components/InspectionHeader';
import { CameraCapture } from '@/components/CameraCapture';
import { PhotoGallery } from '@/components/PhotoGallery';
import { PhotoDetailPanel } from '@/components/PhotoDetailPanel';
import { ReportDialog } from '@/components/ReportDialog';
import { SideMenu } from '@/components/SideMenu';
import { toast } from 'sonner';

export default function Index() {
  const { language, toggleLanguage, t, isLoaded } = useLanguage();
  const isOnline = useOnlineStatus();
  const {
    inspection,
    photos,
    isLoading,
    startInspection,
    capturePhoto,
    updatePhoto,
    deletePhoto,
    updatePhotoWithAI,
    finishInspection,
    refreshPhotos,
  } = useInspection();

  const [selectedPhoto, setSelectedPhoto] = useState<PhotoRecord | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isAnalyzingAll, setIsAnalyzingAll] = useState(false);

  const pendingCount = photos.filter(p => p.aiStatus === 'pending_offline' || p.aiStatus === 'failed').length;

  const handleCapture = useCallback(async (blob: Blob) => {
    const newPhoto = await capturePhoto(blob);
    if (newPhoto) {
      toast.success(t('photoSaved'));
      
      // Auto-analyze if online
      if (isOnline && newPhoto) {
        try {
          await analyzePhoto(newPhoto.id);
          await refreshPhotos();
        } catch (e) {
          console.error('Auto-analysis failed:', e);
        }
      }
    }
  }, [capturePhoto, isOnline, t, refreshPhotos]);

  const handleSelectPhoto = useCallback((photo: PhotoRecord) => {
    setSelectedPhoto(photo);
  }, []);

  const handleUpdatePhoto = useCallback(async (photoId: string, updates: Partial<PhotoRecord>) => {
    await updatePhoto(photoId, updates);
    const updated = photos.find(p => p.id === photoId);
    if (updated) {
      setSelectedPhoto({ ...updated, ...updates });
    }
    toast.success(t('photoSaved'));
  }, [updatePhoto, photos, t]);

  const handleDeletePhoto = useCallback(async (photoId: string) => {
    await deletePhoto(photoId);
    toast.success(t('photoDeleted'));
  }, [deletePhoto, t]);

  const handleAnalyzePhoto = useCallback(async (photoId: string) => {
    if (!isOnline) return;
    
    try {
      await analyzePhoto(photoId);
      await refreshPhotos();
      const updated = photos.find(p => p.id === photoId);
      if (updated) {
        setSelectedPhoto(null);
        setTimeout(() => {
          const refreshed = photos.find(p => p.id === photoId);
          if (refreshed) setSelectedPhoto(refreshed);
        }, 100);
      }
    } catch (e) {
      toast.error(t('analysisFailed'));
    }
  }, [isOnline, refreshPhotos, photos, t]);

  const handleAnalyzeAllPending = useCallback(async () => {
    if (!isOnline || isAnalyzingAll) return;
    
    setIsAnalyzingAll(true);
    setShowMenu(false);
    
    try {
      await analyzeAllPending(photos, (completed, total) => {
        toast.info(`Analyzing ${completed}/${total}...`);
      });
      await refreshPhotos();
      toast.success('All photos analyzed');
    } catch (e) {
      toast.error(t('analysisFailed'));
    }
    
    setIsAnalyzingAll(false);
  }, [isOnline, isAnalyzingAll, photos, refreshPhotos, t]);

  const handleNewInspection = useCallback(() => {
    setShowMenu(false);
    // For now, just reload - in a full app you'd have inspection history
    window.location.reload();
  }, []);

  const handleFinish = useCallback(async () => {
    await finishInspection();
    setShowMenu(false);
    setShowReport(true);
  }, [finishInspection]);

  // Loading state
  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // No active inspection - show form
  if (!inspection) {
    return <NewInspectionForm onStart={startInspection} t={t} />;
  }

  // Main inspection view
  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <StatusBar 
        isOnline={isOnline}
        photoCount={photos.length}
        language={language}
        onToggleLanguage={toggleLanguage}
        t={t}
      />
      
      <InspectionHeader 
        inspection={inspection}
        onGenerateReport={() => setShowReport(true)}
        onMenu={() => setShowMenu(true)}
        t={t}
      />

      <CameraCapture onCapture={handleCapture} t={t} />

      <div className="bg-card border-t border-border">
        <PhotoGallery 
          photos={photos}
          selectedPhotoId={selectedPhoto?.id || null}
          onSelectPhoto={handleSelectPhoto}
          t={t}
        />
      </div>

      <PhotoDetailPanel
        photo={selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
        onUpdate={handleUpdatePhoto}
        onDelete={handleDeletePhoto}
        onAnalyze={isOnline ? handleAnalyzePhoto : undefined}
        language={language}
        t={t}
        isOnline={isOnline}
      />

      <ReportDialog
        isOpen={showReport}
        onClose={() => setShowReport(false)}
        inspection={inspection}
        photos={photos}
        t={t}
      />

      <SideMenu
        isOpen={showMenu}
        onClose={() => setShowMenu(false)}
        inspection={inspection}
        pendingCount={pendingCount}
        onNewInspection={handleNewInspection}
        onAnalyzePending={handleAnalyzeAllPending}
        onFinish={handleFinish}
        t={t}
        isOnline={isOnline}
      />
    </div>
  );
}
