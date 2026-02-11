# 365 InspectAI — Technical Documentation

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Data Models](#data-models)
5. [IndexedDB Schema](#indexeddb-schema)
6. [Core Features](#core-features)
7. [Edge Functions](#edge-functions)
8. [Licensing System](#licensing-system)
9. [AI Integration](#ai-integration)
10. [PDF Report System](#pdf-report-system)
11. [PDF Navigation Tabs (Two-Pass)](#pdf-navigation-tabs-two-pass)
12. [Offline-First Architecture](#offline-first-architecture)
13. [PWA Configuration](#pwa-configuration)
14. [Annotation System](#annotation-system)
15. [Internationalization](#internationalization)
16. [Security](#security)
17. [File Structure](#file-structure)
18. [Environment Variables](#environment-variables)
19. [Deployment](#deployment)
20. [Browser Support](#browser-support)
21. [Testing Guide](#testing-guide)
22. [Migration Guide](#migration-guide)

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
│  IndexedDB v4 (native IDBDatabase API)                          │
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
│   │   ├── WelcomePage (onboarding + license activation)
│   │   ├── NewInspectionForm
│   │   ├── InspectionHeader
│   │   ├── RoomSelector (sticky, drag-and-drop reorder)
│   │   ├── QuickCaptureMode
│   │   │   ├── CameraCapture (front/back camera selection)
│   │   │   ├── DropZone (file upload)
│   │   │   └── LiveNotesPanel (voice → room-grouped notes)
│   │   ├── PhotoGallery (thumbnail grid + AI status badges)
│   │   │   ├── PhotoDetailPanel (full view + editing)
│   │   │   ├── PhotoAnnotationEditor
│   │   │   │   ├── ZoomableAnnotationCanvas
│   │   │   │   ├── AnnotationToolbar
│   │   │   │   └── AnnotationControls
│   │   │   ├── IssuePresetSelector (manual defect tagging)
│   │   │   └── ImageLightbox
│   │   ├── ReportBuilder (Tabs: Photos/Deferred/Maintenance/Legal)
│   │   ├── ReportReviewScreen
│   │   ├── ReportDialog (Agent Summary default + Full Report)
│   │   ├── CompanyProfileSettings (white-label branding)
│   │   ├── LicenseSettings (activation + device management)
│   │   ├── PhraseLibrary
│   │   └── StorageMeter
│   ├── StatusBar (online/offline, photo count, language toggle)
│   ├── PrivacyPolicy
│   └── TermsOfService
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
| idb | ^8.0.3 | IndexedDB Wrapper (legacy, see note) |
| Native IDBDatabase | - | Primary IndexedDB API (db-native.ts) |
| @tanstack/react-query | ^5.83.0 | Server State |
| react-hook-form | ^7.61.1 | Forms |
| zod | ^3.25.76 | Validation |

> **Note:** The project migrated from the `idb` wrapper to native `IDBDatabase` API (`db-native.ts`) due to compatibility issues. The `idb` package remains installed but `db-native.ts` is the primary database interface.

### Media & PDF

| Package | Version | Purpose |
|---------|---------|---------|
| browser-image-compression | ^2.0.2 | Image Compression |
| jspdf | ^4.1.0 | PDF Generation |
| html2canvas | ^1.4.1 | HTML to Canvas |
| dompurify | ^3.3.1 | Sanitization |
| jszip | ^3.10.1 | Export/Import ZIP |

### PWA

| Package | Version | Purpose |
|---------|---------|---------|
| vite-plugin-pwa | ^1.2.0 | Service Worker + Manifest |

### Backend

| Technology | Purpose |
|------------|---------|
| Lovable Cloud (Supabase) | Edge Functions + Database |
| Google Gemini 2.5 Flash | AI Photo Analysis |

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
  thumbnailBlob: Blob;                     // ~200px, 80% quality
  fullImageBlob: Blob;                     // max ~1920px, 85% quality

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

  // Manual Issue (from preset or custom) — ALWAYS takes priority over AI
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

### Supporting Models

```typescript
interface CustomRoom {
  id: string;
  name: string;
  nameEs?: string;
  isDefault: boolean;
  order: number;
}

interface Phrase {
  id: string;
  text: string;
  textEs?: string;
  category: 'disclaimer' | 'note' | 'recommendation' | 'general';
  isFavorite: boolean;
  createdAt: number;
}

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
**Version:** 4

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

## Core Features

### 1. Onboarding & License Guard

A mandatory onboarding screen blocks all app features until the user:
1. Reviews and accepts Terms of Service and Privacy Policy
2. Provides a valid license key
3. Successfully activates the license

Completion is persisted in `localStorage`. Users cannot bypass this gate.

### 2. Dashboard Hub

Central landing page with:
- Active inspection status card (address, photo count, progress)
- "Create New Inspection" button (license-gated)
- "Load Demo Inspection" for evaluation
- Import/Export ZIP functionality
- Storage usage meter
- Quick navigation to all sections

### 3. Inspection Management

**Create → Capture → Review → Report → Complete**

- **New Inspection Form**: Address (required), inspector name, client name, inspection type selector (Pre-Purchase, Pre-Listing, Annual, Insurance, New Construction, Warranty, Other)
- **Demo Mode**: Pre-loaded inspection with 4 sample photos (roof damage, foundation crack, plumbing leak, electrical issue) with pre-populated AI analysis data
- **Inspection Header**: Shows active inspection context, photo count, completion status
- **Finish Inspection**: Marks complete, returns to dashboard

### 4. Room System

**25+ Default Rooms:**
Exterior, Roof, Garage, Kitchen, Living Room, Dining Room, Main Bedroom, Bedroom 2, Bedroom 3, Master Bath, Hall Bath, Half Bath, Laundry Room, Utility Room, Attic, Basement, Crawl Space, Electrical Panel, Water Heater, HVAC, AC, Furnace, Pool, Driveway, Porch, Deck, Patio, Yard, Fireplace, Sewer, Other

**Features:**
- Horizontally scrollable pill bar selector
- Sticky selection persists across views
- Custom room creation (bilingual names)
- Drag-and-drop manual reordering (persisted in settings)
- Room-based photo filtering and note grouping

### 5. Photo Capture & Processing

**Camera-First Interface:**
- Native camera access via `getUserMedia` with front/back camera toggle
- Fallback file input for devices without camera API
- DropZone for drag-and-drop file upload

**Processing Pipeline:**
```
Camera/Upload → browser-image-compression →
  ├── Full Image: max ~1920px, 85% JPEG quality
  └── Thumbnail: ~200px, 80% JPEG quality
  → IndexedDB storage → Queue for AI analysis
```

**Quick Capture Mode:** Rapid-fire photo taking with room selector overlay and instant AI queuing.

**Capacity:** Up to 200 photos per inspection.

### 6. Photo Gallery & Detail

- **Gallery**: Thumbnail grid filtered by selected room, with AI status badges (pending/analyzing/complete/failed)
- **Photo Detail Panel**: Slide-up panel with full image view, AI analysis results, manual override fields for all properties (title, severity, category, description, recommendation)
- **Image Lightbox**: Full-screen zoomable photo viewer
- **Manual overrides always take priority over AI-generated fields**

### 7. Photo Annotation

Canvas-based drawing tools for marking defects directly on photos.

**Tools:** Arrow, Circle, Rectangle, Freehand, Text  
**Controls:** Color picker, stroke thickness, undo/redo  
**Touch:** Pinch-zoom with `ZoomableAnnotationCanvas`

**Technical Highlights:**
- Stroke-based rendering (1KB/stroke vs 12MB/ImageData snapshot)
- Dual-resolution canvas: 1024×768 editing, full-res export
- Point decimation (50–80% reduction, <2px visual loss)
- Micro-stroke merging (<5 points within 500ms)
- Guardrails: max 50 undo steps, 500 strokes, 50MB memory cap
- DPR-aware for retina displays

### 8. Voice Dictation

Hands-free note-taking via Web Speech API.
- Real-time speech-to-text transcription
- Room-based note organization in LiveNotesPanel
- Append/clear notes per room
- Dictated notes included in room notes section of reports
- Works offline (browser-dependent)

### 9. Phrase Library

Searchable, reusable text snippets:
- Categories: Disclaimer, Note, Recommendation, General
- Favorites system for quick access
- Bilingual support (EN/ES)
- Quick-insert into photo notes or room notes

### 10. Issue Preset Selector

Predefined defect templates for manual photo tagging:
- Pre-built templates by category (Roofing, Plumbing, Electrical, etc.)
- Each preset includes title, severity, category, description, recommendation
- Bilingual support
- Quick-apply to any photo

### 11. Report Builder

Tabbed interface for report preparation:
- **Photos Tab**: Review and reorder photos, toggle inclusion in report
- **Deferred Items Tab**: Areas not inspected with reasons
- **Maintenance Tab**: Non-urgent recommendations
- **Legal Tab**: Custom disclaimers, scope, liability statements
- Language selector (English / Spanish / Both)
- Optional sections toggle: Table of Contents, Introduction/Scope, Conclusion/Disclaimers

### 12. Report Dialog & Export

**Two export types:**

| Type | Description |
|------|-------------|
| **Agent-Friendly Summary** (default) | 1-page standalone PDF — "The summary agents actually read." Shows only Safety/Repair/Maintenance findings. Key selling point. |
| **Full Professional Report** | Complete multi-section report (see PDF Report System below) |

### 13. Company Profile (White-Label)

Full branding customization for reports:
- Company name, tagline, logo (blob storage in IndexedDB)
- Inspector name, license number, certifications
- Contact info (phone, email, website, address)
- Custom disclaimer, scope & limitations, liability statement (bilingual)
- Deferred items templates, maintenance templates
- Logo appears on PDF cover page and page headers

### 14. Data Export/Import (Portability)

**Export:** Full inspection as `.zip` file containing:
- `inspection.json` — All metadata
- Photo blobs (full + thumbnail + annotated)
- Room notes, AI analysis data

**Import:** Restore inspection from exported ZIP
- If inspection ID already exists, creates a new unique instance (never overwrites)
- Enables multi-device workflows: start on phone, finish on desktop

### 15. Storage Meter

Visual indicator of IndexedDB usage:
- Shows total storage consumed by photos
- Per-inspection breakdown
- Warning thresholds for approaching browser limits

---

## Edge Functions

### `analyze-photo`

**Location:** `supabase/functions/analyze-photo/index.ts`  
**Method:** POST  
**JWT:** Disabled (security via license verification + CORS + rate limiting)  
**CORS:** Strict whitelist (`.lovable.app`, `.netlify.app`, `localhost`)

**Request:**
```json
{
  "imageBase64": "data:image/jpeg;base64,...",
  "room": "kitchen",
  "language": "en",
  "licenseKey": "ABCD-1234-EFGH-5678",
  "deviceId": "device_1234567890_abc123"
}
```

**Validation:**
- `imageBase64`: required string, max 10MB
- `language`: must be `"en"` or `"es"`
- `licenseKey`: required string
- `deviceId`: required string

**Security Layers:**
1. License verification (queries `licenses` table for active license with `allow_ai = true`)
2. Rate limiting (5 requests/minute per device, in-memory Map)
3. CORS origin whitelist
4. Payload size limit (10MB)

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
| 403 | Invalid/inactive license |
| 413 | Image too large (>10MB) |
| 429 | Rate limit exceeded |
| 500 | AI service error |

**AI Model:** `google/gemini-2.5-flash` via Lovable AI Gateway (`https://ai.gateway.lovable.dev/v1/chat/completions`)  
**Secrets Required:** `LOVABLE_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

---

### `verify-license`

**Location:** `supabase/functions/verify-license/index.ts`  
**Method:** POST  
**JWT:** Disabled  
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
- `verify` — Validate license, register/update device, check device limit
- `reset_devices` — Clear all registered devices (30-day cooldown between resets)

**Input Validation:**
- `licenseKey`: max 100 chars, `/^[A-Za-z0-9\-_]+$/`
- `deviceId`: max 64 chars, `/^[A-Za-z0-9\-_]+$/`
- `productIdOrPermalink`: max 50 chars (optional)

**Response:** Returns `LicenseState` object.

**Security:**
- License keys hashed with SHA-256 (`crypto.subtle`) before device table lookup
- Generic error messages prevent key enumeration
- Sensitive fields redacted from all logs
- RLS blocks all direct client access

**Secrets Required:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

---

## Licensing System

### Client-Side Flow

```
App Launch → useLicense hook → Load cached state from IndexedDB
  │
  ├── License key present?
  │   ├── Online → Call verify-license Edge Function
  │   │   → SHA-256 hash license key
  │   │   → Check licenses table (is_active, expires_at)
  │   │   → Check/register device in license_devices table
  │   │   → Return LicenseState → Cache in IndexedDB
  │   │
  │   └── Offline → Check grace period
  │       ├── Within 7 days → Use cached permissions
  │       └── Expired → Lock create + AI, keep export
  │
  └── No key → Show license activation screen
```

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

### Feature Gating

| Feature | Unlicensed | Licensed | Offline (grace) | Offline (expired) |
|---------|------------|----------|------------------|--------------------|
| Create Inspection | ❌ | ✅ | ✅ | ❌ |
| AI Analysis | ❌ | ✅ | ✅ | ❌ |
| Export/PDF | ✅ Always | ✅ | ✅ | ✅ |
| View Existing | ✅ | ✅ | ✅ | ✅ |

### Cloud Database (RLS-protected)

**`licenses` table:**
| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | Auto-increment |
| license_key | text | Unique |
| product_id | text | Default: 'inspectai-pro' |
| is_active | boolean | Default true |
| expires_at | timestamptz | Nullable (null = perpetual) |
| max_devices | integer | Default 2 |
| customer_name | text | Nullable |
| email | text | Nullable |
| reset_count | integer | Default 0 |
| last_reset_at | timestamptz | Nullable |
| created_at | timestamptz | Default now() |
| notes | text | Admin notes |
| allow_ai | boolean | Controls AI analysis access |

**`license_devices` table:**
| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | Auto-increment |
| license_hash | text | SHA-256 of license_key |
| device_id | text | Client-generated |
| activated_at | timestamptz | Default now() |
| last_seen_at | timestamptz | Updated on each verify |

**RLS:** Both tables have restrictive policies — `false` for all operations via `anon`/`authenticated`. Only `service_role` (Edge Functions) can access.

---

## AI Integration

### Analysis Pipeline

```
Photo (Blob)
  → blobToDataUrl (base64)
  → supabase.functions.invoke('analyze-photo', { body: { imageBase64, room, language, licenseKey, deviceId } })
  → Edge Function validates inputs + verifies license + checks rate limit
  → Gemini 2.5 Flash (via Lovable AI Gateway)
  → Structured JSON via tool_choice (suggest_findings)
  → overallCondition mapped: satisfactory→good, marginal→fair, deficient→poor
  → Update PhotoRecord in IndexedDB
```

### AI Prompt Architecture

The system prompt establishes an expert licensed property inspector persona using the "Best-of Hybrid Inspection Report" format:

- **Persona**: Licensed property inspector (no AI/software references)
- **Language**: Professional, neutral, third-person, court-defensible
- **Structure**: Observation → Implication → Recommendation
- **Required phrases**: "Observed", "Appears to", "At the time of inspection", "Recommend further evaluation by [specialist]"
- **Forbidden phrases**: "I found", "Definitely", "Will cause", "Dangerous" (use "safety concern")
- **Status Labels**: safety, repair, maintenance, monitor
- **Severity Mapping**: severe → safety/major defects, moderate → repair needed, minor → maintenance/monitor
- **Categories**: roofing, plumbing, electrical, hvac, foundation, safety, general
- **Bilingual output**: All findings returned in both English and Spanish

### Offline Fallback

When AI analysis fails or the device is offline:
- Photos queued with `aiStatus: 'pending_offline'`
- Auto-analyzed when connectivity is restored
- Mock analysis system provides realistic placeholder findings as fallback:
  - 6 bilingual finding templates
  - Randomized category and confidence
  - Follows identical O→I→R structure

---

## PDF Report System

### Report Title & Branding

All reports: **"PROPERTY INSPECTION REPORT"**  
All branding: **"365 InspectAI"**

### Module Structure

```
src/lib/pdf/
├── index.ts                  # Module exports
├── reportTypes.ts            # Types, interfaces, status labels, PDFContext
├── pdfUtils.ts               # Shared utilities (createPDFContext, margins, fonts)
├── coverPage.ts              # Cover page with vector house icon, signature area
├── agentSummarySection.ts    # Agent-Friendly Summary (1-page embedded in full report)
├── agentSummaryPdf.ts        # Standalone agent summary PDF export
├── tableOfContents.ts        # Clickable ToC with dotted leaders + page numbers
├── summarySection.ts         # Inspection Summary + Inspected Systems Overview table
├── scopeSection.ts           # Standards, scope & limitations, deferred items
├── findingsSection.ts        # System-by-system findings with photos
├── conclusionSection.ts      # Disclaimers, maintenance, credentials
├── pageHeader.ts             # Navigation tab system + finalizeTabLinks
├── upsellRecommendations.ts  # Maintenance recommendations
└── reportTypes.ts            # PDFContext, TOCEntry, StatusInfo types

src/lib/
├── professionalReportPdf.ts  # Main full report orchestrator
├── reportPdfGenerator.ts     # Report generation entry point
├── pdfGenerator.ts           # Legacy/utility PDF helpers
└── reportConfig.ts           # Report section configuration
```

### Full Report Structure

| # | Section | Key Content |
|---|---------|-------------|
| 1 | **Cover Page** | Property address, date, client, inspector credentials, company branding, vector house icon, signature area, "Confidential and Proprietary" notice |
| 2 | **Agent-Friendly Summary** | 1-page standalone reference (Safety/Repair/Maintenance only) — the key selling feature |
| 3 | **Table of Contents** | Clickable with dotted leader lines and page numbers |
| 4 | **Inspection Summary** | Inspected Systems Overview table with condition status per system, Key Findings by category, Overall Assessment |
| 5 | **Scope & Limitations** | Standards of practice, custom scope text, exclusions |
| 6 | **Detailed Findings** | System-by-system with photos, status badges, Observation→Implication→Recommendation flow |
| 7 | **Deferred Items** | Areas not inspected with reasons |
| 8 | **Maintenance Recommendations** | Non-urgent items, clearly labeled optional |
| 9 | **Disclaimers** | Pre-closing walkthrough, liability, legal notices |
| 10 | **Credentials** | Inspector info, certifications, contact, thank you |

### Ancillary Sections (Optional)

Render only when populated/enabled:
- **Radon** — Inspection checklist, notes, photos
- **WDI (Termite)** — Wood Destroying Insects inspection
- **Mold** — Mold inspection findings

### Finding Status Labels

| Status | English | Spanish | Badge Color |
|--------|---------|---------|-------------|
| safety | Safety | Seguridad | 🔴 Red |
| repair | Repair Recommended | Reparación Recomendada | 🟠 Orange |
| maintenance | Maintenance | Mantenimiento | 🟡 Yellow |
| monitor | Monitor | Monitorear | 🔵 Blue |
| satisfactory | Satisfactory | Satisfactorio | 🟢 Green |

### Severity Mapping

| Severity | Status Labels | Description |
|----------|--------------|-------------|
| severe | Safety | Immediate safety concerns or major structural/system defects |
| moderate | Repair | Functional but deficient, needs repair |
| minor | Maintenance, Monitor | Routine maintenance or observation items |

---

## PDF Navigation Tabs (Two-Pass)

### Overview

Every findings page has a colored navigation tab bar across the top with 10 system sections. Each tab is a clickable internal PDF link (`pdf.link()`) to that section's page.

### Tab Sections

| Tab | Color | Mapped Rooms |
|-----|-------|-------------|
| SUMMARY | — | Summary page |
| EXTERIOR | — | exterior, driveway, porch, deck, patio, yard, garage, pool |
| ROOFING | — | roof |
| STRUCTURE | — | foundation, crawlspace, basement |
| INTERIOR | — | bedrooms, bathrooms, kitchen, living/dining rooms, hallway, laundry, utility, fireplace, other |
| PLUMBING | — | water heater, sewer, plumbing |
| ELECTRICAL | — | electrical panel |
| HEATING | — | furnace, hvac |
| COOLING | — | ac, air conditioning |
| INSULATION | — | attic, insulation, ventilation |

A REFERENCE sub-tab appears below in olive green.

### Two-Pass Rendering (Critical Implementation)

The tab navigation uses a **two-pass approach** to ensure all tabs are clickable on all pages:

**Pass 1 — Render all sections:**
- As each section renders, `addPageHeaderWithTabs()` draws the tab bar and records the page in `ctx.tabbedPages`
- `ctx.sectionPageNumbers` accumulates page numbers as sections are rendered
- After Pass 1, not all tabs have correct links (only sections rendered before the current page have known page numbers)

**Pass 2 — Finalize all tab links:**
- `finalizeTabLinks()` iterates over every recorded tabbed page
- Uses `ctx.pdf.setPage(pageNumber)` to revisit each page
- Redraws the entire tab bar using the now-complete `sectionPageNumbers` map
- All tabs on all pages now have correct internal links

**Key types:**
```typescript
interface PDFContext {
  // ... other fields
  sectionPageNumbers: Map<string, number>;  // section name → page number
  tabbedPages: Array<{ pageNumber: number; activeSection: string }>;  // pages to redraw
}
```

**Key functions:**
```typescript
// Pass 1: Called when rendering each new tabbed page
addPageHeaderWithTabs(ctx, inspection, activeSection, lang)

// Pass 2: Called after all sections are rendered
finalizeTabLinks(ctx, inspection, lang)
```

---

## Offline-First Architecture

### Service Worker

**Strategy:** Workbox via `vite-plugin-pwa` with `registerType: "autoUpdate"`

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
- Auto-processes when `online` event fires

### Online Status Detection

```typescript
const isOnline = useOnlineStatus();
// Listens to window 'online'/'offline' events
// Used for: status indicator, AI queue processing, license verification
```

---

## PWA Configuration

### Manifest (`public/manifest.json`)

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
| 512×512 | `/icon-512-maskable.png` | Adaptive/Maskable |
| 180×180 | `/apple-touch-icon.png` | iOS |

### iOS Meta Tags (in `index.html`)

```html
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="365 InspectAI" />
```

---

## Annotation System

### Key Files

| File | Purpose |
|------|---------|
| `strokeTypes.ts` | Stroke interface, point decimation, micro-stroke merging |
| `strokeRenderer.ts` | Scale-aware rendering engine |
| `annotationUtils.ts` | Drawing utilities |
| `bitmapUtils.ts` | Bitmap manipulation |
| `exportAnnotation.ts` | Full-resolution annotation export |
| `AnnotationCanvas.tsx` | Touch/mouse drawing canvas |
| `ZoomableAnnotationCanvas.tsx` | Pinch-zoom wrapper |
| `AnnotationToolbar.tsx` | Tool selector (Arrow, Circle, Rectangle, Freehand, Text) |
| `AnnotationControls.tsx` | Color, thickness, undo/redo controls |
| `PhotoAnnotationEditor.tsx` | Main editor container |

### Performance Guardrails

| Guardrail | Value |
|-----------|-------|
| Max undo steps | 50 |
| Max strokes | 500 |
| Max memory | 50MB |
| Point decimation | 2px tolerance (50–80% reduction) |
| Micro-stroke merge | <5 points within 500ms |

### Performance Comparison

| Metric | Before (ImageData) | After (Stroke-based) |
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
- All PDF report sections (cover page through credentials)
- AI analysis output (bilingual findings generated by model)
- Status labels, categories, severity levels
- Error messages and toast notifications
- Room names

### Implementation
- Translation dictionary: `src/lib/i18n.ts`
- Language hook: `src/hooks/useLanguage.ts`
- Persisted in IndexedDB `settings` store (key: `language`)

---

## Security

### Input Validation

| Endpoint | Validation |
|----------|-----------|
| analyze-photo | imageBase64: required string ≤10MB; language: ["en","es"]; licenseKey: required; deviceId: required |
| verify-license | licenseKey: ≤100 chars, `/^[A-Za-z0-9\-_]+$/`; deviceId: ≤64 chars, same pattern |

### CORS

Both Edge Functions enforce a strict origin whitelist:
- `https://inspect-ai-anywhere.lovable.app` (production)
- `https://365-inspect-ai.netlify.app` (Netlify deployment)
- `*.lovable.app` (preview environments)
- `*.netlify.app` (Netlify previews)
- `http://localhost:5173`, `http://localhost:8080` (development)

### Database Security

- RLS on `licenses` and `license_devices` denies all `anon`/`authenticated` access
- Only `service_role` (Edge Functions) can read/write license data
- No foreign keys to `auth.users` (standalone app, no auth)

### Data Protection

| Area | Implementation |
|------|---------------|
| License keys | SHA-256 hashed for device table lookups (via `crypto.subtle` in Deno) |
| Anti-enumeration | Generic "License verification failed" / "Analysis failed" for all error states |
| Log redaction | License keys, device IDs, emails, hashes never logged |
| DOMPurify | All user input and AI output sanitized before rendering |
| Local data | IndexedDB (browser-level encryption at rest) |
| Rate limiting | 5 requests/minute per device on analyze-photo |

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
│   │   ├── demo/ (4 sample photos: electrical-issue, foundation-crack, plumbing-leak, roof-damage)
│   │   └── logo.png
│   ├── components/
│   │   ├── ui/ (40+ shadcn/ui primitives)
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
│   │   ├── pdf/ (12 modular PDF generation files)
│   │   ├── db.ts (idb wrapper - legacy)
│   │   ├── db-native.ts (native IDBDatabase - primary)
│   │   ├── aiAnalysis.ts, license.ts, licenseCache.ts
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
├── netlify.toml, vitest.config.ts
└── .nvmrc
```

---

## Environment Variables

### Client-Side (auto-generated `.env`)

| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_URL` | Backend URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Anon key (read-only) |
| `VITE_SUPABASE_PROJECT_ID` | Project identifier |

### Edge Function Secrets (server-side only)

| Secret | Purpose |
|--------|---------|
| `LOVABLE_API_KEY` | Lovable AI Gateway access for photo analysis |
| `SUPABASE_URL` | Backend URL (for service role client in Edge Functions) |
| `SUPABASE_SERVICE_ROLE_KEY` | Full DB access for license operations |
| `SUPABASE_ANON_KEY` | Anon key (auto-configured) |
| `GUMROAD_PING_SECRET` | Gumroad webhook integration (if configured) |

---

## Deployment

### URLs

| Environment | URL |
|-------------|-----|
| Preview | `https://id-preview--8cd0f791-ce4c-4a88-8c8b-73979d499fed.lovable.app` |
| Production | `https://inspect-ai-anywhere.lovable.app` |
| Netlify | `https://365-inspect-ai.netlify.app` |

### Build

```bash
npm run build   # or: bun run build
# Output: dist/ (static files)
```

### Edge Functions

Edge Functions are deployed automatically by Lovable Cloud. No manual deployment needed.

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

## Testing Guide

### Prerequisites

- Active license key in the `licenses` database table
- Browser with IndexedDB, camera API, and Web Speech API support
- Internet connection for AI analysis and license verification (offline mode for other features)

### Creating a Test License

Insert a test license via the database:

```sql
INSERT INTO licenses (license_key, product_id, is_active, max_devices, customer_name, email, notes)
VALUES ('TEST-KEY-2026', 'inspectai-pro', true, 2, 'QA Tester', 'qa@test.com', 'QA testing only');
```

> ⚠️ **Deactivate or delete test licenses before production deployment.**

### Test Scenarios

#### 1. Onboarding & License Activation

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open app for first time | Welcome page with Terms/Privacy appears |
| 2 | Accept Terms & Privacy | License key input field appears |
| 3 | Enter invalid key | Error toast: "License verification failed" |
| 4 | Enter valid key | Success toast, redirected to Dashboard |
| 5 | Reload app | Dashboard loads directly (onboarding bypassed) |

#### 2. Inspection Creation & Photo Capture

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "New Inspection" | Form with address, inspector, client, type fields |
| 2 | Enter address, submit | Inspection created, room selector appears |
| 3 | Select a room | Room pill highlighted, captures filter to that room |
| 4 | Take photo via camera | Photo appears in gallery with "analyzing" badge |
| 5 | Upload photo via drop zone | Same as above |
| 6 | Wait for AI analysis | Badge changes to "complete", findings populate detail panel |
| 7 | Open photo detail | AI title, severity, category, description, recommendation shown |

#### 3. Manual Override

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open photo detail panel | AI analysis fields visible |
| 2 | Edit title manually | Manual title saved, takes priority in report |
| 3 | Change severity dropdown | New severity reflected in badge and report |
| 4 | Apply issue preset | All fields populated from preset template |

#### 4. Photo Annotation

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open annotation editor | Photo displayed on canvas with toolbar |
| 2 | Select Arrow tool, draw | Arrow rendered on canvas |
| 3 | Select Circle tool, draw | Circle rendered |
| 4 | Undo | Last stroke removed |
| 5 | Change color/thickness | Next stroke uses new settings |
| 6 | Save annotation | Annotated image saved to IndexedDB |
| 7 | Check photo detail | Annotated version shown as overlay |

#### 5. Voice Dictation

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open Live Notes Panel | Room-grouped notes display |
| 2 | Click microphone button | Browser asks for mic permission, starts listening |
| 3 | Speak notes | Text appears in transcript field |
| 4 | Stop dictation | Notes appended to selected room |

#### 6. Report Generation

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Report Builder | Tabs: Photos, Deferred, Maintenance, Legal |
| 2 | Review photos, toggle inclusion | Checkboxes control which photos appear in PDF |
| 3 | Click "Generate Report" | Report Dialog opens, Agent Summary selected by default |
| 4 | Generate Agent Summary | 1-page PDF downloads with Safety/Repair/Maintenance findings |
| 5 | Select "Full Report" | Multi-page PDF with all sections, cover page, ToC, tabs |
| 6 | Switch language to Spanish | PDF generates in Spanish with translated labels |
| 7 | Verify tab navigation | Click any tab → navigates to correct section page |

#### 7. Export/Import

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click Export on dashboard | ZIP file downloads with JSON + photos |
| 2 | Open different browser/device | Fresh app installation |
| 3 | Click Import, select ZIP | Inspection restored with all photos and metadata |
| 4 | Import same ZIP again | New inspection instance created (no overwrite) |

#### 8. Offline Mode

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Disconnect internet | Status bar shows "Offline" |
| 2 | Create inspection | Works if within grace period |
| 3 | Take photos | Photos saved locally, AI queued as `pending_offline` |
| 4 | Generate PDF | Works fully offline |
| 5 | Reconnect internet | Status bar shows "Online", queued photos auto-analyze |

#### 9. Demo Mode

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Load Demo" on dashboard | Demo inspection loads with 4 pre-analyzed photos |
| 2 | Browse photos | AI findings pre-populated for each photo |
| 3 | Generate report | Full report with demo findings |

#### 10. Company Profile

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open Settings → Company Profile | Form with all branding fields |
| 2 | Fill company name, upload logo | Saved to IndexedDB |
| 3 | Generate report | Company branding appears on cover page and headers |

### Running Automated Tests

```bash
# Run vitest test suite
bun run test

# Run specific test file
bunx vitest run src/test/example.test.ts
```

Test configuration: `vitest.config.ts` with jsdom environment.

---

## Migration Guide

### Migrating from Another Platform to 365 InspectAI

1. **No database migration needed** — All app data is client-side (IndexedDB)
2. **License setup** — Insert license rows into the `licenses` table via SQL
3. **Edge Functions** — Deployed automatically by Lovable Cloud
4. **Custom domain** — Add domain to CORS whitelist in both Edge Functions:
   - `supabase/functions/analyze-photo/index.ts` → `ALLOWED_ORIGINS` array
   - `supabase/functions/verify-license/index.ts` → `ALLOWED_ORIGINS` array

### Adding a Custom Domain

1. Add domain to `ALLOWED_ORIGINS` in both Edge Functions
2. Redeploy Edge Functions
3. Configure DNS to point to your hosting provider
4. Update `manifest.json` start_url if needed

### IndexedDB Version Upgrades

The database is at **version 4**. When upgrading the schema:

1. Increment version number in `db-native.ts`
2. Add upgrade logic in the `onupgradeneeded` handler
3. Handle all previous versions (users may skip versions)
4. Test with fresh install AND upgrade from each previous version

```typescript
// Example: Adding a new store in version 5
if (oldVersion < 5) {
  db.createObjectStore('newStore', { keyPath: 'id' });
}
```

### Adding a New Edge Function

1. Create `supabase/functions/<function-name>/index.ts`
2. Add to `supabase/config.toml`:
   ```toml
   [functions.<function-name>]
   verify_jwt = false  # or true if auth required
   ```
3. Add CORS headers matching existing functions
4. Add any required secrets via Lovable Cloud
5. Function deploys automatically

### Adding New License Features

To add a new gated feature:

1. Add the permission field to `LicenseState` in `src/lib/license.ts`
2. Add to `getEffectivePermissions()` with offline/grace logic
3. Update `verify-license` Edge Function to return the new field
4. Add the column to the `licenses` table via migration
5. Gate the UI feature using `effectivePermissions` from `useLicense()`

### Bulk License Management

```sql
-- Create a new license
INSERT INTO licenses (license_key, product_id, is_active, max_devices, customer_name, email)
VALUES ('NEW-LICENSE-KEY', 'inspectai-pro', true, 2, 'Customer Name', 'email@example.com');

-- Deactivate a license
UPDATE licenses SET is_active = false WHERE license_key = 'KEY-TO-DEACTIVATE';

-- Reset device count (clear all devices for a license)
DELETE FROM license_devices WHERE license_hash = '<sha256-hash-of-key>';

-- Check device registrations
SELECT ld.device_id, ld.activated_at, ld.last_seen_at
FROM license_devices ld
WHERE ld.license_hash = '<sha256-hash-of-key>';

-- View all active licenses
SELECT license_key, customer_name, email, max_devices, created_at, expires_at
FROM licenses WHERE is_active = true ORDER BY created_at DESC;
```

### Data Backup & Recovery

Since all user data is in IndexedDB:

1. **User-initiated backup**: Export inspection as ZIP from dashboard
2. **Cross-device transfer**: Export on Device A → Import on Device B
3. **Browser clear**: Data is lost if browser storage is cleared — encourage regular exports
4. **No server-side backup**: App data never leaves the device (privacy by design)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-02 | Core inspection, photo, AI, PDF features |
| 1.1.0 | 2026-02 | Agent-Friendly Summary, Inspected Systems Overview |
| 1.2.0 | 2026-02 | Rebranded to 365 InspectAI, standardized status labels |
| 1.3.0 | 2026-02 | Self-hosted licensing system, security hardening |
| 1.4.0 | 2026-02 | Ancillary sections (Radon/WDI/Mold), annotation v2 |
| 1.5.0 | 2026-02 | Two-pass PDF tab rendering, license-gated AI analysis, rate limiting |

---

*This document is the primary technical reference for 365 InspectAI. See ARCHITECTURE.md for a higher-level feature overview.*
