import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Zap,
  BarChart3,
  Plus,
  Camera,
  Upload,
  Download,
  Loader2,
} from 'lucide-react';
import { DropZone } from './DropZone';
import { cn } from '@/lib/utils';
import logoImage from '@/assets/logo.png';
import { importInspection, exportInspection, getExportFilename, downloadBlob } from '@/lib/exportImport';
import { toast } from 'sonner';
import { InspectionRecord } from '@/lib/db';

interface DashboardHubProps {
  photoCount: number;
  inspection?: InspectionRecord | null;
  onCreateInspection: () => void;
  onFilesSelected: (files: File[]) => void;
  onViewPhotos?: () => void;
  onViewReports?: () => void;
  onImportComplete?: (inspectionId: string) => void;
  t: (key: string) => string;
}
 
export function DashboardHub({
  photoCount,
  inspection,
  onCreateInspection,
  onFilesSelected,
  onViewPhotos,
  onViewReports,
  onImportComplete,
  t,
}: DashboardHubProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    if (!inspection) {
      toast.error('No inspection to export');
      return;
    }

    setIsExporting(true);
    try {
      const zipBlob = await exportInspection(inspection.id);
      const filename = getExportFilename(inspection);
      downloadBlob(zipBlob, filename);
      toast.success('Inspection exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export inspection');
    }
    setIsExporting(false);
  };

  const handleImportClick = () => {
    importInputRef.current?.click();
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.zip')) {
      toast.error('Please select a .zip file');
      return;
    }

    setIsImporting(true);
    try {
      const result = await importInspection(file);
      
      if (result.success) {
        toast.success(
          `Imported ${result.photosImported} photos` + 
          (result.photosSkipped > 0 ? ` (${result.photosSkipped} skipped)` : '')
        );
        if (result.inspectionId && onImportComplete) {
          onImportComplete(result.inspectionId);
        }
      } else {
        toast.error(`Import failed: ${result.errors[0] || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Import failed:', error);
      toast.error('Failed to import inspection');
    }
    setIsImporting(false);
    
    if (importInputRef.current) {
      importInputRef.current.value = '';
    }
  };

  const stats = [
    {
      label: 'Photos Captured',
      value: photoCount,
      icon: Camera,
      colorClass: 'text-primary',
      bgClass: 'bg-primary/10 border-primary/30',
    },
    {
      label: 'Reports Ready',
      value: photoCount > 0 ? '1' : '0',
      icon: BarChart3,
      colorClass: 'text-primary',
      bgClass: 'bg-primary/10 border-primary/30',
    },
  ];
 
   const containerVariants = {
     hidden: { opacity: 0 },
     visible: {
       opacity: 1,
       transition: {
         staggerChildren: 0.1,
         delayChildren: 0.2,
       },
     },
   };
 
   const itemVariants = {
     hidden: { opacity: 0, y: 20 },
     visible: {
       opacity: 1,
       y: 0,
       transition: { duration: 0.4 },
     },
   };
 
   return (
     <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-8">
       {/* Header */}
       <motion.div
         initial={{ opacity: 0, y: -20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.5 }}
         className="mb-12"
       >
         <div className="flex items-center gap-3 mb-2">
          <img src={logoImage} alt="365 InspectAI" className="w-20 h-20 object-contain" />
           <h1 className="text-4xl font-bold text-foreground">Dashboard</h1>
         </div>
         <p className="text-muted-foreground">Welcome to 365 InspectAI Pro</p>
       </motion.div>
 
      {/* Stats and Actions Row */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col lg:flex-row gap-6 mb-12"
      >
        {/* Left: Photo Stats */}
        <div className="flex-1 grid grid-cols-2 gap-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            const isPhotosClickable = stat.label === 'Photos Captured' && photoCount > 0 && onViewPhotos;
            const isReportsClickable = stat.label === 'Reports Ready' && photoCount > 0 && onViewReports;
            const isClickable = isPhotosClickable || isReportsClickable;
            const handleClick = isPhotosClickable ? onViewPhotos : isReportsClickable ? onViewReports : undefined;
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                onClick={handleClick}
                className={cn(
                  "group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:shadow-lg card-gradient border border-border/10",
                  isClickable && "cursor-pointer"
                )}
              >
                {/* Hover glow */}
                <div className={cn(
                  "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300",
                  stat.colorClass === 'text-primary' 
                    ? 'bg-gradient-to-br from-primary to-transparent'
                    : 'bg-gradient-to-br from-accent to-transparent'
                )} />

                {/* Content */}
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center border",
                      stat.bgClass
                    )}>
                      <Icon size={24} className={stat.colorClass} />
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm mb-2">{stat.label}</p>
                  <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Right: Import/Export */}
        <div className="flex-1 grid grid-cols-2 gap-4">
          {/* Export Inspection Card */}
          <motion.div
            variants={itemVariants}
            onClick={inspection ? handleExport : undefined}
            className={cn(
              "group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:shadow-lg card-gradient border border-border/10",
              inspection ? "cursor-pointer" : "opacity-50 cursor-not-allowed"
            )}
          >
            <div className={cn(
              "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300",
              "bg-gradient-to-br from-primary to-transparent"
            )} />

            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center border bg-primary/10 border-primary/30">
                  {isExporting ? (
                    <Loader2 size={24} className="text-primary animate-spin" />
                  ) : (
                    <Download size={24} className="text-primary" />
                  )}
                </div>
              </div>
              <p className="text-muted-foreground text-sm mb-2">
                {isExporting ? 'Exporting...' : 'Export'}
              </p>
              <p className="text-xl font-bold text-foreground">
                {inspection ? 'Save .zip' : 'No Data'}
              </p>
            </div>
          </motion.div>

          {/* Import Inspection Card */}
          <motion.div
            variants={itemVariants}
            onClick={handleImportClick}
            className="group cursor-pointer relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:shadow-lg card-gradient border border-border/10"
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 bg-gradient-to-br from-accent to-transparent" />

            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center border bg-accent/10 border-accent/30">
                  {isImporting ? (
                    <Loader2 size={24} className="text-accent animate-spin" />
                  ) : (
                    <Upload size={24} className="text-accent" />
                  )}
                </div>
              </div>
              <p className="text-muted-foreground text-sm mb-2">
                {isImporting ? 'Importing...' : 'Import'}
              </p>
              <p className="text-xl font-bold text-foreground">Load .zip</p>
            </div>
            
            <input
              ref={importInputRef}
              type="file"
              accept=".zip"
              onChange={handleImportFile}
              className="hidden"
            />
          </motion.div>
        </div>
      </motion.div>
 
        {/* Main Actions Section */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        >
          {/* Create Inspection Card */}
          <motion.div
            variants={itemVariants}
            onClick={onCreateInspection}
            className="group cursor-pointer relative overflow-hidden rounded-3xl p-6 transition-all duration-300 hover:shadow-2xl bg-primary/20 border-2 border-primary/30"
          >
            {/* Animated background */}
            <motion.div
              animate={{
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--primary)/0.2)_0%,transparent_70%)]"
            />

            <div className="relative z-10 flex flex-col items-center justify-center text-center h-full gap-4">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 90 }}
                transition={{ duration: 0.3 }}
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center btn-gradient">
                  <Plus size={28} className="text-primary-foreground" />
                </div>
              </motion.div>
              <div>
                <p className="text-lg font-semibold text-foreground">{t('newInspection')}</p>
                <p className="text-sm text-muted-foreground mt-1">Start a new property audit</p>
              </div>
            </div>
          </motion.div>

          {/* Drop Zone */}
          <motion.div
            variants={itemVariants}
            className="md:col-span-2"
          >
            <DropZone onFilesSelected={onFilesSelected} />
          </motion.div>
        </motion.div>
 
       {/* Features Section */}
       <motion.div
         variants={containerVariants}
         initial="hidden"
         animate="visible"
         className="grid grid-cols-1 md:grid-cols-3 gap-6"
       >
         {[
           {
             title: 'AI-Powered Analysis',
             description: 'AI detects defects and issues from photos automatically',
             icon: Zap,
           },
           {
             title: 'Offline-First Design',
             description: 'Work without internet, sync when connected',
             icon: FileText,
           },
           {
             title: 'Professional Reports',
             description: 'Generate PDF reports with findings and recommendations',
             icon: BarChart3,
           },
         ].map((feature, index) => {
           const Icon = feature.icon;
           return (
             <motion.div
               key={index}
               variants={itemVariants}
               className="relative overflow-hidden rounded-2xl p-6 card-gradient border border-border/10"
             >
               <div className="relative z-10">
                 <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 bg-primary/15">
                   <Icon size={24} className="text-primary" />
                 </div>
                 <h3 className="text-lg font-semibold text-foreground mb-2">
                   {feature.title}
                 </h3>
                 <p className="text-sm text-muted-foreground">{feature.description}</p>
               </div>
             </motion.div>
           );
         })}
       </motion.div>
     </div>
   );
 }