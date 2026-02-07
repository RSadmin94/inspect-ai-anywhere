import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  LicenseState, 
  LicenseVerifyRequest, 
  DEFAULT_LICENSE_STATE,
  getDeviceId,
  getEffectivePermissions,
  getRemainingGraceDays,
  isWithinGracePeriod,
} from '@/lib/license';
import {
  saveLicenseState,
  loadLicenseState,
  saveLicenseKey,
  loadLicenseKey,
} from '@/lib/licenseCache';
import { useOnlineStatus } from './useOnlineStatus';

interface UseLicenseReturn {
  licenseState: LicenseState;
  isLoading: boolean;
  isVerifying: boolean;
  licenseKey: string;
  deviceId: string;
  effectivePermissions: {
    allowCreateNew: boolean;
    allowAI: boolean;
    allowExport: boolean;
  };
  remainingGraceDays: number;
  isWithinGrace: boolean;
  setLicenseKey: (key: string) => void;
  verifyLicense: () => Promise<LicenseState>;
  resetDevices: () => Promise<LicenseState>;
}

export function useLicense(): UseLicenseReturn {
  const isOnline = useOnlineStatus();
  const [licenseState, setLicenseState] = useState<LicenseState>(DEFAULT_LICENSE_STATE);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [licenseKey, setLicenseKeyState] = useState('');
  const [deviceId] = useState(() => getDeviceId());

  // Load cached state on mount
  useEffect(() => {
    async function loadCached() {
      try {
        const [state, key] = await Promise.all([
          loadLicenseState(),
          loadLicenseKey(),
        ]);
        setLicenseState(state);
        setLicenseKeyState(key);
      } catch (e) {
        console.error('Failed to load license cache:', e);
      } finally {
        setIsLoading(false);
      }
    }
    loadCached();
  }, []);

  // Persist license key changes
  const setLicenseKey = useCallback((key: string) => {
    setLicenseKeyState(key);
    saveLicenseKey(key).catch(console.error);
  }, []);

  // Call edge function
  const callVerifyLicense = useCallback(async (
    action: 'verify' | 'reset_devices'
  ): Promise<LicenseState> => {
    if (!licenseKey) {
      return {
        ...DEFAULT_LICENSE_STATE,
        message: 'License key is required',
      };
    }

    setIsVerifying(true);

    try {
      const request: LicenseVerifyRequest = {
        licenseKey,
        productIdOrPermalink: '', // Not needed for self-hosted
        deviceId,
        action,
      };

      const { data, error } = await supabase.functions.invoke('verify-license', {
        body: request,
      });

      if (error) {
        console.error('License verification error:', error);
        return {
          ...licenseState,
          status: 'error',
          valid: false,
          message: error.message || 'Verification failed',
        };
      }

      const newState = data as LicenseState;
      setLicenseState(newState);
      await saveLicenseState(newState);
      return newState;
    } catch (e) {
      console.error('License verification failed:', e);
      const errorState: LicenseState = {
        ...licenseState,
        status: 'error',
        valid: false,
        message: e instanceof Error ? e.message : 'Verification failed',
      };
      return errorState;
    } finally {
      setIsVerifying(false);
    }
  }, [licenseKey, deviceId, licenseState]);

  const verifyLicense = useCallback(() => callVerifyLicense('verify'), [callVerifyLicense]);
  const resetDevices = useCallback(() => callVerifyLicense('reset_devices'), [callVerifyLicense]);

  // Calculate effective permissions
  const effectivePermissions = getEffectivePermissions(licenseState, isOnline);
  const remainingGraceDays = getRemainingGraceDays(licenseState);
  const isWithinGrace = isWithinGracePeriod(licenseState);

  return {
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
  };
}
