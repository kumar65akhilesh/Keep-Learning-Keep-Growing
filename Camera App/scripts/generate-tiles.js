/**
 * Generate tile background images for the home screen.
 * Each tile gets a fun cartoon illustration related to its mode.
 *
 * Run: node scripts/generate-tiles.js
 */
const sharp = require('sharp');
const path = require('path');

const TILE_SIZE = 400; // px square

const tiles = [
  {
    name: 'tile-read-abc',
    bg: '#E8F8FF',
    accent: '#4CC9F0',
    dark: '#2A8AB0',
    // Camera with letters floating out
    svg: (s) => `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
      <rect width="${s}" height="${s}" fill="#E8F8FF"/>
      <!-- Scattered letters background -->
      <text x="${s*0.08}" y="${s*0.25}" font-family="Arial Rounded MT Bold,Arial" font-weight="900" font-size="${s*0.18}" fill="#4CC9F0" opacity="0.15" transform="rotate(-15,${s*0.08},${s*0.25})">A</text>
      <text x="${s*0.7}" y="${s*0.2}" font-family="Arial Rounded MT Bold,Arial" font-weight="900" font-size="${s*0.14}" fill="#4CC9F0" opacity="0.12" transform="rotate(10,${s*0.7},${s*0.2})">B</text>
      <text x="${s*0.55}" y="${s*0.85}" font-family="Arial Rounded MT Bold,Arial" font-weight="900" font-size="${s*0.16}" fill="#4CC9F0" opacity="0.12" transform="rotate(8,${s*0.55},${s*0.85})">C</text>
      <text x="${s*0.12}" y="${s*0.8}" font-family="Arial Rounded MT Bold,Arial" font-weight="900" font-size="${s*0.12}" fill="#4CC9F0" opacity="0.10" transform="rotate(-8,${s*0.12},${s*0.8})">D</text>
      <text x="${s*0.82}" y="${s*0.55}" font-family="Arial Rounded MT Bold,Arial" font-weight="900" font-size="${s*0.13}" fill="#4CC9F0" opacity="0.10">E</text>
      <!-- Camera icon (center) -->
      <rect x="${s*0.22}" y="${s*0.32}" width="${s*0.56}" height="${s*0.4}" rx="${s*0.05}" fill="#4CC9F0" opacity="0.25"/>
      <rect x="${s*0.25}" y="${s*0.35}" width="${s*0.5}" height="${s*0.34}" rx="${s*0.04}" fill="white" opacity="0.5"/>
      <circle cx="${s*0.5}" cy="${s*0.52}" r="${s*0.1}" fill="#4CC9F0" opacity="0.3"/>
      <circle cx="${s*0.5}" cy="${s*0.52}" r="${s*0.06}" fill="#4CC9F0" opacity="0.2"/>
      <!-- Flash bump -->
      <rect x="${s*0.38}" y="${s*0.28}" width="${s*0.14}" height="${s*0.06}" rx="${s*0.02}" fill="#4CC9F0" opacity="0.2"/>
      <!-- Sparkles -->
      <text x="${s*0.78}" y="${s*0.35}" font-size="${s*0.06}" opacity="0.3">✨</text>
      <text x="${s*0.15}" y="${s*0.45}" font-size="${s*0.05}" opacity="0.25">⭐</text>
    </svg>`,
  },
  {
    name: 'tile-trace-abc',
    bg: '#E8FFE8',
    accent: '#06D6A0',
    dark: '#049E75',
    // Pencil tracing a dotted letter
    svg: (s) => `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
      <rect width="${s}" height="${s}" fill="#E8FFE8"/>
      <!-- Dotted letter A guide -->
      <text x="${s*0.5}" y="${s*0.72}" text-anchor="middle" font-family="Arial Rounded MT Bold,Arial" font-weight="900" font-size="${s*0.55}" fill="none" stroke="#06D6A0" stroke-width="3" stroke-dasharray="8,8" opacity="0.2">A</text>
      <!-- Partial solid trace on the A -->
      <line x1="${s*0.28}" y1="${s*0.68}" x2="${s*0.42}" y2="${s*0.3}" stroke="#06D6A0" stroke-width="${s*0.02}" stroke-linecap="round" opacity="0.35"/>
      <!-- Pencil -->
      <g transform="translate(${s*0.38},${s*0.22}) rotate(-45)">
        <rect x="0" y="-${s*0.02}" width="${s*0.22}" height="${s*0.04}" rx="${s*0.005}" fill="#FFD60A" opacity="0.5"/>
        <polygon points="0,-${s*0.02} -${s*0.04},0 0,${s*0.02}" fill="#2D2D2D" opacity="0.3"/>
        <rect x="${s*0.18}" y="-${s*0.02}" width="${s*0.04}" height="${s*0.04}" rx="${s*0.005}" fill="#F72585" opacity="0.4"/>
      </g>
      <!-- Stars -->
      <text x="${s*0.8}" y="${s*0.2}" font-size="${s*0.06}" opacity="0.3">🌟</text>
      <text x="${s*0.1}" y="${s*0.3}" font-size="${s*0.04}" opacity="0.2">✨</text>
      <text x="${s*0.75}" y="${s*0.8}" font-size="${s*0.05}" opacity="0.2">💫</text>
    </svg>`,
  },
  {
    name: 'tile-handwrite-abc',
    bg: '#FFF0F5',
    accent: '#F72585',
    dark: '#B01A62',
    // Hand writing with colorful strokes
    svg: (s) => `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
      <rect width="${s}" height="${s}" fill="#FFF0F5"/>
      <!-- Notebook lines -->
      <line x1="${s*0.1}" y1="${s*0.4}" x2="${s*0.9}" y2="${s*0.4}" stroke="#F72585" stroke-width="1" opacity="0.12"/>
      <line x1="${s*0.1}" y1="${s*0.55}" x2="${s*0.9}" y2="${s*0.55}" stroke="#F72585" stroke-width="1" opacity="0.12"/>
      <line x1="${s*0.1}" y1="${s*0.7}" x2="${s*0.9}" y2="${s*0.7}" stroke="#F72585" stroke-width="1" opacity="0.12"/>
      <!-- Handwritten ABC -->
      <text x="${s*0.15}" y="${s*0.65}" font-family="Comic Sans MS,cursive" font-size="${s*0.2}" fill="#F72585" opacity="0.2" transform="rotate(-3,${s*0.15},${s*0.65})">A</text>
      <text x="${s*0.38}" y="${s*0.62}" font-family="Comic Sans MS,cursive" font-size="${s*0.18}" fill="#F72585" opacity="0.18" transform="rotate(2,${s*0.38},${s*0.62})">B</text>
      <text x="${s*0.6}" y="${s*0.64}" font-family="Comic Sans MS,cursive" font-size="${s*0.19}" fill="#F72585" opacity="0.15" transform="rotate(-1,${s*0.6},${s*0.64})">C</text>
      <!-- Paint palette -->
      <ellipse cx="${s*0.72}" cy="${s*0.25}" rx="${s*0.18}" ry="${s*0.12}" fill="#F72585" opacity="0.12" transform="rotate(-20,${s*0.72},${s*0.25})"/>
      <circle cx="${s*0.65}" cy="${s*0.22}" r="${s*0.025}" fill="#4CC9F0" opacity="0.25"/>
      <circle cx="${s*0.72}" cy="${s*0.19}" r="${s*0.025}" fill="#06D6A0" opacity="0.25"/>
      <circle cx="${s*0.79}" cy="${s*0.22}" r="${s*0.025}" fill="#FFD60A" opacity="0.25"/>
      <circle cx="${s*0.76}" cy="${s*0.28}" r="${s*0.025}" fill="#7B2FF7" opacity="0.25"/>
      <!-- Sparkles -->
      <text x="${s*0.08}" y="${s*0.2}" font-size="${s*0.06}" opacity="0.25">🎨</text>
      <text x="${s*0.85}" y="${s*0.85}" font-size="${s*0.05}" opacity="0.2">✨</text>
    </svg>`,
  },
  {
    name: 'tile-read-123',
    bg: '#FFF3E0',
    accent: '#FF9E00',
    dark: '#CC7E00',
    // Camera with numbers
    svg: (s) => `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
      <rect width="${s}" height="${s}" fill="#FFF3E0"/>
      <!-- Scattered numbers -->
      <text x="${s*0.1}" y="${s*0.28}" font-family="Arial Rounded MT Bold,Arial" font-weight="900" font-size="${s*0.2}" fill="#FF9E00" opacity="0.15" transform="rotate(-10,${s*0.1},${s*0.28})">1</text>
      <text x="${s*0.72}" y="${s*0.22}" font-family="Arial Rounded MT Bold,Arial" font-weight="900" font-size="${s*0.16}" fill="#FF9E00" opacity="0.12" transform="rotate(12,${s*0.72},${s*0.22})">2</text>
      <text x="${s*0.6}" y="${s*0.88}" font-family="Arial Rounded MT Bold,Arial" font-weight="900" font-size="${s*0.15}" fill="#FF9E00" opacity="0.12" transform="rotate(5,${s*0.6},${s*0.88})">3</text>
      <text x="${s*0.1}" y="${s*0.82}" font-family="Arial Rounded MT Bold,Arial" font-weight="900" font-size="${s*0.13}" fill="#FF9E00" opacity="0.10" transform="rotate(-5,${s*0.1},${s*0.82})">4</text>
      <text x="${s*0.83}" y="${s*0.6}" font-family="Arial Rounded MT Bold,Arial" font-weight="900" font-size="${s*0.12}" fill="#FF9E00" opacity="0.10">5</text>
      <!-- Camera icon -->
      <rect x="${s*0.22}" y="${s*0.32}" width="${s*0.56}" height="${s*0.4}" rx="${s*0.05}" fill="#FF9E00" opacity="0.2"/>
      <rect x="${s*0.25}" y="${s*0.35}" width="${s*0.5}" height="${s*0.34}" rx="${s*0.04}" fill="white" opacity="0.4"/>
      <circle cx="${s*0.5}" cy="${s*0.52}" r="${s*0.1}" fill="#FF9E00" opacity="0.25"/>
      <circle cx="${s*0.5}" cy="${s*0.52}" r="${s*0.06}" fill="#FF9E00" opacity="0.15"/>
      <rect x="${s*0.38}" y="${s*0.28}" width="${s*0.14}" height="${s*0.06}" rx="${s*0.02}" fill="#FF9E00" opacity="0.15"/>
      <!-- Magnifying glass -->
      <text x="${s*0.78}" y="${s*0.38}" font-size="${s*0.06}" opacity="0.25">🔍</text>
    </svg>`,
  },
  {
    name: 'tile-trace-123',
    bg: '#F3E8FF',
    accent: '#7B2FF7',
    dark: '#5A1FBF',
    // Pencil tracing numbers
    svg: (s) => `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
      <rect width="${s}" height="${s}" fill="#F3E8FF"/>
      <!-- Dotted number 2 guide -->
      <text x="${s*0.5}" y="${s*0.72}" text-anchor="middle" font-family="Arial Rounded MT Bold,Arial" font-weight="900" font-size="${s*0.55}" fill="none" stroke="#7B2FF7" stroke-width="3" stroke-dasharray="8,8" opacity="0.2">2</text>
      <!-- Partial trace -->
      <path d="M${s*0.3},${s*0.35} Q${s*0.35},${s*0.22} ${s*0.5},${s*0.22}" stroke="#7B2FF7" stroke-width="${s*0.02}" stroke-linecap="round" fill="none" opacity="0.35"/>
      <!-- Pencil -->
      <g transform="translate(${s*0.48},${s*0.18}) rotate(-30)">
        <rect x="0" y="-${s*0.02}" width="${s*0.2}" height="${s*0.04}" rx="${s*0.005}" fill="#06D6A0" opacity="0.5"/>
        <polygon points="0,-${s*0.02} -${s*0.035},0 0,${s*0.02}" fill="#2D2D2D" opacity="0.3"/>
        <rect x="${s*0.16}" y="-${s*0.02}" width="${s*0.04}" height="${s*0.04}" rx="${s*0.005}" fill="#FFD60A" opacity="0.4"/>
      </g>
      <!-- Stars -->
      <text x="${s*0.82}" y="${s*0.25}" font-size="${s*0.05}" opacity="0.25">💫</text>
      <text x="${s*0.08}" y="${s*0.88}" font-size="${s*0.06}" opacity="0.2">⭐</text>
    </svg>`,
  },
  {
    name: 'tile-handwrite-123',
    bg: '#FFF8E0',
    accent: '#FFD60A',
    dark: '#C0A000',
    // Hand writing numbers
    svg: (s) => `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
      <rect width="${s}" height="${s}" fill="#FFF8E0"/>
      <!-- Notebook lines -->
      <line x1="${s*0.1}" y1="${s*0.4}" x2="${s*0.9}" y2="${s*0.4}" stroke="#C0A000" stroke-width="1" opacity="0.12"/>
      <line x1="${s*0.1}" y1="${s*0.55}" x2="${s*0.9}" y2="${s*0.55}" stroke="#C0A000" stroke-width="1" opacity="0.12"/>
      <line x1="${s*0.1}" y1="${s*0.7}" x2="${s*0.9}" y2="${s*0.7}" stroke="#C0A000" stroke-width="1" opacity="0.12"/>
      <!-- Handwritten 123 -->
      <text x="${s*0.15}" y="${s*0.65}" font-family="Comic Sans MS,cursive" font-size="${s*0.2}" fill="#C0A000" opacity="0.22" transform="rotate(-2,${s*0.15},${s*0.65})">1</text>
      <text x="${s*0.38}" y="${s*0.63}" font-family="Comic Sans MS,cursive" font-size="${s*0.19}" fill="#C0A000" opacity="0.18" transform="rotate(3,${s*0.38},${s*0.63})">2</text>
      <text x="${s*0.6}" y="${s*0.66}" font-family="Comic Sans MS,cursive" font-size="${s*0.2}" fill="#C0A000" opacity="0.15" transform="rotate(-2,${s*0.6},${s*0.66})">3</text>
      <!-- Abacus beads -->
      <line x1="${s*0.2}" y1="${s*0.18}" x2="${s*0.8}" y2="${s*0.18}" stroke="#C0A000" stroke-width="2" opacity="0.12"/>
      <circle cx="${s*0.3}" cy="${s*0.18}" r="${s*0.03}" fill="#F72585" opacity="0.25"/>
      <circle cx="${s*0.4}" cy="${s*0.18}" r="${s*0.03}" fill="#4CC9F0" opacity="0.25"/>
      <circle cx="${s*0.5}" cy="${s*0.18}" r="${s*0.03}" fill="#06D6A0" opacity="0.25"/>
      <circle cx="${s*0.6}" cy="${s*0.18}" r="${s*0.03}" fill="#7B2FF7" opacity="0.25"/>
      <circle cx="${s*0.7}" cy="${s*0.18}" r="${s*0.03}" fill="#FF9E00" opacity="0.25"/>
      <!-- Sparkle -->
      <text x="${s*0.82}" y="${s*0.88}" font-size="${s*0.05}" opacity="0.2">⭐</text>
      <text x="${s*0.05}" y="${s*0.4}" font-size="${s*0.04}" opacity="0.15">✨</text>
    </svg>`,
  },
];

async function generateTiles() {
  const assetsDir = path.join(__dirname, '..', 'assets');

  for (const tile of tiles) {
    const svgStr = tile.svg(TILE_SIZE);
    const svgBuf = Buffer.from(svgStr);
    const outPath = path.join(assetsDir, `${tile.name}.png`);
    await sharp(svgBuf).png().toFile(outPath);
    console.log(`✅ Generated assets/${tile.name}.png (${TILE_SIZE}x${TILE_SIZE})`);
  }

  console.log('\n🎨 All tile images generated! Copy assets/ folder to build machine.');
}

generateTiles().catch(console.error);
