import { useState, useCallback } from 'react';
import { useEffect } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useInspection } from '@/hooks/useInspection';
import { PhotoRecord, InspectionType } from '@/lib/db';
import { analyzePhoto, analyzeAllPending } from '@/lib/aiAnalysis';
import { loadDemoInspection } from '@/lib/demoData';

import { NewInspectionForm } from '@/components/NewInspectionForm';
import { StatusBar } from '@/components/StatusBar';
import { InspectionHeader } from '@/components/InspectionHeader';
import { CameraCapture } from '@/components/CameraCapture';
import { PhotoGallery } from '@/components/PhotoGallery';
import { PhotoDetailPanel } from '@/components/PhotoDetailPanel';
import { ReportBuilder } from '@/components/ReportBuilder';
import { ReportReviewScreen } from '@/components/ReportReviewScreen';
import { QuickCaptureMode } from '@/components/QuickCaptureMode';
import { SideMenu } from '@/components/SideMenu';
import { AppSidebar } from '@/components/AppSidebar';
import { DashboardHub } from '@/components/DashboardHub';
import { RoomSelector } from '@/components/RoomSelector';
import { toast } from 'sonner';
import { seedDefaultData } from '@/lib/defaultData';

type Page = 'dashboard' | 'inspection' | 'reports' | 'settings';

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
    loadInspection,
    appendRoomNotes,
    clearRoomNotes,
    updateRoomNotes,
  } = useInspection();

  const [selectedPhoto, setSelectedPhoto] = useState<PhotoRecord | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isAnalyzingAll, setIsAnalyzingAll] = useState(false);
   const [showQuickCapture, setShowQuickCapture] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [showNewInspectionForm, setShowNewInspectionForm] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState('other');

  const handleDictation = useCallback(async (text: string, room: string) => {
    await appendRoomNotes(room, text);
    toast.success(`${t(room as any)}: "${text.slice(0, 25)}${text.length > 25 ? '...' : ''}"`);
  }, [appendRoomNotes, t]);

  const handleClearRoomNotes = useCallback(async (room: string) => {
    await clearRoomNotes(room);
    toast.success(`${t(room as any)} notes cleared`);
  }, [clearRoomNotes, t]);

  // Seed default data on first load
  useEffect(() => {
    seedDefaultData().catch(console.error);
  }, []);

  const pendingCount = photos.filter(p => p.aiStatus === 'pending_offline' || p.aiStatus === 'failed').length;

  const handleCapture = useCallback(async (blob: Blob) => {
     const newPhoto = await capturePhoto(blob, selectedRoom);
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
  }, [capturePhoto, isOnline, t, refreshPhotos, selectedRoom]);

   const handleQuickCapture = useCallback(async (blob: Blob, room: string) => {
     const newPhoto = await capturePhoto(blob, room);
     if (newPhoto) {
       toast.success(t('photoSaved'));
       
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
    setShowNewInspectionForm(true);
  }, []);

  const handleFinish = useCallback(async () => {
    await finishInspection();
    setShowMenu(false);
    setShowReport(true);
  }, [finishInspection]);

   const handleStartInspection = useCallback(async (
     address: string,
     inspectorName?: string,
     clientName?: string,
     inspectionType?: InspectionType
   ) => {
     return startInspection(address, inspectorName, clientName, inspectionType);
   }, [startInspection]);

  const handleFilesSelected = useCallback(async (files: File[]) => {
    if (!inspection) {
      toast.error('Please create an inspection first');
      return;
    }
    
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        const blob = new Blob([file], { type: file.type });
        await handleCapture(blob);
      }
    }
  }, [inspection, handleCapture]);

  const handlePageChange = useCallback((page: Page) => {
    if (page === 'reports') {
      setShowReport(true);
    } else {
      setCurrentPage(page);
    }
  }, []);

  const handleLoadDemo = useCallback(async () => {
    try {
      const { inspection: demoInspection } = await loadDemoInspection();
      await loadInspection(demoInspection.id);
      setShowNewInspectionForm(false);
      setCurrentPage('inspection');
      setShowReport(true); // Open report builder to show the demo
      toast.success('Demo inspection loaded with 4 sample photos!');
    } catch (e) {
      console.error('Failed to load demo:', e);
      toast.error('Failed to load demo inspection');
    }
  }, [loadInspection]);

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
  if (!inspection || showNewInspectionForm) {
    return (
      <NewInspectionForm 
        onStart={async (address, inspectorName, clientName, inspectionType) => {
          await handleStartInspection(address, inspectorName, clientName, inspectionType);
          setShowNewInspectionForm(false);
          setCurrentPage('inspection');
        }}
        onLoadDemo={handleLoadDemo}
        t={t} 
      />
    );
  }


  // Main inspection view
  return (
    <div className="h-screen flex bg-background overflow-hidden">
      {/* Sidebar */}
      <AppSidebar
        currentPage={currentPage}
        onPageChange={handlePageChange}
        onNewInspection={handleNewInspection}
        inspectionActive={!!inspection}
        inspection={inspection}
        t={t}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <StatusBar 
          isOnline={isOnline}
          photoCount={photos.length}
          language={language}
          onToggleLanguage={toggleLanguage}
          onGoToDashboard={() => setCurrentPage('dashboard')}
          t={t}
        />

        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          {currentPage === 'dashboard' && (
            <DashboardHub
              photoCount={photos.length}
              onCreateInspection={() => setCurrentPage('inspection')}
              onFilesSelected={handleFilesSelected}
              onViewPhotos={() => setCurrentPage('inspection')}
              t={t}
            />
          )}

          {currentPage === 'inspection' && (
            <div className="flex flex-col h-full">
              <InspectionHeader 
                inspection={inspection}
                onGenerateReport={() => setShowReport(true)}
                onMenu={() => setShowMenu(true)}
                t={t}
              />

              {/* Room Selector - Always Visible */}
              <div className="bg-card/80 backdrop-blur border-b border-border px-4 py-3 relative z-50">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                    {t('room')}:
                  </span>
                  <RoomSelector 
                    value={selectedRoom} 
                    onChange={setSelectedRoom} 
                    t={t} 
                    compact 
                  />
                </div>
              </div>

              <CameraCapture 
                onCapture={handleCapture} 
                t={t}
                language={language}
                onDictation={handleDictation}
                currentRoom={selectedRoom}
                roomNotes={inspection?.roomNotes || {}}
                onClearRoomNotes={handleClearRoomNotes}
              />

              <div className="bg-card border-t border-border">
                <div className="flex items-center justify-between px-4 py-2 border-b border-border">
                  <span className="text-sm font-medium text-muted-foreground">
                    {photos.filter(p => p.room === selectedRoom).length} {t('photos')}
                  </span>
                  <button
                    onClick={() => setShowQuickCapture(true)}
                    className="text-xs text-primary font-medium hover:underline"
                  >
                    {t('quickCapture')} ⚡
                  </button>
                </div>
                <PhotoGallery 
                  photos={photos.filter(p => p.room === selectedRoom)}
                  selectedPhotoId={selectedPhoto?.id || null}
                  onSelectPhoto={handleSelectPhoto}
                  t={t}
                />
              </div>
            </div>
          )}

          {currentPage === 'settings' && (
            <div className="p-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">Settings</h2>
              <p className="text-muted-foreground">AI and app settings coming soon.</p>
            </div>
          )}
        </div>

        {/* Panels and Modals */}
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

        <ReportBuilder
          isOpen={false}
          onClose={() => {}}
          inspection={inspection}
          photos={photos}
          language={language}
          t={t}
        />

        <ReportReviewScreen
          isOpen={showReport}
          onClose={() => setShowReport(false)}
          inspection={inspection}
          photos={photos}
          language={language}
          t={t}
          onUpdateRoomNotes={updateRoomNotes}
          onUpdatePhoto={handleUpdatePhoto}
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

        {showQuickCapture && (
          <QuickCaptureMode
            onCapture={handleQuickCapture}
            onClose={() => setShowQuickCapture(false)}
            t={t}
            language={language}
            onDictation={(text) => handleDictation(text, selectedRoom)}
            currentRoom={selectedRoom}
            roomNotes={inspection?.roomNotes || {}}
            onClearRoomNotes={handleClearRoomNotes}
          />
        )}
      </div>
    </div>
  );
}
