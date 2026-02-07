import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface LicenseState {
  status: 'active' | 'inactive' | 'invalid' | 'device_limit' | 'error';
  valid: boolean;
  message?: string;
  productIdOrPermalink: string;
  lastVerifiedAt: number;
  nextCheckAt: number;
  graceDays: number;
  allowCreateNew: boolean;
  allowAI: boolean;
  allowExport: boolean;
  device: { allowed: number; used: number };
}

interface VerifyRequest {
  licenseKey: string;
  productIdOrPermalink: string;
  deviceId: string;
  action: 'verify' | 'reset_devices';
}

// Hash the license key for storage (simple hash, not for security)
function hashLicenseKey(key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `lh_${Math.abs(hash).toString(36)}`;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const DEFAULT_ALLOWED_DEVICES = 2;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing Supabase configuration');
      return new Response(JSON.stringify({
        status: 'error',
        valid: false,
        message: 'License service not configured',
        productIdOrPermalink: '',
        lastVerifiedAt: Date.now(),
        nextCheckAt: Date.now() + 3600000,
        graceDays: 7,
        allowCreateNew: false,
        allowAI: false,
        allowExport: true,
        device: { allowed: DEFAULT_ALLOWED_DEVICES, used: 0 },
      } as LicenseState), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: VerifyRequest = await req.json();
    const { licenseKey, productIdOrPermalink, deviceId, action } = body;

    if (!licenseKey || !deviceId) {
      return new Response(JSON.stringify({
        status: 'invalid',
        valid: false,
        message: 'Missing required fields',
        productIdOrPermalink: productIdOrPermalink || '',
        lastVerifiedAt: Date.now(),
        nextCheckAt: Date.now() + 3600000,
        graceDays: 7,
        allowCreateNew: false,
        allowAI: false,
        allowExport: true,
        device: { allowed: DEFAULT_ALLOWED_DEVICES, used: 0 },
      } as LicenseState), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client with service role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const licenseHash = hashLicenseKey(licenseKey);

    // Handle reset_devices action
    if (action === 'reset_devices') {
      console.log(`Resetting devices for license hash: ${licenseHash}`);
      
      const { error: deleteError } = await supabase
        .from('license_devices')
        .delete()
        .eq('license_hash', licenseHash);

      if (deleteError) {
        console.error('Failed to reset devices:', deleteError);
        return new Response(JSON.stringify({
          status: 'error',
          valid: false,
          message: 'Failed to reset devices',
          productIdOrPermalink,
          lastVerifiedAt: Date.now(),
          nextCheckAt: Date.now() + 3600000,
          graceDays: 7,
          allowCreateNew: false,
          allowAI: false,
          allowExport: true,
          device: { allowed: DEFAULT_ALLOWED_DEVICES, used: 0 },
        } as LicenseState), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      // After reset, continue to verify the license
    }

    // Verify license against local database
    console.log(`Verifying license key against database`);
    
    const { data: licenseData, error: licenseError } = await supabase
      .from('licenses')
      .select('*')
      .eq('license_key', licenseKey)
      .eq('is_active', true)
      .maybeSingle();

    if (licenseError) {
      console.error('Database error:', licenseError);
      return new Response(JSON.stringify({
        status: 'error',
        valid: false,
        message: 'License verification failed',
        productIdOrPermalink: productIdOrPermalink || '',
        lastVerifiedAt: Date.now(),
        nextCheckAt: Date.now() + 3600000,
        graceDays: 7,
        allowCreateNew: false,
        allowAI: false,
        allowExport: true,
        device: { allowed: DEFAULT_ALLOWED_DEVICES, used: 0 },
      } as LicenseState), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // License not found or inactive
    if (!licenseData) {
      return new Response(JSON.stringify({
        status: 'invalid',
        valid: false,
        message: 'Invalid or inactive license key',
        productIdOrPermalink: productIdOrPermalink || '',
        lastVerifiedAt: Date.now(),
        nextCheckAt: Date.now() + 3600000,
        graceDays: 7,
        allowCreateNew: false,
        allowAI: false,
        allowExport: true,
        device: { allowed: DEFAULT_ALLOWED_DEVICES, used: 0 },
      } as LicenseState), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if license has expired
    if (licenseData.expires_at && new Date(licenseData.expires_at) < new Date()) {
      return new Response(JSON.stringify({
        status: 'invalid',
        valid: false,
        message: 'License has expired',
        productIdOrPermalink: licenseData.product_id,
        lastVerifiedAt: Date.now(),
        nextCheckAt: Date.now() + 3600000,
        graceDays: 7,
        allowCreateNew: false,
        allowAI: false,
        allowExport: true,
        device: { allowed: licenseData.max_devices, used: 0 },
      } as LicenseState), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const ALLOWED_DEVICES = licenseData.max_devices || DEFAULT_ALLOWED_DEVICES;

    // License is valid, now check device limit
    const { data: devices, error: devicesError } = await supabase
      .from('license_devices')
      .select('device_id')
      .eq('license_hash', licenseHash);

    if (devicesError) {
      console.error('Failed to fetch devices:', devicesError);
    }

    const currentDevices = devices || [];
    const deviceExists = currentDevices.some(d => d.device_id === deviceId);
    const deviceCount = currentDevices.length;

    console.log(`Device check: exists=${deviceExists}, count=${deviceCount}, allowed=${ALLOWED_DEVICES}`);

    // Check if device limit exceeded
    if (!deviceExists && deviceCount >= ALLOWED_DEVICES) {
      return new Response(JSON.stringify({
        status: 'device_limit',
        valid: false,
        message: `Device limit reached (${ALLOWED_DEVICES} devices). Reset activations to use on a new device.`,
        productIdOrPermalink: licenseData.product_id,
        lastVerifiedAt: Date.now(),
        nextCheckAt: Date.now() + 3600000,
        graceDays: 7,
        allowCreateNew: false,
        allowAI: false,
        allowExport: true,
        device: { allowed: ALLOWED_DEVICES, used: deviceCount },
      } as LicenseState), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Register or update device
    if (deviceExists) {
      // Update last_seen_at
      await supabase
        .from('license_devices')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('license_hash', licenseHash)
        .eq('device_id', deviceId);
    } else {
      // Insert new device
      const { error: insertError } = await supabase
        .from('license_devices')
        .insert({
          license_hash: licenseHash,
          device_id: deviceId,
        });

      if (insertError) {
        console.error('Failed to register device:', insertError);
      }
    }

    // Get updated device count
    const { data: updatedDevices } = await supabase
      .from('license_devices')
      .select('device_id')
      .eq('license_hash', licenseHash);

    const finalDeviceCount = updatedDevices?.length || 1;

    // Return active license state
    const activeState: LicenseState = {
      status: 'active',
      valid: true,
      message: 'License verified successfully',
      productIdOrPermalink: licenseData.product_id,
      lastVerifiedAt: Date.now(),
      nextCheckAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
      graceDays: 7,
      allowCreateNew: true,
      allowAI: true,
      allowExport: true,
      device: { allowed: ALLOWED_DEVICES, used: finalDeviceCount },
    };

    console.log('Returning active license state');
    
    return new Response(JSON.stringify(activeState), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('License verification error:', error);
    
    return new Response(JSON.stringify({
      status: 'error',
      valid: false,
      message: error instanceof Error ? error.message : 'Verification failed',
      productIdOrPermalink: '',
      lastVerifiedAt: Date.now(),
      nextCheckAt: Date.now() + 3600000,
      graceDays: 7,
      allowCreateNew: false,
      allowAI: false,
      allowExport: true,
      device: { allowed: 2, used: 0 },
    } as LicenseState), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
