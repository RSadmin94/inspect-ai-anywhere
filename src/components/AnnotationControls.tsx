import { Undo2, Redo2, Trash2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';

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
  const { t } = useLanguage();
  return (
    <div className="bg-background border-t px-4 py-3 flex items-center justify-between gap-2">
      {/* Left side - Edit controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onUndo}
          disabled={!canUndo}
          title={t('undo')}
          className="flex items-center gap-1"
        >
          <Undo2 className="w-4 h-4" />
          <span className="hidden sm:inline">{t('undo')}</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onRedo}
          disabled={!canRedo}
          title={t('redo')}
          className="flex items-center gap-1"
        >
          <Redo2 className="w-4 h-4" />
          <span className="hidden sm:inline">{t('redo')}</span>
        </Button>

        <div className="w-px h-6 bg-border" />

        <Button
          variant="outline"
          size="sm"
          onClick={onClear}
          title={t('clearAllAnnotations')}
          className="flex items-center gap-1 text-destructive hover:text-destructive"
        >
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline">{t('clear')}</span>
        </Button>
      </div>

      {/* Right side - Action buttons */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          title={t('cancel')}
          className="flex items-center gap-1"
        >
          <X className="w-4 h-4" />
          <span className="hidden sm:inline">{t('cancel')}</span>
        </Button>

        <Button
          size="sm"
          onClick={onSave}
          disabled={isSaving}
          title={t('saveAnnotation')}
          className="flex items-center gap-1"
        >
          <Save className="w-4 h-4" />
          <span className="hidden sm:inline">{isSaving ? t('saving') : t('save')}</span>
        </Button>
      </div>
    </div>
  );
}
