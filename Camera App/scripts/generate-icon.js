/**
 * Generate Letter Lens app icon — Owl with magnifying glass
 * 
 * Run: node scripts/generate-icon.js
 */
const sharp = require('sharp');
const path = require('path');

const BRAND_YELLOW = '#FFD60A';
const DARK_BG = '#1A1A2E';
const OWL_BODY = '#6B4C9A';     // Purple owl
const OWL_BELLY = '#8B6FBF';    // Lighter purple belly
const OWL_EYES_BG = '#FFFFFF';   // White eye circles
const OWL_PUPILS = '#1A1A2E';    // Dark pupils
const OWL_BEAK = '#FF9F43';      // Orange beak
const LENS_RIM = '#FFD60A';      // Yellow lens rim
const LENS_GLASS = '#E0F0FF';    // Light blue glass
const LENS_HANDLE = '#C0A000';   // Darker gold handle

function createOwlSvg(size) {
  const s = size;
  const cx = s / 2; // center x
  const cy = s / 2; // center y
  const r = s * 0.42; // main body radius

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <defs>
    <radialGradient id="bg" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#2D2D5E"/>
      <stop offset="100%" stop-color="${DARK_BG}"/>
    </radialGradient>
    <radialGradient id="lens-glass" cx="40%" cy="35%" r="55%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="${LENS_GLASS}" stop-opacity="0.3"/>
    </radialGradient>
    <radialGradient id="owl-grad" cx="50%" cy="35%" r="55%">
      <stop offset="0%" stop-color="#7B5CAA"/>
      <stop offset="100%" stop-color="${OWL_BODY}"/>
    </radialGradient>
  </defs>

  <!-- Background -->
  <rect width="${s}" height="${s}" rx="${s * 0.18}" fill="url(#bg)"/>

  <!-- Stars (decorative) -->
  <circle cx="${s * 0.12}" cy="${s * 0.15}" r="${s * 0.008}" fill="${BRAND_YELLOW}" opacity="0.7"/>
  <circle cx="${s * 0.88}" cy="${s * 0.12}" r="${s * 0.006}" fill="${BRAND_YELLOW}" opacity="0.5"/>
  <circle cx="${s * 0.15}" cy="${s * 0.82}" r="${s * 0.005}" fill="${BRAND_YELLOW}" opacity="0.4"/>
  <circle cx="${s * 0.92}" cy="${s * 0.75}" r="${s * 0.007}" fill="${BRAND_YELLOW}" opacity="0.6"/>
  <circle cx="${s * 0.08}" cy="${s * 0.5}" r="${s * 0.005}" fill="#FFFFFF" opacity="0.3"/>
  <circle cx="${s * 0.78}" cy="${s * 0.08}" r="${s * 0.005}" fill="#FFFFFF" opacity="0.3"/>

  <!-- Owl Body -->
  <ellipse cx="${cx}" cy="${cy * 1.08}" rx="${r * 0.85}" ry="${r}" fill="url(#owl-grad)"/>

  <!-- Owl Belly -->
  <ellipse cx="${cx}" cy="${cy * 1.2}" rx="${r * 0.5}" ry="${r * 0.55}" fill="${OWL_BELLY}" opacity="0.6"/>
  <!-- Belly pattern (V shapes) -->
  <path d="M${cx - s*0.08} ${cy * 1.1} l${s*0.04} ${s*0.03} l${s*0.04} ${-s*0.03}" stroke="${OWL_BODY}" stroke-width="${s*0.006}" fill="none" opacity="0.5"/>
  <path d="M${cx - s*0.04} ${cy * 1.18} l${s*0.04} ${s*0.03} l${s*0.04} ${-s*0.03}" stroke="${OWL_BODY}" stroke-width="${s*0.006}" fill="none" opacity="0.5"/>

  <!-- Ear tufts (left) -->
  <path d="M${cx - r*0.55} ${cy * 0.72} L${cx - r*0.75} ${cy * 0.42} L${cx - r*0.25} ${cy * 0.65}" fill="${OWL_BODY}"/>
  <!-- Ear tufts (right) -->
  <path d="M${cx + r*0.55} ${cy * 0.72} L${cx + r*0.75} ${cy * 0.42} L${cx + r*0.25} ${cy * 0.65}" fill="${OWL_BODY}"/>

  <!-- Left Eye (white circle) -->
  <circle cx="${cx - r*0.32}" cy="${cy * 0.88}" r="${r * 0.28}" fill="${OWL_EYES_BG}"/>
  <circle cx="${cx - r*0.32}" cy="${cy * 0.88}" r="${r * 0.28}" stroke="${OWL_BODY}" stroke-width="${s*0.008}" fill="none"/>
  <!-- Left Pupil -->
  <circle cx="${cx - r*0.28}" cy="${cy * 0.88}" r="${r * 0.14}" fill="${OWL_PUPILS}"/>
  <!-- Left Eye shine -->
  <circle cx="${cx - r*0.22}" cy="${cy * 0.83}" r="${r * 0.05}" fill="#FFFFFF" opacity="0.8"/>

  <!-- Right Eye (white circle) -->
  <circle cx="${cx + r*0.32}" cy="${cy * 0.88}" r="${r * 0.28}" fill="${OWL_EYES_BG}"/>
  <circle cx="${cx + r*0.32}" cy="${cy * 0.88}" r="${r * 0.28}" stroke="${OWL_BODY}" stroke-width="${s*0.008}" fill="none"/>
  <!-- Right Pupil -->
  <circle cx="${cx + r*0.36}" cy="${cy * 0.88}" r="${r * 0.14}" fill="${OWL_PUPILS}"/>
  <!-- Right Eye shine -->
  <circle cx="${cx + r*0.42}" cy="${cy * 0.83}" r="${r * 0.05}" fill="#FFFFFF" opacity="0.8"/>

  <!-- Beak -->
  <path d="M${cx - s*0.03} ${cy * 0.97} L${cx} ${cy * 1.06} L${cx + s*0.03} ${cy * 0.97} Z" fill="${OWL_BEAK}"/>

  <!-- Feet -->
  <ellipse cx="${cx - s*0.1}" cy="${s * 0.84}" rx="${s*0.06}" ry="${s*0.02}" fill="${OWL_BEAK}" opacity="0.8"/>
  <ellipse cx="${cx + s*0.1}" cy="${s * 0.84}" rx="${s*0.06}" ry="${s*0.02}" fill="${OWL_BEAK}" opacity="0.8"/>

  <!-- Magnifying Glass (bottom-right, overlapping owl) -->
  <!-- Handle -->
  <line x1="${cx + r*0.55}" y1="${cy * 1.3}" x2="${s * 0.88}" y2="${s * 0.88}" stroke="${LENS_HANDLE}" stroke-width="${s * 0.04}" stroke-linecap="round"/>
  <!-- Lens ring -->
  <circle cx="${cx + r*0.4}" cy="${cy * 1.15}" r="${r * 0.32}" fill="url(#lens-glass)" stroke="${LENS_RIM}" stroke-width="${s * 0.025}"/>
  <!-- Letter "A" inside lens -->
  <text x="${cx + r*0.4}" y="${cy * 1.22}" text-anchor="middle" font-family="Arial Black, sans-serif" font-weight="900" font-size="${s * 0.12}" fill="${BRAND_YELLOW}">A</text>
  <!-- Lens shine -->
  <path d="M${cx + r*0.25} ${cy * 1.05} Q${cx + r*0.35} ${cy * 1.0} ${cx + r*0.5} ${cy * 1.03}" stroke="#FFFFFF" stroke-width="${s*0.008}" fill="none" opacity="0.5" stroke-linecap="round"/>

  <!-- App name at bottom -->
  <text x="${cx}" y="${s * 0.95}" text-anchor="middle" font-family="Arial Rounded MT Bold, Arial, sans-serif" font-weight="bold" font-size="${s * 0.055}" fill="${BRAND_YELLOW}" letter-spacing="${s * 0.003}">LETTER LENS</text>
</svg>`;
}

function createAdaptiveSvg(size) {
  // Adaptive icon: just the owl centered, no text, no rounded corners (Android adds them)
  const s = size;
  const cx = s / 2;
  const cy = s * 0.45; // shifted up since no text
  const r = s * 0.35;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <defs>
    <radialGradient id="bg2" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#2D2D5E"/>
      <stop offset="100%" stop-color="${DARK_BG}"/>
    </radialGradient>
    <radialGradient id="lens-glass2" cx="40%" cy="35%" r="55%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="${LENS_GLASS}" stop-opacity="0.3"/>
    </radialGradient>
    <radialGradient id="owl-grad2" cx="50%" cy="35%" r="55%">
      <stop offset="0%" stop-color="#7B5CAA"/>
      <stop offset="100%" stop-color="${OWL_BODY}"/>
    </radialGradient>
  </defs>

  <rect width="${s}" height="${s}" fill="url(#bg2)"/>

  <!-- Stars -->
  <circle cx="${s*0.1}" cy="${s*0.1}" r="${s*0.008}" fill="${BRAND_YELLOW}" opacity="0.7"/>
  <circle cx="${s*0.9}" cy="${s*0.08}" r="${s*0.006}" fill="${BRAND_YELLOW}" opacity="0.5"/>
  <circle cx="${s*0.12}" cy="${s*0.85}" r="${s*0.005}" fill="${BRAND_YELLOW}" opacity="0.4"/>
  <circle cx="${s*0.88}" cy="${s*0.9}" r="${s*0.007}" fill="${BRAND_YELLOW}" opacity="0.6"/>

  <!-- Owl Body -->
  <ellipse cx="${cx}" cy="${cy * 1.12}" rx="${r * 0.9}" ry="${r * 1.05}" fill="url(#owl-grad2)"/>

  <!-- Belly -->
  <ellipse cx="${cx}" cy="${cy * 1.28}" rx="${r * 0.52}" ry="${r * 0.55}" fill="${OWL_BELLY}" opacity="0.6"/>
  <path d="M${cx - s*0.06} ${cy*1.15} l${s*0.03} ${s*0.025} l${s*0.03} ${-s*0.025}" stroke="${OWL_BODY}" stroke-width="${s*0.005}" fill="none" opacity="0.5"/>
  <path d="M${cx - s*0.03} ${cy*1.22} l${s*0.03} ${s*0.025} l${s*0.03} ${-s*0.025}" stroke="${OWL_BODY}" stroke-width="${s*0.005}" fill="none" opacity="0.5"/>

  <!-- Ear tufts -->
  <path d="M${cx - r*0.58} ${cy*0.78} L${cx - r*0.8} ${cy*0.42} L${cx - r*0.28} ${cy*0.7}" fill="${OWL_BODY}"/>
  <path d="M${cx + r*0.58} ${cy*0.78} L${cx + r*0.8} ${cy*0.42} L${cx + r*0.28} ${cy*0.7}" fill="${OWL_BODY}"/>

  <!-- Eyes -->
  <circle cx="${cx - r*0.35}" cy="${cy * 0.92}" r="${r*0.3}" fill="${OWL_EYES_BG}"/>
  <circle cx="${cx - r*0.35}" cy="${cy * 0.92}" r="${r*0.3}" stroke="${OWL_BODY}" stroke-width="${s*0.007}" fill="none"/>
  <circle cx="${cx - r*0.3}" cy="${cy * 0.92}" r="${r*0.15}" fill="${OWL_PUPILS}"/>
  <circle cx="${cx - r*0.24}" cy="${cy * 0.87}" r="${r*0.05}" fill="#FFFFFF" opacity="0.8"/>

  <circle cx="${cx + r*0.35}" cy="${cy * 0.92}" r="${r*0.3}" fill="${OWL_EYES_BG}"/>
  <circle cx="${cx + r*0.35}" cy="${cy * 0.92}" r="${r*0.3}" stroke="${OWL_BODY}" stroke-width="${s*0.007}" fill="none"/>
  <circle cx="${cx + r*0.4}" cy="${cy * 0.92}" r="${r*0.15}" fill="${OWL_PUPILS}"/>
  <circle cx="${cx + r*0.46}" cy="${cy * 0.87}" r="${r*0.05}" fill="#FFFFFF" opacity="0.8"/>

  <!-- Beak -->
  <path d="M${cx - s*0.025} ${cy} L${cx} ${cy*1.1} L${cx + s*0.025} ${cy} Z" fill="${OWL_BEAK}"/>

  <!-- Feet -->
  <ellipse cx="${cx - s*0.08}" cy="${s*0.78}" rx="${s*0.05}" ry="${s*0.015}" fill="${OWL_BEAK}" opacity="0.8"/>
  <ellipse cx="${cx + s*0.08}" cy="${s*0.78}" rx="${s*0.05}" ry="${s*0.015}" fill="${OWL_BEAK}" opacity="0.8"/>

  <!-- Magnifying Glass -->
  <line x1="${cx + r*0.6}" y1="${cy*1.35}" x2="${s*0.85}" y2="${s*0.88}" stroke="${LENS_HANDLE}" stroke-width="${s*0.035}" stroke-linecap="round"/>
  <circle cx="${cx + r*0.45}" cy="${cy*1.2}" r="${r*0.33}" fill="url(#lens-glass2)" stroke="${LENS_RIM}" stroke-width="${s*0.022}"/>
  <text x="${cx + r*0.45}" y="${cy*1.27}" text-anchor="middle" font-family="Arial Black, sans-serif" font-weight="900" font-size="${s*0.1}" fill="${BRAND_YELLOW}">A</text>
  <path d="M${cx + r*0.3} ${cy*1.1} Q${cx + r*0.4} ${cy*1.05} ${cx + r*0.55} ${cy*1.08}" stroke="#FFFFFF" stroke-width="${s*0.007}" fill="none" opacity="0.5" stroke-linecap="round"/>
</svg>`;
}

async function generateIcons() {
  const assetsDir = path.join(__dirname, '..', 'assets');

  // icon.png — 1024x1024 (main app icon)
  const iconSvg = Buffer.from(createOwlSvg(1024));
  await sharp(iconSvg).png().toFile(path.join(assetsDir, 'icon.png'));
  console.log('✅ Generated assets/icon.png (1024x1024)');

  // adaptive-icon.png — 1024x1024 (Android adaptive icon)
  const adaptiveSvg = Buffer.from(createAdaptiveSvg(1024));
  await sharp(adaptiveSvg).png().toFile(path.join(assetsDir, 'adaptive-icon.png'));
  console.log('✅ Generated assets/adaptive-icon.png (1024x1024)');

  // splash-icon.png — 1284x2778 (splash screen)
  // Use the owl icon centered on dark background
  const splashBg = sharp({
    create: {
      width: 1284,
      height: 2778,
      channels: 4,
      background: { r: 26, g: 26, b: 46, alpha: 1 } // DARK_BG
    }
  });

  const owlForSplash = Buffer.from(createAdaptiveSvg(600));
  const owlPng = await sharp(owlForSplash).png().toBuffer();

  await splashBg
    .composite([{ input: owlPng, gravity: 'centre' }])
    .png()
    .toFile(path.join(assetsDir, 'splash-icon.png'));
  console.log('✅ Generated assets/splash-icon.png (1284x2778)');

  console.log('\n🦉 All icons generated! Copy assets/ folder to build machine.');
}

generateIcons().catch(console.error);
