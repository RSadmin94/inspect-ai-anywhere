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
  saveProductId,
  loadProductId,
} from '@/lib/licenseCache';
import { useOnlineStatus } from './useOnlineStatus';

interface UseLicenseReturn {
  licenseState: LicenseState;
  isLoading: boolean;
  isVerifying: boolean;
  licenseKey: string;
  productId: string;
  deviceId: string;
  effectivePermissions: {
    allowCreateNew: boolean;
    allowAI: boolean;
    allowExport: boolean;
  };
  remainingGraceDays: number;
  isWithinGrace: boolean;
  setLicenseKey: (key: string) => void;
  setProductId: (id: string) => void;
  verifyLicense: () => Promise<LicenseState>;
  resetDevices: () => Promise<LicenseState>;
}

export function useLicense(): UseLicenseReturn {
  const isOnline = useOnlineStatus();
  const [licenseState, setLicenseState] = useState<LicenseState>(DEFAULT_LICENSE_STATE);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [licenseKey, setLicenseKeyState] = useState('');
  const [productId, setProductIdState] = useState('');
  const [deviceId] = useState(() => getDeviceId());

  // Load cached state on mount
  useEffect(() => {
    async function loadCached() {
      try {
        const [state, key, product] = await Promise.all([
          loadLicenseState(),
          loadLicenseKey(),
          loadProductId(),
        ]);
        setLicenseState(state);
        setLicenseKeyState(key);
        setProductIdState(product);
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

  // Persist product ID changes
  const setProductId = useCallback((id: string) => {
    setProductIdState(id);
    saveProductId(id).catch(console.error);
  }, []);

  // Call edge function
  const callVerifyLicense = useCallback(async (
    action: 'verify' | 'reset_devices'
  ): Promise<LicenseState> => {
    if (!licenseKey || !productId) {
      return {
        ...DEFAULT_LICENSE_STATE,
        message: 'License key and product ID are required',
      };
    }

    setIsVerifying(true);

    try {
      const request: LicenseVerifyRequest = {
        licenseKey,
        productIdOrPermalink: productId,
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
  }, [licenseKey, productId, deviceId, licenseState]);

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
    productId,
    deviceId,
    effectivePermissions,
    remainingGraceDays,
    isWithinGrace,
    setLicenseKey,
    setProductId,
    verifyLicense,
    resetDevices,
  };
}
