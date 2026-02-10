# 365 InspectAI

**AI-powered property inspection software for field professionals.**

A mobile-first, offline-first Progressive Web Application (PWA) that enables inspectors to capture photos, receive AI-powered defect analysis, annotate findings, and generate professional PDF reports — all without requiring internet connectivity.

🌐 **Live App:** https://inspect-ai-anywhere.lovable.app  
📧 **Support:** support@365globalsolutions.com

---

## Features

| Feature | Description |
|---------|-------------|
| 📸 **Photo Capture** | Camera-first interface with compression, thumbnails, and up to 200 photos per inspection |
| 🤖 **AI Analysis** | Gemini-powered defect detection with Observation → Implication → Recommendation format |
| ✏️ **Annotations** | Mark defects directly on photos (arrow, circle, rectangle, freehand, text) |
| 📄 **PDF Reports** | Professional "Property Inspection Report" with 10 sections, agent-friendly summary |
| 🎤 **Voice Dictation** | Hands-free note-taking organized by room |
| 🌐 **Bilingual** | Full English/Spanish support with formal professional tone |
| 🏢 **White-Label** | Complete company branding, custom disclaimers, legal templates |
| 📱 **Offline-First** | Full functionality without internet via IndexedDB + service workers |
| 🔑 **Licensing** | Self-hosted license system with device management |
| 🏠 **25+ Rooms** | Pre-built room library with custom rooms and drag-and-drop reorder |

---

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Data:** IndexedDB (idb), TanStack Query, React Hook Form, Zod
- **PDF:** jsPDF, html2canvas, DOMPurify
- **AI:** Google Gemini 2.5 Flash (via Lovable AI Gateway)
- **Backend:** Lovable Cloud (Edge Functions + Database)
- **PWA:** vite-plugin-pwa, Workbox

---

## Quick Start

```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open http://localhost:5173 in your browser.

---

## Project Structure

```
src/
├── components/     # UI components (30+ feature, 40+ shadcn/ui)
├── hooks/          # React hooks (inspection, license, language, voice, online)
├── lib/            # Business logic (DB, AI, PDF, licensing, i18n)
│   └── pdf/        # Modular PDF generation (11 files)
├── pages/          # Route pages
└── assets/         # Demo photos, logo

supabase/
└── functions/      # Edge Functions (analyze-photo, verify-license)
```

---

## Documentation

| Document | Purpose |
|----------|---------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System architecture, features, data flows |
| [TECHNICAL_DOCUMENTATION.md](./TECHNICAL_DOCUMENTATION.md) | Full API reference, data models, security |
| [PRODUCTION_READY_VERIFICATION.md](./PRODUCTION_READY_VERIFICATION.md) | Annotation system verification report |

---

## Key Workflows

### Inspection Flow
1. Create inspection (address, client, type)
2. Select room → Capture photos or upload
3. AI analyzes each photo automatically
4. Annotate photos, add manual findings
5. Voice-dictate room notes
6. Build report (select photos, add deferred items, maintenance)
7. Generate PDF → Download

### Licensing Flow
1. Enter license key in Settings
2. Verify against backend (Edge Function)
3. Device registered (2-device limit)
4. 7-day offline grace period
5. Export always available, even unlicensed

---

## Build & Deploy

```bash
npm run build      # Production build → dist/
```

The app is hosted on Lovable Cloud and published via the Lovable editor.

---

## License

Proprietary — 365 Global Solutions
