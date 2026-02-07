# 365 InspectAI - Technical Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Data Models](#data-models)
5. [Core Features](#core-features)
6. [Offline-First Architecture](#offline-first-architecture)
7. [AI Integration](#ai-integration)
8. [PWA Configuration](#pwa-configuration)
9. [File Structure](#file-structure)
10. [API Reference](#api-reference)

---

## Overview

**InspectAI** is a mobile-first, offline-first Progressive Web Application (PWA) designed for field property inspections. The application enables inspectors to capture photos, add notes, receive AI-powered analysis of property issues, and generate professional PDF reports—all without requiring internet connectivity.

### Key Characteristics
- **Offline-First**: Full functionality without internet connection
- **Mobile-First**: Optimized for field use on tablets and smartphones
- **No Authentication Required**: Standalone operation without user accounts
- **Local Data Storage**: All data persisted in IndexedDB
- **AI-Powered Analysis**: Automated defect detection and categorization

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Interface                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │Dashboard │ │ Camera   │ │ Photo    │ │ Report Builder   │   │
│  │   Hub    │ │ Capture  │ │ Gallery  │ │                  │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                      Business Logic Layer                        │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐    │
│  │useInspection │ │useVoice      │ │ Image Processing     │    │
│  │    Hook      │ │Dictation     │ │ (browser-image-      │    │
│  │              │ │              │ │  compression)        │    │
│  └──────────────┘ └──────────────┘ └──────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                      Data Persistence Layer                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    IndexedDB (idb)                        │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │   │
│  │  │inspections│ │  photos  │ │ settings │ │customRooms│    │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘    │   │
│  │  ┌──────────┐ ┌──────────────┐                          │   │
│  │  │ phrases  │ │ issuePresets │                          │   │
│  │  └──────────┘ └──────────────┘                          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                      Cloud Services (Optional)                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Lovable Cloud (Supabase)                     │   │
│  │  ┌──────────────────┐                                    │   │
│  │  │ Edge Function:   │  AI Photo Analysis                 │   │
│  │  │ analyze-photo    │  (when online)                     │   │
│  │  └──────────────────┘                                    │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Component Architecture

```
App.tsx
├── BrowserRouter
│   ├── Index.tsx (Main Page)
│   │   ├── AppSidebar
│   │   ├── DashboardHub
│   │   │   ├── NewInspectionForm
│   │   │   ├── InspectionHeader
│   │   │   ├── RoomSelector
│   │   │   ├── QuickCaptureMode
│   │   │   │   ├── CameraCapture
│   │   │   │   ├── DropZone
│   │   │   │   └── LiveNotesPanel
│   │   │   ├── PhotoGallery
│   │   │   │   ├── PhotoDetailPanel
│   │   │   │   ├── IssuePresetSelector
│   │   │   │   └── ImageLightbox
│   │   │   ├── ReportBuilder
│   │   │   └── ReportReviewScreen
│   │   └── StatusBar
│   └── NotFound.tsx
└── Providers (QueryClient, Tooltip, Toast)
```

---

## Technology Stack

### Frontend Framework
| Technology | Version | Purpose |
|------------|---------|---------|
| React | ^18.3.1 | UI Framework |
| TypeScript | - | Type Safety |
| Vite | - | Build Tool & Dev Server |
| React Router DOM | ^6.30.1 | Client-side Routing |

### UI Components & Styling
| Technology | Version | Purpose |
|------------|---------|---------|
| Tailwind CSS | - | Utility-first CSS |
| shadcn/ui | - | Component Library |
| Radix UI | Various | Accessible Primitives |
| Lucide React | ^0.462.0 | Icon Library |
| Framer Motion | ^12.31.0 | Animations |

### Data Management
| Technology | Version | Purpose |
|------------|---------|---------|
| idb | ^8.0.3 | IndexedDB Wrapper |
| TanStack React Query | ^5.83.0 | Server State Management |
| React Hook Form | ^7.61.1 | Form Management |
| Zod | ^3.25.76 | Schema Validation |

### PWA & Offline
| Technology | Version | Purpose |
|------------|---------|---------|
| vite-plugin-pwa | ^1.2.0 | PWA Generation |
| Workbox | (via plugin) | Service Worker & Caching |

### Image Processing
| Technology | Version | Purpose |
|------------|---------|---------|
| browser-image-compression | ^2.0.2 | Client-side Image Compression |

### PDF Generation
| Technology | Version | Purpose |
|------------|---------|---------|
| jsPDF | ^4.1.0 | PDF Creation |
| html2canvas | ^1.4.1 | HTML to Canvas Conversion |

### Backend (Optional)
| Technology | Purpose |
|------------|---------|
| Lovable Cloud (Supabase) | Edge Functions for AI Analysis |

---

## Data Models

### Database Schema (IndexedDB)

The application uses IndexedDB with the following object stores:

#### `inspections` Store
```typescript
interface InspectionRecord {
  id: string;                    // Primary key (generated UUID)
  propertyAddress: string;       // Required - property location
  inspectorName?: string;        // Optional - inspector's name
  createdAt: number;             // Unix timestamp
  updatedAt: number;             // Unix timestamp
  photoIds: string[];            // Array of photo IDs
  isComplete: boolean;           // Inspection completion status
  clientName?: string;           // Optional - client name
  inspectionType?: InspectionType; // Type of inspection
  customRooms?: string[];        // IDs of custom rooms
  roomNotes?: Record<string, string>; // Notes by room key
}

type InspectionType = 
  | 'pre_purchase' 
  | 'pre_listing' 
  | 'annual' 
  | 'insurance' 
  | 'new_construction' 
  | 'warranty' 
  | 'other';
```
**Index**: `by-date` on `createdAt`

#### `photos` Store
```typescript
interface PhotoRecord {
  id: string;                    // Primary key
  inspectionId: string;          // Foreign key to inspection
  room: string;                  // Room/area identifier
  timestamp: number;             // Capture timestamp
  notes: string;                 // User notes
  thumbnailBlob: Blob;           // Compressed thumbnail (320px)
  fullImageBlob: Blob;           // Full image (max 2048px)
  
  // AI Analysis Fields
  aiStatus: AIStatus;
  aiFindingTitle?: string;
  aiFindingTitleEs?: string;     // Spanish translation
  aiSeverity?: Severity;
  aiConfidence?: number;         // 0-100
  aiDescription?: string;
  aiDescriptionEs?: string;
  aiRecommendation?: string;
  aiRecommendationEs?: string;
  aiCategory?: Category;
  aiFullAnalysis?: string;       // Raw AI response JSON
  
  // Manual Issue Fields
  manualTitle?: string;
  manualTitleEs?: string;
  manualSeverity?: Severity;
  manualCategory?: Category;
  manualDescription?: string;
  manualDescriptionEs?: string;
  manualRecommendation?: string;
  manualRecommendationEs?: string;
  
  // Report Builder Fields
  includeInReport?: boolean;
  reportOrder?: number;
}

type AIStatus = 'pending_offline' | 'analyzing' | 'complete' | 'failed';
type Severity = 'minor' | 'moderate' | 'severe';
type Category = 'roofing' | 'plumbing' | 'electrical' | 'hvac' | 
                'foundation' | 'safety' | 'general';
```
**Index**: `by-inspection` on `inspectionId`

#### `customRooms` Store
```typescript
interface CustomRoom {
  id: string;
  name: string;
  nameEs?: string;               // Spanish translation
  isDefault: boolean;
  order: number;
}
```

#### `phrases` Store
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
**Indexes**: `by-category`, `by-favorite`

#### `issuePresets` Store
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
**Index**: `by-category`

#### `settings` Store
```typescript
interface SettingsRecord {
  key: string;                   // Primary key
  value: string;                 // JSON-serialized value
}

// Known Settings Keys:
// - 'roomOrder': string[] - Custom room ordering
// - 'language': 'en' | 'es' - UI language preference
```

---

## Core Features

### 1. Inspection Management

**Creating an Inspection**
```typescript
const { startInspection } = useInspection();

await startInspection(
  propertyAddress,    // Required
  inspectorName,      // Optional
  clientName,         // Optional
  inspectionType      // Optional: InspectionType
);
```

**Updating Inspection**
```typescript
const { updateInspection } = useInspection();
await updateInspection({ clientName: 'New Client' });
```

### 2. Photo Capture & Processing

**Image Processing Pipeline**
```
Original Image
      │
      ▼
┌─────────────────┐
│ browser-image-  │
│ compression     │
└─────────────────┘
      │
      ├──► Full Image (max 2048px, 85% quality)
      │
      └──► Thumbnail (320px, 80% quality)
```

**Capture Flow**
```typescript
const { capturePhoto } = useInspection();

// From camera or file input
const newPhoto = await capturePhoto(imageBlob, selectedRoom);
// Returns PhotoRecord with aiStatus: 'pending_offline'
```

### 3. Room/Area Management

**Default Rooms**
- Exterior, Interior, Kitchen, Bathroom, Bedroom
- Living Room, Dining Room, Garage, Attic, Basement
- Roof, Foundation, HVAC, Electrical, Plumbing, Other

**Custom Rooms**
- Users can add custom rooms/areas
- Rooms can be reordered via drag-and-drop
- Order persisted in settings store

### 4. AI-Powered Analysis

**Analysis Flow**
```
Photo Captured
      │
      ▼
┌─────────────────┐     ┌─────────────────┐
│ Check Online    │────►│ Queue Offline   │
│ Status          │ No  │ (pending_       │
└─────────────────┘     │  offline)       │
      │ Yes             └─────────────────┘
      ▼
┌─────────────────┐
│ Edge Function:  │
│ analyze-photo   │
└─────────────────┘
      │
      ▼
┌─────────────────┐
│ AI Model        │
│ Analysis        │
└─────────────────┘
      │
      ▼
┌─────────────────┐
│ Update Photo    │
│ with AI Results │
└─────────────────┘
```

**AI Response Structure**
```typescript
interface AIAnalysisResult {
  findingTitle: string;
  findingTitleEs: string;
  severity: Severity;
  confidence: number;
  description: string;
  descriptionEs: string;
  recommendation: string;
  recommendationEs: string;
  category: Category;
}
```

### 5. Report Generation

**Report Builder Features**
- Select/deselect photos for inclusion
- Reorder photos via drag-and-drop
- Preview report before generation
- Export to PDF

**PDF Generation**
- Uses jsPDF for PDF creation
- html2canvas for complex element rendering
- Includes property details, photos, findings, recommendations

### 6. Internationalization (i18n)

**Supported Languages**
- English (en) - Default
- Spanish (es)

**Implementation**
```typescript
// Hook usage
const { t, language, setLanguage } = useLanguage();

// Translation function
t('key.path'); // Returns translated string
```

### 7. Voice Dictation

**Web Speech API Integration**
```typescript
const { 
  isListening,
  isSupported,
  startListening,
  stopListening,
  transcript
} = useVoiceDictation();
```

---

## Offline-First Architecture

### Service Worker Strategy

**Caching Strategy** (via Workbox)
```javascript
// Static assets: CacheFirst
globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"]

// Google Fonts: CacheFirst with expiration
{
  urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
  handler: "CacheFirst",
  options: {
    cacheName: "google-fonts-cache",
    expiration: { maxEntries: 10, maxAgeSeconds: 31536000 }
  }
}
```

### Online Status Detection

```typescript
const isOnline = useOnlineStatus();

// Returns boolean, updates on network change
// Used to:
// - Show online/offline indicator
// - Trigger AI analysis queue processing
// - Enable/disable cloud-dependent features
```

### Data Sync Strategy

```
┌─────────────────┐
│ Photo Captured  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Save to         │
│ IndexedDB       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│ Online?         │────►│ Add to Pending  │
└────────┬────────┘ No  │ Queue           │
         │ Yes          └─────────────────┘
         ▼
┌─────────────────┐
│ Send to AI      │
│ Edge Function   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Update Local    │
│ Record          │
└─────────────────┘
```

---

## AI Integration

### Edge Function: `analyze-photo`

**Location**: `supabase/functions/analyze-photo/index.ts`

**Configuration**:
```toml
# supabase/config.toml
[functions.analyze-photo]
verify_jwt = false  # Public access (no auth required)
```

**Request Format**:
```typescript
POST /functions/v1/analyze-photo
Content-Type: application/json

{
  "imageBase64": string,  // Base64-encoded image
  "room": string,         // Room/area context
  "notes": string         // User-provided notes
}
```

**Response Format**:
```typescript
{
  "success": boolean,
  "analysis": {
    "findingTitle": string,
    "findingTitleEs": string,
    "severity": "minor" | "moderate" | "severe",
    "confidence": number,
    "description": string,
    "descriptionEs": string,
    "recommendation": string,
    "recommendationEs": string,
    "category": Category
  }
}
```

---

## PWA Configuration

### Manifest (`public/manifest.json`)
```json
{
  "name": "InspectAI",
  "short_name": "InspectAI",
  "description": "AI-powered property inspection app",
  "theme_color": "#1e3a5f",
  "background_color": "#f5f7fa",
  "display": "standalone",
  "orientation": "portrait-primary",
  "start_url": "/",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### Vite PWA Plugin Config
```typescript
VitePWA({
  registerType: "autoUpdate",
  includeAssets: ["favicon.ico", "icon-192.png", "icon-512.png"],
  manifest: { /* ... */ },
  workbox: {
    globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
    runtimeCaching: [/* Google Fonts caching */]
  }
})
```

### iOS-Specific Meta Tags
```html
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="InspectAI" />
<link rel="apple-touch-icon" href="/logo.png" />
```

---

## File Structure

```
inspectai/
├── public/
│   ├── favicon.ico
│   ├── icon-192.png
│   ├── icon-512.png
│   ├── logo.png
│   ├── manifest.json
│   ├── placeholder.svg
│   └── robots.txt
├── src/
│   ├── assets/
│   │   └── logo.png
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── ... (40+ components)
│   │   ├── AppSidebar.tsx
│   │   ├── CameraCapture.tsx
│   │   ├── DashboardHub.tsx
│   │   ├── DropZone.tsx
│   │   ├── ImageLightbox.tsx
│   │   ├── InspectionHeader.tsx
│   │   ├── IssuePresetSelector.tsx
│   │   ├── LiveNotesPanel.tsx
│   │   ├── NavLink.tsx
│   │   ├── NewInspectionForm.tsx
│   │   ├── PhotoDetailPanel.tsx
│   │   ├── PhotoGallery.tsx
│   │   ├── PhraseLibrary.tsx
│   │   ├── QuickCaptureMode.tsx
│   │   ├── ReportBuilder.tsx
│   │   ├── ReportDialog.tsx
│   │   ├── ReportReviewScreen.tsx
│   │   ├── RoomSelector.tsx
│   │   ├── SideMenu.tsx
│   │   ├── StatusBar.tsx
│   │   └── VoiceDictationButton.tsx
│   ├── hooks/
│   │   ├── use-mobile.tsx
│   │   ├── use-toast.ts
│   │   ├── useInspection.ts
│   │   ├── useLanguage.ts
│   │   ├── useOnlineStatus.ts
│   │   └── useVoiceDictation.ts
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts          # Auto-generated
│   │       └── types.ts           # Auto-generated
│   ├── lib/
│   │   ├── aiAnalysis.ts
│   │   ├── db.ts                  # IndexedDB operations
│   │   ├── defaultData.ts
│   │   ├── i18n.ts                # Translations
│   │   ├── imageUtils.ts
│   │   ├── pdfGenerator.ts
│   │   ├── reportPdfGenerator.ts
│   │   └── utils.ts               # cn() utility
│   ├── pages/
│   │   ├── Index.tsx
│   │   └── NotFound.tsx
│   ├── test/
│   │   ├── example.test.ts
│   │   └── setup.ts
│   ├── App.css
│   ├── App.tsx
│   ├── index.css                  # Tailwind + Design Tokens
│   ├── main.tsx
│   └── vite-env.d.ts
├── supabase/
│   ├── functions/
│   │   └── analyze-photo/
│   │       └── index.ts
│   └── config.toml
├── .env                           # Environment variables
├── components.json                # shadcn/ui config
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
└── vitest.config.ts
```

---

## API Reference

### Database Operations (`src/lib/db.ts`)

#### Inspection Operations
| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `saveInspection` | `InspectionRecord` | `Promise<void>` | Create/update inspection |
| `getInspection` | `id: string` | `Promise<InspectionRecord \| undefined>` | Get by ID |
| `getCurrentInspection` | - | `Promise<InspectionRecord \| undefined>` | Get active inspection |
| `deleteInspection` | `id: string` | `Promise<void>` | Delete with all photos |

#### Photo Operations
| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `savePhoto` | `PhotoRecord` | `Promise<void>` | Create/update photo |
| `getPhoto` | `id: string` | `Promise<PhotoRecord \| undefined>` | Get by ID |
| `getPhotosByInspection` | `inspectionId: string` | `Promise<PhotoRecord[]>` | Get all photos for inspection |
| `deletePhoto` | `id: string` | `Promise<void>` | Delete photo |
| `getPendingPhotos` | - | `Promise<PhotoRecord[]>` | Get photos pending AI analysis |
| `updatePhotoAI` | `id, aiData` | `Promise<void>` | Update AI analysis fields |

#### Settings Operations
| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `getSetting` | `key: string` | `Promise<string \| undefined>` | Get setting value |
| `setSetting` | `key, value` | `Promise<void>` | Set setting value |
| `getRoomOrder` | - | `Promise<string[]>` | Get room order array |
| `saveRoomOrder` | `order: string[]` | `Promise<void>` | Save room order |

#### Custom Room Operations
| Function | Parameters | Returns |
|----------|------------|---------|
| `saveCustomRoom` | `CustomRoom` | `Promise<void>` |
| `getAllCustomRooms` | - | `Promise<CustomRoom[]>` |
| `deleteCustomRoom` | `id: string` | `Promise<void>` |

#### Phrase Operations
| Function | Parameters | Returns |
|----------|------------|---------|
| `savePhrase` | `Phrase` | `Promise<void>` |
| `getAllPhrases` | - | `Promise<Phrase[]>` |
| `getPhrasesByCategory` | `category` | `Promise<Phrase[]>` |
| `deletePhrase` | `id: string` | `Promise<void>` |

#### Issue Preset Operations
| Function | Parameters | Returns |
|----------|------------|---------|
| `saveIssuePreset` | `IssuePreset` | `Promise<void>` |
| `getAllIssuePresets` | - | `Promise<IssuePreset[]>` |
| `getPresetsByCategory` | `category` | `Promise<IssuePreset[]>` |
| `deleteIssuePreset` | `id: string` | `Promise<void>` |

### Image Utilities (`src/lib/imageUtils.ts`)

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `processImage` | `File \| Blob` | `Promise<{thumbnail, fullImage}>` | Compress and create thumbnail |
| `blobToDataUrl` | `Blob` | `Promise<string>` | Convert blob to data URL |
| `generateId` | - | `string` | Generate unique ID |

### Hooks

#### `useInspection`
```typescript
const {
  inspection,          // Current InspectionRecord | null
  photos,              // PhotoRecord[]
  isLoading,           // boolean
  startInspection,     // (address, inspector?, client?, type?) => Promise
  updateInspection,    // (updates) => Promise
  capturePhoto,        // (blob, room?) => Promise<PhotoRecord>
  updatePhoto,         // (id, updates) => Promise
  deletePhoto,         // (id) => Promise
  updatePhotoWithAI,   // (id, aiData) => Promise
  finishInspection,    // () => Promise
  refreshPhotos,       // () => Promise
  updateRoomNotes,     // (room, notes) => Promise
  appendRoomNotes,     // (room, text) => Promise
  clearRoomNotes,      // (room) => Promise
} = useInspection();
```

#### `useLanguage`
```typescript
const {
  language,     // 'en' | 'es'
  setLanguage,  // (lang) => void
  t,            // (key) => string
} = useLanguage();
```

#### `useOnlineStatus`
```typescript
const isOnline = useOnlineStatus(); // boolean
```

#### `useVoiceDictation`
```typescript
const {
  isListening,    // boolean
  isSupported,    // boolean
  transcript,     // string
  startListening, // () => void
  stopListening,  // () => void
} = useVoiceDictation();
```

---

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon key | `eyJ...` |
| `VITE_SUPABASE_PROJECT_ID` | Supabase project ID | `ziarptgdthwgiwbpowhj` |

---

## Deployment

### Preview URL
`https://id-preview--8cd0f791-ce4c-4a88-8c8b-73979d499fed.lovable.app`

### Published URL
`https://inspect-ai-anywhere.lovable.app`

### Build Command
```bash
npm run build
# or
bun run build
```

### Output
Static files in `dist/` directory, ready for deployment to any static hosting service.

---

## Security Considerations

1. **No Authentication**: App operates without user accounts - all data is local
2. **Local Data Only**: Sensitive inspection data never leaves the device (except for AI analysis)
3. **Edge Function**: `verify_jwt = false` - publicly accessible for offline-first compatibility
4. **No Server-Side Storage**: All photos and reports stored locally in IndexedDB

---

## Browser Support

| Browser | Support Level |
|---------|---------------|
| Chrome/Edge | Full |
| Safari (iOS) | Full (PWA with limitations) |
| Firefox | Full |
| Samsung Internet | Full |

### Required APIs
- IndexedDB
- Service Workers
- Web Speech API (for voice dictation)
- MediaDevices (for camera access)
- Blob/File API

---

*Last Updated: February 2025*
*Version: 1.0.0*
