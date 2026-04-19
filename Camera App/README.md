# � Little Letters

A playful, kid-friendly mobile app for young learners to **read** and **write** letters (A–Z) and numbers (1–9). Built with React Native (Expo SDK 55) and Google ML Kit for on-device OCR. Uses a high-pitched child-like TTS voice.

## ✨ Features

### Home Screen — 6-Mode Selector (2×3 grid)

Each tile has a **cartoon illustration background** with a layered cartoon badge icon.

| Tile | What it does |
|------|-----------|
| 📖 **Read ABC** | Opens the camera to scan printed/handwritten **letters**. ML Kit OCR detects text, filters to A–Z only, and shows results as colorful tappable cards. |
| ✏️ **Trace ABC** | Guided **stroke-by-stroke** tracing. Kids follow dotted guide paths for each stroke of every letter (A→Z). Auto-evaluates on finger-lift with proximity-based scoring. Speaks "Nice!" between strokes and "Good job!" on completion. |
| 🖊️ **Handwrite ABC** | Opens a blank drawing canvas. Kids write a letter freely, then tap "Recognize". The app identifies what was written and speaks it aloud. |
| 🔢 **Read 123** | Opens the camera to scan and recognize **numbers** (1–9 only). Same OCR flow as Read ABC but filtered to digits. |
| ✏️ **Trace 123** | Guided stroke-by-stroke tracing for numbers 1–9. Same guided system as Trace ABC but cycles through digits. |
| 🖊️ **Handwrite 123** | Freehand number writing → recognition. Same flow as Handwrite ABC but for digits. |

### Core Capabilities

- **Mode-Based Filtering** — Choosing a tile constrains OCR to that character set (letters OR digits), eliminating cross-set confusion (O/0, l/1, S/5, B/8)
- **Live Camera Preview** — Point camera at text; detected characters highlighted with bounding boxes (native only)
- **Capture & Recognize** — Take a photo for detailed recognition with star-based confidence ratings (1–5 stars)
- **Stroke-by-Stroke Tracing** — Guided canvas shows dotted guide paths per stroke. Evaluates user drawing using proximity sampling (60% of 50 guide samples must be within 12% of canvas size). Auto-advances through strokes; speaks encouragement.
- **Handwriting Recognition** — Blank canvas to draw freely, then tap Recognize to identify the character
- **Text-to-Speech** — Child-like voice (high pitch 1.5). Tap any card to hear it. Spell-out mode reads characters one by one with pauses. Stop button cancels immediately (including mid-spell)
- **Phonetic Pronunciations** — Ambiguous letters use "the letter A/E/I/O/U/R/Y" for clarity
- **Copy to Clipboard** — One-tap copy of all recognized characters as a string
- **Scan History** — Saved scans stored locally (SQLite on native, in-memory on web). Browse, search, delete, re-open
- **Kid-Friendly UI** — Bright pastel colors, Nunito font, large touch targets, star ratings, encouraging banners ("Super Star!", "Amazing!"), tile background illustrations, cartoon badge icons

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                         Home Screen                          │
│  ┌─────────┐ ┌─────────┐ ┌─────────────┐                    │
│  │📖Read ABC│ │✏️Trace ABC│ │🖊️Handwrite ABC│                  │
│  └────┬────┘ └────┬────┘ └──────┬──────┘                    │
│  ┌─────────┐ ┌─────────┐ ┌─────────────┐                    │
│  │🔢Read 123│ │✏️Trace 123│ │🖊️Hndwrt 123  │                  │
│  └────┬────┘ └────┬────┘ └──────┬──────┘                    │
│       │          │               │                  Bottom:  │
│       │      ┌───┴───┐          │           History / Settings│
│       │      │       │          │                            │
│  read-* → Camera → Result                                     │
│  trace-* → Tracing canvas (stroke-by-stroke guided)           │
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
- `trace-*` modes → Guided stroke-by-stroke tracing canvas
- `handwrite-*` modes → Blank canvas → Draw → Recognize button → Result

### Tracing System (`utils/strokePaths.ts`)

Each character (A–Z, 1–9) is defined as an ordered array of **strokes**. Each stroke is an array of normalised `[x, y]` waypoints in 0–1 coordinate space:

```typescript
const A: CharacterStrokes = [
  [[0.2, 1], [0.5, 0]],           // left diagonal (↗)
  [[0.5, 0], [0.8, 1]],           // right diagonal (↘)
  [[0.35, 0.55], [0.65, 0.55]],   // crossbar (→)
];
```

The tracing screen (`app/tracing.tsx`) uses `sampleStroke()` to generate 50 evenly-spaced guide points along each stroke. When the user lifts their finger, it checks what percentage of those guide points have a user-drawn point within 12% proximity. If ≥60% match, the stroke passes.

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
│   ├── index.tsx                 # Home — 2×3 grid with ImageBackground tiles
│   ├── camera.tsx                # Camera + OCR (native)
│   ├── camera.web.tsx            # Camera placeholder + demo mode (web)
│   ├── tracing.tsx               # Stroke-by-stroke guided tracing canvas
│   ├── handwrite.tsx             # Freehand drawing → recognize button
│   ├── result.tsx                # Recognized characters display + actions
│   ├── history.tsx               # Past scan records list
│   └── settings.tsx              # App preferences
├── assets/                       # Static images
│   ├── icon.png                  # App icon (owl with magnifying glass)
│   ├── adaptive-icon.png         # Android adaptive icon
│   ├── splash-icon.png           # Splash screen (owl at 80% canvas)
│   ├── tile-read-abc.png         # Tile bg: camera + scattered letters
│   ├── tile-trace-abc.png        # Tile bg: pencil tracing dotted A
│   ├── tile-handwrite-abc.png    # Tile bg: notebook + paint palette
│   ├── tile-read-123.png         # Tile bg: camera + scattered numbers
│   ├── tile-trace-123.png        # Tile bg: pencil tracing dotted 2
│   └── tile-handwrite-123.png    # Tile bg: notebook + abacus beads
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
├── constants/
│   └── theme.ts                 # Colors, Fonts, Spacing, Shadows (web-compatible boxShadow)
├── scripts/
│   ├── generate-icon.js          # Generates owl icon PNGs using sharp + SVG
│   ├── generate-tiles.js         # Generates 6 tile background PNGs using sharp + SVG
│   └── generate-readme-html.js   # Converts README.md → README.html via marked
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
│   ├── charPatterns.ts          # Legacy 5×7 bitmap patterns (unused, kept for reference)
│   ├── strokePaths.ts           # Normalised stroke definitions for A–Z, 1–9
│   └── debounce.ts              # debounce & throttle utilities
├── __tests__/                    # Unit tests
│   ├── services/
│   │   ├── clipboard.test.ts
│   │   ├── ocr.test.ts
│   │   └── tts.test.ts
│   ├── store/
│   │   └── stores.test.ts
│   └── utils/
│       ├── characterFilter.test.ts
│       └── debounce.test.ts
├── package.json
├── app.json                     # Expo config (SDK 55, bundleId, etc.)
├── tsconfig.json
└── babel.config.js
```

## 🚀 Getting Started

### Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| **Node.js** | 18+ | LTS recommended (`node -v` to check) |
| **npm** | 9+ | Comes with Node (`npm -v` to check) |
| **Git** | any | For cloning the repo |
| **Android Studio** | latest | For Android native builds (with SDK 34+) |
| **Xcode** | 15+ | For iOS builds (macOS only) |
| **Physical Android device** | Android 7+ | USB debugging enabled for on-device OCR testing |

### 1. Clone & Install

```bash
# Clone the repository
git clone <repo-url>
cd camera-ocr-app

# Install dependencies
# --legacy-peer-deps is required because react@19 has peer-dep conflicts
# with some Expo packages that haven't updated their peerDeps yet
npm install --legacy-peer-deps
```

### 2. Generate Assets (icons & tile images)

The app icon and tile background images are generated from SVG via the `sharp` library. Run both scripts if you need to regenerate them:

```bash
# Generate the owl app icon (icon.png, adaptive-icon.png, splash-icon.png)
node scripts/generate-icon.js

# Generate the 6 tile background images (tile-*.png)
node scripts/generate-tiles.js

# Regenerate README.html from README.md
node scripts/generate-readme-html.js
```

### 3. Start in Development Mode

#### Option A: Web Preview (quick, no phone needed)

```bash
# Start Metro bundler + open browser
npx expo start --web --port 3000
```

Then open **http://localhost:3000**. Web mode supports tracing, handwriting, TTS, and demo camera mode. Real camera/OCR requires a native build.

#### Option B: Android Dev Client (full features — recommended)

This is the recommended approach for testing camera + OCR on a physical device.

```bash
# Step 1: Generate native Android project (run once, or after changing app.json/plugins)
npx expo prebuild --clean

# Step 2: Build and install the dev client APK on connected device
npx expo run:android

# Step 3: Once the app is installed, start Metro bundler
# (the app on the phone will connect to this)
npx expo start --dev-client --port 3030
```

> **Tip:** After the initial `run:android` build, you only need Metro (`npx expo start --dev-client`) for JS-only changes. Re-run `prebuild --clean` + `run:android` only when native dependencies or `app.json` change.

#### Option C: iOS (macOS only)

```bash
npx expo prebuild --clean
npx expo run:ios

# Then start Metro
npx expo start --dev-client --port 3030
```

### 4. Two-Machine Workflow

If you develop on one machine (VS Code) and build on another:

```
VS Code Machine                    Build Machine
┌──────────────┐                  ┌──────────────┐
│ Edit code     │  ──copy files→  │ Metro bundler │
│ Generate PNGs │                  │ npx expo start│
│ Run tests     │                  │ Phone via USB │
└──────────────┘                  └──────────────┘
```

1. **Edit** files on VS Code machine
2. **Copy** changed files to build machine (same relative path)
3. On build machine, Metro auto-reloads on file change — or press `r` in Metro terminal
4. For **native changes** (new native package, app.json changes): re-run `npx expo prebuild --clean && npx expo run:android` on the build machine

### 5. Common Dev Commands Reference

```bash
# ─── Starting ────────────────────────────────────────────────
npx expo start                        # Start Metro (auto-detect platform)
npx expo start --web --port 3000      # Web preview on port 3000
npx expo start --dev-client --port 3030 # Dev client mode (for native)
npx expo start --clear                # Clear Metro cache & start

# ─── Building ────────────────────────────────────────────────
npx expo prebuild                     # Generate native projects (android/ ios/)
npx expo prebuild --clean             # Wipe & regenerate native projects
npx expo run:android                  # Build + install on Android device
npx expo run:ios                      # Build + install on iOS simulator

# ─── Testing ─────────────────────────────────────────────────
npm test                              # Run all tests with coverage report
npx jest --watch                      # Run tests in watch mode
npx jest __tests__/utils              # Run only util tests
npx jest --testPathPattern=ocr        # Run only tests matching "ocr"

# ─── Linting ─────────────────────────────────────────────────
npm run lint                          # ESLint check

# ─── Asset Generation ────────────────────────────────────────
node scripts/generate-icon.js         # Regenerate app icons
node scripts/generate-tiles.js        # Regenerate tile backgrounds
node scripts/generate-readme-html.js  # Regenerate README.html

# ─── Troubleshooting ─────────────────────────────────────────
npx expo start --clear                # Clear Metro cache
npx expo install --fix                # Fix version mismatches
rm -rf node_modules && npm install --legacy-peer-deps  # Clean install

# Kill a stuck port (Windows)
netstat -ano | findstr :3030
taskkill /F /PID <PID>

# Kill a stuck port (macOS/Linux)
lsof -i :3030
kill -9 <PID>
```

### 6. Environment Variables

The app currently uses no environment variables. All config is in `app.json` and `constants/theme.ts`.

### Web Limitations

On web, camera and ML Kit are unavailable. The app provides:
- **Demo mode** on the camera screen — generates random sample characters
- **Writing practice** — fully functional (drawing canvas works with mouse)
- **TTS** — uses Web Speech API with high pitch
- **History** — in-memory only (lost on page refresh)

## 🧪 Running Tests

```bash
npm test                  # All tests with coverage
npx jest --watch          # Watch mode
npx jest __tests__/utils  # Specific folder
```

**Test files:**

| Test file | What it covers |
|---|---|
| `__tests__/services/clipboard.test.ts` | Clipboard copy + paste |
| `__tests__/services/ocr.test.ts` | OCR processing + mode filtering |
| `__tests__/services/tts.test.ts` | TTS speak + cancel + phonetics |
| `__tests__/store/stores.test.ts` | Zustand store state transitions |
| `__tests__/utils/characterFilter.test.ts` | Mode detection + character filtering |
| `__tests__/utils/debounce.test.ts` | Debounce + throttle timing |

**Coverage target:** ≥80% on services and utilities.

## 📦 Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `expo` | ~55.0.11 | Framework (SDK 55) |
| `react` / `react-dom` | ^19.2.3 | UI library |
| `react-native` | 0.84.1 | Mobile runtime |
| `expo-camera` | ~55.0.13 | Camera access (CameraView) |
| `react-native-mlkit-ocr` | ^0.3.0 | On-device OCR (Google ML Kit) |
| `expo-speech` | ~55.0.11 | Text-to-speech |
| `expo-clipboard` | ~55.0.11 | Copy to clipboard |
| `expo-sqlite` | ~55.0.13 | Local SQLite history (native) |
| `expo-image-manipulator` | ~55.0.13 | Image preprocessing |
| `expo-router` | ~55.0.10 | File-based navigation |
| `zustand` | ^5.0.12 | State management |
| `react-native-reanimated` | ~4.3.0 | Animations |
| `@expo-google-fonts/nunito` | ^0.2.0 | Kid-friendly rounded font |
| `sharp` (dev) | ^0.34.5 | SVG → PNG asset generation |
| `marked` (dev) | ^17.0.6 | Markdown → HTML for README |

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

**Tile Backgrounds:** Each home screen tile has a generated pastel illustration (camera icons, pencils, scattered letters/numbers, notebook lines, paint palettes, abacus beads) rendered at low opacity so foreground text stays readable.

## 🔧 Known Issues & TODOs

### Current State (Working)
- [x] 6-mode home screen with cartoon badge icons and tile background illustrations
- [x] Camera screen with demo mode (web) / ML Kit OCR (native)
- [x] Stroke-by-stroke guided tracing (proximity-based evaluation, auto-advance)
- [x] Handwriting recognition with blank canvas and Recognize button
- [x] Result screen with letter cards, star ratings, TTS, copy, save
- [x] History screen with search, delete, re-open
- [x] Settings screen (speech speed, spell-out, auto-save, default mode)
- [x] Child-like TTS voice with proper letter pronunciations
- [x] Custom owl app icon and splash screen
- [x] Web preview works at localhost:3000

### TODO / Future Enhancements
- [ ] **Handwriting recognition model** — Replace random demo recognition with a TFLite CNN model for real handwritten character identification
- [ ] **Sound effects** — Add fun sounds on recognition success (currently silent)
- [ ] **Persistent web storage** — Use IndexedDB or localStorage instead of in-memory for web history
- [ ] **Gamification** — Track progress per letter, award badges, show completion percentage
- [ ] **Dark mode** — Theme toggle exists in settings store but UI not implemented
- [ ] **Animations** — Add Reanimated-powered transitions for card reveals and tracing success

## 📝 Changelog

### v1.0.0 (April 2026)
- Initial release with 6 modes (Read/Trace/Handwrite × ABC/123)
- Stroke-by-stroke guided tracing with normalised waypoint definitions (A–Z, 1–9)
- On-device ML Kit OCR for camera modes
- Cartoon tile backgrounds with ImageBackground
- Custom owl-with-magnifying-glass app icon
- Child-like TTS with phonetic pronunciations
- SQLite scan history (native) / in-memory (web)
- Zustand v5 state management

## 📝 License

MIT
