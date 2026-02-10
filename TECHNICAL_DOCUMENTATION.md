# 365 InspectAI — Technical Documentation

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Data Models](#data-models)
5. [IndexedDB Schema](#indexeddb-schema)
6. [Core Features API](#core-features-api)
7. [Edge Functions](#edge-functions)
8. [Licensing System](#licensing-system)
9. [AI Integration](#ai-integration)
10. [PDF Report System](#pdf-report-system)
11. [Offline-First Architecture](#offline-first-architecture)
12. [PWA Configuration](#pwa-configuration)
13. [Annotation System](#annotation-system)
14. [Internationalization](#internationalization)
15. [Security](#security)
16. [File Structure](#file-structure)
17. [Environment Variables](#environment-variables)
18. [Deployment](#deployment)
19. [Browser Support](#browser-support)

---

## Overview

**365 InspectAI** is a mobile-first, offline-first Progressive Web Application (PWA) for professional property inspectors. It operates as a standalone tool — no user accounts, no cloud dependency — with all data persisted locally in IndexedDB.

### Key Characteristics
- **Offline-First**: Full functionality without internet
- **Mobile-First**: One-handed thumb operation, portrait-primary
- **Camera-First**: "Deep Pro" dark theme with glassmorphism
- **No Authentication**: Standalone operation, no user accounts
- **Local Storage**: All data in IndexedDB
- **AI-Powered**: Gemini 2.5 Flash for defect analysis
- **Bilingual**: English + Spanish (formal professional tone)
- **White-Label**: Full company branding customization
- **Licensed**: Self-hosted license system with device management

**Production URL**: https://inspect-ai-anywhere.lovable.app  
**Support**: support@365globalsolutions.com

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Interface                           │
│  Dashboard │ Camera │ Photo Gallery │ Report Builder │ Settings │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                    Business Logic Layer                          │
│  useInspection │ useLicense │ useLanguage │ useVoiceDictation   │
│  useOnlineStatus │ Image Processing │ AI Orchestration          │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                    Data Persistence Layer                        │
│  IndexedDB v2 via idb                                           │
│  Stores: inspections, photos, settings, customRooms, phrases,  │
│          issuePresets                                            │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                  Cloud Services (Optional)                       │
│  Edge Functions: analyze-photo, verify-license                  │
│  Database: licenses, license_devices (RLS-protected)            │
└─────────────────────────────────────────────────────────────────┘
```

### Component Tree

```
App.tsx → BrowserRouter
├── Index.tsx (single route, view-switching)
│   ├── AppSidebar / SideMenu
│   ├── DashboardHub
│   │   ├── WelcomePage
│   │   ├── NewInspectionForm
│   │   ├── InspectionHeader
│   │   ├── RoomSelector
│   │   ├── QuickCaptureMode
│   │   │   ├── CameraCapture
│   │   │   ├── DropZone
│   │   │   └── LiveNotesPanel
│   │   ├── PhotoGallery
│   │   │   ├── PhotoDetailPanel
│   │   │   ├── PhotoAnnotationEditor
│   │   │   ├── IssuePresetSelector
│   │   │   └── ImageLightbox
│   │   ├── ReportBuilder
│   │   ├── ReportReviewScreen / ReportDialog
│   │   ├── CompanyProfileSettings
│   │   ├── LicenseSettings
│   │   ├── PhraseLibrary
│   │   └── StorageMeter
│   └── StatusBar
└── NotFound.tsx
```

---

## Technology Stack

### Frontend

| Package | Version | Purpose |
|---------|---------|---------|
| react | ^18.3.1 | UI Framework |
| typescript | - | Type Safety |
| vite | - | Build Tool |
| react-router-dom | ^6.30.1 | Routing |
| tailwindcss + tailwindcss-animate | - | Styling |
| shadcn/ui (Radix UI) | Various | Component Library |
| lucide-react | ^0.462.0 | Icons |
| framer-motion | ^12.31.0 | Animations |

### Data

| Package | Version | Purpose |
|---------|---------|---------|
| idb | ^8.0.3 | IndexedDB Wrapper |
| @tanstack/react-query | ^5.83.0 | Server State |
| react-hook-form | ^7.61.1 | Forms |
| zod | ^3.25.76 | Validation |

### Media & PDF

| Package | Version | Purpose |
|---------|---------|---------|
| browser-image-compression | ^2.0.2 | Image Compression |
| jspdf | ^4.1.0 | PDF Generation |
| html2canvas | ^1.4.1 | HTML to Canvas |
| dompurify | ^3.3.1 | Sanitization |
| jszip | ^3.10.1 | Export/Import |

### PWA

| Package | Version | Purpose |
|---------|---------|---------|
| vite-plugin-pwa | ^1.2.0 | Service Worker + Manifest |

### Backend

| Technology | Purpose |
|------------|---------|
| Lovable Cloud | Edge Functions + Database |
| Gemini 2.5 Flash | AI Photo Analysis |

---

## Data Models

### InspectionRecord

```typescript
interface InspectionRecord {
  id: string;                              // UUID primary key
  propertyAddress: string;                 // Required
  inspectorName?: string;
  createdAt: number;                       // Unix timestamp (ms)
  updatedAt: number;                       // Unix timestamp (ms)
  photoIds: string[];                      // Array of photo IDs
  isComplete: boolean;
  clientName?: string;
  inspectionType?: InspectionType;
  customRooms?: string[];                  // Custom room IDs
  roomNotes?: Record<string, string>;      // Notes keyed by room
}

type InspectionType =
  | 'pre_purchase' | 'pre_listing' | 'annual'
  | 'insurance' | 'new_construction' | 'warranty' | 'other';
```

### PhotoRecord

```typescript
interface PhotoRecord {
  id: string;
  inspectionId: string;
  room: string;
  timestamp: number;
  notes: string;
  thumbnailBlob: Blob;                     // 320px, 80% quality
  fullImageBlob: Blob;                     // max 2048px, 85% quality

  // AI Analysis
  aiStatus: AIStatus;
  aiFindingTitle?: string;
  aiFindingTitleEs?: string;
  aiSeverity?: Severity;
  aiConfidence?: number;                   // 0–100
  aiDescription?: string;
  aiDescriptionEs?: string;
  aiRecommendation?: string;
  aiRecommendationEs?: string;
  aiCategory?: Category;
  aiFullAnalysis?: string;                 // Full JSON from AI

  // Manual Issue (from preset or custom)
  manualTitle?: string;
  manualTitleEs?: string;
  manualSeverity?: Severity;
  manualCategory?: Category;
  manualDescription?: string;
  manualDescriptionEs?: string;
  manualRecommendation?: string;
  manualRecommendationEs?: string;

  // Report Builder
  includeInReport?: boolean;
  reportOrder?: number;

  // Annotations
  annotationData?: string;                 // JSON stroke metadata
  annotatedImageBlob?: Blob;               // Rendered annotation image
  hasAnnotations?: boolean;
}

type AIStatus = 'pending_offline' | 'analyzing' | 'complete' | 'failed';
type Severity = 'minor' | 'moderate' | 'severe';
type Category = 'roofing' | 'plumbing' | 'electrical' | 'hvac'
              | 'foundation' | 'safety' | 'general';
```

### CustomRoom

```typescript
interface CustomRoom {
  id: string;
  name: string;
  nameEs?: string;
  isDefault: boolean;
  order: number;
}
```

### Phrase

```typescript
interface Phrase {
  id: string;
  text: string;
  textEs?: string;
  category: 'disclaimer' | 'note' | 'recommendation' | 'general';
  isFavorite: boolean;
  createdAt: number;
}
```

### IssuePreset

```typescript
interface IssuePreset {
  id: string;
  title: string;
  titleEs?: string;
  category: Category;
  severity: Severity;
  description: string;
  descriptionEs?: string;
  recommendation: string;
  recommendationEs?: string;
  createdAt: number;
}
```

### LicenseState

```typescript
interface LicenseState {
  status: 'active' | 'inactive' | 'invalid' | 'device_limit' | 'error';
  valid: boolean;
  message?: string;
  productIdOrPermalink: string;
  lastVerifiedAt: number;
  nextCheckAt: number;
  graceDays: number;                       // Default: 7
  allowCreateNew: boolean;
  allowAI: boolean;
  allowExport: boolean;                    // Always true
  device: { allowed: number; used: number };
}
```

### CompanyProfile

```typescript
interface CompanyProfile {
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
  customDisclaimer?: string;
  customDisclaimerEs?: string;
  scopeAndLimitations?: string;
  scopeAndLimitationsEs?: string;
  liabilityStatement?: string;
  liabilityStatementEs?: string;
  deferredItemsTemplates?: Array<{ area: string; reason: string }>;
  maintenanceTemplates?: string[];
}
```

---

## IndexedDB Schema

**Database Name:** `inspectai-db`  
**Version:** 2

| Store | Key Path | Indexes |
|-------|----------|---------|
| `inspections` | `id` | `by-date` (createdAt) |
| `photos` | `id` | `by-inspection` (inspectionId) |
| `settings` | `key` | — |
| `customRooms` | `id` | — |
| `phrases` | `id` | `by-category`, `by-favorite` |
| `issuePresets` | `id` | `by-category` |

**Known Settings Keys:**
- `roomOrder` — JSON string[] of room order
- `language` — `"en"` or `"es"`
- `company-profile` — JSON CompanyProfile
- `company-profile-logo` — Base64 logo string
- `license_state` — JSON LicenseState
- `license_key` — Plain license key string

---

## Core Features API

### Database Operations (`src/lib/db.ts`)

#### Inspections

| Function | Signature | Description |
|----------|-----------|-------------|
| `saveInspection` | `(inspection: InspectionRecord) → Promise<void>` | Create/update |
| `getInspection` | `(id: string) → Promise<InspectionRecord?>` | Get by ID |
| `getCurrentInspection` | `() → Promise<InspectionRecord?>` | Get active (non-complete) |
| `deleteInspection` | `(id: string) → Promise<void>` | Delete with all photos |

#### Photos

| Function | Signature | Description |
|----------|-----------|-------------|
| `savePhoto` | `(photo: PhotoRecord) → Promise<void>` | Create/update |
| `getPhoto` | `(id: string) → Promise<PhotoRecord?>` | Get by ID |
| `getPhotosByInspection` | `(inspectionId: string) → Promise<PhotoRecord[]>` | All photos for inspection |
| `deletePhoto` | `(id: string) → Promise<void>` | Delete single photo |
| `getPendingPhotos` | `() → Promise<PhotoRecord[]>` | Photos needing AI analysis |
| `updatePhotoAI` | `(id, aiData) → Promise<void>` | Update AI fields only |

#### Settings

| Function | Signature |
|----------|-----------|
| `getSetting` | `(key: string) → Promise<string?>` |
| `setSetting` | `(key: string, value: string) → Promise<void>` |
| `getRoomOrder` | `() → Promise<string[]>` |
| `saveRoomOrder` | `(order: string[]) → Promise<void>` |

#### Custom Rooms / Phrases / Issue Presets

Standard CRUD: `save*`, `getAll*`, `delete*`, plus `getPhrasesByCategory` and `getPresetsByCategory`.

---

### Hooks

#### `useInspection`

```typescript
const {
  inspection,          // InspectionRecord | null
  photos,              // PhotoRecord[]
  isLoading,           // boolean
  startInspection,     // (address, inspector?, client?, type?) → Promise
  updateInspection,    // (updates) → Promise
  capturePhoto,        // (blob, room?) → Promise<PhotoRecord>
  updatePhoto,         // (id, updates) → Promise
  deletePhoto,         // (id) → Promise
  updatePhotoWithAI,   // (id, aiData) → Promise
  finishInspection,    // () → Promise
  refreshPhotos,       // () → Promise
  updateRoomNotes,     // (room, notes) → Promise
  appendRoomNotes,     // (room, text) → Promise
  clearRoomNotes,      // (room) → Promise
} = useInspection();
```

#### `useLicense`

```typescript
const {
  licenseState,           // LicenseState
  isLoading,              // boolean
  isVerifying,            // boolean
  licenseKey,             // string
  deviceId,               // string
  effectivePermissions,   // { allowCreateNew, allowAI, allowExport }
  remainingGraceDays,     // number
  isWithinGrace,          // boolean
  setLicenseKey,          // (key: string) → void
  verifyLicense,          // () → Promise<LicenseState>
  resetDevices,           // () → Promise<LicenseState>
} = useLicense();
```

#### `useLanguage`

```typescript
const { language, setLanguage, t } = useLanguage();
// language: 'en' | 'es'
// t: (key: string) → string
```

#### `useOnlineStatus`

```typescript
const isOnline: boolean = useOnlineStatus();
```

#### `useVoiceDictation`

```typescript
const {
  isListening, isSupported, transcript,
  startListening, stopListening,
} = useVoiceDictation();
```

---

## Edge Functions

### `analyze-photo`

**Location:** `supabase/functions/analyze-photo/index.ts`  
**Method:** POST  
**CORS:** Strict whitelist (production + preview + localhost)

**Request:**
```json
{
  "imageBase64": "data:image/jpeg;base64,...",
  "room": "kitchen",
  "language": "en"
}
```

**Validation:**
- `imageBase64`: required, string, max 10MB
- `language`: must be `"en"` or `"es"`

**Response (success):**
```json
{
  "findings": [
    {
      "title": "Water Staining Observed",
      "title_es": "Manchas de Agua Observadas",
      "observation": "...",
      "observation_es": "...",
      "implication": "...",
      "implication_es": "...",
      "recommendation": "...",
      "recommendation_es": "...",
      "description": "...",
      "description_es": "...",
      "severity": "moderate",
      "status": "repair",
      "category": "plumbing",
      "confidence": 85
    }
  ],
  "overallCondition": "fair",
  "summary": "...",
  "summary_es": "..."
}
```

**Error Codes:**
| Status | Meaning |
|--------|---------|
| 400 | Missing/invalid input |
| 402 | AI credits exhausted |
| 413 | Image too large (>10MB) |
| 429 | Rate limit exceeded |
| 500 | AI service error |

**AI Model:** `google/gemini-2.5-flash` via Lovable AI Gateway  
**Secrets Required:** `LOVABLE_API_KEY`

---

### `verify-license`

**Location:** `supabase/functions/verify-license/index.ts`  
**Method:** POST  
**CORS:** Strict whitelist

**Request:**
```json
{
  "licenseKey": "ABCD-1234-EFGH-5678",
  "productIdOrPermalink": "",
  "deviceId": "device_1234567890_abc123",
  "action": "verify"
}
```

**Actions:**
- `verify` — Validate license, register/update device
- `reset_devices` — Clear all registered devices (30-day cooldown)

**Input Validation:**
- `licenseKey`: max 100 chars, alphanumeric + `-_`
- `deviceId`: max 64 chars, alphanumeric + `-_`
- `productIdOrPermalink`: max 50 chars (optional)

**Response:** Returns `LicenseState` object (see Data Models).

**Security:**
- License keys hashed with SHA-256 before device table lookup
- Generic error messages prevent key enumeration
- Sensitive fields redacted from all logs
- RLS blocks all direct client access to tables

**Secrets Required:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

---

## Licensing System

### Client-Side Flow

1. **App Launch** → `useLicense` loads cached `LicenseState` from IndexedDB
2. **Online** → Calls `verify-license` Edge Function → Updates cache
3. **Offline** → Checks 7-day grace period → Grants/denies features
4. **Expired Grace** → Locks `allowCreateNew` and `allowAI`, keeps `allowExport`

### Grace Period Logic (`src/lib/license.ts`)

```typescript
const GRACE_PERIOD_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function isWithinGracePeriod(state: LicenseState): boolean {
  if (!state.lastVerifiedAt) return false;
  return (Date.now() - state.lastVerifiedAt) <= GRACE_PERIOD_MS;
}

function getEffectivePermissions(state, isOnline): Permissions {
  // Export always allowed
  // Online: use server permissions
  // Offline + grace: use cached permissions
  // Offline + expired grace: lock create + AI
}
```

### Device ID Generation

```typescript
// Persistent per browser via localStorage
`device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
```

### Cloud Database (RLS-protected)

**`licenses` table:**
| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | Auto-increment |
| license_key | text | Unique, never hashed in DB |
| product_id | text | Product identifier |
| is_active | boolean | Default true |
| expires_at | timestamptz | Nullable (null = perpetual) |
| max_devices | integer | Default 2 |
| customer_name | text | Nullable |
| email | text | Nullable |
| reset_count | integer | Default 0 |
| last_reset_at | timestamptz | Nullable |
| created_at | timestamptz | Default now() |
| notes | text | Admin notes |

**`license_devices` table:**
| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | Auto-increment |
| license_hash | text | SHA-256 of license_key |
| device_id | text | Client-generated |
| activated_at | timestamptz | Default now() |
| last_seen_at | timestamptz | Updated on each verify |

**RLS:** All policies deny all operations for `anon` and `authenticated` roles. Only `service_role` (used by Edge Functions) can access these tables.

---

## AI Integration

### Analysis Pipeline

```
Photo (Blob)
  → blobToDataUrl (base64)
  → supabase.functions.invoke('analyze-photo')
  → Edge Function validates input
  → Gemini 2.5 Flash (via Lovable AI Gateway)
  → Structured JSON via tool_choice (suggest_findings)
  → Update PhotoRecord in IndexedDB
```

### AI Prompt Architecture

The system prompt establishes an expert licensed property inspector persona using the "Best-of Hybrid Inspection Report" format:

- **Language**: Professional, neutral, third-person, court-defensible
- **Structure**: Observation → Implication → Recommendation
- **Status Labels**: safety, repair, maintenance, monitor
- **Severity Mapping**: severe → safety/major, moderate → repair, minor → maintenance/monitor
- **Restrictions**: No AI references, no emojis, no speculation, no absolutes

### Offline Fallback

When AI analysis fails or is unavailable, a mock analysis system provides realistic placeholder findings:
- 6 bilingual finding templates
- Randomized category and confidence
- Follows identical Observation → Implication → Recommendation structure
- Status-to-severity mapping

---

## PDF Report System

### Report Title

All reports: **"PROPERTY INSPECTION REPORT"**  
All branding: **"365 InspectAI"**

### Module Structure

```
src/lib/pdf/
├── index.ts                  # Main orchestration
├── reportTypes.ts            # Types, status labels, condition mappings
├── pdfUtils.ts               # Shared utilities (margins, fonts, colors)
├── coverPage.ts              # Cover page with signature area
├── agentSummarySection.ts    # Agent-Friendly Summary (1 page)
├── agentSummaryPdf.ts        # Standalone agent summary export
├── tableOfContents.ts        # Clickable ToC with page numbers
├── summarySection.ts         # Inspection Summary + Systems Overview
├── scopeSection.ts           # Standards, scope, exclusions
├── findingsSection.ts        # System-by-system detailed findings
├── conclusionSection.ts      # Disclaimers, legal notices
└── upsellRecommendations.ts  # Maintenance recommendations
```

### Report Sections

| # | Section | Key Content |
|---|---------|-------------|
| 1 | Cover Page | Property, date, client, inspector, company branding, signature |
| 2 | Agent-Friendly Summary | 1-page standalone reference (Safety/Repair/Maintenance only) |
| 3 | Table of Contents | Clickable with dotted leader lines |
| 4 | Inspection Summary | Systems Overview table + Key Findings + Overall Assessment |
| 5 | Scope & Limitations | Standards, custom scope, exclusions |
| 6 | Detailed Findings | Per-system with photos, status badges, O→I→R flow |
| 7 | Deferred Items | Uninspected areas with reasons |
| 8 | Maintenance | Non-urgent recommendations |
| 9 | Disclaimers | Legal, liability, walkthrough guide |
| 10 | Credentials | Inspector info, certifications, contact |

### Ancillary Sections (Optional)

Render only when populated/enabled:
- **Radon** — Inspection checklist, notes, photos
- **WDI (Termite)** — Wood Destroying Insects inspection
- **Mold** — Mold inspection findings

### Finding Status Labels

| Status | English | Spanish | Use Case |
|--------|---------|---------|----------|
| safety | Safety | Seguridad | Immediate safety concerns |
| repair | Repair Recommended | Reparación Recomendada | Major defects |
| maintenance | Maintenance | Mantenimiento | Routine maintenance |
| monitor | Monitor | Monitorear | Items to watch |

---

## Offline-First Architecture

### Service Worker

**Strategy:** Workbox via vite-plugin-pwa with `registerType: "autoUpdate"`

| Resource | Strategy | Details |
|----------|----------|---------|
| Static assets | CacheFirst | `**/*.{js,css,html,ico,png,svg,woff,woff2}` |
| Google Fonts | CacheFirst | 1-year expiry, max 10 entries |
| API calls | NetworkFirst | Fallback to cache/offline queue |

### Data Sync Queue (`src/lib/offlineSyncQueue.ts`)

```typescript
interface SyncOperation {
  id: string;
  type: 'photo_analysis' | 'inspection_update';
  payload: any;
  attempts: number;
  lastAttempt?: number;
  status: 'pending' | 'in_progress' | 'failed';
}
```

- IndexedDB-backed queue
- Exponential backoff: 1s, 2s, 4s, 8s…
- Max 5 retries
- Persists across app restarts
- Auto-processes when online status changes

### Online Status Detection

```typescript
const isOnline = useOnlineStatus();
// Listens to window 'online'/'offline' events
// Used for: status indicator, AI queue processing, license verification
```

---

## PWA Configuration

### Manifest

```json
{
  "name": "365 InspectAI - Home Inspection Software",
  "short_name": "365 InspectAI",
  "theme_color": "#0F172A",
  "background_color": "#0F172A",
  "display": "standalone",
  "orientation": "portrait-primary",
  "start_url": "/"
}
```

### Icons

| Size | File | Purpose |
|------|------|---------|
| 192×192 | `/icon-192.png` | Standard |
| 512×512 | `/icon-512.png` | Splash |
| 512×512 | `/icon-512-maskable.png` | Adaptive |
| 180×180 | `/apple-touch-icon.png` | iOS |

### iOS Meta Tags

```html
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="365 InspectAI" />
```

---

## Annotation System

### Architecture

- **Stroke-based** rendering (not ImageData snapshots)
- **Dual-resolution**: 1024×768 for editing, full resolution for export
- **DPR-aware** for retina displays

### Key Files

| File | Purpose |
|------|---------|
| `strokeTypes.ts` | Stroke interface, decimation, merging utilities |
| `strokeRenderer.ts` | Scale-aware rendering engine |
| `AnnotationCanvas.tsx` | Touch/mouse drawing canvas |
| `ZoomableAnnotationCanvas.tsx` | Pinch-zoom wrapper |
| `PhotoAnnotationEditor.tsx` | Main editor with undo/redo |

### Tools

Arrow, Circle, Rectangle, Freehand, Text

### Guardrails

| Guardrail | Value |
|-----------|-------|
| Max undo steps | 50 |
| Max strokes | 500 |
| Max memory | 50MB |
| Point decimation | 2px tolerance (50–80% reduction) |
| Micro-stroke merge | <5 points within 500ms |

### Performance

| Metric | Before | After |
|--------|--------|-------|
| Per undo step | 12MB | 1KB |
| Canvas lag (20 strokes) | 100ms | <5ms |
| Frame rate | 10fps | 60fps |

---

## Internationalization

### Supported Languages

| Code | Language | Tone |
|------|----------|------|
| `en` | English | Professional |
| `es` | Spanish | Formal professional |

### Usage

```typescript
const { t, language, setLanguage } = useLanguage();
t('saveReport'); // → "Save Report" or "Guardar Informe"
```

### Coverage

- All UI labels and buttons
- All PDF report sections
- AI analysis output (bilingual findings)
- Status labels, categories, severity levels
- Error messages and notifications

---

## Security

### Input Validation

| Endpoint | Validation |
|----------|-----------|
| analyze-photo | imageBase64: required string ≤10MB; language: ["en","es"] |
| verify-license | licenseKey: ≤100 chars, `/^[A-Za-z0-9\-_]+$/`; deviceId: ≤64 chars |

### CORS

Both Edge Functions enforce a strict origin whitelist:
- `https://inspect-ai-anywhere.lovable.app` (production)
- `https://id-preview--*.lovable.app` (preview)
- `http://localhost:5173`, `http://localhost:8080` (development)

### Database Security

- RLS on `licenses` and `license_devices` denies all `anon`/`authenticated` access
- Only `service_role` (Edge Functions) can read/write license data
- No foreign keys to `auth.users` (standalone app, no auth)

### Data Protection

- License keys: SHA-256 hashed for device table lookups
- Anti-enumeration: generic "License verification failed" for all invalid states
- Log redaction: license keys, device IDs, emails, hashes never logged
- DOMPurify: all user input and AI output sanitized before rendering
- Local data: IndexedDB (browser-level encryption at rest)

---

## File Structure

```
365-inspectai/
├── public/
│   ├── favicon.ico, icon-192.png, icon-512.png, icon-512-maskable.png
│   ├── apple-touch-icon.png, logo.png
│   ├── manifest.json, robots.txt, placeholder.svg
├── src/
│   ├── assets/
│   │   ├── demo/ (4 sample photos)
│   │   └── logo.png
│   ├── components/
│   │   ├── ui/ (40+ shadcn/ui components)
│   │   ├── AnnotationCanvas.tsx, AnnotationControls.tsx, AnnotationToolbar.tsx
│   │   ├── AppSidebar.tsx, CameraCapture.tsx, CompanyProfileSettings.tsx
│   │   ├── DashboardHub.tsx, DropZone.tsx, ExportImportButtons.tsx
│   │   ├── ImageLightbox.tsx, InspectionHeader.tsx, IssuePresetSelector.tsx
│   │   ├── LicenseSettings.tsx, LiveNotesPanel.tsx, NavLink.tsx
│   │   ├── NewInspectionForm.tsx, PhotoAnnotationEditor.tsx
│   │   ├── PhotoDetailPanel.tsx, PhotoGallery.tsx, PhraseLibrary.tsx
│   │   ├── PrivacyPolicy.tsx, QuickCaptureMode.tsx
│   │   ├── ReportBuilder.tsx, ReportDialog.tsx, ReportReviewScreen.tsx
│   │   ├── RoomSelector.tsx, SideMenu.tsx, StatusBar.tsx
│   │   ├── StorageMeter.tsx, TermsOfService.tsx
│   │   ├── VoiceDictationButton.tsx, WelcomePage.tsx
│   │   └── ZoomableAnnotationCanvas.tsx
│   ├── hooks/
│   │   ├── use-mobile.tsx, use-toast.ts
│   │   ├── useInspection.ts, useLanguage.ts, useLicense.ts
│   │   ├── useOnlineStatus.ts, useVoiceDictation.ts
│   ├── lib/
│   │   ├── pdf/ (11 modular PDF generation files)
│   │   ├── db.ts, aiAnalysis.ts, license.ts, licenseCache.ts
│   │   ├── i18n.ts, imageUtils.ts, companyProfile.ts
│   │   ├── strokeTypes.ts, strokeRenderer.ts, bitmapUtils.ts
│   │   ├── annotationUtils.ts, exportAnnotation.ts
│   │   ├── offlineSyncQueue.ts, storageUtils.ts
│   │   ├── defaultData.ts, demoData.ts
│   │   ├── exportImport.ts, reportConfig.ts
│   │   ├── pdfGenerator.ts, professionalReportPdf.ts, reportPdfGenerator.ts
│   │   └── utils.ts
│   ├── integrations/supabase/ (auto-generated client.ts + types.ts)
│   ├── pages/ (Index.tsx, NotFound.tsx)
│   ├── test/ (setup.ts, example.test.ts)
│   ├── App.tsx, App.css, index.css, main.tsx, vite-env.d.ts
├── supabase/
│   ├── functions/
│   │   ├── analyze-photo/index.ts
│   │   └── verify-license/index.ts
│   └── config.toml
├── ARCHITECTURE.md, TECHNICAL_DOCUMENTATION.md, README.md
├── PRODUCTION_READY_VERIFICATION.md
├── index.html, vite.config.ts, tailwind.config.ts
├── tsconfig.json, tsconfig.app.json, tsconfig.node.json
├── eslint.config.js, postcss.config.js, components.json
└── vitest.config.ts
```

---

## Environment Variables

| Variable | Source | Purpose |
|----------|--------|---------|
| `VITE_SUPABASE_URL` | Auto-generated (.env) | Backend URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Auto-generated (.env) | Anon key |
| `VITE_SUPABASE_PROJECT_ID` | Auto-generated (.env) | Project ID |

**Edge Function Secrets (server-side only):**

| Secret | Purpose |
|--------|---------|
| `LOVABLE_API_KEY` | Lovable AI Gateway access |
| `SUPABASE_URL` | Backend URL (for service role client) |
| `SUPABASE_SERVICE_ROLE_KEY` | Full DB access for license ops |

---

## Deployment

### URLs

| Environment | URL |
|-------------|-----|
| Preview | `https://id-preview--8cd0f791-ce4c-4a88-8c8b-73979d499fed.lovable.app` |
| Production | `https://inspect-ai-anywhere.lovable.app` |

### Build

```bash
npm run build   # or: bun run build
# Output: dist/ (static files)
```

---

## Browser Support

| Browser | Support |
|---------|---------|
| Chrome/Edge (Android) | ✅ Full (recommended) |
| Safari (iOS 16.4+) | ✅ Full with PWA install |
| Firefox | ✅ Core features (no PWA install) |
| Desktop Chrome/Edge | ✅ Full |
| Desktop Safari | ⚠️ Limited (no service worker persistence) |

**Required APIs:** IndexedDB, Service Workers, MediaDevices (camera), Web Speech (dictation)

---

*This document is the primary technical reference for 365 InspectAI. See ARCHITECTURE.md for a higher-level feature overview.*
