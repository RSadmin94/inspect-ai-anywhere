import { MapPin, FileText, Menu, Download, Upload } from 'lucide-react';
import { InspectionRecord } from '@/lib/db';
import { ExportImportButtons } from './ExportImportButtons';

interface InspectionHeaderProps {
  inspection: InspectionRecord;
  onGenerateReport: () => void;
  onMenu: () => void;
  onImportComplete?: (inspectionId: string) => void;
  t: (key: string) => string;
}

export function InspectionHeader({ inspection, onGenerateReport, onMenu, onImportComplete, t }: InspectionHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-card border-b border-border">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <button 
          onClick={onMenu}
          className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-muted touch-target flex-shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <p className="font-medium truncate">{inspection.propertyAddress}</p>
          </div>
          {inspection.inspectorName && (
            <p className="text-sm text-muted-foreground truncate">{inspection.inspectorName}</p>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <ExportImportButtons 
          inspection={inspection} 
          onImportComplete={onImportComplete}
          t={t}
        />
        <button
          onClick={onGenerateReport}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-accent text-accent-foreground touch-target flex-shrink-0"
        >
          <FileText className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}