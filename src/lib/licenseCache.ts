// License state caching in IndexedDB
import { getDB } from './db';
import { LicenseState, DEFAULT_LICENSE_STATE } from './license';

const LICENSE_STATE_KEY = 'license_state';
const LICENSE_KEY_STORAGE = 'license_key';
const PRODUCT_ID_STORAGE = 'product_id';

// Save license state to IndexedDB settings
export async function saveLicenseState(state: LicenseState): Promise<void> {
  const db = await getDB();
  await db.put('settings', { 
    key: LICENSE_STATE_KEY, 
    value: JSON.stringify(state) 
  });
}

// Load license state from IndexedDB
export async function loadLicenseState(): Promise<LicenseState> {
  try {
    const db = await getDB();
    const stored = await db.get('settings', LICENSE_STATE_KEY);
    if (stored?.value) {
      return JSON.parse(stored.value) as LicenseState;
    }
  } catch (e) {
    console.error('Failed to load license state:', e);
  }
  return DEFAULT_LICENSE_STATE;
}

// Save license key (encrypted in real production, plain for now)
export async function saveLicenseKey(key: string): Promise<void> {
  const db = await getDB();
  await db.put('settings', { key: LICENSE_KEY_STORAGE, value: key });
}

// Load license key
export async function loadLicenseKey(): Promise<string> {
  try {
    const db = await getDB();
    const stored = await db.get('settings', LICENSE_KEY_STORAGE);
    return stored?.value || '';
  } catch (e) {
    console.error('Failed to load license key:', e);
    return '';
  }
}

// Save product ID/permalink
export async function saveProductId(productId: string): Promise<void> {
  const db = await getDB();
  await db.put('settings', { key: PRODUCT_ID_STORAGE, value: productId });
}

// Load product ID/permalink
export async function loadProductId(): Promise<string> {
  try {
    const db = await getDB();
    const stored = await db.get('settings', PRODUCT_ID_STORAGE);
    return stored?.value || '';
  } catch (e) {
    console.error('Failed to load product ID:', e);
    return '';
  }
}

// Clear all license data
export async function clearLicenseData(): Promise<void> {
  const db = await getDB();
  await db.delete('settings', LICENSE_STATE_KEY);
  await db.delete('settings', LICENSE_KEY_STORAGE);
  await db.delete('settings', PRODUCT_ID_STORAGE);
}
