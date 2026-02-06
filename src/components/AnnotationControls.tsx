import { Undo2, Redo2, Trash2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AnnotationControlsProps {
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onSave: () => void;
  onCancel: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isSaving?: boolean;
}

export function AnnotationControls({
  onUndo,
  onRedo,
  onClear,
  onSave,
  onCancel,
  canUndo,
  canRedo,
  isSaving = false,
}: AnnotationControlsProps) {
  return (
    <div className="bg-background border-t px-4 py-3 flex items-center justify-between gap-2">
      {/* Left side - Edit controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo"
          className="flex items-center gap-1"
        >
          <Undo2 className="w-4 h-4" />
          <span className="hidden sm:inline">Undo</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo"
          className="flex items-center gap-1"
        >
          <Redo2 className="w-4 h-4" />
          <span className="hidden sm:inline">Redo</span>
        </Button>

        <div className="w-px h-6 bg-border" />

        <Button
          variant="outline"
          size="sm"
          onClick={onClear}
          title="Clear all annotations"
          className="flex items-center gap-1 text-destructive hover:text-destructive"
        >
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline">Clear</span>
        </Button>
      </div>

      {/* Right side - Action buttons */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          title="Cancel"
          className="flex items-center gap-1"
        >
          <X className="w-4 h-4" />
          <span className="hidden sm:inline">Cancel</span>
        </Button>

        <Button
          size="sm"
          onClick={onSave}
          disabled={isSaving}
          title="Save annotation"
          className="flex items-center gap-1"
        >
          <Save className="w-4 h-4" />
          <span className="hidden sm:inline">{isSaving ? 'Saving...' : 'Save'}</span>
        </Button>
      </div>
    </div>
  );
}
