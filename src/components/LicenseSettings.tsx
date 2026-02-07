import { useState } from 'react';
import { useLicense } from '@/hooks/useLicense';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, AlertTriangle, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export function LicenseSettings() {
  const isOnline = useOnlineStatus();
  const {
    licenseState,
    isLoading,
    isVerifying,
    licenseKey,
    productId,
    deviceId,
    effectivePermissions,
    remainingGraceDays,
    isWithinGrace,
    setLicenseKey,
    setProductId,
    verifyLicense,
    resetDevices,
  } = useLicense();

  const [keyInput, setKeyInput] = useState(licenseKey);
  const [productInput, setProductInput] = useState(productId);

  const handleVerify = async () => {
    if (!isOnline) {
      toast.error('Internet connection required to verify license');
      return;
    }

    setLicenseKey(keyInput);
    setProductId(productInput);

    const result = await verifyLicense();
    
    if (result.valid) {
      toast.success('License verified successfully!');
    } else {
      toast.error(result.message || 'License verification failed');
    }
  };

  const handleReset = async () => {
    if (!isOnline) {
      toast.error('Internet connection required to reset devices');
      return;
    }

    const result = await resetDevices();
    
    if (result.valid) {
      toast.success('Device activations reset successfully!');
    } else {
      toast.error(result.message || 'Failed to reset devices');
    }
  };

  const getStatusBadge = () => {
    switch (licenseState.status) {
      case 'active':
        return <Badge className="bg-primary text-primary-foreground"><CheckCircle className="w-3 h-3 mr-1" /> Active</Badge>;
      case 'invalid':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Invalid</Badge>;
      case 'device_limit':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" /> Device Limit</Badge>;
      case 'error':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Error</Badge>;
      default:
        return <Badge variant="secondary">Inactive</Badge>;
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
          License Settings
          {isOnline ? (
            <Badge variant="outline" className="text-green-600"><Wifi className="w-3 h-3 mr-1" /> Online</Badge>
          ) : (
            <Badge variant="outline" className="text-yellow-600"><WifiOff className="w-3 h-3 mr-1" /> Offline</Badge>
          )}
        </CardTitle>
        <CardDescription>
          Enter your Gumroad license key to activate all features
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* License Status */}
        <div className="p-4 rounded-lg bg-muted/50 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status</span>
            {getStatusBadge()}
          </div>
          
          {licenseState.message && (
            <p className="text-sm text-muted-foreground">{licenseState.message}</p>
          )}

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Devices</span>
            <span>{licenseState.device.used} / {licenseState.device.allowed}</span>
          </div>

          {licenseState.valid && (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Create Inspections</span>
                <span>{effectivePermissions.allowCreateNew ? '✓' : '✗'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">AI Analysis</span>
                <span>{effectivePermissions.allowAI ? '✓' : '✗'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Export PDF</span>
                <span>✓ (Always available)</span>
              </div>
            </>
          )}

          {!isOnline && licenseState.valid && (
            <div className="pt-2 border-t border-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Offline Grace Period</span>
                <span className={isWithinGrace ? 'text-primary' : 'text-destructive'}>
                  {remainingGraceDays} days remaining
                </span>
              </div>
              {!isWithinGrace && (
                <p className="text-xs text-amber-600 mt-1">
                  Grace period expired. Connect to internet to re-verify license.
                </p>
              )}
            </div>
          )}
        </div>

        {/* License Input */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="productId">Product ID or Permalink</Label>
            <Input
              id="productId"
              value={productInput}
              onChange={(e) => setProductInput(e.target.value)}
              placeholder="e.g., abc123 or my-product"
              disabled={isVerifying}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="licenseKey">License Key</Label>
            <Input
              id="licenseKey"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="Enter your Gumroad license key"
              disabled={isVerifying}
              type="password"
            />
          </div>
        </div>

        {/* Device ID (read-only) */}
        <div className="space-y-2">
          <Label className="text-muted-foreground">Device ID</Label>
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
            disabled={!isOnline || isVerifying || !keyInput || !productInput}
            className="flex-1"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify License'
            )}
          </Button>

          {licenseState.status === 'device_limit' && (
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={!isOnline || isVerifying}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset Devices
            </Button>
          )}
        </div>

        {!isOnline && (
          <p className="text-xs text-muted-foreground text-center">
            Connect to the internet to verify or reset your license.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
