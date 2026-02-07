# 365 InspectAI - Architecture & Features Documentation

## Overview

365 InspectAI is an offline-first Progressive Web Application (PWA) designed for professional home inspectors. It enables field-based photo capture, AI-powered defect analysis, and professional PDF report generation—all while maintaining full functionality without internet connectivity.

---

## Technology Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework with hooks-based architecture |
| **TypeScript** | Type-safe development |
| **Vite** | Build tool and dev server |
| **Tailwind CSS** | Utility-first styling with custom design tokens |
| **shadcn/ui** | Accessible component library |
| **Framer Motion** | Animations and transitions |
| **React Router** | Client-side routing |

### Data & Storage
| Technology | Purpose |
|------------|---------|
| **IndexedDB (via idb)** | Primary offline data storage |
| **Lovable Cloud** | Backend services and AI processing |

### PDF Generation
| Technology | Purpose |
|------------|---------|
| **jsPDF** | PDF document construction |
| **html2canvas** | DOM-to-image capture for PDF |
| **DOMPurify** | HTML sanitization for security |

### PWA Features
| Technology | Purpose |
|------------|---------|
| **vite-plugin-pwa** | Service worker and manifest generation |
| **Workbox** | Caching strategies |

---

## Application Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                        │
├─────────────────────────────────────────────────────────────────┤
│  Pages: Index.tsx (Dashboard, Inspection, Settings, Reports)    │
│  Components: CameraCapture, PhotoGallery, ReportReviewScreen    │
│  UI: shadcn/ui components with Tailwind styling                 │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         STATE LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│  Hooks: useInspection, useLanguage, useOnlineStatus             │
│  Context: React state with IndexedDB persistence                │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         DATA LAYER                               │
├─────────────────────────────────────────────────────────────────┤
│  lib/db.ts: IndexedDB operations                                │
│  lib/imageUtils.ts: Photo processing pipeline                   │
│  lib/offlineSyncQueue.ts: Sync queue management                 │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       STORAGE LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│  IndexedDB Stores:                                              │
│  • inspections - Inspection records                             │
│  • photos - Photo blobs and metadata                            │
│  • companyProfile - Branding configuration                      │
│  • phraseLibrary - Custom inspection phrases                    │
│  • syncQueue - Offline sync operations                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Core Features

### 1. Inspection Management

**Purpose:** Create, manage, and complete property inspections.

**Key Components:**
- `NewInspectionForm.tsx` - Inspection creation with metadata
- `useInspection.ts` - State management hook
- `InspectionHeader.tsx` - Active inspection display

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
  roomNotes?: Record<string, string>;
}
```

**Inspection Types:**
- Pre-Purchase Inspection
- Pre-Listing Inspection
- Annual Inspection
- Insurance Inspection
- New Construction Inspection
- Warranty Inspection

---

### 2. Photo Capture & Management

**Purpose:** Capture, store, and organize inspection photos by room.

**Key Components:**
- `CameraCapture.tsx` - Camera interface with device selection
- `QuickCaptureMode.tsx` - Rapid photo capture workflow
- `PhotoGallery.tsx` - Thumbnail grid with AI status indicators
- `PhotoDetailPanel.tsx` - Full photo view with editing

**Photo Pipeline:**
```
Camera/Upload → Blob → Compression → Thumbnail Generation → IndexedDB Storage
                                         │
                                         ▼
                            Full Image: max 2048px, 0.85 quality
                            Thumbnail: 320px, 0.80 quality
```

**Photo Data Model:**
```typescript
interface PhotoRecord {
  id: string;
  inspectionId: string;
  room: string;
  timestamp: number;
  notes: string;
  thumbnailBlob: Blob;
  fullImageBlob: Blob;
  annotatedBlob?: Blob;
  aiStatus: 'pending_offline' | 'analyzing' | 'complete' | 'failed';
  aiAnalysis?: AIAnalysisResult;
}
```

**Room Categories:**
- Exterior, Interior, Kitchen, Bathroom
- Dining Room, Main Bedroom, Bedroom 2, Bedroom 3
- Living Room, Garage, Attic, Basement
- Roof, Electrical Panel, AC, Water Heater, Other

---

### 3. Photo Annotation System

**Purpose:** Mark defects and areas of interest directly on photos.

**Key Components:**
- `PhotoAnnotationEditor.tsx` - Main annotation interface
- `AnnotationCanvas.tsx` - Drawing canvas with touch support
- `AnnotationToolbar.tsx` - Tool selection and controls
- `AnnotationControls.tsx` - Undo/redo and save actions

**Annotation Tools:**
- **Arrow** - Point to specific areas
- **Circle** - Highlight round areas
- **Rectangle** - Box selection
- **Freehand** - Custom drawing
- **Text** - Add labels

**Technical Implementation:**
- Uses ImageBitmap for performance optimization
- DPR (Device Pixel Ratio) aware for retina displays
- Coordinates stored relative to original image resolution
- Exports merged annotation as new Blob

---

### 4. AI-Powered Defect Analysis

**Purpose:** Automatically analyze photos to identify defects and generate professional observations.

**Key Components:**
- `lib/aiAnalysis.ts` - Analysis orchestration
- `supabase/functions/analyze-photo/index.ts` - Edge function
- `IssuePresetSelector.tsx` - Manual defect categorization

**AI Analysis Flow:**
```
Photo Blob → Base64 Encoding → Edge Function → Gemini API → Structured Analysis
                                                    │
                                                    ▼
                                        AIAnalysisResult {
                                          summary: string;
                                          severity: 'low' | 'medium' | 'high';
                                          defects: Defect[];
                                          recommendations: string[];
                                        }
```

**AI Prompt Guidelines:**
- Professional, neutral, third-person tone
- "Observation → Implication → Recommendation" structure
- No AI/software references in output
- Licensed specialist recommendations for uncertain findings
- No speculation beyond visible evidence
- Confidence levels stated implicitly

**Offline Behavior:**
- Photos queued with `pending_offline` status
- Automatic analysis when connectivity restored
- Batch processing with progress indicators

---

### 5. Voice Dictation

**Purpose:** Hands-free note-taking during inspections.

**Key Components:**
- `VoiceDictationButton.tsx` - Mic interface
- `useVoiceDictation.ts` - Web Speech API hook
- `LiveNotesPanel.tsx` - Room-organized transcript display

**Features:**
- Real-time speech-to-text
- Room-based note organization
- Append/clear per room
- Works offline (browser-dependent)

---

### 6. Professional Report Generation

**Purpose:** Generate publication-ready PDF inspection reports titled "PROPERTY INSPECTION REPORT" that are lender-safe and legally robust.

**Key Components:**
- `ReportReviewScreen.tsx` - Report preview and editing
- `ReportBuilder.tsx` - Report configuration UI (Photos, Deferred, Maintenance, Legal tabs)
- `lib/pdf/` - Modular PDF generation system:
  - `reportTypes.ts` - Types, interfaces, and status labels
  - `pdfUtils.ts` - Shared utility functions
  - `coverPage.ts` - Cover page with signature area
  - `agentSummarySection.ts` - Standalone 1-page Agent-Friendly Summary
  - `tableOfContents.ts` - Clickable ToC with page numbers
  - `summarySection.ts` - Inspection Summary with Systems Overview
  - `scopeSection.ts` - Standards & limitations
  - `findingsSection.ts` - System-by-system findings
  - `conclusionSection.ts` - Disclaimers & credentials
  - `upsellRecommendations.ts` - Maintenance recommendations
- `lib/reportConfig.ts` - Report structure configuration

**Report Structure:**
```
1. Cover Page (Authority + Professionalism)
   - Property address
   - Inspection date & time
   - Client name (PREPARED FOR section)
   - Inspector name, license #, certifications
   - Company branding, tagline, contact info
   - Digital signature area
   - "Confidential and Proprietary" notice

2. Agent-Friendly Summary (Standalone 1-page)
   - Quick-reference summary for real estate agents
   - Designed for easy forwarding to clients
   - Key findings at a glance

3. Table of Contents
   - Clickable section navigation
   - Page numbers with dotted leader lines

4. Inspection Summary (Page 4 - Overview)
   - Header: "This summary highlights the most significant 
     conditions observed during the inspection. Please refer 
     to the full report for additional details."
   - Inspected Systems Overview Table:
     * System/Area name
     * Condition status (Satisfactory/Maintenance/Marginal/Needs Attention)
     * Items recorded count
   - Key Findings Categories:
     * 🔴 Safety Concerns (immediate attention)
     * 🟠 Major Defects (repair recommended)
     * 🟡 Items to Monitor / Maintenance
   - Overall Assessment Commentary:
     * "Several conditions were observed that may require 
       prompt attention. Further evaluation by qualified, 
       licensed professionals is recommended."

5. Scope, Standards & Limitations
   - Inspection type description
   - Standards of practice
   - Custom scope (from company profile)
   - Inspector limitations list
   - Key exclusions box

6. Detailed Inspection Findings (System-by-System)
   - System overview with condition status
   - Per-system disclaimer
   - Observations with:
     - Photo with annotation
     - Status badge (Safety/Repair Recommended/Maintenance/Monitor)
     - Observation → Implication → Recommendation flow
     - Category and comments

7. Deferred / Not Inspected Items
   - Areas that couldn't be inspected
   - Reasons (obstructed, weather, inaccessible, etc.)
   - Re-inspection recommendations

8. Maintenance Recommendations
   - Non-urgent items
   - Non-defect maintenance tips
   - Clearly labeled as optional

9. End-of-Report Disclaimers
   - Pre-closing walkthrough guide
   - Custom disclaimers (from company profile)
   - Liability statement
   - Scope and limitations text
   - Standard legal notices

10. Inspector Credentials & Contact
    - Company logo and name
    - Inspector name and license
    - Certifications and affiliations
    - Full contact information
    - Thank you message
```

**Finding Status Labels (Standardized):**
| Status | English | Spanish | Color |
|--------|---------|---------|-------|
| Safety | Safety | Seguridad | 🔴 Red |
| Repair | Repair Recommended | Reparación Recomendada | 🟠 Orange |
| Maintenance | Maintenance | Mantenimiento | 🟡 Yellow |
| Monitor | Monitor | Monitorear | 🔵 Blue |

**Condition Statuses (mapped from severity):**
- Satisfactory - No issues found
- Needs Maintenance - Minor attention needed
- Professional Consultation - Expert evaluation recommended
- Not Satisfactory - Significant issue

**Technical Notes:**
- Emojis replaced with vector graphics for cross-viewer stability
- Reports appear human-authored (no AI/software references)

---

### 7. Company Branding System (White-Label)

**Purpose:** Full white-labeling of reports with company identity and legal templates.

**Key Components:**
- `CompanyProfileSettings.tsx` - Configuration UI
- `lib/companyProfile.ts` - Profile storage and retrieval

**Customizable Elements:**
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
```

**Storage:** IndexedDB with separate logo blob storage

---

### 8. Bilingual Support (English/Spanish)

**Purpose:** Full application localization for bilingual inspectors with formal professional Spanish tone.

**Key Components:**
- `lib/i18n.ts` - Translation dictionary
- `useLanguage.ts` - Language state hook

**Coverage:**
- All UI elements
- PDF report generation (all sections)
- Professional terminology
- Formal Spanish tone throughout
- Status labels and categories

---

### 9. Offline-First Architecture

**Purpose:** Full functionality without internet connectivity.

**Implementation:**

**Service Worker:**
- Precaches all application assets
- Runtime caching for API responses
- Background sync support

**IndexedDB Storage:**
- All inspection data persisted locally
- Photo blobs stored directly in DB
- Up to 200 photos per inspection

**Sync Queue:**
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

**Retry Strategy:**
- Exponential backoff (1s, 2s, 4s, 8s...)
- Maximum 5 retry attempts
- Revision gating to prevent overwrites

---

### 10. Demo Mode

**Purpose:** Showcase application capabilities without field data.

**Key Components:**
- `lib/demoData.ts` - Demo inspection seeding
- `src/assets/demo/` - Sample photos with pre-analyzed defects

**Demo Content:**
- Foundation crack (high severity)
- Roof damage (high severity)
- Plumbing leak (medium severity)
- Electrical issue (medium severity)

---

### 11. Inspection Workflow Features

**Quick Capture Mode:**
- Rapid photo capture workflow
- Room-context filtering

**Room Selector:**
- Persistent 'sticky' room selector
- Manual drag-and-drop reordering
- Custom room creation

**Phrase Library:**
- Searchable phrase database
- Categories: Disclaimer, Note, Recommendation
- Bilingual support

**Live Notes Panel:**
- Voice dictation organized by room
- Real-time transcript display
- Room-based grouping

---

## Data Flow Diagrams

### Photo Capture Flow
```
┌──────────┐    ┌──────────┐    ┌───────────┐    ┌──────────┐
│  Camera  │───▶│ Compress │───▶│ Generate  │───▶│  Store   │
│  Capture │    │  Image   │    │ Thumbnail │    │ IndexedDB│
└──────────┘    └──────────┘    └───────────┘    └──────────┘
                                                       │
                                                       ▼
                                                 ┌──────────┐
                                                 │  Queue   │
                                                 │   for    │
                                                 │ Analysis │
                                                 └──────────┘
```

### AI Analysis Flow
```
┌──────────┐    ┌──────────┐    ┌───────────┐    ┌──────────┐
│  Photo   │───▶│  Edge    │───▶│  Gemini   │───▶│  Update  │
│   Blob   │    │ Function │    │    API    │    │  Photo   │
└──────────┘    └──────────┘    └───────────┘    └──────────┘
     │                                                 │
     │              ┌───────────────┐                  │
     └─────────────▶│ Offline Queue │◀─────────────────┘
                    └───────────────┘
```

### Report Generation Flow
```
┌──────────┐    ┌──────────┐    ┌───────────┐    ┌──────────┐
│ Collect  │───▶│  Build   │───▶│  Render   │───▶│ Download │
│   Data   │    │   PDF    │    │  Sections │    │   File   │
└──────────┘    └──────────┘    └───────────┘    └──────────┘
     │
     ├── Inspection metadata
     ├── Photos + annotations
     ├── AI analysis results
     ├── Room notes
     ├── Company profile
     └── Legal templates
```

---

## File Structure

```
src/
├── components/
│   ├── ui/                    # shadcn/ui components
│   ├── AnnotationCanvas.tsx   # Photo markup
│   ├── AnnotationControls.tsx
│   ├── AnnotationToolbar.tsx
│   ├── AppSidebar.tsx
│   ├── CameraCapture.tsx      # Camera interface
│   ├── CompanyProfileSettings.tsx
│   ├── DashboardHub.tsx       # Main dashboard
│   ├── DropZone.tsx
│   ├── ImageLightbox.tsx
│   ├── InspectionHeader.tsx
│   ├── IssuePresetSelector.tsx
│   ├── LiveNotesPanel.tsx
│   ├── NewInspectionForm.tsx
│   ├── PhotoAnnotationEditor.tsx
│   ├── PhotoDetailPanel.tsx
│   ├── PhotoGallery.tsx
│   ├── PhraseLibrary.tsx
│   ├── QuickCaptureMode.tsx
│   ├── ReportBuilder.tsx
│   ├── ReportDialog.tsx
│   ├── ReportReviewScreen.tsx
│   ├── RoomSelector.tsx
│   ├── SideMenu.tsx
│   ├── StatusBar.tsx
│   └── VoiceDictationButton.tsx
│
├── hooks/
│   ├── use-mobile.tsx
│   ├── use-toast.ts
│   ├── useInspection.ts       # Inspection state
│   ├── useLanguage.ts         # i18n hook
│   ├── useOnlineStatus.ts     # Connectivity
│   └── useVoiceDictation.ts   # Speech API
│
├── lib/
│   ├── pdf/                   # Modular PDF generation
│   │   ├── agentSummarySection.ts
│   │   ├── conclusionSection.ts
│   │   ├── coverPage.ts
│   │   ├── findingsSection.ts
│   │   ├── index.ts
│   │   ├── pdfUtils.ts
│   │   ├── reportTypes.ts
│   │   ├── scopeSection.ts
│   │   ├── summarySection.ts
│   │   ├── tableOfContents.ts
│   │   └── upsellRecommendations.ts
│   ├── aiAnalysis.ts          # AI orchestration
│   ├── annotationUtils.ts     # Drawing utilities
│   ├── bitmapUtils.ts
│   ├── companyProfile.ts      # Branding storage
│   ├── db.ts                  # IndexedDB operations
│   ├── defaultData.ts
│   ├── demoData.ts            # Demo mode
│   ├── exportAnnotation.ts
│   ├── i18n.ts                # Translations
│   ├── imageUtils.ts          # Photo processing
│   ├── offlineSyncQueue.ts    # Sync management
│   ├── pdfGenerator.ts
│   ├── professionalReportPdf.ts
│   ├── reportConfig.ts        # Report structure
│   ├── reportPdfGenerator.ts
│   ├── strokeRenderer.ts
│   ├── strokeTypes.ts
│   └── utils.ts               # General utilities
│
├── pages/
│   ├── Index.tsx              # Main application
│   └── NotFound.tsx
│
└── assets/
    ├── demo/                  # Demo inspection photos
    │   ├── electrical-issue.jpg
    │   ├── foundation-crack.jpg
    │   ├── plumbing-leak.jpg
    │   └── roof-damage.jpg
    └── logo.png

supabase/
├── functions/
│   └── analyze-photo/
│       └── index.ts           # AI analysis edge function
└── config.toml
```

---

## Security Considerations

### Data Sanitization
- All user input sanitized with DOMPurify
- AI-generated content sanitized before rendering
- No direct HTML injection in reports

### Offline Security
- All data encrypted at rest (browser IndexedDB)
- No sensitive data transmitted without user action
- Session-based authentication when online

### Report Integrity
- Reports appear human-authored (no AI references)
- Professional disclaimers protect liability
- Timestamps and inspection IDs for audit trail

---

## Performance Optimizations

### Image Handling
- Lazy loading of full-resolution images
- Thumbnail-first display strategy
- ImageBitmap for annotation performance
- Compression before storage

### State Management
- Minimal re-renders with useCallback
- Optimistic UI updates
- Debounced auto-save

### PWA
- Aggressive caching strategies
- Preloading of critical assets
- Background sync for deferred operations

---

## UX Design Philosophy

### Camera-First Interface
- Optimized for one-handed thumb operation
- "Deep Pro" dark theme with glassmorphism
- Strict room-context filtering

### Visual Design
- Camera gallery shows only active room content
- Live notes filtered by selected room
- Persistent sticky room selector

---

## Future Considerations

1. **Multi-Inspector Support** - Team inspections with role-based access
2. **Cloud Backup** - Optional cloud sync for data redundancy
3. **Custom Report Templates** - User-defined report structures
4. **Integration APIs** - Connect with inspection scheduling software
5. **Advanced AI** - Thermal imaging analysis, moisture detection
6. **Client Portal** - Secure report delivery to clients

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-02 | Initial release with core features |
| 1.1.0 | 2026-02 | Added Agent-Friendly Summary, Inspected Systems Overview |
| 1.2.0 | 2026-02 | Rebranded to 365 InspectAI, updated status labels |

---

*This document is maintained as the technical source of truth for 365 InspectAI architecture and features.*
