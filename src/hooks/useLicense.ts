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

      console.log('[DEBUG] Calling verify-license with request:', request);
      const { data, error } = await supabase.functions.invoke('verify-license', {
        body: request,
      });
      console.log('[DEBUG] Response - data:', data, 'error:', error);

      if (error) {
        console.error('[DEBUG] Error object:', error);
        console.error('[DEBUG] Error keys:', Object.keys(error));
        console.error('[DEBUG] Error context:', (error as any)?.context);
        
        // If the function returned JSON with a non-2xx status, Supabase invoke puts it in error.context.response
        const resp = (error as any)?.context?.response;
        if (resp) {
          try {
            const body = await resp.json();
            console.log('[DEBUG] Response body:', body);
            return {
              ...licenseState,
              status: body?.valid ? 'active' : (body?.status || 'invalid'),
              valid: !!body?.valid,
              message: body?.message || error.message || 'Verification failed',
              productIdOrPermalink: body?.productIdOrPermalink || '',
              lastVerifiedAt: body?.lastVerifiedAt || Date.now(),
              nextCheckAt: body?.nextCheckAt || Date.now() + 3600000,
              graceDays: body?.graceDays || 7,
              allowCreateNew: body?.allowCreateNew || false,
              allowAI: body?.allowAI || false,
              allowExport: body?.allowExport !== undefined ? body.allowExport : true,
              device: body?.device || { allowed: 2, used: 0 },
            };
          } catch (parseError) {
            console.error('[DEBUG] Failed to parse response:', parseError);
            // fallthrough to default
          }
        }

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
