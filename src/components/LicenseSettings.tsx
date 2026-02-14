import { useState } from 'react';
import { useLicense } from '@/hooks/useLicense';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useLanguage } from '@/hooks/useLanguage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, AlertTriangle, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export function LicenseSettings() {
  const { t } = useLanguage();
  const isOnline = useOnlineStatus();
  const {
    licenseState,
    isLoading,
    isVerifying,
    licenseKey,
    deviceId,
    effectivePermissions,
    remainingGraceDays,
    isWithinGrace,
    setLicenseKey,
    verifyLicense,
    resetDevices,
  } = useLicense();

  const [keyInput, setKeyInput] = useState(licenseKey);

  const handleVerify = async () => {
    if (!isOnline) {
      toast.error(t('internetRequiredVerify'));
      return;
    }

    setLicenseKey(keyInput);

    const result = await verifyLicense();
    
    if (result.valid) {
      toast.success(t('licenseVerifiedSuccess'));
    } else {
      toast.error(result.message || t('licenseVerifyFailed'));
    }
  };

  const handleReset = async () => {
    if (!isOnline) {
      toast.error(t('internetRequiredReset'));
      return;
    }

    const result = await resetDevices();
    
    if (result.status === 'error' && result.message?.includes('30 days')) {
      // Cooldown denial - show warning with next available date
      toast.warning(result.message);
    } else if (result.valid || result.message?.includes('reset')) {
      toast.success(t('devicesResetVerifyAgain'));
      // Auto-verify after reset
      await verifyLicense();
    } else {
      toast.error(result.message || t('failedResetDevices'));
    }
  };

  const getStatusBadge = () => {
    switch (licenseState.status) {
      case 'active':
        return <Badge className="bg-primary text-primary-foreground"><CheckCircle className="w-3 h-3 mr-1" /> {t('active')}</Badge>;
      case 'invalid':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> {t('invalid')}</Badge>;
      case 'device_limit':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" /> {t('deviceLimit')}</Badge>;
      case 'error':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> {t('invalid')}</Badge>;
      default:
        return <Badge variant="secondary">{t('inactive')}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {t('licenseSettings')}
          {isOnline ? (
            <Badge variant="outline" className="text-green-600"><Wifi className="w-3 h-3 mr-1" /> {t('online')}</Badge>
          ) : (
            <Badge variant="outline" className="text-yellow-600"><WifiOff className="w-3 h-3 mr-1" /> {t('offline')}</Badge>
          )}
        </CardTitle>
        <CardDescription>
          {t('enterLicenseToActivate')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* License Status */}
        <div className="p-4 rounded-lg bg-muted/50 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t('status')}</span>
            {getStatusBadge()}
          </div>
          
          {licenseState.message && (
            <p className="text-sm text-muted-foreground">{licenseState.message}</p>
          )}

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t('devices')}</span>
            <span>{licenseState.device.used} / {licenseState.device.allowed}</span>
          </div>

          {licenseState.valid && (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t('createInspections')}</span>
                <span>{effectivePermissions.allowCreateNew ? '✓' : '✗'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t('aiStatus')}</span>
                <span>{effectivePermissions.allowAI ? '✓' : '✗'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t('exportPdfAlways')}</span>
                <span>{t('alwaysAvailable')}</span>
              </div>
            </>
          )}

          {!isOnline && licenseState.valid && (
            <div className="pt-2 border-t border-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t('offlineGracePeriod')}</span>
                <span className={isWithinGrace ? 'text-primary' : 'text-destructive'}>
                  {remainingGraceDays} {t('daysRemaining')}
                </span>
              </div>
              {!isWithinGrace && (
                <p className="text-xs text-amber-600 mt-1">
                  {t('graceExpiredNotice')}
                </p>
              )}
            </div>
          )}
        </div>

        {/* License Input */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="licenseKey">{t('licenseKeyLabel')}</Label>
            <Input
              id="licenseKey"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder={t('enterLicenseKey')}
              disabled={isVerifying}
              type="password"
            />
          </div>
        </div>

        {/* Device ID (read-only) */}
        <div className="space-y-2">
          <Label className="text-muted-foreground">{t('deviceId')}</Label>
          <Input
            value={deviceId}
            readOnly
            className="text-xs font-mono bg-muted"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={handleVerify}
            disabled={!isOnline || isVerifying || !keyInput}
            className="flex-1"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('verifyingLicense')}
              </>
            ) : (
              t('verifyLicense')
            )}
          </Button>

          {(licenseState.status === 'device_limit' || licenseState.valid) && (
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={!isOnline || isVerifying}
              title={t('resetDevicesTooltip')}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {t('resetDevices')}
            </Button>
          )}
        </div>

        {licenseState.status === 'device_limit' && (
          <p className="text-sm text-destructive text-center">
            {t('deviceLimitReachedNotice')}
          </p>
        )}

        {!isOnline && (
          <p className="text-xs text-muted-foreground text-center">
            {t('connectToVerify')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
