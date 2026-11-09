/**
 * Generates the storefront's product artwork as self-hosted SVGs.
 *
 * Real product photography is a business asset; until it is uploaded through
 * the admin panel these deterministic, themed vector renders are used so the
 * site never ships broken images or external hotlinks. Any product image can
 * be replaced per-product from the admin panel.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const OUT = path.join(process.cwd(), "public", "products");
mkdirSync(OUT, { recursive: true });

const SHAPES = {
  laptop: (a, b) => `
    <rect x="150" y="190" width="300" height="190" rx="14" fill="url(#body)" stroke="${b}" stroke-opacity=".5" stroke-width="2"/>
    <rect x="168" y="206" width="264" height="158" rx="6" fill="url(#screen)"/>
    <path d="M120 386h360l22 34a10 10 0 0 1-9 15H107a10 10 0 0 1-9-15z" fill="url(#body)" stroke="${b}" stroke-opacity=".45" stroke-width="2"/>
    <rect x="262" y="396" width="76" height="8" rx="4" fill="${b}" fill-opacity=".55"/>
    <rect x="188" y="228" width="96" height="8" rx="4" fill="${a}" fill-opacity=".9"/>
    <rect x="188" y="248" width="150" height="6" rx="3" fill="${b}" fill-opacity=".5"/>
    <rect x="188" y="264" width="120" height="6" rx="3" fill="${b}" fill-opacity=".35"/>`,
  phone: (a, b) => `
    <rect x="205" y="112" width="190" height="376" rx="34" fill="url(#body)" stroke="${b}" stroke-opacity=".5" stroke-width="2"/>
    <rect x="219" y="128" width="162" height="344" rx="26" fill="url(#screen)"/>
    <rect x="272" y="140" width="56" height="12" rx="6" fill="${b}" fill-opacity=".55"/>
    <circle cx="300" cy="360" r="52" fill="${a}" fill-opacity=".22"/>
    <circle cx="300" cy="360" r="30" fill="${a}" fill-opacity=".4"/>
    <rect x="242" y="220" width="116" height="8" rx="4" fill="${a}" fill-opacity=".85"/>
    <rect x="242" y="240" width="76" height="6" rx="3" fill="${b}" fill-opacity=".5"/>`,
  headphones: (a, b) => `
    <path d="M160 320v-40a140 140 0 0 1 280 0v40" fill="none" stroke="${b}" stroke-width="26" stroke-linecap="round"/>
    <rect x="126" y="296" width="76" height="140" rx="34" fill="url(#body)" stroke="${b}" stroke-opacity=".5" stroke-width="2"/>
    <rect x="398" y="296" width="76" height="140" rx="34" fill="url(#body)" stroke="${b}" stroke-opacity=".5" stroke-width="2"/>
    <rect x="146" y="318" width="36" height="96" rx="18" fill="${a}" fill-opacity=".55"/>
    <rect x="418" y="318" width="36" height="96" rx="18" fill="${a}" fill-opacity=".55"/>`,
  watch: (a, b) => `
    <rect x="252" y="96" width="96" height="96" rx="24" fill="url(#body)" stroke="${b}" stroke-opacity=".4" stroke-width="2"/>
    <rect x="252" y="408" width="96" height="96" rx="24" fill="url(#body)" stroke="${b}" stroke-opacity=".4" stroke-width="2"/>
    <rect x="204" y="164" width="192" height="272" rx="60" fill="url(#body)" stroke="${b}" stroke-opacity=".55" stroke-width="2"/>
    <rect x="220" y="180" width="160" height="240" rx="48" fill="url(#screen)"/>
    <circle cx="300" cy="300" r="66" fill="none" stroke="${a}" stroke-width="12" stroke-opacity=".8" stroke-dasharray="300 120" stroke-linecap="round"/>
    <circle cx="300" cy="300" r="10" fill="${a}"/>`,
  camera: (a, b) => `
    <rect x="128" y="188" width="344" height="228" rx="34" fill="url(#body)" stroke="${b}" stroke-opacity=".5" stroke-width="2"/>
    <rect x="236" y="152" width="128" height="48" rx="14" fill="url(#body)" stroke="${b}" stroke-opacity=".4" stroke-width="2"/>
    <circle cx="300" cy="302" r="94" fill="url(#screen)" stroke="${b}" stroke-opacity=".55" stroke-width="3"/>
    <circle cx="300" cy="302" r="60" fill="none" stroke="${a}" stroke-width="6" stroke-opacity=".75"/>
    <circle cx="300" cy="302" r="30" fill="${a}" fill-opacity=".35"/>
    <rect x="400" y="208" width="44" height="14" rx="7" fill="${a}" fill-opacity=".7"/>`,
  drone: (a, b) => `
    <circle cx="300" cy="300" r="84" fill="url(#body)" stroke="${b}" stroke-opacity=".5" stroke-width="2"/>
    <g stroke="${b}" stroke-width="14" stroke-linecap="round">
      <line x1="246" y1="246" x2="168" y2="168"/>
      <line x1="354" y1="246" x2="432" y2="168"/>
      <line x1="246" y1="354" x2="168" y2="432"/>
      <line x1="354" y1="354" x2="432" y2="432"/>
    </g>
    <g fill="${a}" fill-opacity=".35" stroke="${a}" stroke-width="4">
      <circle cx="152" cy="152" r="52"/><circle cx="448" cy="152" r="52"/>
      <circle cx="152" cy="448" r="52"/><circle cx="448" cy="448" r="52"/>
    </g>
    <circle cx="300" cy="300" r="36" fill="${a}" fill-opacity=".55"/>`,
  speaker: (a, b) => `
    <rect x="192" y="116" width="216" height="368" rx="56" fill="url(#body)" stroke="${b}" stroke-opacity=".5" stroke-width="2"/>
    <circle cx="300" cy="230" r="62" fill="url(#screen)" stroke="${b}" stroke-opacity=".5" stroke-width="2"/>
    <circle cx="300" cy="230" r="30" fill="${a}" fill-opacity=".4"/>
    <circle cx="300" cy="382" r="62" fill="url(#screen)" stroke="${b}" stroke-opacity=".5" stroke-width="2"/>
    <circle cx="300" cy="382" r="30" fill="${a}" fill-opacity=".4"/>`,
  tablet: (a, b) => `
    <rect x="164" y="146" width="272" height="310" rx="28" fill="url(#body)" stroke="${b}" stroke-opacity=".5" stroke-width="2"/>
    <rect x="180" y="162" width="240" height="278" rx="18" fill="url(#screen)"/>
    <circle cx="300" cy="420" r="9" fill="${b}" fill-opacity=".5"/>
    <rect x="212" y="212" width="140" height="10" rx="5" fill="${a}" fill-opacity=".85"/>
    <rect x="212" y="236" width="176" height="7" rx="3.5" fill="${b}" fill-opacity=".45"/>
    <rect x="212" y="258" width="120" height="7" rx="3.5" fill="${b}" fill-opacity=".3"/>`,
  monitor: (a, b) => `
    <rect x="112" y="150" width="376" height="252" rx="18" fill="url(#body)" stroke="${b}" stroke-opacity=".5" stroke-width="2"/>
    <rect x="130" y="168" width="340" height="216" rx="8" fill="url(#screen)"/>
    <path d="M282 402h36l10 56h-56z" fill="url(#body)" stroke="${b}" stroke-opacity=".35" stroke-width="2"/>
    <rect x="216" y="456" width="168" height="18" rx="9" fill="url(#body)" stroke="${b}" stroke-opacity=".35" stroke-width="2"/>
    <rect x="152" y="196" width="132" height="9" rx="4.5" fill="${a}" fill-opacity=".9"/>`,
  keyboard: (a, b) => `
    <rect x="96" y="228" width="408" height="184" rx="26" fill="url(#body)" stroke="${b}" stroke-opacity=".5" stroke-width="2"/>
    ${Array.from({ length: 30 }, (_, i) => {
      const col = i % 10;
      const row = Math.floor(i / 10);
      return `<rect x="${122 + col * 36.5}" y="${256 + row * 44}" width="28" height="32" rx="7" fill="${row === 1 ? a : b}" fill-opacity="${row === 1 ? 0.55 : 0.22}"/>`;
    }).join("")}`,
  "smart-home": (a, b) => `
    <circle cx="300" cy="300" r="150" fill="url(#body)" stroke="${b}" stroke-opacity=".5" stroke-width="2"/>
    <circle cx="300" cy="300" r="112" fill="none" stroke="${a}" stroke-width="10" stroke-opacity=".7" stroke-dasharray="520 180" stroke-linecap="round"/>
    <circle cx="300" cy="300" r="58" fill="${a}" fill-opacity=".28"/>
    <circle cx="300" cy="300" r="20" fill="${a}"/>`,
};

const PALETTES = [
  ["#6366f1", "#a5b4fc", "#1e1b4b"],
  ["#06b6d4", "#67e8f9", "#083344"],
  ["#8b5cf6", "#c4b5fd", "#2e1065"],
  ["#f59e0b", "#fcd34d", "#451a03"],
  ["#10b981", "#6ee7b7", "#022c22"],
  ["#ec4899", "#f9a8d4", "#500724"],
  ["#3b82f6", "#93c5fd", "#172554"],
  ["#ef4444", "#fca5a5", "#450a0a"],
];

function svg(shape, paletteIndex, label) {
  const [a, b, dark] = PALETTES[paletteIndex % PALETTES.length];
  const draw = SHAPES[shape] ?? SHAPES.laptop;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600" role="img" aria-label="${label}">
  <defs>
    <radialGradient id="bg" cx="28%" cy="18%" r="92%">
      <stop offset="0%" stop-color="${a}" stop-opacity=".22"/>
      <stop offset="55%" stop-color="${dark}" stop-opacity=".95"/>
      <stop offset="100%" stop-color="#06080f"/>
    </radialGradient>
    <linearGradient id="body" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#2b3245"/>
      <stop offset="48%" stop-color="#151a26"/>
      <stop offset="100%" stop-color="#0a0d15"/>
    </linearGradient>
    <linearGradient id="screen" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${a}" stop-opacity=".55"/>
      <stop offset="55%" stop-color="${dark}" stop-opacity=".9"/>
      <stop offset="100%" stop-color="#05070c"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${a}" stop-opacity=".55"/>
      <stop offset="100%" stop-color="${a}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="600" height="600" fill="url(#bg)"/>
  <circle cx="300" cy="300" r="250" fill="url(#glow)"/>
  <g opacity=".5" stroke="${b}" stroke-opacity=".12" stroke-width="1">
    ${Array.from({ length: 7 }, (_, i) => `<line x1="0" y1="${i * 100}" x2="600" y2="${i * 100}"/>`).join("")}
    ${Array.from({ length: 7 }, (_, i) => `<line x1="${i * 100}" y1="0" x2="${i * 100}" y2="600"/>`).join("")}
  </g>
  ${draw(a, b)}
  <text x="300" y="556" text-anchor="middle" font-family="Verdana, Geneva, sans-serif" font-size="19" letter-spacing="7" fill="${b}" fill-opacity=".65">NEXVORO</text>
</svg>`;
}

const ASSETS = [
  // laptops
  ["laptop-aurora-pro.svg", "laptop", 0],
  ["laptop-zenith-gaming.svg", "laptop", 2],
  ["laptop-nova-air.svg", "laptop", 1],
  ["laptop-titan-creator.svg", "laptop", 5],
  // smartphones
  ["phone-pulse-15.svg", "phone", 3],
  ["phone-pulse-15-pro.svg", "phone", 6],
  ["phone-edge-fold.svg", "phone", 4],
  ["phone-nova-lite.svg", "phone", 7],
  // audio
  ["audio-orbital-anc.svg", "headphones", 1],
  ["audio-studio-true.svg", "headphones", 3],
  ["audio-sonic-bar.svg", "speaker", 0],
  ["audio-boom-portable.svg", "speaker", 4],
  // wearables
  ["watch-chrono-x.svg", "watch", 2],
  ["watch-vitals-fit.svg", "watch", 4],
  ["tablet-slate-11.svg", "tablet", 5],
  // cameras / drones
  ["camera-lumen-r7.svg", "camera", 3],
  ["camera-lumen-action.svg", "camera", 7],
  ["drone-skylark-4k.svg", "drone", 1],
  // displays & peripherals
  ["monitor-vista-27.svg", "monitor", 6],
  ["monitor-curve-34.svg", "monitor", 2],
  ["keyboard-mech-rgb.svg", "keyboard", 5],
  ["keyboard-low-profile.svg", "keyboard", 0],
  // smart home
  ["home-hub-mini.svg", "smart-home", 4],
  ["home-clean-vac.svg", "smart-home", 6],
];

for (const [file, shape, palette] of ASSETS) {
  writeFileSync(path.join(OUT, file), svg(shape, palette, file.replace(/[-.]/g, " ")));
}

// Category tiles reuse the product renders with a wider crop.
const CATEGORY_TILES = [
  ["cat-laptops.svg", "laptop", 0],
  ["cat-smartphones.svg", "phone", 3],
  ["cat-audio.svg", "headphones", 1],
  ["cat-wearables.svg", "watch", 2],
  ["cat-cameras.svg", "camera", 7],
  ["cat-smart-home.svg", "smart-home", 4],
  ["cat-monitors.svg", "monitor", 6],
  ["cat-tablets.svg", "tablet", 5],
  ["cat-accessories.svg", "keyboard", 5],
  ["cat-gaming-laptops.svg", "laptop", 2],
  ["cat-drones.svg", "drone", 1],
];
for (const [file, shape, palette] of CATEGORY_TILES) {
  writeFileSync(path.join(OUT, file), svg(shape, palette, file.replace(/[-.]/g, " ")));
}

// Open Graph / social share card.
const og = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <linearGradient id="obg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0b0d12"/><stop offset="55%" stop-color="#141a2b"/><stop offset="100%" stop-color="#0b1424"/>
    </linearGradient>
    <radialGradient id="oglow" cx="78%" cy="18%" r="60%">
      <stop offset="0%" stop-color="#6366f1" stop-opacity=".55"/><stop offset="100%" stop-color="#6366f1" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="otxt" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#a5b4fc"/><stop offset="100%" stop-color="#22d3ee"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#obg)"/>
  <circle cx="960" cy="120" r="360" fill="url(#oglow)"/>
  <text x="80" y="250" font-family="Verdana, Geneva, sans-serif" font-size="74" font-weight="bold" fill="url(#otxt)" letter-spacing="6">NEXVORO</text>
  <text x="80" y="330" font-family="Verdana, Geneva, sans-serif" font-size="36" fill="#e8ecf6">Future-grade electronics, delivered.</text>
  <text x="80" y="392" font-family="Verdana, Geneva, sans-serif" font-size="22" fill="#8b96ad">Laptops · Smartphones · Audio · Wearables · Cameras · Smart home</text>
  <rect x="80" y="452" width="230" height="58" rx="29" fill="#4f46e5"/>
  <text x="196" y="489" text-anchor="middle" font-family="Verdana, Geneva, sans-serif" font-size="20" fill="#ffffff">Shop the collection</text>
</svg>`;
writeFileSync(path.join(process.cwd(), "public", "og-image.svg"), og);

console.log(`Generated ${ASSETS.length + CATEGORY_TILES.length + 1} SVG assets.`);
