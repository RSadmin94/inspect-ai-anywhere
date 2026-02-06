import { getDB, getSetting, setSetting } from './db';

export interface CompanyProfile {
  id: string;
  companyName: string;
  companyNameEs?: string;
  inspectorName?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  logoUrl?: string;
  logoBlob?: Blob;
  certifications?: string[];
  licenseNumber?: string;
  tagline?: string;
  taglineEs?: string;
  // Custom legalese fields
  customDisclaimer?: string;
  customDisclaimerEs?: string;
  scopeAndLimitations?: string;
  scopeAndLimitationsEs?: string;
  liabilityStatement?: string;
  liabilityStatementEs?: string;
  // Deferred items templates
  deferredItemsTemplates?: Array<{ area: string; reason: string }>;
  // Maintenance recommendations templates
  maintenanceTemplates?: string[];
}

const COMPANY_PROFILE_KEY = 'company-profile';

export async function getCompanyProfile(): Promise<CompanyProfile | null> {
  try {
    const profileJson = await getSetting(COMPANY_PROFILE_KEY);
    if (!profileJson) return null;
    return JSON.parse(profileJson) as CompanyProfile;
  } catch (e) {
    console.error('Failed to get company profile:', e);
    return null;
  }
}

export async function saveCompanyProfile(profile: CompanyProfile): Promise<void> {
  try {
    // Extract logoBlob before stringifying (blobs can't be JSON serialized)
    const { logoBlob, ...profileWithoutBlob } = profile;
    await setSetting(COMPANY_PROFILE_KEY, JSON.stringify(profileWithoutBlob));
    // Store logo blob separately if provided
    if (logoBlob) {
      await setSetting(`${COMPANY_PROFILE_KEY}-logo`, await blobToBase64(logoBlob));
    }
  } catch (e) {
    console.error('Failed to save company profile:', e);
    throw e;
  }
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function getCompanyLogo(): Promise<string | null> {
  try {
    return await getSetting(`${COMPANY_PROFILE_KEY}-logo`) || null;
  } catch {
    return null;
  }
}

export function getDefaultCompanyProfile(): CompanyProfile {
  return {
    id: COMPANY_PROFILE_KEY,
    companyName: 'InspectAI',
    companyNameEs: 'InspectAI',
    certifications: [],
  };
}
