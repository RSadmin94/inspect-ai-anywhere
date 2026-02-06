# InspectAI - Architecture & Features Documentation

## Overview

InspectAI is an offline-first Progressive Web Application (PWA) designed for professional home inspectors. It enables field-based photo capture, AI-powered defect analysis, and professional PDF report generation—all while maintaining full functionality without internet connectivity.

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
- Full Home Inspection
- Pre-Purchase Inspection
- Pre-Listing Inspection
- New Construction Inspection
- 11-Month Warranty Inspection
- 4-Point Inspection
- Wind Mitigation Inspection

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
- Dining Room, Bedroom 1-3
- Garage, Attic, Basement
- HVAC, Electrical, Plumbing
- Roof, Foundation, Other

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

**Purpose:** Generate publication-ready PDF inspection reports.

**Key Components:**
- `ReportReviewScreen.tsx` - Report preview and editing
- `lib/professionalReportPdf.ts` - PDF generation engine
- `lib/reportConfig.ts` - Report structure configuration

**Report Structure:**
```
1. Cover Page
   - Company logo and branding
   - Property address
   - Inspection date
   - Inspector information

2. Client & Property Information
   - Client name
   - Property details
   - Inspection type
   - Date and time

3. Scope & Limitations
   - Professional disclaimers
   - Visual inspection limitations
   - Exclusions and conditions

4. Summary of Findings
   - High severity items
   - Medium severity items
   - Professional recommendations

5. Detailed Findings by System
   - Numbered observations
   - Photos with annotations
   - Condition status
   - Recommendations

6. Certification & Disclaimers
   - Inspector certification
   - Liability language
   - Standards compliance
```

**Condition Statuses:**
- Satisfactory (S)
- Maintenance Required (M)
- Repair Recommended (R)
- Safety Concern (SC)
- Further Evaluation (FE)
- Not Inspected (NI)

---

### 7. Company Branding System

**Purpose:** White-label reports with company identity.

**Key Components:**
- `CompanyProfileSettings.tsx` - Configuration UI
- `lib/companyProfile.ts` - Profile storage and retrieval

**Customizable Elements:**
- Company name and logo
- Inspector name and license
- Contact information (phone, email, website)
- Address
- Certifications and credentials

**Storage:**
```typescript
interface CompanyProfile {
  companyName: string;
  inspectorName: string;
  licenseNumber?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  logoBlob?: Blob;
  certifications?: string[];
}
```

---

### 8. Bilingual Support (English/Spanish)

**Purpose:** Full application localization for bilingual inspectors.

**Key Components:**
- `lib/i18n.ts` - Translation dictionary
- `useLanguage.ts` - Language state hook

**Coverage:**
- All UI elements
- Report generation
- Professional terminology
- Formal Spanish tone

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
- Sample photos with pre-analyzed defects

**Demo Content:**
- Foundation crack (high severity)
- Roof damage (high severity)
- Plumbing leak (medium severity)
- Electrical issue (medium severity)

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
     └── Company profile
```

---

## File Structure

```
src/
├── components/
│   ├── ui/                    # shadcn/ui components
│   ├── AnnotationCanvas.tsx   # Photo markup
│   ├── CameraCapture.tsx      # Camera interface
│   ├── CompanyProfileSettings.tsx
│   ├── DashboardHub.tsx       # Main dashboard
│   ├── PhotoAnnotationEditor.tsx
│   ├── PhotoDetailPanel.tsx
│   ├── PhotoGallery.tsx
│   ├── QuickCaptureMode.tsx
│   ├── ReportBuilder.tsx
│   ├── ReportReviewScreen.tsx
│   ├── RoomSelector.tsx
│   └── VoiceDictationButton.tsx
│
├── hooks/
│   ├── useInspection.ts       # Inspection state
│   ├── useLanguage.ts         # i18n hook
│   ├── useOnlineStatus.ts     # Connectivity
│   └── useVoiceDictation.ts   # Speech API
│
├── lib/
│   ├── aiAnalysis.ts          # AI orchestration
│   ├── annotationUtils.ts     # Drawing utilities
│   ├── companyProfile.ts      # Branding storage
│   ├── db.ts                  # IndexedDB operations
│   ├── demoData.ts            # Demo mode
│   ├── i18n.ts                # Translations
│   ├── imageUtils.ts          # Photo processing
│   ├── offlineSyncQueue.ts    # Sync management
│   ├── professionalReportPdf.ts
│   ├── reportConfig.ts        # Report structure
│   └── utils.ts               # General utilities
│
├── pages/
│   ├── Index.tsx              # Main application
│   └── NotFound.tsx
│
└── assets/
    └── demo/                  # Demo inspection photos
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

---

*This document is maintained as the technical source of truth for InspectAI architecture and features.*
