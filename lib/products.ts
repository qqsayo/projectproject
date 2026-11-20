export type Credit = { title: string; author: string; url: string; license: 'CC0' | 'CC BY-SA 2.0' | 'CC BY-SA 3.0' | 'CC BY-SA 4.0' | 'CC BY 4.0'; licenseUrl: string };
export type Variant = { id: string; name: string; color: string; image: string; credit?: Credit };
export type Product = {
  id: string; name: string; brand: string; price: number; style: string; year?: string;
  description: string; sizes: number[]; variants: Variant[];
  archive?: { image: string; credit: Credit };
  scan?: { id: string; title: string; author: string; url: string; note?: string };
};

export function commons(file: string, author: string, license: Credit['license']): Credit {
  const licensePath = { 'CC0': 'publicdomain/zero/1.0', 'CC BY-SA 2.0': 'licenses/by-sa/2.0', 'CC BY-SA 3.0': 'licenses/by-sa/3.0', 'CC BY-SA 4.0': 'licenses/by-sa/4.0', 'CC BY 4.0': 'licenses/by/4.0' }[license];
  return { title: file, author, license, url: 'https://commons.wikimedia.org/wiki/File:' + encodeURIComponent(file.replaceAll(' ', '_')), licenseUrl: 'https://creativecommons.org/' + licensePath + '/' };
}

const standardSizes = [36, 37, 38, 39, 40, 41, 42, 43, 44, 45];
const courtSizes = [38, 39, 40, 41, 42, 43, 44, 45, 46];

export const products: Product[] = [
  {
    id: 'air-max-1', name: 'Air Max 1', brand: 'Nike', price: 150, style: 'Running', year: '1987',
    sizes: [36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46],
    description: 'An exposed Air unit, a sweeping suede mudguard, and a shape that’s instantly recognizable. The original Air Max brought the cushioning out into the open.',
    variants: [
      { id: 'red', name: 'White / University Red', color: '#ad282c', image: '/media/air-max.webp' },
      { id: 'blue', name: 'White / Royal Blue', color: '#2949a0', image: '/media/air-max-blue.webp' },
    ],
    archive: { image: '/media/max.png', credit: commons('Nike Air Max 1.png', 'Footshop', 'CC BY-SA 4.0') },
    scan: { id: '91c9af4fcc4a415583ad93c791601094', title: 'Nike Air Max 1 Low Poly', author: 'pickle', url: 'https://sketchfab.com/3d-models/nike-air-max-1-low-poly-91c9af4fcc4a415583ad93c791601094', note: 'Stylized low-poly reference' },
  },
  {
    id: 'samba-og', name: 'Samba OG', brand: 'adidas', price: 120, style: 'Terrace', year: '1950',
    sizes: [36, 37, 38, 39, 40, 41, 42, 43, 44, 45],
    description: 'The gum sole and suede T-toe trace the Samba’s roots in football. Its low profile and three stripes have since become part of the everyday uniform.',
    variants: [
      { id: 'cloud', name: 'Cloud White / Core Black', color: '#ece9df', image: '/media/samba-studio.webp', credit: commons('Adidas Samba OG.jpg', 'LeDroider', 'CC0') },
      { id: 'black', name: 'Core Black / Cloud White', color: '#252527', image: '/media/sambaBlack.webp', credit: commons('Adidas Samba original sneaker March- 2024.jpg', 'Ksharks2', 'CC BY-SA 4.0') },
    ],
    scan: { id: 'b23ee595a5e54bcca9928bd098c47a7e', title: 'Old Adidas Samba Sneaker', author: 'Kai Christmann', url: 'https://sketchfab.com/3d-models/old-adidas-samba-sneaker-b23ee595a5e54bcca9928bd098c47a7e' },
  },
  {
    id: 'air-jordan-1', name: 'Air Jordan 1', brand: 'Jordan', price: 180, style: 'Basketball', year: '1985',
    sizes: [38, 39, 40, 41, 42, 43, 44, 45, 46],
    description: 'A high collar, color-blocked leather and the Wings insignia define the shape. Originally a court shoe, the Jordan 1 has become a staple of sneaker culture.',
    variants: [{ id: 'retro', name: 'Retro High / Royal Blue', color: '#2949a0', image: '/media/jordan.webp', credit: commons('74892143 f94145facb.jpg', 'Kevin Vertucio', 'CC BY-SA 2.0') }],
    scan: { id: 'eb97944e2d0c42fe9b8c530968abd2ba', title: 'Air Jordan 1 Retro Mid Fog (Canvas) Scan', author: 'MUSHROOM_BUILDS', url: 'https://sketchfab.com/3d-models/nike-air-jordans-1-retro-mid-fog-canvas-scan-eb97944e2d0c42fe9b8c530968abd2ba' },
  },
  {
    id: 'gel-kayano-14', name: 'GEL-KAYANO 14', brand: 'ASICS', price: 170, style: 'Running', year: '2008',
    sizes: [36, 37, 38, 39, 40, 41, 42, 43, 44, 45],
    description: 'Open mesh, layered overlays and visible GEL details capture the engineering aesthetic of late-2000s running shoes.',
    variants: [{ id: 'aritzia', name: 'Aritzia edition', color: '#718676', image: '/media/kayano.webp', credit: commons('Gel-Kayano 14 Artizia.jpg', 'LeDroider', 'CC0') }],
  },
  {
    id: 'air-max-97', name: 'Air Max 97', brand: 'Nike', price: 190, style: 'Running', year: '1997',
    sizes: [37, 38, 39, 40, 41, 42, 43, 44, 45, 46],
    description: 'Layered lines wrap around the upper above a full-length visible Air unit. The continuous profile gives the Air Max 97 its sense of movement.',
    variants: [
      { id: 'silver', name: 'Silver Bullet', color: '#a4a9af', image: '/media/max97alt.webp', credit: commons('Air Max 97.jpg', 'Choledocho', 'CC BY-SA 4.0') },
      { id: 'archive', name: 'Archive edition', color: '#b4b3b7', image: '/media/max97.webp', credit: commons('Nike Air Max 97.jpg', 'Ssu', 'CC BY-SA 4.0') },
      { id: 'black', name: 'Black / Patterned', color: '#242528', image: '/media/max97black.webp', credit: commons('Nike Air Max 97 Black.jpg', 'Lulu45 005', 'CC BY-SA 4.0') },
    ],
  },
  {
    id: "campus-00s", name: "Campus 00s", brand: "adidas", price: 110, style: "Skate",
    sizes: standardSizes,
    description: "A broad suede upper, chunky laces and three cream stripes bring a skate-era proportion to the familiar Campus shape.",
    variants: [{ id: 'main', name: "Brown / Cloud White", color: "#8d5339", image: '/media/campus.webp',
      credit: commons("Adidas Campus 00s.jpg", "LeDroider", "CC0") }],
  },
  {
    id: "forum-low", name: "Forum Low", brand: "adidas", price: 115, style: "Basketball",
    sizes: courtSizes,
    description: "The low-cut Forum carries its adjustable strap and layered panels forward from the original basketball design.",
    variants: [{ id: 'main', name: "Cloud White", color: "#f1ece0", image: '/media/forum.webp',
      credit: commons("Adidas Forum.jpg", "LeDroider", "CC0") }],
  },
  {
    id: "gazelle-indoor", name: "Gazelle Indoor", brand: "adidas", price: 120, style: "Terrace",
    sizes: standardSizes,
    description: "A close-fitting suede upper and translucent gum sole give this indoor-court silhouette its distinctive profile.",
    variants: [{ id: 'main', name: "Blue / Gum", color: "#2687bc", image: '/media/gazelle.webp',
      credit: commons("Adidas Gazelle Indoor.jpg", "LeDroider", "CC0") }],
  },
  {
    id: "handball-spezial", name: "Handball Spezial", brand: "adidas", price: 115, style: "Terrace",
    sizes: standardSizes,
    description: "A low suede profile, contrasting three stripes and a dark gum sole define this indoor-sport classic.",
    variants: [{ id: 'main', name: "Core Black / Gum", color: "#2b2826", image: '/media/spezial.webp',
      credit: commons("Adidas Handball Spezial.jpg", "LeDroider", "CC0") }],
  },
  {
    id: "sl-72-og", name: "SL 72 OG", brand: "adidas", price: 100, style: "Running",
    sizes: standardSizes,
    description: "Lightweight-looking panels and a serrated outsole trace the original SL 72’s running heritage.",
    variants: [{ id: 'main', name: "Coral / Cloud White", color: "#d86053", image: '/media/sl72.webp',
      credit: commons("Adidas SL 72 OG.jpg", "LeDroider", "CC0") }],
  },
  {
    id: "nmd-r1", name: "NMD R1", brand: "adidas", price: 145, style: "Lifestyle",
    sizes: standardSizes,
    description: "The white knit upper keeps the focus on the distinctive blocks set into the midsole.",
    variants: [{ id: 'main', name: "Triple White", color: "#f6f0e6", image: '/media/nmd.webp',
      credit: commons("All white Adidas NMD R1.jpg", "LeDroider", "CC0") }],
  },
  {
    id: "air-max-90", name: "Air Max 90", brand: "Nike", price: 150, style: "Running",
    sizes: standardSizes,
    description: "Deep panel lines and the molded frame around the visible Air unit make the heel the focus of this silhouette.",
    variants: [{ id: 'main', name: "White / Infrared", color: "#c94438", image: '/media/max90.webp',
      credit: commons("Nike Air Max III 1990.jpg", "Warinhari", "CC BY-SA 4.0") }],
  },
  {
    id: "air-force-1-low", name: "Air Force 1 Low", brand: "Nike", price: 130, style: "Basketball",
    sizes: courtSizes,
    description: "A customized Air Force 1 Low with a warm patterned Swoosh, a perforated toe and a white cupsole.",
    variants: [{ id: 'main', name: "White / Orange Custom", color: "#e1854b", image: '/media/af1.webp',
      credit: commons("Customize White Nike Air Force One.jpg", "בר", "CC BY-SA 3.0") }],
  },
  {
    id: "blazer-mid", name: "Blazer Mid", brand: "Nike", price: 110, style: "Basketball",
    sizes: courtSizes,
    description: "A straight rubber sidewall and an elongated white Swoosh give the high-collar Blazer its court profile.",
    variants: [{ id: 'main', name: "Navy / White", color: "#3a5d75", image: '/media/blazer.webp',
      credit: commons("2012 Nike Blazers.JPG", "Corvettec6r", "CC0") }],
  },
  {
    id: "new-balance-574", name: "574", brand: "New Balance", price: 115, style: "Lifestyle",
    sizes: standardSizes,
    description: "Layered mesh and suede meet a compact, rounded profile and a substantial heel on this classic New Balance.",
    variants: [{ id: 'main', name: "Sand / Cream", color: "#9a8b71", image: '/media/nb574.webp',
      credit: commons("New Balance 574.jpg", "LeDroider", "CC0") }],
  },
  {
    id: "new-balance-373", name: "373", brand: "New Balance", price: 95, style: "Lifestyle",
    sizes: standardSizes,
    description: "A slim running-inspired profile with bright blue laces and a contrasting side N.",
    variants: [{ id: 'main', name: "Grey / Royal Blue", color: "#4e7398", image: '/media/nb373.webp',
      credit: commons("New Balance 373.jpg", "Elemili", "CC BY-SA 3.0") }],
  },
  {
    id: "new-balance-680-v6", name: "680 v6", brand: "New Balance", price: 105, style: "Running",
    sizes: standardSizes,
    description: "A light-toned mesh upper with contrasting heel support and red detailing.",
    variants: [{ id: 'main', name: "White / Black / Red", color: "#a73440", image: '/media/nb680.webp',
      credit: commons("New Balance 680 v6.jpg", "Petar Milošević", "CC BY 4.0") }],
  },
  {
    id: "knu-skool", name: "Knu Skool", brand: "Vans", price: 95, style: "Skate",
    sizes: standardSizes,
    description: "A padded tongue, wide laces and a raised side stripe define the Knu Skool’s oversized skate proportions.",
    variants: [{ id: 'main', name: "Navy / White", color: "#283847", image: '/media/vansknu.webp',
      credit: commons("Paire de Vans Knu Skool Caldrone.jpg", "IsaacGouillart", "CC BY-SA 4.0") }],
  },
  {
    id: "gola-harrier", name: "Harrier", brand: "Gola", price: 100, style: "Terrace",
    sizes: standardSizes,
    description: "A low suede shape with a restrained wingflash stripe and a narrow gum sole.",
    variants: [{ id: 'main', name: "Navy / Cream", color: "#263d50", image: '/media/gola.webp',
      credit: commons("Gola Harrier navy beige mens trainers.JPG", "Root66", "CC BY-SA 3.0") }],
  },
  {
    id: "camaro-m2", name: "Camaro M2", brand: "Diadora", price: 105, style: "Running",
    sizes: standardSizes,
    description: "Bright blue and yellow panels give this suede Camaro its track-inspired color blocking.",
    variants: [{ id: 'main', name: "Dutch Blue / Yellow", color: "#306d99", image: '/media/diadora.webp',
      credit: commons("Diadora CAMARO M2 sneaker.jpg", "WorldTravleerAndPhotoTaker", "CC0") }],
  },
];

export function catalogImage(id: string) {
  return '/media/profiles/' + id + '.webp';
}

export function studioImage(product: Product, variantIndex: number, fullSize = false) {
  const variant = product.variants[variantIndex];
  const id = variantIndex === 0 ? product.id : product.id + '-' + variant.id;
  return '/media/profiles/' + (fullSize ? '4k/' : '') + id + '.webp';
}

export const euro = new Intl.NumberFormat('en-IE', {
  style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
});




