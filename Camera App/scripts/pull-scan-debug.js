#!/usr/bin/env node
/**
 * pull-scan-debug.js
 *
 * Copies the most recent Scan-Handwriting debug artifacts from the
 * connected Android device into ./debug-scans/ on this machine.
 *
 * What gets pulled:
 *   - scanocr_<ts>.log         (full pipeline trace, JS + native)
 *   - scanocr_debug_<ts>.png   (binarized overlay with detected boxes)
 *   - scanocr_latest.txt       (pointer to latest log)
 *
 * Usage:
 *   node scripts/pull-scan-debug.js              # pull the latest scan once
 *   node scripts/pull-scan-debug.js --watch      # pull every time a new scan appears
 *   node scripts/pull-scan-debug.js --all        # pull every scanocr_* on the device
 *
 * Requires `adb` on PATH (ships with Android Studio platform-tools).
 *
 * Debug builds only — release APKs write nothing.
 */

const { execFileSync, spawnSync } = require('child_process');
const fs   = require('fs');
const path = require('path');

const APP_ID     = 'com.letterlens.app';
const DEVICE_DIR = `/sdcard/Android/data/${APP_ID}/files`;
const LOCAL_DIR  = path.resolve(__dirname, '..', 'debug-scans');

function adb(args, opts = {}) {
  const r = spawnSync('adb', args, { encoding: 'utf8', ...opts });
  if (r.error) throw r.error;
  if (r.status !== 0) throw new Error(`adb ${args.join(' ')} failed:\n${r.stderr || r.stdout}`);
  return r.stdout;
}

function ensureLocalDir() {
  if (!fs.existsSync(LOCAL_DIR)) fs.mkdirSync(LOCAL_DIR, { recursive: true });
}

function listDeviceFiles() {
  const out = adb(['shell', `ls ${DEVICE_DIR} 2>/dev/null || true`]);
  return out.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
}

function readLatestPointer() {
  const out = spawnSync(
    'adb',
    ['shell', `cat ${DEVICE_DIR}/scanocr_latest.txt 2>/dev/null || true`],
    { encoding: 'utf8' },
  );
  return (out.stdout || '').trim();
}

function pullFile(devicePath) {
  const name = path.basename(devicePath);
  const dest = path.join(LOCAL_DIR, name);
  adb(['pull', devicePath, dest]);
  return dest;
}

function pullLatest() {
  ensureLocalDir();
  const logPath = readLatestPointer();
  if (!logPath) {
    console.log('No scanocr_latest.txt on device yet — run a scan in the app first.');
    return null;
  }
  const ts = (logPath.match(/scanocr_(\d+)\.log/) || [])[1];
  if (!ts) {
    console.log(`Could not parse timestamp from: ${logPath}`);
    return null;
  }
  const pngPath = `${DEVICE_DIR}/scanocr_debug_${ts}.png`;

  const localLog = pullFile(logPath);
  let localPng = null;
  try { localPng = pullFile(pngPath); } catch { /* png is optional */ }

  console.log(`📝 log → ${path.relative(process.cwd(), localLog)}`);
  if (localPng) console.log(`🖼  png → ${path.relative(process.cwd(), localPng)}`);
  else          console.log('🖼  png → (not found — overlay may have failed to render)');
  return ts;
}

function pullAll() {
  ensureLocalDir();
  const files = listDeviceFiles().filter((f) => f.startsWith('scanocr_'));
  if (!files.length) {
    console.log('No scanocr_* files on device yet.');
    return;
  }
  for (const f of files) {
    try {
      const dest = pullFile(`${DEVICE_DIR}/${f}`);
      console.log(`✓ ${path.relative(process.cwd(), dest)}`);
    } catch (e) {
      console.warn(`✗ ${f}: ${e.message.split('\n')[0]}`);
    }
  }
}

async function watch() {
  console.log(`👀 Watching device for new scans… (polling scanocr_latest.txt every 2s)`);
  console.log(`   Output: ${LOCAL_DIR}`);
  console.log(`   Ctrl-C to stop.\n`);
  let lastTs = '';
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const logPath = readLatestPointer();
      const ts = (logPath.match(/scanocr_(\d+)\.log/) || [])[1] || '';
      if (ts && ts !== lastTs) {
        console.log(`\n— new scan ${ts} —`);
        pullLatest();
        lastTs = ts;
      }
    } catch (e) {
      console.warn(`(poll error: ${e.message.split('\n')[0]})`);
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
}

// ── Entry ────────────────────────────────────────────────────────
try {
  execFileSync('adb', ['version'], { stdio: 'ignore' });
} catch {
  console.error('❌ `adb` not found on PATH. Install Android platform-tools and try again.');
  process.exit(1);
}

const arg = process.argv[2];
if      (arg === '--watch') watch();
else if (arg === '--all')   pullAll();
else                        pullLatest();
