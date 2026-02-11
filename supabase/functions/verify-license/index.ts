import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// JWT verification is disabled for this function - security enforced via:
// 1. License format validation
// 2. Device limit logic
// 3. Rate limiting per device
// 4. Generic error messages to prevent enumeration
export const config = {
  jwt: {
    verify: false,
  },
};

// Allowed origins for CORS - restricts API access to known domains
const ALLOWED_ORIGINS = [
  'https://inspect-ai-anywhere.lovable.app',
  'http://localhost:5173',
  'http://localhost:8080',
  'https://365-inspect-ai.netlify.app',
  // add your custom domain when ready:
  // 'https://app.365inspectai.com',
];

function isAllowedOrigin(origin: string | null) {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  if (origin.endsWith('.lovable.app')) return true;
  if (origin.endsWith('.netlify.app')) return true;
  return false;
}

function getCorsHeaders(origin: string | null): Record<string, string> {
  // Check if origin is in allowed list
  const allowedOrigin = isAllowedOrigin(origin) ? origin! : ALLOWED_ORIGINS[0];
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

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

// Rate limiting: track requests per device per minute
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(deviceId: string, maxRequests: number = 10): boolean {
  const now = Date.now();
  const key = deviceId;
  const entry = rateLimitMap.get(key);
  
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + 60000 }); // 1 minute window
    return true;
  }
  
  if (entry.count >= maxRequests) {
    return false;
  }
  
  entry.count++;
  return true;
}

// Cryptographically secure hash using SHA-256
async function hashLicenseKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return `lh_${hashHex.substring(0, 32)}`; // Use first 32 chars for reasonable length
}

// Sanitize data for logging - remove sensitive information
function sanitizeForLog(data: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (['licenseKey', 'license_key', 'deviceId', 'device_id', 'email', 'license_hash'].includes(key)) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeForLog(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const DEFAULT_ALLOWED_DEVICES = 2;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing configuration');
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

    // Rate limiting: check if device has exceeded request limit
    if (!checkRateLimit(deviceId)) {
      console.warn('Rate limit exceeded for device:', deviceId);
      return new Response(JSON.stringify({
        status: 'error',
        valid: false,
        message: 'License verification failed',
        productIdOrPermalink: '',
        lastVerifiedAt: Date.now(),
        nextCheckAt: Date.now() + 3600000,
        graceDays: 7,
        allowCreateNew: false,
        allowAI: false,
        allowExport: true,
        device: { allowed: DEFAULT_ALLOWED_DEVICES, used: 0 },
      } as LicenseState), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Input validation: check presence, length, and format
    const MAX_LICENSE_KEY_LENGTH = 100;
    const MAX_DEVICE_ID_LENGTH = 64;
    const MAX_PRODUCT_ID_LENGTH = 50;
    const VALID_INPUT_PATTERN = /^[A-Za-z0-9\-_]+$/;

    const isValidInput = (value: string | undefined, maxLength: number): boolean => {
      return !!value && value.length <= maxLength && VALID_INPUT_PATTERN.test(value);
    };

    if (!isValidInput(licenseKey, MAX_LICENSE_KEY_LENGTH) || !isValidInput(deviceId, MAX_DEVICE_ID_LENGTH)) {
      console.log('Input validation failed');
      return new Response(JSON.stringify({
        status: 'invalid',
        valid: false,
        message: 'License verification failed',
        productIdOrPermalink: '',
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

    // Validate productIdOrPermalink if provided
    if (productIdOrPermalink && !isValidInput(productIdOrPermalink, MAX_PRODUCT_ID_LENGTH)) {
      console.log('Input validation failed');
      return new Response(JSON.stringify({
        status: 'invalid',
        valid: false,
        message: 'License verification failed',
        productIdOrPermalink: '',
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

    // Initialize Supabase client with service role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const licenseHash = await hashLicenseKey(licenseKey);

    // Handle reset_devices action with 30-day cooldown
    if (action === 'reset_devices') {
      console.log('Processing device reset request');
      
      // First, fetch license to check cooldown
      const { data: licenseForReset, error: resetLookupError } = await supabase
        .from('licenses')
        .select('last_reset_at, reset_count, max_devices')
        .eq('license_key', licenseKey)
        .eq('is_active', true)
        .maybeSingle();

      if (resetLookupError || !licenseForReset) {
        return new Response(JSON.stringify({
          status: 'invalid',
          valid: false,
          message: 'License verification failed',
          productIdOrPermalink,
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

      // Check 30-day cooldown
      const COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
      if (licenseForReset.last_reset_at) {
        const lastReset = new Date(licenseForReset.last_reset_at).getTime();
        const nextAvailable = lastReset + COOLDOWN_MS;
        
        if (Date.now() < nextAvailable) {
          const nextDate = new Date(nextAvailable).toISOString().split('T')[0];
          return new Response(JSON.stringify({
            status: 'error',
            valid: true, // License is still valid, just can't reset yet
            message: `Device reset is available once every 30 days. Next reset available on ${nextDate}.`,
            productIdOrPermalink,
            lastVerifiedAt: Date.now(),
            nextCheckAt: Date.now() + 3600000,
            graceDays: 7,
            allowCreateNew: true,
            allowAI: true,
            allowExport: true,
            device: { allowed: licenseForReset.max_devices || DEFAULT_ALLOWED_DEVICES, used: 0 },
          } as LicenseState), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      // Cooldown passed or first reset - proceed with reset
      const { error: deleteError } = await supabase
        .from('license_devices')
        .delete()
        .eq('license_hash', licenseHash);

      if (deleteError) {
        console.error('Device reset failed');
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

      // Update reset tracking
      const { error: updateError } = await supabase
        .from('licenses')
        .update({ 
          last_reset_at: new Date().toISOString(),
          reset_count: (licenseForReset.reset_count || 0) + 1
        })
        .eq('license_key', licenseKey);

      if (updateError) {
        console.error('Reset tracking update failed');
      }

      console.log('Device reset completed');
      // After reset, continue to verify the license
    }

    // Verify license against local database
    console.log('Verifying license');
    
    const { data: licenseData, error: licenseError } = await supabase
      .from('licenses')
      .select('*')
      .eq('license_key', licenseKey)
      .eq('is_active', true)
      .maybeSingle();

    if (licenseError) {
      console.error('License lookup failed');
      return new Response(JSON.stringify({
        status: 'invalid',
        valid: false,
        message: 'License verification failed',
        productIdOrPermalink: '',
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

    // License not found or inactive - use generic message to prevent enumeration
    if (!licenseData) {
      console.log('License not found');
      return new Response(JSON.stringify({
        status: 'invalid',
        valid: false,
        message: 'License verification failed',
        productIdOrPermalink: '',
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

    // Check if license has expired - use generic message to prevent enumeration
    if (licenseData.expires_at && new Date(licenseData.expires_at) < new Date()) {
      console.log('License expired');
      return new Response(JSON.stringify({
        status: 'invalid',
        valid: false,
        message: 'License verification failed',
        productIdOrPermalink: '',
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

    const ALLOWED_DEVICES = licenseData.max_devices || DEFAULT_ALLOWED_DEVICES;

    // License is valid, now check device limit
    const { data: devices, error: devicesError } = await supabase
      .from('license_devices')
      .select('device_id')
      .eq('license_hash', licenseHash);

    if (devicesError) {
      console.error('Device lookup failed');
    }

    const currentDevices = devices || [];
    const deviceExists = currentDevices.some(d => d.device_id === deviceId);
    const deviceCount = currentDevices.length;

    console.log(`Device status: registered=${deviceExists}, total=${deviceCount}`);

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
        console.error('Device registration failed');
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

    console.log('License verified successfully');
    
    return new Response(JSON.stringify(activeState), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Verification error');
    
    return new Response(JSON.stringify({
      status: 'error',
      valid: false,
      message: 'Verification failed',
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
