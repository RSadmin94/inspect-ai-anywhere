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

interface DbLicenseRecord {
  key?: string | null;
  status?: string | null;
  device_limit?: number | null;
  expires_at?: string | null;
  created_at?: string | null;
  product_id?: string | null;
  last_reset_at?: string | null;
  reset_count?: number | null;
  license_key?: string | null;
  is_active?: boolean | null;
  max_devices?: number | null;
}

type LookupMode = 'canonical' | 'legacy';

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
    if (['licenseKey', 'license_key', 'key', 'deviceId', 'device_id', 'email', 'license_hash'].includes(key)) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeForLog(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

function extractJwtRole(token: string): string | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  try {
    const padded = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const normalized = padded + '='.repeat((4 - (padded.length % 4)) % 4);
    const payload = JSON.parse(atob(normalized));
    return typeof payload?.role === 'string' ? payload.role : null;
  } catch {
    return null;
  }
}

function isAnonOrPublishableKey(token: string): boolean {
  if (token.startsWith('sb_publishable_')) {
    return true;
  }

  const role = extractJwtRole(token);
  return role === 'anon';
}

function isMissingColumnError(error: { code?: string } | null): boolean {
  return error?.code === '42703';
}

async function fetchActiveLicenseRecord(
  supabase: any,
  licenseKey: string,
  includeResetFields = false,
): Promise<{
  data: DbLicenseRecord | null;
  error: { code?: string; message?: string } | null;
  lookupMode: LookupMode;
}> {
  const canonicalSelect = includeResetFields
    ? 'key, status, device_limit, expires_at, created_at, product_id, last_reset_at, reset_count'
    : 'key, status, device_limit, expires_at, created_at, product_id';

  const canonicalLookup = await supabase
    .from('licenses')
    .select(canonicalSelect)
    .eq('key', licenseKey)
    .eq('status', 'active')
    .maybeSingle();

  if (!canonicalLookup.error) {
    return { data: canonicalLookup.data, error: null, lookupMode: 'canonical' };
  }

  if (!isMissingColumnError(canonicalLookup.error)) {
    return {
      data: null,
      error: { code: canonicalLookup.error.code, message: canonicalLookup.error.message },
      lookupMode: 'canonical',
    };
  }

  const legacySelect = includeResetFields
    ? 'license_key, is_active, max_devices, expires_at, created_at, product_id, last_reset_at, reset_count'
    : 'license_key, is_active, max_devices, expires_at, created_at, product_id';

  const legacyLookup = await supabase
    .from('licenses')
    .select(legacySelect)
    .eq('license_key', licenseKey)
    .eq('is_active', true)
    .maybeSingle();

  return {
    data: legacyLookup.data,
    error: legacyLookup.error ? { code: legacyLookup.error.code, message: legacyLookup.error.message } : null,
    lookupMode: 'legacy',
  };
}

function getAllowedDevices(license: DbLicenseRecord | null, defaultAllowed: number): number {
  const fromCanonical = license?.device_limit;
  const fromLegacy = license?.max_devices;
  const resolved = fromCanonical ?? fromLegacy ?? defaultAllowed;
  return Number.isFinite(Number(resolved)) ? Number(resolved) : defaultAllowed;
}

function maskLicenseKey(value: string | null | undefined): string {
  if (!value) return '';
  if (value.length <= 10) return `${value.slice(0, 2)}***${value.slice(-2)}`;
  return `${value.slice(0, 6)}***${value.slice(-4)}`;
}

function logFinalValidation(state: LicenseState) {
  console.log('[verify-license] final valid:', state.valid);
  console.log('[verify-license] final validation response:', sanitizeForLog(state as unknown as Record<string, unknown>));
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
      const missingConfigResponse: LicenseState = {
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
      };
      logFinalValidation(missingConfigResponse);
      return new Response(JSON.stringify({
        ...missingConfigResponse,
      } as LicenseState), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (isAnonOrPublishableKey(SUPABASE_SERVICE_ROLE_KEY)) {
      console.error('Invalid service role key configuration: anon/publishable key detected');
      const invalidConfigResponse: LicenseState = {
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
      };
      logFinalValidation(invalidConfigResponse);
      return new Response(JSON.stringify({
        ...invalidConfigResponse,
      } as LicenseState), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: VerifyRequest = await req.json();
    const { licenseKey, productIdOrPermalink, deviceId, action } = body;
    console.log('[verify-license] incoming key:', maskLicenseKey(licenseKey));
    console.log('[verify-license] incoming request:', sanitizeForLog({
      maskedLicenseKey: maskLicenseKey(licenseKey),
      productIdOrPermalink,
      deviceId,
      action,
    }));

    // Rate limiting: check if device has exceeded request limit
    if (!checkRateLimit(deviceId)) {
      console.warn('Rate limit exceeded for device:', deviceId);
      const rateLimitResponse: LicenseState = {
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
      };
      logFinalValidation(rateLimitResponse);
      return new Response(JSON.stringify({
        ...rateLimitResponse,
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
      const invalidInputResponse: LicenseState = {
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
      };
      logFinalValidation(invalidInputResponse);
      return new Response(JSON.stringify({
        ...invalidInputResponse,
      } as LicenseState), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate productIdOrPermalink if provided
    if (productIdOrPermalink && !isValidInput(productIdOrPermalink, MAX_PRODUCT_ID_LENGTH)) {
      console.log('Input validation failed');
      const invalidProductResponse: LicenseState = {
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
      };
      logFinalValidation(invalidProductResponse);
      return new Response(JSON.stringify({
        ...invalidProductResponse,
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
      const resetLookup = await fetchActiveLicenseRecord(supabase, licenseKey, true);
      const licenseForReset = resetLookup.data;
      const resetLookupError = resetLookup.error;

      console.log('[verify-license] DB lookup result (reset):', sanitizeForLog({
        lookupMode: resetLookup.lookupMode,
        found: !!licenseForReset,
        resultCount: licenseForReset ? 1 : 0,
        error: resetLookupError ?? null,
        license: licenseForReset
          ? {
              maskedKey: maskLicenseKey(licenseForReset.key ?? licenseForReset.license_key ?? null),
              status: licenseForReset.status ?? (licenseForReset.is_active ? 'active' : 'inactive'),
              device_limit: licenseForReset.device_limit ?? licenseForReset.max_devices ?? DEFAULT_ALLOWED_DEVICES,
              expires_at: licenseForReset.expires_at ?? null,
            }
          : null,
      }));

      if (resetLookupError || !licenseForReset) {
        const resetLookupFailureResponse: LicenseState = {
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
        };
        logFinalValidation(resetLookupFailureResponse);
        return new Response(JSON.stringify({
          ...resetLookupFailureResponse,
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
          const cooldownResponse: LicenseState = {
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
            device: { allowed: getAllowedDevices(licenseForReset, DEFAULT_ALLOWED_DEVICES), used: 0 },
          };
          logFinalValidation(cooldownResponse);
          return new Response(JSON.stringify({
            ...cooldownResponse,
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
        const deviceResetErrorResponse: LicenseState = {
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
        };
        logFinalValidation(deviceResetErrorResponse);
        return new Response(JSON.stringify({
          ...deviceResetErrorResponse,
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
        .eq(resetLookup.lookupMode === 'canonical' ? 'key' : 'license_key', licenseKey);

      if (updateError) {
        console.error('Reset tracking update failed');
      }

      console.log('Device reset completed');
      // After reset, continue to verify the license
    }

    // Verify license against local database
    console.log('Verifying license');
    const licenseLookup = await fetchActiveLicenseRecord(supabase, licenseKey);
    const licenseData = licenseLookup.data;
    const licenseError = licenseLookup.error;

    console.log('[verify-license] DB lookup result (verify):', sanitizeForLog({
      lookupMode: licenseLookup.lookupMode,
      found: !!licenseData,
      resultCount: licenseData ? 1 : 0,
      error: licenseError ?? null,
      license: licenseData
        ? {
            maskedKey: maskLicenseKey(licenseData.key ?? licenseData.license_key ?? null),
            status: licenseData.status ?? (licenseData.is_active ? 'active' : 'inactive'),
            device_limit: licenseData.device_limit ?? licenseData.max_devices ?? DEFAULT_ALLOWED_DEVICES,
            expires_at: licenseData.expires_at ?? null,
          }
        : null,
    }));

    if (licenseError) {
      console.error('License lookup failed');
      const lookupErrorResponse: LicenseState = {
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
      };
      logFinalValidation(lookupErrorResponse);
      return new Response(JSON.stringify({
        ...lookupErrorResponse,
      } as LicenseState), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // License not found or inactive - use generic message to prevent enumeration
    if (!licenseData) {
      console.log('License not found');
      const notFoundResponse: LicenseState = {
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
      };
      logFinalValidation(notFoundResponse);
      return new Response(JSON.stringify({
        ...notFoundResponse,
      } as LicenseState), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if license has expired - use generic message to prevent enumeration
    if (licenseData.expires_at && new Date(licenseData.expires_at) < new Date()) {
      console.log('License expired');
      const expiredResponse: LicenseState = {
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
      };
      logFinalValidation(expiredResponse);
      return new Response(JSON.stringify({
        ...expiredResponse,
      } as LicenseState), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const ALLOWED_DEVICES = getAllowedDevices(licenseData, DEFAULT_ALLOWED_DEVICES);

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
      const deviceLimitResponse: LicenseState = {
        status: 'device_limit',
        valid: false,
        message: `Device limit reached (${ALLOWED_DEVICES} devices). Reset activations to use on a new device.`,
        productIdOrPermalink: licenseData.product_id ?? productIdOrPermalink,
        lastVerifiedAt: Date.now(),
        nextCheckAt: Date.now() + 3600000,
        graceDays: 7,
        allowCreateNew: false,
        allowAI: false,
        allowExport: true,
        device: { allowed: ALLOWED_DEVICES, used: deviceCount },
      };
      logFinalValidation(deviceLimitResponse);
      return new Response(JSON.stringify({
        ...deviceLimitResponse,
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
      productIdOrPermalink: licenseData.product_id ?? productIdOrPermalink,
      lastVerifiedAt: Date.now(),
      nextCheckAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
      graceDays: 7,
      allowCreateNew: true,
      allowAI: true,
      allowExport: true,
      device: { allowed: ALLOWED_DEVICES, used: finalDeviceCount },
    };

    console.log('License verified successfully');
    logFinalValidation(activeState);
    
    return new Response(JSON.stringify(activeState), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Verification error');
    const errorResponse: LicenseState = {
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
    };
    logFinalValidation(errorResponse);

    return new Response(JSON.stringify({
      ...errorResponse,
    } as LicenseState), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
