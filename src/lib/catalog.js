// Catalogue structure shared by the public site and the admin panel.

/**
 * Page headers: background colour per page (client notes 2) and the default
 * headline / sub-text (both editable in Admin → Site Content → Page headlines).
 * `dark` = use light text on that colour.
 */
export const PAGES = {
  stock: { title: 'Stock Cabinetry', subtitle: 'Standard sizes and colors available', bg: '#B9AA98' }, // Light Taupe
  custom: { title: 'Custom Cabinetry', subtitle: 'Choose every detail, from your door profile to your perfect stain or paint color.', bg: '#8F8375', dark: true }, // Warm Greige
  countertops: { title: 'Countertops', subtitle: 'Discover thoughtfully selected surfaces designed for both everyday living and exceptional style.', bg: '#7A8063', dark: true }, // Muted Olive
  flooring: { title: 'Flooring', subtitle: 'Explore flooring selections that bring warmth, character, and cohesion to your space.', bg: '#4F5945', dark: true }, // Deep Olive
  backsplash: { title: 'Backsplash', subtitle: 'Refined details, beautiful textures, and timeless finishes that complete the space.', bg: '#AABCC0' }, // Dusty Blue
  spaces: { title: 'Spaces We’ve Created', subtitle: 'Explore our completed projects, where thoughtful design, carefully selected materials, and beautiful craftsmanship come together to create spaces that feel like home.', bg: '#A6AA96' }, // Soft Sage
  about: { title: 'About Us', subtitle: '', bg: '#B7AEA1' }, // Warm Greige (light, from the second colour table)
  contact: { title: 'Contact Us', subtitle: '', bg: '#887F75', dark: true }, // Mushroom Taupe
  measurement: { title: 'Measurement Guide', subtitle: '', bg: '#D8C8B4' }, // Warm Sand
  shipping: { title: 'Shipment & Delivery Information', subtitle: '', bg: '#D8C8B4' },
  faq: { title: 'FAQ’s', subtitle: '', bg: '#D8C8B4' },
  terms: { title: 'Terms and Conditions', subtitle: '', bg: '#D8C8B4' },
}

// "Add usual rows" for a stock door style's specs (client notes 3)
const STOCK_SPEC_ROWS = [
  'Box Material', 'Box Interior', 'Box Exterior', 'Box Face Frame', 'Door Material',
  'Door Style', 'Door Hinges', 'Drawer Glides', 'Drawer Material', 'Shelves',
]

const FLOORING_SPECS = [
  'Collection', 'Color', 'SKU', 'Species', 'Thickness', 'Plank Width', 'Plank Length',
  'Plank Color Variation', 'Style', 'Finish', 'Installation', 'Coverage', 'Warranty',
]

/**
 * Every catalogue section.
 *  name      – public label (search results)       admin – admin menu label
 *  allTab    – category tabs start with "All" (default yes)
 *  rail      – can appear in a Home page scroll bar
 *  path      – where an item opens on the site      specs – usual spec rows for new items
 *  gallery   – item can have extra photos           detail – has its own detail page
 */
export const SECTIONS = {
  stock_collection: { name: 'Stock Cabinetry', admin: 'Stock — Door Styles', rail: true, gallery: true, specs: STOCK_SPEC_ROWS, path: (it) => `/stock-cabinetry/${it.id}` },
  stock_item: { name: 'Stock Cabinetry Item', admin: 'Stock — Default Items', allTab: false, path: (it) => (it.parent_id ? `/stock-cabinetry/${it.parent_id}` : '/stock-cabinetry') },
  door_profile: { name: 'Door Profile', admin: 'Door Profiles', rail: true, path: () => '/custom-cabinetry?tab=door_profile' },
  paint: { name: 'Paint', admin: 'Paints', path: () => '/custom-cabinetry?tab=paint' },
  stain: { name: 'Stain', admin: 'Stains', path: () => '/custom-cabinetry?tab=stain' },
  melamine: { name: 'Textured Melamine', admin: 'Textured Melamine', path: () => '/custom-cabinetry?tab=melamine' },
  countertop: { detail: true, name: 'Countertop', admin: 'Countertops', rail: true, gallery: true, specs: ['Size', 'Texture', 'Thickness'], path: (it) => `/countertops/${it.id}` },
  flooring: { detail: true, name: 'Flooring', admin: 'Flooring', rail: true, gallery: true, specs: FLOORING_SPECS, path: (it) => `/flooring/${it.id}` },
  backsplash: { detail: true, name: 'Backsplash', admin: 'Backsplash', rail: true, gallery: true, specs: ['Size', 'Material', 'Finish', 'Thickness'], path: (it) => `/backsplash/${it.id}` },
  gallery: { name: 'Spaces We’ve Created', admin: 'Spaces Gallery', noCategories: true, path: () => '/spaces-weve-created' },
}

/**
 * Custom Cabinetry main tabs, in order. Each is its own section; the client can add more in
 * Admin → Categories (new ones get a `custom_…` key). Stored in site_settings "customTabs".
 */
export const DEFAULT_CUSTOM_TABS = [
  { key: 'door_profile', label: 'Door Profiles' },
  { key: 'paint', label: 'Paints' },
  { key: 'stain', label: 'Stains' },
  { key: 'melamine', label: 'Textured Melamine' },
  { key: 'custom_polymer_high_gloss', label: 'Polymer High-Gloss' },
  { key: 'custom_polymer_velour_touch', label: 'Polymer Velour Touch' },
  { key: 'custom_master_oak', label: 'Master Oak' },
]

const titleCase = (key) => key.replace(/^custom_/, '').split('_').map((w) => w[0]?.toUpperCase() + w.slice(1)).join(' ')

/** Section settings, including Custom Cabinetry tabs the client created (pass its label if known). */
export const confOf = (section, label) =>
  SECTIONS[section] || {
    name: label || titleCase(section), admin: label || titleCase(section),
    path: () => `/custom-cabinetry?tab=${section}`,
  }

/** Default category tabs per section (Admin → Categories can add, rename, remove, reorder). */
export const DEFAULT_CATEGORIES = {
  stock_collection: ['Flat Panel', 'Shaker', 'Double Shaker', 'Slim Shaker', 'Raised Panel'],
  stock_item: ['Base', 'Wall', 'Tall', 'Vanity', 'Trim, Panels, Molding'],
  door_profile: [],
  paint: [],
  stain: ['Alder', 'Birch', 'Maple', 'Oak', 'Walnut', 'White Oak'],
  melamine: [],
  countertop: ['Granite', 'Quartz', 'Natural Stone', 'Porcelain', 'Solid Surface'],
  flooring: ['Engineered Wood', 'Laminated Wood', 'Solid Hardwood', 'Resilient Vinyl', 'Tile'],
  backsplash: ['Subway', 'Mosaic', 'Marble', '3D', 'Decorative', 'Handmade'],
}

export const DEFAULT_STOCK_SPECS = [
  ['Box Material', '1/2" Birch Plywood'],
  ['Box Interior', 'Natural Birch Interior'],
  ['Box Face Frame', '3/4" x 1-1/2" Solid Birch'],
  ['Door Material', 'Solid Wood Frame, MDF Panel'],
  ['Door Style', 'Full Overlay'],
  ['Door Hinges', 'Soft Close, Concealed, 6-Way Adjustable'],
  ['Drawer Glides', 'Soft Close Undermount Full Extension'],
  ['Drawer Material', '5/8" wood, Dovetail'],
  ['Shelves', '3/4" Plywood, Adjustable, full in wall, ½ depth in base'],
]

// Stock collections store their tab in `style`; everything else uses `category`.
const STYLE_BY_NAME = {
  'Double Smoked': 'Double Shaker', 'Double White': 'Double Shaker',
  'Slim Oak': 'Slim Shaker', 'Slim Pine': 'Slim Shaker', 'Slim White': 'Slim Shaker',
  'Classic Brown': 'Raised Panel', 'Classic Cream': 'Raised Panel', 'Traditional White': 'Raised Panel',
}
export const catField = (section) => (section === 'stock_collection' ? 'style' : 'category')

// An item can sit in several tabs (e.g. a door profile that is both "Maple" and "Polymer"):
// `category` holds them joined with "|".
export const CAT_SEP = '|'
export const catsOf = (section, item) =>
  section === 'stock_collection'
    ? [item.style || STYLE_BY_NAME[item.name] || 'Shaker']
    : (item.category || '').split(CAT_SEP).map((c) => c.trim()).filter(Boolean)
export const joinCats = (cats) => [...new Set(cats.map((c) => c.trim()).filter(Boolean))].join(CAT_SEP)

const hasAll = (section) => confOf(section).allTab !== false

/**
 * Tabs for a section's items. Items in none of the listed tabs show under "All"; sections
 * without an "All" tab get a trailing "Other" tab instead, so nothing published disappears.
 */
export function tabsFor(section, items, list) {
  if (!list?.length) return []
  const all = hasAll(section)
  const orphan = (items || []).some((i) => !catsOf(section, i).some((c) => list.includes(c)))
  return [...(all ? ['All'] : []), ...list, ...(orphan && !all ? ['Other'] : [])]
}

export function inTab(section, list, tab, item) {
  if (!tab || tab === 'All') return true
  const cats = catsOf(section, item)
  return tab === 'Other' ? !cats.some((c) => list.includes(c)) : cats.includes(tab)
}

/** Home page scroll bars: the items ticked "Show on Home page", else the first 24 in order. */
export const railItems = (items) => {
  const list = items || []
  return list.some((i) => i.featured) ? list.filter((i) => i.featured) : list.slice(0, 24)
}

/** Photos for a detail page / viewer: main image first, then the extra gallery photos. */
export const photosOf = (item) => [item?.image_url, ...(Array.isArray(item?.images) ? item.images : [])].filter(Boolean)

/** Uploaded images are stored as `<id>.full.webp` + `<id>.thumb.webp`; tiles use the small one. */
export const thumb = (url) => (url && /\.full\.webp$/.test(url) ? url.replace(/\.full\.webp$/, '.thumb.webp') : url)
