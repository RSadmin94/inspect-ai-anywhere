# 365 InspectAI — Architecture & Features

## Overview

**365 InspectAI** is a mobile-first, offline-first Progressive Web Application (PWA) for professional property inspectors. It enables field-based photo capture, AI-powered defect analysis, photo annotation, voice dictation, and professional PDF report generation — all while maintaining full functionality without internet connectivity.

**Production URL:** https://inspect-ai-anywhere.lovable.app  
**Support:** support@365globalsolutions.com

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **UI Framework** | React 18 + TypeScript | Component-based UI with type safety |
| **Build** | Vite | Fast HMR and production builds |
| **Styling** | Tailwind CSS + shadcn/ui | Utility CSS with accessible components |
| **Animation** | Framer Motion | Transitions and micro-interactions |
| **Routing** | React Router DOM v6 | Client-side SPA routing |
| **Data** | IndexedDB (via `idb` v8) | Primary offline-first storage |
| **State** | React hooks + TanStack Query | Local + server state management |
| **Forms** | React Hook Form + Zod | Validation and form management |
| **Images** | browser-image-compression | Client-side image optimization |
| **PDF** | jsPDF + html2canvas + DOMPurify | Report generation and sanitization |
| **PWA** | vite-plugin-pwa (Workbox) | Service worker, caching, installability |
| **Backend** | Lovable Cloud (Edge Functions) | AI analysis + license verification |
| **AI Model** | Google Gemini 2.5 Flash | Photo defect analysis |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                          │
│  Pages: Index.tsx (single-page with view switching)             │
│  Views: Dashboard │ Inspection │ Report Builder │ Settings      │
│  UI: shadcn/ui + Tailwind + "Deep Pro" dark theme              │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                       BUSINESS LOGIC                            │
│  useInspection  │ useLicense │ useLanguage │ useVoiceDictation  │
│  useOnlineStatus │ Photo processing │ AI orchestration          │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                     DATA PERSISTENCE                            │
│  IndexedDB v2 (idb wrapper)                                     │
│  ┌────────────┐ ┌────────┐ ┌──────────┐ ┌────────────┐         │
│  │inspections │ │ photos │ │ settings │ │customRooms │         │
│  └────────────┘ └────────┘ └──────────┘ └────────────┘         │
│  ┌─────────┐ ┌──────────────┐                                   │
│  │ phrases │ │ issuePresets │                                   │
│  └─────────┘ └──────────────┘                                   │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                   CLOUD SERVICES (Optional)                     │
│  Edge Function: analyze-photo    → Gemini AI photo analysis     │
│  Edge Function: verify-license   → Self-hosted license system   │
│  Database: licenses, license_devices (RLS-protected)            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

```
App.tsx
├── BrowserRouter
│   ├── Index.tsx (Main Page — single route, view-switching)
│   │   ├── AppSidebar / SideMenu
│   │   ├── DashboardHub
│   │   │   ├── WelcomePage
│   │   │   ├── NewInspectionForm
│   │   │   ├── InspectionHeader
│   │   │   ├── RoomSelector (sticky, drag-and-drop reorder)
│   │   │   ├── QuickCaptureMode
│   │   │   │   ├── CameraCapture (device selection, front/back)
│   │   │   │   ├── DropZone (file upload)
│   │   │   │   └── LiveNotesPanel (voice → room-grouped notes)
│   │   │   ├── PhotoGallery (thumbnail grid + AI status badges)
│   │   │   │   ├── PhotoDetailPanel (full view + editing)
│   │   │   │   ├── PhotoAnnotationEditor
│   │   │   │   │   ├── ZoomableAnnotationCanvas
│   │   │   │   │   ├── AnnotationToolbar
│   │   │   │   │   └── AnnotationControls
│   │   │   │   ├── IssuePresetSelector (manual defect tagging)
│   │   │   │   └── ImageLightbox
│   │   │   ├── ReportBuilder (Tabs: Photos/Deferred/Maintenance/Legal)
│   │   │   ├── ReportReviewScreen
│   │   │   ├── ReportDialog
│   │   │   ├── CompanyProfileSettings (white-label branding)
│   │   │   ├── LicenseSettings (activation + device management)
│   │   │   ├── PhraseLibrary
│   │   │   └── StorageMeter
│   │   ├── StatusBar (online/offline, photo count)
│   │   ├── PrivacyPolicy
│   │   └── TermsOfService
│   └── NotFound.tsx
└── Providers (QueryClient, TooltipProvider, Toaster, Sonner)
```

---

## Core Features

### 1. Inspection Management

Create, manage, and complete property inspections with rich metadata.

**Inspection Types:** Pre-Purchase, Pre-Listing, Annual, Insurance, New Construction, Warranty

**Data Model:**
```typescript
interface InspectionRecord {
  id: string;
  propertyAddress: string;
  inspectorName?: string;
  clientName?: string;
  inspectionType?: InspectionType;
  createdAt: number;
  updatedAt: number;
  photoIds: string[];
  isComplete: boolean;
  customRooms?: string[];
  roomNotes?: Record<string, string>;
}
```

---

### 2. Photo Capture & Processing

Camera-first interface with multi-device support and client-side compression.

**Pipeline:**
```
Camera/Upload → browser-image-compression →
  ├── Full Image: max 2048px, 85% JPEG quality
  └── Thumbnail: 320px, 80% JPEG quality
  → IndexedDB storage → Queue for AI analysis
```

**Capacity:** Up to 200 photos per inspection.

---

### 3. Photo Annotation System

Mark defects directly on photos with touch-optimized drawing tools.

**Tools:** Arrow, Circle, Rectangle, Freehand, Text

**Technical Highlights:**
- Stroke-based rendering (1KB/stroke vs 12MB/ImageData snapshot)
- Dual-resolution canvas: 1024×768 editing, full-res export
- Point decimation (50–80% reduction, <2px visual loss)
- Micro-stroke merging (<5 points within 500ms)
- Guardrails: max 50 undo steps, 500 strokes, 50MB memory cap
- DPR-aware for retina displays

---

### 4. AI-Powered Defect Analysis

Automated photo analysis using Google Gemini 2.5 Flash via Edge Function.

**Analysis Flow:**
```
Photo → Base64 → Edge Function (analyze-photo) → Gemini API → Structured JSON
```

**Prompt Architecture:**
- Professional licensed inspector persona
- "Observation → Implication → Recommendation" structure
- Court-defensible language (no AI/software references)
- Status labels: Safety, Repair, Maintenance, Monitor
- Severity: severe, moderate, minor
- Bilingual output (English + Spanish)

**Input Validation:**
- Max payload: 10MB base64 string
- Language whitelist: `["en", "es"]`
- Type checking on `imageBase64`

**Offline Behavior:**
- Photos queued as `pending_offline`
- Auto-analyzed when connectivity restored
- Falls back to mock analysis on error

---

### 5. Voice Dictation

Hands-free note-taking via Web Speech API.

**Features:**
- Real-time speech-to-text
- Room-based note organization (LiveNotesPanel)
- Append/clear per room
- Works offline (browser-dependent)

---

### 6. Professional Report Generation (PDF)

Publication-ready inspection reports titled **"PROPERTY INSPECTION REPORT"**.

**Report Structure:**

| # | Section | Description |
|---|---------|-------------|
| 1 | **Cover Page** | Property address, date, client, inspector credentials, company branding, signature area, "Confidential" notice |
| 2 | **Agent-Friendly Summary** | Standalone 1-page quick-reference for real estate agents (key selling feature) |
| 3 | **Table of Contents** | Clickable navigation with page numbers |
| 4 | **Inspection Summary** | Inspected Systems Overview table, Key Findings by category, Overall Assessment |
| 5 | **Scope & Limitations** | Standards of practice, custom scope, exclusions |
| 6 | **Detailed Findings** | System-by-system with photos, status badges, Observation→Implication→Recommendation |
| 7 | **Deferred Items** | Areas not inspected with reasons |
| 8 | **Maintenance Recommendations** | Non-urgent items, clearly labeled optional |
| 9 | **Disclaimers** | Pre-closing walkthrough, liability, legal notices |
| 10 | **Credentials** | Inspector info, certifications, contact, thank you |

**Ancillary Sections (optional):** Radon, WDI (Wood Destroying Insects/Termite), Mold — render only when populated.

**Finding Status Labels:**

| Status | English | Spanish | Color |
|--------|---------|---------|-------|
| Safety | Safety | Seguridad | 🔴 Red |
| Repair | Repair Recommended | Reparación Recomendada | 🟠 Orange |
| Maintenance | Maintenance | Mantenimiento | 🟡 Yellow |
| Monitor | Monitor | Monitorear | 🔵 Blue |

**Technical Notes:**
- Vector graphics instead of emojis for cross-viewer stability
- All content sanitized with DOMPurify
- Reports appear human-authored (no AI references)
- Full bilingual support

**PDF Module Structure:**
```
src/lib/pdf/
├── index.ts                  # Orchestration
├── reportTypes.ts            # Types, interfaces, status labels
├── pdfUtils.ts               # Shared utilities
├── coverPage.ts              # Cover page generation
├── agentSummarySection.ts    # Agent-friendly 1-pager
├── tableOfContents.ts        # Clickable ToC
├── summarySection.ts         # Inspection Summary + Systems Overview
├── scopeSection.ts           # Scope, Standards & Limitations
├── findingsSection.ts        # System-by-system findings
├── conclusionSection.ts      # Disclaimers & conclusion
├── upsellRecommendations.ts  # Maintenance recommendations
└── agentSummaryPdf.ts        # Standalone agent summary export
```

---

### 7. Company Branding (White-Label)

Full white-labeling of reports with company identity, legal templates, and logo.

**Customizable Fields:**
- Company name, tagline, logo (blob storage)
- Inspector name, license number, certifications
- Contact info (phone, email, website, address)
- Custom disclaimer, scope & limitations, liability statement (bilingual)
- Deferred items templates, maintenance templates

---

### 8. Bilingual Support (English/Spanish)

Full localization with formal professional Spanish tone.

**Coverage:** All UI elements, PDF reports, AI analysis output, status labels, categories.

**Implementation:** `lib/i18n.ts` dictionary + `useLanguage` hook with `t()` function.

---

### 9. Offline-First Architecture

Full functionality without internet connectivity.

**Service Worker (Workbox):**
- CacheFirst for static assets (JS, CSS, HTML, fonts, images)
- Runtime caching for Google Fonts (1-year expiry)
- Automatic service worker updates

**IndexedDB Storage:**
- All inspection data, photos, settings persisted locally
- Photo blobs stored directly (no external dependencies)
- License state cached with 7-day offline grace period

**Sync Queue:**
- Offline operations queued in IndexedDB
- Exponential backoff retry (1s, 2s, 4s, 8s…)
- Max 5 retry attempts
- Auto-syncs when connectivity restored

---

### 10. Self-Hosted Licensing System

Server-side license validation with device management.

**Architecture:**
```
Client (useLicense hook)
  → Edge Function (verify-license)
    → Supabase DB (licenses + license_devices tables)
    → SHA-256 hash verification
    → Device registration/limit check
  → IndexedDB cache (7-day grace period)
```

**Security Hardening:**
- SHA-256 hashing for license keys (never stored in plain text on device)
- Strict CORS whitelist on all endpoints
- RLS denies all direct client access to license tables
- Anti-enumeration: generic failure messages for all invalid states
- Sensitive data redacted from server logs
- Input validation: length limits + alphanumeric pattern enforcement

**Device Management:**
- 2-device limit per license
- 30-day cooldown between device resets
- Reset counter tracking
- `last_seen_at` tracking for registered devices

**Feature Gating:**
| Feature | Unlicensed | Licensed | Offline (grace) |
|---------|------------|----------|------------------|
| Create Inspection | ❌ | ✅ | ✅ (7 days) |
| AI Analysis | ❌ | ✅ | ✅ (7 days) |
| Export/PDF | ✅ Always | ✅ | ✅ Always |

**Database Schema (Cloud):**
- `licenses` — license_key, product_id, is_active, expires_at, max_devices, reset tracking
- `license_devices` — license_hash, device_id, activated_at, last_seen_at

---

### 11. Inspection Workflow Features

**Quick Capture Mode:** Rapid photo capture with room-context filtering.

**Room Selector:**
- 25+ standard rooms (Exterior, Interior, Kitchen, Bathroom, Dining Room, Main Bedroom, Bedroom 2/3, Living Room, Basement, Attic, Garage, Roof, Electrical Panel, AC, Water Heater, Crawl Space, Furnace, Laundry, etc.)
- Custom room creation
- Drag-and-drop reordering (persisted in settings)
- Sticky selection across views

**Phrase Library:**
- Searchable phrase database
- Categories: Disclaimer, Note, Recommendation, General
- Favorites system
- Bilingual support

**Issue Preset Selector:**
- Predefined defect templates by category
- Manual severity/category assignment
- Quick application to photos

**Demo Mode:**
- Pre-loaded inspection with 4 sample photos (foundation crack, roof damage, plumbing leak, electrical issue)
- Demonstrates full workflow without field data

---

### 12. Data Export/Import

**Export:** Full inspection data as JSON (via JSZip)
**Import:** Restore from exported JSON backup

---

## Data Flow Diagrams

### Photo Lifecycle
```
Camera/File → Compress → Thumbnail → IndexedDB → Queue AI
                                          │
                                    ┌─────▼─────┐
                                    │ Annotate?  │
                                    └─────┬─────┘
                                          │
                            ┌─────────────▼──────────────┐
                            │ Stroke-based annotation     │
                            │ → Export at full resolution  │
                            │ → Save annotatedImageBlob   │
                            └─────────────┬──────────────┘
                                          │
                                    ┌─────▼─────┐
                                    │  Include   │
                                    │ in Report? │
                                    └─────┬─────┘
                                          │
                                    ┌─────▼─────┐
                                    │ PDF uses   │
                                    │ annotated  │
                                    │ version    │
                                    └────────────┘
```

### License Verification Flow
```
App Launch → Load cached state from IndexedDB
  │
  ├── Online? → Call verify-license Edge Function
  │               → SHA-256 hash license key
  │               → Check licenses table
  │               → Check/register device
  │               → Return LicenseState
  │               → Cache in IndexedDB
  │
  └── Offline? → Check grace period (7 days)
                  → Grant/deny features accordingly
```

---

## Security Summary

| Area | Implementation |
|------|---------------|
| **Data Sanitization** | DOMPurify on all user input and AI output |
| **License Keys** | SHA-256 hashed, never stored plaintext on client |
| **CORS** | Strict origin whitelist on all Edge Functions |
| **RLS** | All license tables deny direct client access |
| **Anti-Enumeration** | Generic failure messages for all invalid states |
| **Log Redaction** | License keys, device IDs, emails, hashes redacted |
| **Input Validation** | Length limits, format patterns, type checks |
| **Offline Data** | All data local in IndexedDB (browser-encrypted at rest) |

---

## Performance Optimizations

| Area | Optimization |
|------|-------------|
| **Images** | Lazy loading, thumbnail-first, compression before storage |
| **Annotations** | Stroke-based (1KB vs 12MB), dual-resolution canvas |
| **State** | useCallback, optimistic updates, debounced auto-save |
| **PWA** | Aggressive caching, asset preloading, background sync |
| **Memory** | 50MB cap on annotations, point decimation, micro-stroke merging |

---

## PWA Configuration

- **Theme:** `#0F172A` (dark)
- **Display:** Standalone
- **Orientation:** Portrait-primary
- **Icons:** 192px, 512px, 512px-maskable
- **iOS:** `apple-mobile-web-app-capable`, `black-translucent` status bar
- **Service Worker:** Auto-update with Workbox

---

## File Structure

```
src/
├── components/           # UI components (30+)
│   ├── ui/               # shadcn/ui primitives (40+)
│   └── *.tsx             # Feature components
├── hooks/                # Custom React hooks (7)
├── lib/                  # Business logic
│   ├── pdf/              # Modular PDF generation (11 files)
│   ├── db.ts             # IndexedDB operations
│   ├── aiAnalysis.ts     # AI orchestration + mock fallback
│   ├── license.ts        # License types + grace period logic
│   ├── licenseCache.ts   # IndexedDB license caching
│   ├── i18n.ts           # Translation dictionary
│   ├── imageUtils.ts     # Photo processing pipeline
│   ├── companyProfile.ts # Branding storage
│   ├── strokeTypes.ts    # Annotation stroke types
│   ├── strokeRenderer.ts # Annotation rendering engine
│   └── offlineSyncQueue.ts # Offline sync queue
├── pages/                # Route pages (2)
├── assets/demo/          # Demo inspection photos (4)
└── integrations/supabase/ # Auto-generated client + types

supabase/
├── functions/
│   ├── analyze-photo/    # AI photo analysis
│   └── verify-license/   # License verification
└── config.toml
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-02 | Core inspection, photo, AI, PDF features |
| 1.1.0 | 2026-02 | Agent-Friendly Summary, Inspected Systems Overview |
| 1.2.0 | 2026-02 | Rebranded to 365 InspectAI, standardized status labels |
| 1.3.0 | 2026-02 | Self-hosted licensing system, security hardening |
| 1.4.0 | 2026-02 | Ancillary sections (Radon/WDI/Mold), annotation v2 |

---

*This document is the primary architectural reference for 365 InspectAI.*
