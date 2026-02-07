// License types and utilities for Gumroad licensing

export type LicenseStatus = 'active' | 'inactive' | 'invalid' | 'device_limit' | 'error';

export interface LicenseState {
  status: LicenseStatus;
  valid: boolean;
  message?: string;
  productIdOrPermalink: string;
  lastVerifiedAt: number; // epoch ms
  nextCheckAt: number;    // epoch ms
  graceDays: number;      // default 7
  allowCreateNew: boolean;
  allowAI: boolean;
  allowExport: boolean;   // ALWAYS true
  device: { allowed: number; used: number };
}

export interface LicenseVerifyRequest {
  licenseKey: string;
  productIdOrPermalink: string;
  deviceId: string;
  action: 'verify' | 'reset_devices';
}

// Default unlicensed state
export const DEFAULT_LICENSE_STATE: LicenseState = {
  status: 'inactive',
  valid: false,
  message: 'No license activated',
  productIdOrPermalink: '',
  lastVerifiedAt: 0,
  nextCheckAt: 0,
  graceDays: 7,
  allowCreateNew: false,
  allowAI: false,
  allowExport: true, // Export always works
  device: { allowed: 2, used: 0 },
};

// Grace period in milliseconds (7 days)
export const GRACE_PERIOD_MS = 7 * 24 * 60 * 60 * 1000;

// Generate or retrieve device ID
export function getDeviceId(): string {
  const DEVICE_ID_KEY = 'inspectai_device_id';
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  
  if (!deviceId) {
    // Generate a unique device ID
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  
  return deviceId;
}

// Check if offline grace period is still valid
export function isWithinGracePeriod(state: LicenseState): boolean {
  if (!state.lastVerifiedAt) return false;
  const elapsed = Date.now() - state.lastVerifiedAt;
  return elapsed <= GRACE_PERIOD_MS;
}

// Calculate remaining grace days
export function getRemainingGraceDays(state: LicenseState): number {
  if (!state.lastVerifiedAt) return 0;
  const elapsed = Date.now() - state.lastVerifiedAt;
  const remaining = GRACE_PERIOD_MS - elapsed;
  return Math.max(0, Math.ceil(remaining / (24 * 60 * 60 * 1000)));
}

// Get effective license permissions based on online status and grace period
export function getEffectivePermissions(
  state: LicenseState, 
  isOnline: boolean
): Pick<LicenseState, 'allowCreateNew' | 'allowAI' | 'allowExport'> {
  // Export is always allowed
  const permissions = {
    allowCreateNew: false,
    allowAI: false,
    allowExport: true,
  };

  if (!state.valid && state.status !== 'active') {
    return permissions;
  }

  if (isOnline) {
    // Online: use server-provided permissions
    return {
      allowCreateNew: state.allowCreateNew,
      allowAI: state.allowAI,
      allowExport: true,
    };
  }

  // Offline: check grace period
  if (isWithinGracePeriod(state)) {
    return {
      allowCreateNew: state.allowCreateNew,
      allowAI: state.allowAI,
      allowExport: true,
    };
  }

  // Offline and outside grace: lock features but allow export
  return permissions;
}
