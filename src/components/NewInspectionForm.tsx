import { useState } from 'react';
import { MapPin, User, ArrowRight, Clipboard, Building, ChevronDown, FlaskConical, Loader2, X } from 'lucide-react';
import { InspectionType } from '@/lib/db';

interface NewInspectionFormProps {
  onStart: (address: string, inspectorName?: string, clientName?: string, inspectionType?: InspectionType) => Promise<unknown>;
  onLoadDemo?: () => Promise<void>;
  onClose?: () => void;
  t: (key: string) => string;
}

const INSPECTION_TYPES: InspectionType[] = ['pre_purchase', 'pre_listing', 'annual', 'insurance', 'new_construction', 'warranty', 'other'];

export function NewInspectionForm({ onStart, onLoadDemo, onClose, t }: NewInspectionFormProps) {
  const [address, setAddress] = useState('');
  const [inspectorName, setInspectorName] = useState('');
  const [clientName, setClientName] = useState('');
  const [inspectionType, setInspectionType] = useState<InspectionType>('pre_purchase');
  const [isStarting, setIsStarting] = useState(false);
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return;
    
    setIsStarting(true);
    await onStart(
      address.trim(), 
      inspectorName.trim() || undefined,
      clientName.trim() || undefined,
      inspectionType
    );
  };

  const handleLoadDemo = async () => {
    if (!onLoadDemo || isLoadingDemo) return;
    setIsLoadingDemo(true);
    await onLoadDemo();
    setIsLoadingDemo(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="safe-top px-6 pt-8 pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center">
              <Clipboard className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">365 InspectAI</h1>
              <p className="text-sm text-muted-foreground">{t('newInspection')}</p>
            </div>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 px-6 pb-safe-bottom">
        <div className="space-y-6">
          {/* Property Address */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              {t('propertyAddress')} *
            </label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder={t('enterAddress')}
                className="w-full h-14 pl-12 pr-4 rounded-xl border border-input bg-card text-base touch-target"
                required
              />
            </div>
          </div>

          {/* Client Name */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              {t('clientName')}
            </label>
            <div className="relative">
              <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                placeholder={t('enterClientName')}
                className="w-full h-14 pl-12 pr-4 rounded-xl border border-input bg-card text-base touch-target"
              />
            </div>
          </div>

          {/* Inspector Name */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              {t('inspectorName')}
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={inspectorName}
                onChange={e => setInspectorName(e.target.value)}
                placeholder={t('enterName')}
                className="w-full h-14 pl-12 pr-4 rounded-xl border border-input bg-card text-base touch-target"
              />
            </div>
          </div>

          {/* Inspection Type */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              {t('inspectionType')}
            </label>
            <div className="relative">
              <select
                value={inspectionType}
                onChange={e => setInspectionType(e.target.value as InspectionType)}
                className="w-full h-14 px-4 pr-10 rounded-xl border border-input bg-card text-base appearance-none touch-target"
              >
                {INSPECTION_TYPES.map(type => (
                  <option key={type} value={type}>{t(type)}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-auto pt-8 space-y-3">
          <button
            type="submit"
            disabled={!address.trim() || isStarting}
            className="w-full h-14 bg-primary text-primary-foreground rounded-xl font-semibold text-lg touch-target flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {t('startInspection')}
            <ArrowRight className="w-5 h-5" />
          </button>

          {onLoadDemo && (
            <button
              type="button"
              onClick={handleLoadDemo}
              disabled={isLoadingDemo}
              className="w-full h-12 bg-accent text-accent-foreground rounded-xl font-medium text-sm touch-target flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoadingDemo ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading demo...
                </>
              ) : (
                <>
                  <FlaskConical className="w-4 h-4" />
                  Load Demo Inspection (4 sample photos)
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}