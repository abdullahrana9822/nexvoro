import "./load-env";

import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { sql } from "drizzle-orm";

import { db, pool } from "../src/db";
import {
  brands,
  categories,
  coupons,
  orderEvents,
  orderItems,
  orders,
  productVariants,
  products,
  reviews,
  settings,
  shippingPlans,
  users,
} from "../src/db/schema";

const CATEGORY_TREE = [
  {
    slug: "laptops",
    name: "Laptops & Computers",
    icon: "Laptop",
    image: "/products/cat-laptops.svg",
    featured: true,
    children: [
      { slug: "gaming-laptops", name: "Gaming Laptops", image: "/products/cat-gaming-laptops.svg" },
      { slug: "ultrabooks", name: "Ultrabooks", image: "/products/cat-laptops.svg" },
    ],
  },
  {
    slug: "smartphones",
    name: "Smartphones",
    icon: "Smartphone",
    image: "/products/cat-smartphones.svg",
    featured: true,
    children: [],
  },
  {
    slug: "audio",
    name: "Audio",
    icon: "Headphones",
    image: "/products/cat-audio.svg",
    featured: true,
    children: [
      { slug: "headphones", name: "Headphones", image: "/products/cat-audio.svg" },
      { slug: "speakers", name: "Speakers", image: "/products/cat-audio.svg" },
    ],
  },
  {
    slug: "wearables",
    name: "Wearables",
    icon: "Watch",
    image: "/products/cat-wearables.svg",
    featured: true,
    children: [],
  },
  {
    slug: "cameras",
    name: "Cameras",
    icon: "Camera",
    image: "/products/cat-cameras.svg",
    featured: true,
    children: [],
  },
  {
    slug: "smart-home",
    name: "Smart Home",
    icon: "Home",
    image: "/products/cat-smart-home.svg",
    featured: true,
    children: [],
  },
  {
    slug: "monitors",
    name: "Monitors & Displays",
    icon: "Monitor",
    image: "/products/cat-monitors.svg",
    featured: false,
    children: [],
  },
  {
    slug: "tablets",
    name: "Tablets",
    icon: "Tablet",
    image: "/products/cat-tablets.svg",
    featured: false,
    children: [],
  },
  {
    slug: "accessories",
    name: "Accessories",
    icon: "Keyboard",
    image: "/products/cat-accessories.svg",
    featured: false,
    children: [],
  },
  {
    slug: "drones",
    name: "Drones",
    icon: "Plane",
    image: "/products/cat-drones.svg",
    featured: false,
    children: [],
  },
];

const BRANDS = [
  { slug: "aurora", name: "Aurora", description: "Precision laptops and displays engineered for makers." },
  { slug: "nantar", name: "Nantar", description: "Smartphones that push the edge of mobile imaging." },
  { slug: "orbital", name: "Orbital", description: "Reference-grade personal audio." },
  { slug: "kestrel", name: "Kestrel", description: "Outdoor-ready cameras and drones." },
  { slug: "vitals", name: "Vitals", description: "Wearables focused on health and recovery." },
  { slug: "nimbus", name: "Nimbus", description: "Connected home hardware and appliances." },
  { slug: "forge", name: "Forge", description: "Mechanical keyboards and desktop peripherals." },
  { slug: "zenith", name: "Zenith", description: "High-refresh gaming hardware." },
];

type SeedProduct = {
  slug: string;
  name: string;
  sku: string;
  category: string;
  brand: string;
  price: string;
  compareAtPrice?: string;
  costPrice: string;
  stock: number;
  images: string[];
  short: string;
  description: string;
  specs: { label: string; value: string }[];
  tags: string[];
  featured?: boolean;
  trending?: boolean;
  bestSeller?: boolean;
  flash?: boolean;
  warranty?: number;
  variants?: { name: string; sku: string; delta: string; stock: number; options: Record<string, string> }[];
};

const PRODUCTS: SeedProduct[] = [
  {
    slug: "aurora-pro-16-laptop",
    name: "Aurora Pro 16 Laptop",
    sku: "NX-LT-AP16",
    category: "ultrabooks",
    brand: "aurora",
    price: "489000",
    compareAtPrice: "549000",
    costPrice: "402000",
    stock: 24,
    images: ["/products/laptop-aurora-pro.svg", "/products/monitor-vista-27.svg"],
    short: "3nm silicon, 120Hz mini-LED display and 18-hour battery in a 1.6 kg chassis.",
    description:
      "The Aurora Pro 16 is built for people who move fast and work heavy. A 16-inch mini-LED panel with 120Hz adaptive refresh and 1600 nits peak brightness, a 16-core 3nm processor and 32GB of unified memory keep large timelines, colour grades and dev containers responsive. The CNC aluminium unibody weighs 1.6 kg, the 99Wh battery lasts a full working day, and the vapour-chamber cooler stays whisper-quiet under sustained load.",
    specs: [
      { label: "Processor", value: "16-core 3nm Aurora M4 Pro" },
      { label: "Memory", value: "32GB unified" },
      { label: "Storage", value: "1TB NVMe Gen4" },
      { label: "Display", value: '16" mini-LED, 3456×2234, 120Hz' },
      { label: "Battery", value: "99Wh · up to 18h" },
      { label: "Weight", value: "1.6 kg" },
      { label: "Ports", value: "3× USB-C/Thunderbolt, HDMI 2.1, SDXC" },
    ],
    tags: ["laptop", "creator", "premium"],
    featured: true,
    bestSeller: true,
    variants: [
      { name: "32GB / 1TB", sku: "NX-LT-AP16-32-1T", delta: "0", stock: 14, options: { memory: "32GB", storage: "1TB" } },
      { name: "64GB / 2TB", sku: "NX-LT-AP16-64-2T", delta: "92000", stock: 10, options: { memory: "64GB", storage: "2TB" } },
    ],
  },
  {
    slug: "zenith-blade-gaming-17",
    name: "Zenith Blade Gaming 17",
    sku: "NX-LT-ZB17",
    category: "gaming-laptops",
    brand: "zenith",
    price: "419000",
    compareAtPrice: "469000",
    costPrice: "351000",
    stock: 18,
    images: ["/products/laptop-zenith-gaming.svg"],
    short: "240Hz QHD gaming with a 24GB desktop-class GPU and dual fan vapour chamber.",
    description:
      "A 17-inch esports machine with a 240Hz QHD panel, 24GB of desktop-class graphics memory and a 24-core CPU. Per-key RGB, a mechanical optical keyboard and a 100Wh battery that still manages 6 hours away from the wall. The vapour chamber plus liquid metal keeps sustained clocks high during long ranked sessions.",
    specs: [
      { label: "Processor", value: "24-core Zenith HX" },
      { label: "Graphics", value: "24GB GDDR7 discrete" },
      { label: "Display", value: '17.3" QHD, 240Hz, 3ms' },
      { label: "Memory", value: "32GB DDR5-6400" },
      { label: "Keyboard", value: "Optical mechanical, per-key RGB" },
    ],
    tags: ["gaming", "laptop"],
    trending: true,
    flash: true,
  },
  {
    slug: "nova-air-14-ultrabook",
    name: "Nova Air 14 Ultrabook",
    sku: "NX-LT-NA14",
    category: "ultrabooks",
    brand: "aurora",
    price: "249000",
    costPrice: "196000",
    stock: 40,
    images: ["/products/laptop-nova-air.svg"],
    short: "A 990 g fanless ultrabook with a 14-hour battery and a 2.8K OLED panel.",
    description:
      "Fanless, silent and 990 grams. The Nova Air 14 pairs a 2.8K OLED display with an efficient 8-core chip and 16GB of memory — enough for a full day of writing, research and design work without a charger in your bag.",
    specs: [
      { label: "Processor", value: "8-core low-power" },
      { label: "Memory", value: "16GB" },
      { label: "Storage", value: "512GB NVMe" },
      { label: "Display", value: '14" OLED 2.8K' },
      { label: "Weight", value: "990 g" },
    ],
    tags: ["laptop", "ultrabook"],
    bestSeller: true,
  },
  {
    slug: "titan-creator-16-studio",
    name: "Titan Creator 16 Studio",
    sku: "NX-LT-TC16",
    category: "laptops",
    brand: "aurora",
    price: "629000",
    compareAtPrice: "699000",
    costPrice: "521000",
    stock: 9,
    images: ["/products/laptop-titan-creator.svg"],
    short: "Colour-calibrated 4K mini-LED studio laptop with desktop-class rendering.",
    description:
      "Designed for film and 3D pipelines: a factory-calibrated 4K mini-LED panel covering 100% DCI-P3, 64GB of ECC memory and dual NVMe drives in RAID 0. Includes a Thunderbolt dock, a 240W GaN charger and a three-year on-site warranty.",
    specs: [
      { label: "Display", value: '16" 4K mini-LED, 100% DCI-P3' },
      { label: "Memory", value: "64GB ECC" },
      { label: "Storage", value: "2× 1TB NVMe (RAID 0)" },
      { label: "Graphics", value: "16GB pro-class GPU" },
    ],
    tags: ["laptop", "studio", "premium"],
    featured: true,
  },
  {
    slug: "pulse-15-smartphone",
    name: "Pulse 15 Smartphone",
    sku: "NX-PH-P15",
    category: "smartphones",
    brand: "nantar",
    price: "189000",
    compareAtPrice: "219000",
    costPrice: "152000",
    stock: 60,
    images: ["/products/phone-pulse-15.svg"],
    short: "6.7-inch 120Hz OLED, 50MP main camera and 80W charging.",
    description:
      "A flagship-grade phone at a sensible price. The Pulse 15 has a 6.7-inch 120Hz LTPO OLED display, a 50MP main sensor with optical stabilisation, a 12MP ultrawide and a 5,000mAh battery that charges to 60% in 15 minutes.",
    specs: [
      { label: "Display", value: '6.7" LTPO OLED 120Hz' },
      { label: "Main camera", value: "50MP OIS + 12MP ultrawide" },
      { label: "Battery", value: "5,000mAh · 80W wired" },
      { label: "Memory", value: "12GB / 256GB" },
      { label: "IP rating", value: "IP68" },
    ],
    tags: ["phone", "5g"],
    bestSeller: true,
    flash: true,
    variants: [
      { name: "12GB / 256GB", sku: "NX-PH-P15-12-256", delta: "0", stock: 40, options: { memory: "12GB", storage: "256GB" } },
      { name: "16GB / 512GB", sku: "NX-PH-P15-16-512", delta: "34000", stock: 20, options: { memory: "16GB", storage: "512GB" } },
    ],
  },
  {
    slug: "pulse-15-pro-smartphone",
    name: "Pulse 15 Pro Smartphone",
    sku: "NX-PH-P15P",
    category: "smartphones",
    brand: "nantar",
    price: "279000",
    costPrice: "221000",
    stock: 32,
    images: ["/products/phone-pulse-15-pro.svg"],
    short: "Periscope telephoto, titanium frame and satellite messaging.",
    description:
      "The Pro adds a 5× periscope telephoto with 10× lossless hybrid zoom, a titanium mid-frame, a brighter 2,600-nit display and two-way satellite messaging for when there is no signal at all.",
    specs: [
      { label: "Display", value: '6.8" LTPO OLED 2,600 nits' },
      { label: "Cameras", value: "50MP + 12MP UW + 48MP 5× periscope" },
      { label: "Build", value: "Titanium, IP68" },
      { label: "Battery", value: "5,200mAh · 100W" },
    ],
    tags: ["phone", "flagship"],
    featured: true,
    trending: true,
  },
  {
    slug: "edge-fold-smartphone",
    name: "Edge Fold Smartphone",
    sku: "NX-PH-EF",
    category: "smartphones",
    brand: "nantar",
    price: "449000",
    compareAtPrice: "499000",
    costPrice: "372000",
    stock: 11,
    images: ["/products/phone-edge-fold.svg"],
    short: "Book-style foldable with a 7.9-inch inner display and a crease-free hinge.",
    description:
      "A 7.9-inch inner LTPO display folds into a 6.4-inch phone. The waterdrop hinge holds any angle, the outer glass is scratch-resistant and the 4,800mAh battery supports 65W charging.",
    specs: [
      { label: "Inner display", value: '7.9" LTPO 120Hz' },
      { label: "Cover display", value: '6.4" OLED 120Hz' },
      { label: "Hinge", value: "Waterdrop, 400k folds rated" },
      { label: "Weight", value: "239 g" },
    ],
    tags: ["phone", "foldable"],
  },
  {
    slug: "nova-lite-smartphone",
    name: "Nova Lite Smartphone",
    sku: "NX-PH-NL",
    category: "smartphones",
    brand: "nantar",
    price: "72000",
    costPrice: "56000",
    stock: 120,
    images: ["/products/phone-nova-lite.svg"],
    short: "A dependable 5G daily driver with a two-day battery.",
    description:
      "6.6-inch 90Hz display, 5,000mAh battery with two-day real-world endurance, 8GB of memory and a 50MP camera. The best value pick in the range.",
    specs: [
      { label: "Display", value: '6.6" IPS 90Hz' },
      { label: "Battery", value: "5,000mAh · 33W" },
      { label: "Memory", value: "8GB / 128GB" },
    ],
    tags: ["phone", "budget"],
    bestSeller: true,
  },
  {
    slug: "orbital-anc-headphones",
    name: "Orbital ANC Headphones",
    sku: "NX-AU-OANC",
    category: "headphones",
    brand: "orbital",
    price: "96000",
    compareAtPrice: "119000",
    costPrice: "71000",
    stock: 55,
    images: ["/products/audio-orbital-anc.svg"],
    short: "Reference over-ears with adaptive noise cancelling and 60-hour battery.",
    description:
      "40mm beryllium-coated drivers tuned flat, adaptive hybrid ANC with a transparency mode that actually sounds natural, and 60 hours of playback. Memory-foam ear cushions and a 280g frame keep them comfortable through a long-haul flight.",
    specs: [
      { label: "Drivers", value: "40mm beryllium-coated" },
      { label: "ANC", value: "Adaptive hybrid, 42dB reduction" },
      { label: "Battery", value: "60h ANC off · 40h ANC on" },
      { label: "Codecs", value: "LDAC, AAC, aptX Adaptive" },
      { label: "Weight", value: "280 g" },
    ],
    tags: ["audio", "anc", "premium"],
    featured: true,
    bestSeller: true,
    flash: true,
  },
  {
    slug: "studio-true-wireless-earbuds",
    name: "Studio True Wireless Earbuds",
    sku: "NX-AU-STW",
    category: "headphones",
    brand: "orbital",
    price: "42000",
    compareAtPrice: "52000",
    costPrice: "31000",
    stock: 90,
    images: ["/products/audio-studio-true.svg"],
    short: "Compact ANC earbuds with dual-driver sound and wireless charging.",
    description:
      "Dual drivers per bud, 8 hours of playback (32 with the case), IPX5 sweat resistance and low-latency gaming mode. Multipoint pairing keeps your laptop and phone connected at once.",
    specs: [
      { label: "Drivers", value: "Dual dynamic + balanced armature" },
      { label: "Battery", value: "8h + 24h case" },
      { label: "Water resistance", value: "IPX5" },
    ],
    tags: ["audio", "earbuds"],
    trending: true,
  },
  {
    slug: "sonic-bar-soundbar",
    name: "Sonic Bar Soundbar",
    sku: "NX-AU-SB",
    category: "speakers",
    brand: "orbital",
    price: "132000",
    costPrice: "101000",
    stock: 26,
    images: ["/products/audio-sonic-bar.svg"],
    short: "5.1.2 channel Dolby Atmos soundbar with a wireless subwoofer.",
    description:
      "Nine drivers, two up-firing height channels and a wireless 8-inch subwoofer. HDMI eARC passthrough supports 4K 120Hz, and room calibration runs from the remote in about a minute.",
    specs: [
      { label: "Channels", value: "5.1.2 Dolby Atmos" },
      { label: "Subwoofer", value: "8\" wireless" },
      { label: "HDMI", value: "eARC, 4K120 passthrough" },
    ],
    tags: ["audio", "home-theatre"],
  },
  {
    slug: "boom-portable-speaker",
    name: "Boom Portable Speaker",
    sku: "NX-AU-BP",
    category: "speakers",
    brand: "orbital",
    price: "28000",
    costPrice: "19500",
    stock: 140,
    images: ["/products/audio-boom-portable.svg"],
    short: "IP67 waterproof speaker with 24-hour battery and stereo pairing.",
    description:
      "A rugged 360° speaker that floats, survives dust and rain, and connects to a second unit for true stereo. 24 hours of playback and USB-C power bank output.",
    specs: [
      { label: "Rating", value: "IP67 dust/waterproof" },
      { label: "Battery", value: "24h" },
      { label: "Output", value: "30W" },
    ],
    tags: ["audio", "outdoor"],
  },
  {
    slug: "chrono-x-smartwatch",
    name: "Chrono X Smartwatch",
    sku: "NX-WR-CX",
    category: "wearables",
    brand: "vitals",
    price: "118000",
    compareAtPrice: "139000",
    costPrice: "91000",
    stock: 44,
    images: ["/products/watch-chrono-x.svg"],
    short: "Titanium smartwatch with dual-band GPS and ECG.",
    description:
      "A 1.5-inch AMOLED always-on display in a titanium case with sapphire glass. Dual-band GPS locks on in seconds, ECG and SpO2 sensors run continuous background checks, and battery lasts 14 days in smartwatch mode.",
    specs: [
      { label: "Display", value: '1.5" AMOLED, sapphire' },
      { label: "Sensors", value: "ECG, SpO2, skin temp, dual-band GPS" },
      { label: "Battery", value: "14 days" },
      { label: "Water rating", value: "10 ATM" },
    ],
    tags: ["wearable", "fitness"],
    featured: true,
  },
  {
    slug: "vitals-fit-band",
    name: "Vitals Fit Band",
    sku: "NX-WR-VF",
    category: "wearables",
    brand: "vitals",
    price: "19500",
    costPrice: "13200",
    stock: 200,
    images: ["/products/watch-vitals-fit.svg"],
    short: "Lightweight 21-day fitness band with sleep and HRV tracking.",
    description:
      "18 grams on the wrist, 21 days of battery and serious sleep/recovery analytics. Tracks 120 workout types with connected GPS from your phone.",
    specs: [
      { label: "Battery", value: "21 days" },
      { label: "Weight", value: "18 g" },
      { label: "Water rating", value: "5 ATM" },
    ],
    tags: ["wearable", "budget"],
    bestSeller: true,
  },
  {
    slug: "slate-11-tablet",
    name: "Slate 11 Tablet",
    sku: "NX-TB-S11",
    category: "tablets",
    brand: "nantar",
    price: "159000",
    costPrice: "124000",
    stock: 35,
    images: ["/products/tablet-slate-11.svg"],
    short: '11" 2.5K 120Hz tablet with stylus support and quad speakers.',
    description:
      "A 2.5K 120Hz display, quad speakers tuned for media, 8,000mAh battery and 4096 levels of stylus pressure. Includes the keyboard folio in the box.",
    specs: [
      { label: "Display", value: '11" 2.5K 120Hz' },
      { label: "Battery", value: "8,000mAh · 45W" },
      { label: "Stylus", value: "4096 pressure levels" },
    ],
    tags: ["tablet", "creative"],
    trending: true,
  },
  {
    slug: "lumen-r7-mirrorless-camera",
    name: "Lumen R7 Mirrorless Camera",
    sku: "NX-CM-LR7",
    category: "cameras",
    brand: "kestrel",
    price: "398000",
    compareAtPrice: "439000",
    costPrice: "331000",
    stock: 14,
    images: ["/products/camera-lumen-r7.svg"],
    short: "33MP full-frame mirrorless with 8K video and 8-stop stabilisation.",
    description:
      "A 33MP back-side illuminated full-frame sensor, 8K30 / 4K120 recording in 10-bit 4:2:2, subject-tracking autofocus with bird, vehicle and eye detection, and 8 stops of in-body stabilisation. Weather sealed magnesium body with dual card slots.",
    specs: [
      { label: "Sensor", value: "33MP full-frame BSI" },
      { label: "Video", value: "8K30 · 4K120 10-bit 4:2:2" },
      { label: "Stabilisation", value: "8 stops IBIS" },
      { label: "Slots", value: "Dual CFexpress / SD" },
    ],
    tags: ["camera", "video", "premium"],
    featured: true,
  },
  {
    slug: "lumen-action-camera",
    name: "Lumen Action Camera",
    sku: "NX-CM-LA",
    category: "cameras",
    brand: "kestrel",
    price: "68000",
    costPrice: "49000",
    stock: 70,
    images: ["/products/camera-lumen-action.svg"],
    short: "5.3K60 action cam with 10m waterproof body and horizon lock.",
    description:
      "5.3K60 recording, 4K120 slow motion, 10 metres waterproof without a case, and horizon lock so your footage stays level through flips and drops.",
    specs: [
      { label: "Video", value: "5.3K60 · 4K120" },
      { label: "Waterproof", value: "10 m without case" },
      { label: "Stabilisation", value: "HyperSteady + horizon lock" },
    ],
    tags: ["camera", "action"],
    flash: true,
  },
  {
    slug: "skylark-4k-drone",
    name: "Skylark 4K Drone",
    sku: "NX-DR-SK4",
    category: "drones",
    brand: "kestrel",
    price: "214000",
    compareAtPrice: "239000",
    costPrice: "172000",
    stock: 22,
    images: ["/products/drone-skylark-4k.svg"],
    short: "Foldable drone with a 1-inch sensor, 46-minute flight time and obstacle sensing.",
    description:
      "A 1-inch CMOS sensor on a 3-axis gimbal, 46 minutes of flight time, omnidirectional obstacle sensing and 15 km video transmission. Folds to the size of a water bottle and weighs 249 g class.",
    specs: [
      { label: "Sensor", value: '1" CMOS, 5.4K30' },
      { label: "Flight time", value: "46 min" },
      { label: "Transmission", value: "15 km O4" },
      { label: "Sensing", value: "Omnidirectional" },
    ],
    tags: ["drone", "aerial"],
    trending: true,
  },
  {
    slug: "vista-27-monitor",
    name: "Vista 27 4K Monitor",
    sku: "NX-MN-V27",
    category: "monitors",
    brand: "aurora",
    price: "142000",
    costPrice: "110000",
    stock: 38,
    images: ["/products/monitor-vista-27.svg"],
    short: '27" 4K IPS Black panel with 98% DCI-P3 and USB-C 96W.',
    description:
      "A colour-accurate 27-inch 4K panel (98% DCI-P3, Delta-E < 2 factory calibrated) with 96W USB-C power delivery, a built-in KVM switch and an ergonomic stand.",
    specs: [
      { label: "Panel", value: '27" 4K IPS Black' },
      { label: "Colour", value: "98% DCI-P3, Delta-E < 2" },
      { label: "Ports", value: "USB-C 96W, 2× HDMI, DP, 4× USB-A" },
    ],
    tags: ["monitor", "productivity"],
    featured: true,
  },
  {
    slug: "curve-34-ultrawide-monitor",
    name: "Curve 34 Ultrawide Monitor",
    sku: "NX-MN-C34",
    category: "monitors",
    brand: "zenith",
    price: "236000",
    compareAtPrice: "264000",
    costPrice: "188000",
    stock: 17,
    images: ["/products/monitor-curve-34.svg"],
    short: '34" 165Hz UWQHD curved display built for racing and strategy games.',
    description:
      "A 1000R curved 34-inch UWQHD panel at 165Hz with 1ms response and HDR600. The immersive radius puts the whole field of view in focus.",
    specs: [
      { label: "Panel", value: '34" UWQHD 1000R VA' },
      { label: "Refresh", value: "165Hz, 1ms" },
      { label: "HDR", value: "DisplayHDR 600" },
    ],
    tags: ["monitor", "gaming"],
    trending: true,
  },
  {
    slug: "mech-rgb-keyboard",
    name: "Mech RGB Keyboard",
    sku: "NX-AC-MK",
    category: "accessories",
    brand: "forge",
    price: "34000",
    costPrice: "24500",
    stock: 110,
    images: ["/products/keyboard-mech-rgb.svg"],
    short: "Hot-swappable 75% mechanical keyboard with gasket mount and tri-mode wireless.",
    description:
      "A gasket-mounted 75% board with hot-swap sockets, pre-lubed linear switches, PBT keycaps and tri-mode connectivity (2.4GHz, Bluetooth, USB-C). Per-key RGB is configurable from the browser.",
    specs: [
      { label: "Layout", value: "75% hot-swap" },
      { label: "Mount", value: "Gasket" },
      { label: "Connectivity", value: "2.4GHz · BT 5.3 · USB-C" },
      { label: "Battery", value: "4,000mAh" },
    ],
    tags: ["keyboard", "accessory"],
    bestSeller: true,
  },
  {
    slug: "low-profile-wireless-keyboard",
    name: "Low Profile Wireless Keyboard",
    sku: "NX-AC-LPK",
    category: "accessories",
    brand: "forge",
    price: "16000",
    costPrice: "11200",
    stock: 180,
    images: ["/products/keyboard-low-profile.svg"],
    short: "Slim multi-device keyboard with backlit keys and a 6-month battery.",
    description:
      "Switch between three devices with a keypress. A slim aluminium deck, quiet scissor switches, white backlight and up to six months per charge.",
    specs: [
      { label: "Devices", value: "3 (BT + dongle)" },
      { label: "Battery", value: "6 months" },
      { label: "Switches", value: "Scissor, 1.2mm travel" },
    ],
    tags: ["keyboard", "accessory"],
  },
  {
    slug: "home-hub-mini",
    name: "Home Hub Mini",
    sku: "NX-SH-HM",
    category: "smart-home",
    brand: "nimbus",
    price: "24500",
    costPrice: "17800",
    stock: 95,
    images: ["/products/home-hub-mini.svg"],
    short: "Matter + Thread smart home hub with local automation and voice control.",
    description:
      "Controls every Matter and Thread device locally without the cloud. Reliable automations keep running when the internet drops, and on-device processing means voice commands never leave your home.",
    specs: [
      { label: "Protocols", value: "Matter, Thread, Zigbee, Wi-Fi 6" },
      { label: "Automation", value: "Local, on-device" },
      { label: "Privacy", value: "Voice processed locally" },
    ],
    tags: ["smart-home", "hub"],
    featured: true,
  },
  {
    slug: "clean-vac-robot",
    name: "Clean Vac Robot",
    sku: "NX-SH-CV",
    category: "smart-home",
    brand: "nimbus",
    price: "148000",
    compareAtPrice: "169000",
    costPrice: "116000",
    stock: 28,
    images: ["/products/home-clean-vac.svg"],
    short: "Self-emptying robot vacuum and mop with LiDAR mapping.",
    description:
      "LiDAR mapping builds a per-room map you can edit. 8,000Pa suction, an auto-emptying 3L base, mop lifting for carpets and 2 hours of runtime per charge.",
    specs: [
      { label: "Suction", value: "8,000 Pa" },
      { label: "Navigation", value: "LiDAR + 3D obstacle" },
      { label: "Base", value: "Self-empty 3L, auto mop wash" },
      { label: "Runtime", value: "120 min" },
    ],
    tags: ["smart-home", "cleaning"],
    flash: true,
  },
];

function daysAgo(days: number) {
  return new Date(Date.now() - days * 86_400_000);
}

async function main() {
  console.log("→ Seeding NEXVORO…");

  // ------------------------------------------------------------------ guard
  // The seed clears the catalogue, so it must never run against a database
  // that already holds real data. `--if-empty` (used by the deploy hook)
  // aborts with a no-op instead of destroying anything, and `--force` is the
  // only way to intentionally re-seed.
  const existing = await db.execute<{ products: number; orders: number }>(sql`
    select
      (select count(*) from products)::int as products,
      (select count(*) from orders)::int as orders
  `);
  const counts = existing.rows[0] ?? { products: 0, orders: 0 };
  const hasData = counts.products > 0 || counts.orders > 0;
  if (hasData && !process.argv.includes("--force")) {
    console.log(
      `[seed] database already contains ${counts.products} products and ${counts.orders} orders — skipping. ` +
        "Pass --force to re-seed and wipe the catalogue.",
    );
    return;
  }

  // ---------------------------------------------------------------- reset
  // The seed is idempotent-by-reset: it clears catalogue + demo transactional
  // data but keeps the schema and migration history intact.
  await db.execute(sql`
    truncate table
      order_events, order_items, orders, payments, notifications,
      cart_items, carts, wishlist_items, reviews, product_variants,
      products, categories, brands, coupons, shipping_plans,
      audit_logs, contact_messages, newsletter_subscribers, settings
    restart identity cascade
  `);

  // --------------------------------------------------------------- brands
  const insertedBrands = await db.insert(brands).values(BRANDS).returning();
  const brandBySlug = new Map(insertedBrands.map((b) => [b.slug, b]));

  // ----------------------------------------------------------- categories
  let position = 0;
  const categoryBySlug = new Map<string, string>();

  for (const parent of CATEGORY_TREE) {
    const [inserted] = await db
      .insert(categories)
      .values({
        slug: parent.slug,
        name: parent.name,
        imageUrl: parent.image,
        icon: parent.icon,
        isFeatured: parent.featured,
        position: position++,
        description: `Shop ${parent.name.toLowerCase()} at NEXVORO with authentic stock, warranty and fast delivery.`,
        metaTitle: `${parent.name} — buy online at NEXVORO`,
        metaDescription: `Explore ${parent.name.toLowerCase()} with genuine warranty, expert support and free delivery on qualifying orders.`,
      })
      .returning();
    if (!inserted) throw new Error(`Failed to insert category ${parent.slug}`);
    categoryBySlug.set(parent.slug, inserted.id);

    let childPosition = 0;
    for (const child of parent.children) {
      const [insertedChild] = await db
        .insert(categories)
        .values({
          slug: child.slug,
          name: child.name,
          imageUrl: child.image,
          icon: parent.icon,
          parentId: inserted.id,
          position: childPosition++,
          description: `Shop ${child.name.toLowerCase()} at NEXVORO.`,
        })
        .returning();
      if (insertedChild) categoryBySlug.set(child.slug, insertedChild.id);
    }
  }

  // ----------------------------------------------------------- shipping
  const insertedPlans = await db
    .insert(shippingPlans)
    .values([
      {
        name: "Standard Delivery",
        description: "3–5 business days across Pakistan.",
        price: "2500",
        freeOver: "150000",
        minDays: 3,
        maxDays: 5,
        stageIntervalHours: 12,
        isDefault: true,
        position: 0,
      },
      {
        name: "Express Delivery",
        description: "Next-day delivery in Lahore, Karachi and Islamabad.",
        price: "5500",
        minDays: 1,
        maxDays: 2,
        stageIntervalHours: 6,
        position: 1,
      },
      {
        name: "Same-day Metro",
        description: "Order before 12pm for same-day delivery in Lahore.",
        price: "8500",
        minDays: 0,
        maxDays: 1,
        stageIntervalHours: 2,
        position: 2,
      },
    ])
    .returning();
  const standardPlan = insertedPlans[0];

  // ----------------------------------------------------------- products
  const insertedProducts: (typeof products.$inferSelect)[] = [];
  let dayOffset = 0;

  for (const item of PRODUCTS) {
    const categoryId = categoryBySlug.get(item.category);
    const brand = brandBySlug.get(item.brand);
    if (!categoryId || !brand) {
      throw new Error(`Missing relation for ${item.slug}`);
    }

    const [product] = await db
      .insert(products)
      .values({
        slug: item.slug,
        name: item.name,
        sku: item.sku,
        shortDescription: item.short,
        description: item.description,
        categoryId,
        brandId: brand.id,
        price: item.price,
        compareAtPrice: item.compareAtPrice ?? null,
        costPrice: item.costPrice,
        stock: item.stock,
        images: item.images,
        specs: item.specs,
        tags: item.tags,
        status: "ACTIVE",
        isFeatured: item.featured ?? false,
        isTrending: item.trending ?? false,
        isBestSeller: item.bestSeller ?? false,
        isFlashSale: item.flash ?? false,
        flashSaleEndsAt: item.flash
          ? new Date(Date.now() + (3 + (dayOffset % 5)) * 86_400_000)
          : null,
        warrantyMonths: item.warranty ?? 12,
        ratingAvg: "0",
        ratingCount: 0,
        soldCount: 20 + ((dayOffset * 37) % 400),
        viewCount: 120 + ((dayOffset * 91) % 2000),
        metaTitle: `${item.name} — NEXVORO`,
        metaDescription: item.short.slice(0, 300),
        createdAt: daysAgo(dayOffset),
      })
      .returning();

    if (!product) throw new Error(`Failed to insert product ${item.slug}`);
    insertedProducts.push(product);

    if (item.variants) {
      await db.insert(productVariants).values(
        item.variants.map((variant) => ({
          productId: product.id,
          name: variant.name,
          sku: variant.sku,
          priceDelta: variant.delta,
          stock: variant.stock,
          options: variant.options,
        })),
      );
    }
    dayOffset += 1;
  }

  // ------------------------------------------------------------ reviews
  const REVIEW_TEXT = [
    ["Exactly as described", "Arrived next day in Lahore, packaging was excellent and the unit was sealed."],
    ["Worth every rupee", "Build quality is a step above what I expected at this price point."],
    ["Great support", "Had a question about warranty and the team replied within an hour."],
    ["Solid daily driver", "Been using it for three weeks now, zero complaints so far."],
    ["Battery lives up to the claim", "Two full days of real use without reaching for the charger."],
  ];
  const reviewerNames = ["Hamza A.", "Ayesha K.", "Bilal R.", "Fatima S.", "Usman T.", "Sana M."];

  let reviewIndex = 0;
  for (const product of insertedProducts) {
    const count = 2 + (reviewIndex % 3);
    for (let i = 0; i < count; i += 1) {
      const text = REVIEW_TEXT[(reviewIndex + i) % REVIEW_TEXT.length];
      const rating = [5, 5, 4, 5, 4, 3][(reviewIndex + i) % 6] ?? 5;
      if (!text) continue;
      await db.insert(reviews).values({
        productId: product.id,
        authorName: reviewerNames[(reviewIndex + i) % reviewerNames.length] ?? "Customer",
        rating,
        title: text[0],
        body: text[1],
        status: "APPROVED",
        createdAt: daysAgo(3 + i),
      });
    }

    const rows = await db
      .select({
        avg: sql<string>`coalesce(avg(${reviews.rating}), 0)`,
        count: sql<number>`count(*)::int`,
      })
      .from(reviews)
      .where(sql`${reviews.productId} = ${product.id} and ${reviews.status} = 'APPROVED'`);
    const row = rows[0];
    if (row && row.count > 0) {
      await db
        .update(products)
        .set({ ratingAvg: Number(row.avg).toFixed(2), ratingCount: row.count })
        .where(sql`${products.id} = ${product.id}`);
    }
    reviewIndex += 1;
  }

  // ------------------------------------------------------------ coupons
  await db.insert(coupons).values([
    {
      code: "NEX10",
      description: "10% off your first order",
      type: "PERCENTAGE",
      value: "10",
      maxDiscount: "25000",
      minSubtotal: "25000",
      maxUses: 1000,
      perUserLimit: 1,
      expiresAt: new Date(Date.now() + 90 * 86_400_000),
      isActive: true,
    },
    {
      code: "FESTIVE15",
      description: "15% off orders over PKR 150,000",
      type: "PERCENTAGE",
      value: "15",
      maxDiscount: "60000",
      minSubtotal: "150000",
      maxUses: 500,
      perUserLimit: 1,
      expiresAt: new Date(Date.now() + 30 * 86_400_000),
      isActive: true,
    },
    {
      code: "FLAT5000",
      description: "Flat PKR 5,000 off",
      type: "FIXED",
      value: "5000",
      minSubtotal: "50000",
      maxUses: 2000,
      perUserLimit: 2,
      isActive: true,
    },
  ]);

  // -------------------------------------------------------------- users
  const adminEmail = (process.env.SEED_ADMIN_EMAIL ?? "admin@nexvoro.com").toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "";
  if (adminPassword.length < 10) {
    throw new Error(
      "SEED_ADMIN_PASSWORD must be set (min 10 chars) before seeding. This prevents shipping a default admin password.",
    );
  }

  const staffEmail = process.env.SEED_STAFF_EMAIL ?? "ops@nexvoro.com";
  const staffPassword = process.env.SEED_STAFF_PASSWORD ?? `${adminPassword}-ops`;
  const demoEmail = process.env.SEED_DEMO_EMAIL ?? "customer@nexvoro.com";
  const demoPassword = process.env.SEED_DEMO_PASSWORD ?? "";

  const [admin] = await db
    .insert(users)
    .values({
      email: adminEmail,
      emailNormalized: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 12),
      firstName: "NEXVORO",
      lastName: "Admin",
      role: "SUPER_ADMIN",
      phone: "+92 300 1112223",
      emailVerifiedAt: new Date(),
    })
    .returning();

  await db.insert(users).values({
    email: staffEmail,
    emailNormalized: staffEmail.toLowerCase(),
    passwordHash: await bcrypt.hash(staffPassword, 12),
    firstName: "Ops",
    lastName: "Team",
    role: "ADMIN",
    emailVerifiedAt: new Date(),
  });

  let demoUser = null;
  if (demoPassword.length >= 10) {
    [demoUser] = await db
      .insert(users)
      .values({
        email: demoEmail,
        emailNormalized: demoEmail.toLowerCase(),
        passwordHash: await bcrypt.hash(demoPassword, 12),
        firstName: "Demo",
        lastName: "Customer",
        role: "CUSTOMER",
        phone: "+92 321 5556677",
        emailVerifiedAt: new Date(),
      })
      .returning();
  }

  // ------------------------------------------------------- demo orders
  if (demoUser && standardPlan && insertedProducts.length > 5) {
    const demoOrders: {
      status: "PENDING" | "PROCESSING" | "SHIPPED" | "AWAITING_CONFIRMATION" | "DELIVERED";
      progress: number;
      days: number;
      items: { index: number; qty: number }[];
    }[] = [
      { status: "DELIVERED", progress: 100, days: 22, items: [{ index: 0, qty: 1 }] },
      { status: "SHIPPED", progress: 63, days: 6, items: [{ index: 4, qty: 1 }, { index: 8, qty: 2 }] },
      { status: "AWAITING_CONFIRMATION", progress: 99, days: 3, items: [{ index: 12, qty: 1 }] },
      { status: "PROCESSING", progress: 34, days: 1, items: [{ index: 20, qty: 1 }] },
      { status: "PENDING", progress: 5, days: 0, items: [{ index: 23, qty: 1 }] },
    ];

    let counter = 10041;
    for (const demoOrder of demoOrders) {
      const lines = demoOrder.items
        .map((entry) => ({ product: insertedProducts[entry.index], qty: entry.qty }))
        .filter((entry) => Boolean(entry.product)) as {
        product: (typeof insertedProducts)[number];
        qty: number;
      }[];
      if (lines.length === 0) continue;

      const subtotal = lines.reduce(
        (sum, line) => sum + Number(line.product.price) * line.qty,
        0,
      );
      const shipping = subtotal >= 150000 ? 0 : 2500;
      const total = subtotal + shipping;
      const placedAt = daysAgo(demoOrder.days);

      const [order] = await db
        .insert(orders)
        .values({
          orderNumber: `NX-2026-${counter++}`,
          userId: demoUser.id,
          email: demoUser.email,
          phone: demoUser.phone ?? "+92 321 5556677",
          status: demoOrder.status,
          paymentStatus: demoOrder.status === "DELIVERED" ? "PAID" : "COD_DUE",
          paymentMethod: "COD",
          progress: demoOrder.progress,
          subtotal: subtotal.toFixed(2),
          shippingCost: shipping.toFixed(2),
          total: total.toFixed(2),
          shippingPlanId: standardPlan.id,
          shippingAddress: {
            fullName: "Demo Customer",
            phone: "+92 321 5556677",
            line1: "House 42, Street 8",
            city: "Lahore",
            state: "Punjab",
            postalCode: "54000",
            country: "Pakistan",
          },
          trackingCode: `NXTRK${randomBytes(3).toString("hex").toUpperCase()}`,
          placedAt,
          expectedDeliveryAt: new Date(placedAt.getTime() + 5 * 86_400_000),
          lastAutomationAt: placedAt,
          deliveredAt: demoOrder.status === "DELIVERED" ? new Date(placedAt.getTime() + 4 * 86_400_000) : null,
          customerConfirmedAt:
            demoOrder.status === "DELIVERED" ? new Date(placedAt.getTime() + 4 * 86_400_000) : null,
        })
        .returning();

      if (!order) continue;

      await db.insert(orderItems).values(
        lines.map((line) => ({
          orderId: order.id,
          productId: line.product.id,
          productName: line.product.name,
          productSlug: line.product.slug,
          sku: line.product.sku,
          imageUrl: line.product.images[0] ?? null,
          unitPrice: line.product.price,
          quantity: line.qty,
          lineTotal: (Number(line.product.price) * line.qty).toFixed(2),
        })),
      );

      await db.insert(orderEvents).values([
        {
          orderId: order.id,
          type: "ORDER_PLACED",
          message: `Order ${order.orderNumber} placed with COD payment.`,
          progress: 5,
          actorType: "CUSTOMER",
          actorId: demoUser.id,
          createdAt: placedAt,
        },
        ...(demoOrder.progress > 5
          ? [
              {
                orderId: order.id,
                type: demoOrder.status,
                message: `Status: ${demoOrder.status.replaceAll("_", " ").toLowerCase()}`,
                progress: demoOrder.progress,
                actorType: "WORKER" as const,
                createdAt: new Date(placedAt.getTime() + 86_400_000),
              },
            ]
          : []),
      ]);
    }
  }

  // ------------------------------------------------------------ settings
  await db.insert(settings).values([
    {
      key: "store.profile",
      group: "general",
      value: {
        name: "NEXVORO",
        tagline: "Future-grade electronics, delivered.",
        supportEmail: "support@nexvoro.com",
        supportPhone: "+92 300 000 0000",
        address: "Level 8, Tech Tower, Gulberg III, Lahore, Pakistan",
      },
    },
    {
      key: "store.appearance",
      group: "appearance",
      value: { defaultTheme: "light", defaultFont: "outfit", allowCustomerThemes: true },
    },
    {
      key: "store.commerce",
      group: "commerce",
      value: {
        currency: "PKR",
        codEnabled: true,
        onlinePaymentsEnabled: false,
        taxRate: 0,
        freeShippingThreshold: 150000,
      },
    },
    {
      key: "homepage.sections",
      group: "homepage",
      value: [
        { id: "hero", enabled: true, title: "Hero slider" },
        { id: "categories", enabled: true, title: "Featured categories" },
        { id: "flash", enabled: true, title: "Flash sale" },
        { id: "featured", enabled: true, title: "Featured products" },
        { id: "trending", enabled: true, title: "Trending now" },
        { id: "bestsellers", enabled: true, title: "Best sellers" },
        { id: "testimonials", enabled: true, title: "Testimonials" },
        { id: "newsletter", enabled: true, title: "Newsletter" },
      ],
    },
    {
      key: "homepage.hero",
      group: "homepage",
      value: [
        {
          eyebrow: "New season · Aurora Pro 16",
          title: "Built for the work you care about",
          subtitle:
            "3nm silicon, a 120Hz mini-LED display and 18-hour battery — the Aurora Pro 16 is the machine that keeps up.",
          ctaLabel: "Shop Aurora",
          ctaHref: "/product/aurora-pro-16-laptop",
          image: "/products/laptop-aurora-pro.svg",
          tone: "brand",
        },
        {
          eyebrow: "Flash sale · up to 22% off",
          title: "Audio that disappears into the music",
          subtitle:
            "Orbital ANC over-ears with adaptive noise cancelling and 60-hour battery. Limited stock at the sale price.",
          ctaLabel: "Shop audio",
          ctaHref: "/shop?category=audio",
          image: "/products/audio-orbital-anc.svg",
          tone: "accent",
        },
        {
          eyebrow: "Creator series",
          title: "Shoot 8K. Edit anywhere.",
          subtitle:
            "The Lumen R7 full-frame body with 8-stop stabilisation, paired with the Titan Creator studio laptop.",
          ctaLabel: "Explore cameras",
          ctaHref: "/shop?category=cameras",
          image: "/products/camera-lumen-r7.svg",
          tone: "dark",
        },
      ],
    },
    {
      key: "store.payments",
      group: "payments",
      value: {
        provider: process.env.PAYMENT_GATEWAY_PROVIDER ?? "",
        onlineEnabled: Boolean(process.env.PAYMENT_GATEWAY_SECRET),
        methods: ["COD", "CARD", "WALLET", "BANK_TRANSFER"],
      },
    },
    {
      key: "orders.automation",
      group: "orders",
      value: { enabled: true, stageIntervalHours: 12, autoDeliver: false },
    },
  ]);

  console.log(`✓ Brands: ${insertedBrands.length}`);
  console.log(`✓ Categories: ${categoryBySlug.size}`);
  console.log(`✓ Products: ${insertedProducts.length}`);
  console.log(`✓ Shipping plans: ${insertedPlans.length}`);
  console.log(`✓ Admin: ${admin?.email}`);
  console.log("✓ Seed complete.");
}

main()
  .catch((error) => {
    console.error("[seed] failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
