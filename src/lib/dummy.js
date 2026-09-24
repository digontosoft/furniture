// Temporary placeholder content. Replaced by Supabase data when USE_DUMMY is turned off (see api.js).
const pic = (seed, w = 700, h = 700) => `https://picsum.photos/seed/${seed}/${w}/${h}`
const swatch = (hex) => `https://placehold.co/600x600/${hex}/${hex}.png`

const make = (section, list, extra = {}) =>
  list.map((it, i) => ({
    id: `${section}-${i}`,
    section,
    parent_id: null,
    description: '',
    published: true,
    sort_order: i,
    ...extra,
    ...it,
  }))

const collections = ['Shaker White', 'Shaker Gray', 'Slab Walnut', 'Raised Panel Ivory', 'Navy Shaker', 'Sage Green', 'Espresso', 'Natural Oak']
const stockCollections = make(
  'stock_collection',
  collections.map((name, i) => ({ name, description: 'Door style & color', image_url: pic(`stock-col-${i}`) })),
)
const CATS = {
  'Base Cabinets': [['Base Cabinet 12"', '12"W x 34.5"H x 24"D'], ['Base Cabinet 15"', '15"W x 34.5"H x 24"D'], ['Base Cabinet 18"', '18"W x 34.5"H x 24"D'], ['Base Cabinet 24"', '24"W x 34.5"H x 24"D'], ['Base Cabinet 30"', '30"W x 34.5"H x 24"D']],
  'Wall Cabinets': [['Wall Cabinet 12"x30"', '12"W x 30"H x 12"D'], ['Wall Cabinet 18"x30"', '18"W x 30"H x 12"D'], ['Wall Cabinet 30"x36"', '30"W x 36"H x 12"D']],
  'Tall Cabinets': [['Tall Pantry 18"', '18"W x 84"H x 24"D'], ['Tall Pantry 24"', '24"W x 90"H x 24"D']],
  'Drawer Bases': [['3 Drawer Base 18"', '18"W x 34.5"H x 24"D'], ['3 Drawer Base 24"', '24"W x 34.5"H x 24"D']],
  'Sink Bases': [['Sink Base 30"', '30"W x 34.5"H x 24"D'], ['Sink Base 36"', '36"W x 34.5"H x 24"D']],
  'Vanities': [['Vanity 24"', '24"W x 34.5"H x 21"D'], ['Vanity 30"', '30"W x 34.5"H x 21"D']],
}
const stockItems = stockCollections.flatMap((c, ci) =>
  Object.entries(CATS).flatMap(([category, list], k) =>
    list.map(([name, size], i) => ({
      id: `${c.id}-${k}-${i}`,
      section: 'stock_item',
      parent_id: c.id,
      name,
      category,
      size,
      sku: `${c.name.split(' ').map((w) => w[0]).join('')}-${category[0]}${i + 1}${12 + i * 3}`,
      description: '',
      published: true,
      sort_order: k * 10 + i,
      image_url: pic(`${c.id}-${k}-${i}`, 700, 700),
    })),
  ),
)

export const DUMMY_ITEMS = [
  ...stockCollections,
  ...stockItems,
  ...make('door_profile', ['Shaker', 'Slab', 'Raised Panel', 'Cathedral', 'Beadboard', 'Mitered', 'Recessed', 'Arched'].map((name, i) => ({ name, image_url: pic(`profile-${i}`) }))),
  ...make('paint', [
    ['Alabaster', 'F2EFE8'], ['Agreeable Gray', 'D1CBC1'], ['Sage Whisper', 'A7B39A'], ['Hale Navy', '2F3E52'],
    ['Charcoal', '3B3B3D'], ['Warm Taupe', 'B8A898'], ['Forest Green', '3E5241'], ['Blush Clay', 'D9B8A6'],
  ].map(([name, hex]) => ({ name, image_url: swatch(hex) }))),
  ...make('stain', [
    ['Natural', 'C9A36B'], ['Honey', 'B8813E'], ['Chestnut', '8A5A34'], ['Walnut', '5E3D28'],
    ['Espresso', '3A2519'], ['Driftwood', '9C8B78'], ['Cherry', '7A3B2A'], ['Ebony', '231A16'],
  ].map(([name, hex]) => ({ name, image_url: swatch(hex) }))),
  ...make('countertop', ['Calacatta Gold', 'Carrara White', 'Black Pearl', 'Quartz Ivory', 'Blue Bahia', 'Taj Mahal', 'Nero Marquina', 'Soapstone Gray'].map((name, i) => ({ name, description: 'Slab', image_url: pic(`slab-${i}`) }))),
  ...make('flooring', ['European Oak', 'Hickory Hardwood', 'Luxury Vinyl Plank', 'Porcelain Tile', 'Herringbone', 'Slate Stone', 'Walnut Engineered', 'Polished Concrete'].map((name, i) => ({ name, description: 'Flooring', image_url: pic(`floor-${i}`) }))),
  ...make('gallery', Array.from({ length: 12 }, (_, i) => ({
    name: ['Kitchen', 'Bathroom', 'Pantry', 'Living Room', 'Mudroom', 'Laundry'][i % 6],
    image_url: pic(`space-${i}`, 800, i % 3 === 0 ? 1000 : i % 3 === 1 ? 600 : 800),
  }))),
]

export const DUMMY_HERO = pic('hero-interior', 1800, 1000)
export const DUMMY_IMAGES = {
  about: pic('about-portrait', 800, 1000),
  philosophy: pic('philosophy-space', 900, 1100),
  stock: pic('home-stock', 900, 700),
  custom: pic('home-custom', 900, 700),
  countertops: pic('home-countertops', 900, 700),
  flooring: pic('home-flooring', 900, 700),
}
