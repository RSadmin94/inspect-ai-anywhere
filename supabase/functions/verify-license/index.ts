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
    const GUMROAD_ACCESS_TOKEN = Deno.env.get('GUMROAD_ACCESS_TOKEN');
    const ALLOWED_DEVICES = parseInt(Deno.env.get('ALLOWED_DEVICES') || '2', 10);
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!GUMROAD_ACCESS_TOKEN) {
      console.error('GUMROAD_ACCESS_TOKEN not configured');
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
        device: { allowed: ALLOWED_DEVICES, used: 0 },
      } as LicenseState), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: VerifyRequest = await req.json();
    const { licenseKey, productIdOrPermalink, deviceId, action } = body;

    if (!licenseKey || !productIdOrPermalink || !deviceId) {
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
        device: { allowed: ALLOWED_DEVICES, used: 0 },
      } as LicenseState), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client with service role
    const supabase = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!
    );

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
          device: { allowed: ALLOWED_DEVICES, used: 0 },
        } as LicenseState), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // After reset, verify the license again
    }

    // Verify with Gumroad API
    console.log(`Verifying license with Gumroad for product: ${productIdOrPermalink}`);
    
    const gumroadParams = new URLSearchParams({
      product_id: productIdOrPermalink,
      license_key: licenseKey,
    });

    // Gumroad also accepts product_permalink, try that if product_id fails
    const gumroadResponse = await fetch('https://api.gumroad.com/v2/licenses/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: gumroadParams.toString() + `&access_token=${GUMROAD_ACCESS_TOKEN}`,
    });

    const gumroadData = await gumroadResponse.json();
    console.log('Gumroad response:', JSON.stringify(gumroadData));

    // Check if license is valid
    if (!gumroadData.success) {
      // Try with permalink if product_id failed
      const gumroadParamsAlt = new URLSearchParams({
        product_permalink: productIdOrPermalink,
        license_key: licenseKey,
      });

      const gumroadResponseAlt = await fetch('https://api.gumroad.com/v2/licenses/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: gumroadParamsAlt.toString() + `&access_token=${GUMROAD_ACCESS_TOKEN}`,
      });

      const gumroadDataAlt = await gumroadResponseAlt.json();
      
      if (!gumroadDataAlt.success) {
        return new Response(JSON.stringify({
          status: 'invalid',
          valid: false,
          message: gumroadDataAlt.message || 'Invalid license key',
          productIdOrPermalink,
          lastVerifiedAt: Date.now(),
          nextCheckAt: Date.now() + 3600000,
          graceDays: 7,
          allowCreateNew: false,
          allowAI: false,
          allowExport: true,
          device: { allowed: ALLOWED_DEVICES, used: 0 },
        } as LicenseState), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // License is valid with Gumroad, now check device limit
    
    // Get current device count
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
        productIdOrPermalink,
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
      productIdOrPermalink,
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
