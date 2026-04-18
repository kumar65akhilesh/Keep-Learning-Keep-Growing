# 🔍 Letter Lens

A playful, kid-friendly mobile app for young learners to **read** and **write** letters (A–Z) and numbers (1–9). Built with React Native (Expo SDK 55) and Google ML Kit for on-device OCR. Uses a high-pitched child-like TTS voice.

## ✨ Features

### Home Screen — 6-Mode Selector (2×3 grid)

| Tile | What it does |
|------|-----------|
| 📖 **Read ABC** | Opens the camera to scan printed/handwritten **letters**. ML Kit OCR detects text, filters to A–Z only, and shows results as colorful tappable cards. |
| ✏️ **Trace ABC** | Opens a tracing canvas with a large faded guide letter (A→Z). Kids trace over the letter using their finger or mouse. Navigate Prev/Next through the alphabet, hear each letter spoken, and clear to retry. |
| 🖊️ **Handwrite ABC** | Opens a blank drawing canvas. Kids write a letter freely, then tap “Recognize”. The app identifies what was written and speaks it aloud. (Demo mode uses random matching; future: TFLite CNN for real recognition.) |
| 🔢 **Read 123** | Opens the camera to scan and recognize **numbers** (1–9 only). Same OCR flow as Read ABC but filtered to digits. |
| ✏️ **Trace 123** | Tracing practice for numbers 1–9. Same guided canvas as Trace ABC but cycles through digits. |
| 🖊️ **Handwrite 123** | Freehand number writing → recognition. Same flow as Handwrite ABC but for digits. |

### Core Capabilities

- **Mode-Based Filtering** — Choosing a tile constrains OCR to that character set (letters OR digits), eliminating cross-set confusion (O/0, l/1, S/5, B/8)
- **Live Camera Preview** — Point camera at text; detected characters highlighted with bounding boxes (native only)
- **Capture & Recognize** — Take a photo for detailed recognition with star-based confidence ratings (1–5 stars)
- **Tracing Practice** — Guided canvas with faded guide character, character strip for quick navigation
- **Handwriting Recognition** — Blank canvas to draw freely, then tap Recognize to identify the character
- **Text-to-Speech** — Child-like voice (high pitch 1.5). Tap any card to hear it. Spell-out mode reads characters one by one with pauses. Stop button cancels immediately (including mid-spell)
- **Phonetic Pronunciations** — Ambiguous letters use "the letter A/E/I/O/U/R/Y" for clarity
- **Copy to Clipboard** — One-tap copy of all recognized characters as a string
- **Scan History** — Saved scans stored locally (SQLite on native, in-memory on web). Browse, search, delete, re-open
- **Kid-Friendly UI** — Bright pastel colors, Nunito font, large touch targets, star ratings, encouraging banners ("Super Star!", "Amazing!"), bouncy animations

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                         Home Screen                          │
│  ┌─────────┐ ┌─────────┐ ┌─────────────┐ ┌─────────┐  │
│  │📖Read ABC│ │✏️Trace ABC│ │🖊️Handwrite ABC│ │🔢Read 123│  │
│  └────┬────┘ └────┬────┘ └──────┬──────┘ └────┬────┘  │
│       │          │               │              │         │
│  ┌─────────┐ ┌──────────┐ ┌──────────────┐              │
│  │✏️Trace 123│ │🖊️Hndwrt 123│ │ History/Sett │              │
│  └─────────┘ └──────────┘ └──────────────┘              │
│                                                                │
│  read-* → Camera → Result                                     │
│  trace-* → Tracing canvas (guided)                             │
│  handwrite-* → Blank canvas → Recognize                       │
└────────────────────────────────────────────────────────────────┘
```

### Recognition Modes

```typescript
type RecognitionMode =
  | 'read-abc' | 'trace-abc' | 'handwrite-abc'
  | 'read-123' | 'trace-123' | 'handwrite-123';
```

- `read-*` modes → Camera screen → OCR → Result screen
- `trace-*` modes → Guided tracing canvas with faded guide character
- `handwrite-*` modes → Blank canvas → Draw → Recognize button → Result

### Mode-Based Filtering (`utils/characterFilter.ts`)

`isLetterMode(mode)` checks if mode ends in `-abc`; `isReadMode(mode)` checks if it starts with `read-`; `isTraceMode(mode)` checks for `trace-`; `isHandwriteMode(mode)` checks for `handwrite-`. The `filterByMode()` function applies regex (`/^[A-Za-z]$/` or `/^[1-9]$/`) to raw ML Kit results, keeping only matching characters.

### TTS (`services/tts.ts`)

- **Child voice**: pitch 1.5, rate 0.85, prefers female/child voice on web
- **Cancellation**: internal `cancelledFlag` + `Speech.stop()` breaks spell-out loops instantly
- **Phonetics**: maps letters to pronunciations (e.g. `A → "the letter A"`, `B → "bee"`)

## 📁 Project Structure

```
camera-ocr-app/
├── app/                          # Expo Router screens
│   ├── _layout.tsx               # Root layout (Stack nav, font loading)
│   ├── index.tsx                 # Home — 2×3 mode selector grid (6 tiles)
│   ├── camera.tsx                # Camera + OCR (native)
│   ├── camera.web.tsx            # Camera placeholder + demo mode (web)
│   ├── tracing.tsx               # Guided tracing canvas with faded guide character
│   ├── handwrite.tsx             # Freehand drawing → recognize button
│   ├── result.tsx                # Recognized characters display + actions
│   ├── history.tsx               # Past scan records list
│   └── settings.tsx              # App preferences
├── components/
│   ├── camera/
│   │   ├── CaptureButton.tsx     # Large circular capture button
│   │   ├── LiveResultStrip.tsx   # Scrollable detected-character bubbles
│   │   └── OcrOverlay.tsx        # Bounding box overlay on camera preview
│   └── common/
│       ├── ActionButton.tsx      # Pill-shaped action button (Speak/Copy/Save/Retry)
│       ├── EncouragementBanner.tsx # "Great job!" motivational messages
│       ├── LetterBubble.tsx      # Small circular character bubble
│       ├── LetterCard.tsx        # Large character card with star confidence
│       └── LoadingSpinner.tsx    # Centered spinner
├── services/
│   ├── ocr.ts                   # ML Kit OCR wrapper + mode filtering (native)
│   ├── ocr.web.ts               # OCR stub returning empty results (web)
│   ├── tts.ts                   # Text-to-speech with child voice + cancellation
│   ├── clipboard.ts             # expo-clipboard wrapper
│   ├── history.ts               # SQLite scan history CRUD (native)
│   ├── history.web.ts           # In-memory scan history (web)
│   ├── imagePreprocessing.ts    # Image crop/resize (native)
│   └── imagePreprocessing.web.ts # Image stub (web)
├── store/                        # Zustand v5 state management
│   ├── ocrStore.ts              # mode, currentResult, liveCharacters, totalFound
│   ├── settingsStore.ts         # speechRate, spellOut, autoSave, defaultMode, theme
│   └── historyStore.ts          # scans array, isLoading
├── types/
│   ├── ocr.ts                   # RecognitionMode, RecognizedCharacter, OcrResult, etc.
│   └── index.ts                 # Re-exports
├── utils/
│   ├── characterFilter.ts      # isLetterMode, isReadMode, isTraceMode, isHandwriteMode, filterByMode
│   └── debounce.ts              # debounce & throttle utilities
├── constants/
│   └── theme.ts                 # Colors, Fonts, Spacing, Shadows (web-compatible boxShadow)
├── __tests__/                    # Unit tests (5 files)
│   ├── services/
│   ├── store/
│   └── utils/
├── package.json
├── app.json                     # Expo config (SDK 55, bundleId, etc.)
├── tsconfig.json
└── babel.config.js
```

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+**
- **Expo CLI** (`npx expo`)
- For native: Android Studio or Xcode
- For web preview: any modern browser

### Install & Run

```bash
cd camera-ocr-app

# Install dependencies (--legacy-peer-deps needed for react@19 compat)
npm install --legacy-peer-deps

# === Web preview (no phone needed) ===
npx expo start --web --port 3000
# Then open http://localhost:3000

# === Native (full camera + OCR) ===
npx expo prebuild          # Generate native projects
npx expo run:android       # Run on Android emulator/device
npx expo run:ios           # Run on iOS simulator/device
```

### Web Limitations

On web, camera and ML Kit are unavailable. The app provides:
- **Demo mode** on the camera screen — generates random sample characters
- **Writing practice** — fully functional (drawing canvas works with mouse)
- **TTS** — uses Web Speech API with high pitch
- **History** — in-memory only (lost on page refresh)

### Port Conflicts

If port 3000 is already in use:
```bash
# Find and kill the process (Windows)
netstat -ano | findstr :3000
taskkill /F /PID <PID>

# Or use a different port
npx expo start --web --port 3001
```

## 🧪 Running Tests

```bash
npm test                  # All tests with coverage
npx jest --watch          # Watch mode
npx jest __tests__/utils  # Specific folder
```

**Coverage target:** ≥80% on services and utilities.

## 📦 Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `expo` | ~55.0.11 | Framework (SDK 55) |
| `react` / `react-dom` | 19.2.0 | UI library (must match exactly) |
| `react-native` | 0.84.1 | Mobile runtime |
| `expo-camera` | ~55.0.6 | Camera access (CameraView) |
| `react-native-mlkit-ocr` | ^0.3.0 | On-device OCR (Google ML Kit) |
| `expo-speech` | ~55.0.3 | Text-to-speech |
| `expo-clipboard` | ~55.0.1 | Copy to clipboard |
| `expo-sqlite` | ~55.0.13 | Local SQLite history (native) |
| `expo-image-manipulator` | ~55.0.2 | Image preprocessing |
| `expo-router` | ~55.0.10 | File-based navigation |
| `zustand` | ^5.0.12 | State management |
| `react-native-reanimated` | ~4.3.0 | Animations |
| `@expo-google-fonts/nunito` | ^0.2.3 | Kid-friendly rounded font |

## 🎨 Design System

**Style:** Playful, kid-friendly with bright colors, rounded shapes, and large touch targets.

**Color palette:**
- Sky Blue `#4CC9F0` — Read ABC / primary
- Grass Green `#06D6A0` — Trace ABC
- Coral `#F72585` — Handwrite ABC
- Orange `#FF9E00` — Read 123
- Purple `#7B2FF7` — Trace 123
- Sunny Yellow `#FFD60A` — Handwrite 123

**Font:** Nunito (Regular, SemiBold, Bold, ExtraBold) — falls back to system sans-serif on web if load fails.

**Shadows:** Uses `boxShadow` on web, native shadow props on iOS/Android.

## 🔧 Known Issues & TODOs

### Current State (Working)
- [x] 6-mode home screen (Read ABC, Trace ABC, Handwrite ABC, Read 123, Trace 123, Handwrite 123)
- [x] Camera screen with demo mode (web) / ML Kit OCR (native)
- [x] Tracing practice with guided canvas and faded character template
- [x] Handwriting recognition with blank canvas and Recognize button
- [x] Result screen with letter cards, star ratings, TTS, copy, save
- [x] History screen with search, delete, re-open
- [x] Settings screen (speech speed, spell-out, auto-save, default mode)
- [x] Child-like TTS voice with proper letter pronunciations
- [x] Web preview works at localhost:3000

### TODO / Future Enhancements
- [ ] **Real device testing** — Test camera + ML Kit OCR on physical Android/iOS
- [ ] **Handwriting recognition model** — Replace random demo recognition with a TFLite CNN model for real handwritten character identification
- [ ] **Writing evaluation** — Compare user's drawn stroke to the guide letter (shape matching) in tracing mode
- [ ] **Sound effects** — Add fun sounds on recognition success (currently silent)
- [ ] **Persistent web storage** — Use IndexedDB or localStorage instead of in-memory for web history
- [ ] **Gamification** — Track progress per letter, award badges, show completion percentage
- [ ] **Dark mode** — Theme toggle exists in settings store but UI not implemented
- [ ] **Align package versions** — Some packages show version mismatch warnings vs Expo SDK 55 expected versions
- [ ] **Fix TypeScript types** — `@types/react@19.0.14` has JSX type mismatch with React 19.2; update to `~19.2.10`

## 📝 License

MIT
