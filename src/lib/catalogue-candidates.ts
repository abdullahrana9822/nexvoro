/** Merchant review candidates, NOT verified offers or stock claims. */
const groups = [
  {
    category: "smartphones",
    label: "Smartphones",
    image: "phone-pulse-15-pro.svg",
    items: [
      ["Apple", "iPhone 16", "6.1-inch display"],
      ["Samsung", "Galaxy S24", "6.2-inch display"],
      ["Google", "Pixel 9", "6.3-inch display"],
    ],
  },
  {
    category: "laptops",
    label: "Laptops & Computers",
    image: "laptop-aurora-pro.svg",
    items: [
      ["Apple", "MacBook Air 13 M3", "Apple M3 processor"],
      ["Lenovo", "ThinkPad X1 Carbon Gen 12", "14-inch display"],
      ["ASUS", "ROG Zephyrus G14 2024", "14-inch display"],
    ],
  },
  {
    category: "headphones",
    label: "Headphones & Earbuds",
    image: "audio-orbital-anc.svg",
    items: [
      ["Sony", "WH-1000XM5", "Over-ear wireless headphones"],
      ["Apple", "AirPods Pro 2 USB-C", "In-ear wireless earbuds"],
      ["Bose", "QuietComfort Ultra Headphones", "Over-ear wireless headphones"],
    ],
  },
  {
    category: "wearables",
    label: "Smart Watches",
    image: "watch-chrono-x.svg",
    items: [
      ["Apple", "Watch Series 10", "watchOS"],
      ["Samsung", "Galaxy Watch7", "Wear OS"],
      ["Garmin", "Venu 3", "AMOLED display"],
    ],
  },
  {
    category: "gaming",
    label: "Gaming Accessories",
    image: "keyboard-mech-rgb.svg",
    items: [
      ["Logitech", "G Pro X Superlight 2", "Wireless gaming mouse"],
      ["Razer", "BlackShark V2 Pro 2023", "Wireless gaming headset"],
      ["SteelSeries", "Apex Pro TKL 2023", "Compact gaming keyboard"],
    ],
  },
  {
    category: "speakers",
    label: "Speakers & Audio",
    image: "audio-boom-portable.svg",
    items: [
      ["JBL", "Charge 5", "Portable Bluetooth speaker"],
      ["Sonos", "Era 100", "Wi-Fi speaker"],
      ["Marshall", "Emberton II", "Portable Bluetooth speaker"],
    ],
  },
  {
    category: "cameras",
    label: "Cameras",
    image: "camera-lumen-r7.svg",
    items: [
      ["Sony", "Alpha a6700 Body", "APS-C interchangeable-lens camera"],
      ["Canon", "EOS R50 Body", "APS-C interchangeable-lens camera"],
      ["Fujifilm", "X-S20 Body", "APS-C interchangeable-lens camera"],
    ],
  },
  {
    category: "smart-home",
    label: "Smart Home Devices",
    image: "home-hub-mini.svg",
    items: [
      ["Google", "Nest Mini 2nd Gen", "Voice-controlled smart speaker"],
      ["Amazon", "Echo Dot 5th Gen", "Voice-controlled smart speaker"],
      ["Philips Hue", "White and Color Ambiance E27", "Connected LED bulb"],
    ],
  },
  {
    category: "tablets",
    label: "Tablets",
    image: "tablet-slate-11.svg",
    items: [
      ["Apple", "iPad Air 11 M2", "11-inch display"],
      ["Samsung", "Galaxy Tab S9", "11-inch display"],
      ["Microsoft", "Surface Pro 11", "13-inch display"],
    ],
  },
  {
    category: "accessories",
    label: "Computer Accessories",
    image: "keyboard-low-profile.svg",
    items: [
      ["Logitech", "MX Master 3S", "Wireless productivity mouse"],
      ["Keychron", "K2 Version 2", "75% mechanical keyboard"],
      ["Samsung", "T7 Shield 1TB", "Portable solid-state drive"],
    ],
  },
] as const;
export const CATALOGUE_CANDIDATES = groups.flatMap((g, gi) =>
  g.items.map(([brand, model, spec], i) => ({
    slug: `${brand}-${model}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/-$/, ""),
    name: `${brand} ${model}`,
    brand,
    category: g.category,
    categoryName: g.label,
    sku: `NX-REVIEW-${String(gi * 3 + i + 1).padStart(3, "0")}`,
    image: `/products/${g.image}`,
    shortDescription: `${spec}. Merchant review required before sale.`,
    description: `${brand} ${model}. ${spec}. This catalogue draft is not an offer for sale. Confirm the exact regional variant, supplier availability, selling price, warranty and all specifications before publishing. The current image is an original category illustration, not manufacturer product photography. Replace it with licensed photographs of the exact product. No customer rating or review has been fabricated.`,
    specs: [
      { label: "Brand", value: brand },
      { label: "Model", value: model },
      { label: "Overview", value: spec },
      { label: "Publishing status", value: "Awaiting merchant verification" },
    ],
  })),
);
