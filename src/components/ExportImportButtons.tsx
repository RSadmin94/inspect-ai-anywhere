import { useState, useRef } from 'react';
import { Download, Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InspectionRecord } from '@/lib/db';
import { exportInspection, getExportFilename, importInspection, downloadBlob } from '@/lib/exportImport';
import { toast } from 'sonner';

interface ExportImportButtonsProps {
  inspection?: InspectionRecord | null;
  onImportComplete?: (inspectionId: string) => void;
  t: (key: string) => string;
}

export function ExportImportButtons({ inspection, onImportComplete, t }: ExportImportButtonsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex gap-2">
      {inspection && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={isExporting}
          className="flex items-center gap-2"
        >
          {isExporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          Export
        </Button>
      )}
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleImportClick}
        disabled={isImporting}
        className="flex items-center gap-2"
      >
        {isImporting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Upload className="w-4 h-4" />
        )}
        Import
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".zip"
        onChange={handleFileSelected}
        className="hidden"
      />
    </div>
  );
}
