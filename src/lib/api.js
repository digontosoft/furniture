import { useEffect, useState } from 'react'
import { DUMMY_ITEMS, DUMMY_HERO, DUMMY_IMAGES } from './dummy'
import { PAGES, DEFAULT_CATEGORIES, DEFAULT_STOCK_SPECS } from './catalog'

const getClient = () => import('./supabase').then((m) => m.supabase)

// Placeholder content until the client's real data is loaded. Set VITE_USE_DUMMY=false to use Supabase.
export const USE_DUMMY = import.meta.env.VITE_USE_DUMMY !== 'false'
export { DUMMY_IMAGES }

export const DEFAULT_SETTINGS = {
  hero: {
    title: 'Thoughtful interiors. Beautifully considered.',
    subtitle: 'Creating spaces that are as functional as they are beautiful.',
    image_url: USE_DUMMY ? DUMMY_HERO : '',
  },
  philosophy: {
    text: 'Merging exceptional design with tailormade cabinetry, we curate spaces from concept to completion, distinguished by precision, craftsmanship, and an unwavering attention to every detail.',
  },
  // flat `<page>_title` / `<page>_subtitle` keys, edited in Admin → Site Content
  pages: Object.fromEntries(Object.entries(PAGES).flatMap(([k, p]) => [[`${k}_title`, p.title], [`${k}_subtitle`, p.subtitle]])),
  categories: DEFAULT_CATEGORIES,
  stockSpecs: { rows: DEFAULT_STOCK_SPECS },
  about: {
    heading: 'Thoughtful Design Begins Before Construction.',
    title: 'Interior Planning & Design Specialist',
    image_url: '',
    body:
      'Great interior design starts long before construction begins. We work with contractors, engineers, builders and homeowners from the blueprint stage through project completion.\n\nWhen reviewing architectural plans we look at function, flow, proportion and everyday usability, identifying layout and structural adjustments before construction becomes permanent or costly.\n\nOur planning covers kitchens, bathrooms, cabinetry, storage, appliance placement and overall interior flow. We bridge the gap between the blueprint and the finished interior.\n\nSmall changes — a shifted wall, a revised opening, a few extra inches, a better cabinet layout — can make a big difference in the finished space.',
    closing: 'Small changes before construction can make a world of difference after it.',
  },
  contact: { phone: '702-418-2018', email: '', address: '', hours: 'Monday - Friday\n9:00am - 5:00pm\nAlso by appointment', instagram: '', linkedin: '' },
  terms: { body: 'Terms and Conditions will be published here soon.' },
  measurementGuide: { body: 'Our measurement guide will be published here soon. In the meantime, request a consultation and we will measure your space for you.', pdf_url: '' },
  shipping: { body: 'Shipment & delivery information will be published here soon.' },
  faq: { body: 'Frequently asked questions will be published here soon.' },
}

const cache = new Map()

// Stale-while-revalidate: show last known data instantly, refresh in the background.
const LS = 'gg:v2:'
const readLS = (k) => { try { return JSON.parse(localStorage.getItem(LS + k)) } catch { return null } }
const writeLS = (k, v) => { try { localStorage.setItem(LS + k, JSON.stringify(v)) } catch { /* quota / private mode */ } }

async function fetchItems(section, parentId) {
  if (USE_DUMMY)
    return DUMMY_ITEMS.filter((i) => i.section === section && (!parentId || i.parent_id === parentId || i.parent_id === null))
  const supabase = await getClient()
  if (!supabase) return []
  let q = supabase.from('catalog_items').select('*').eq('section', section).eq('published', true)
  // stock items with no parent are shared by every collection
  if (parentId) q = q.or(`parent_id.eq.${parentId},parent_id.is.null`)
  const { data, error } = await q.order('sort_order').order('created_at')
  if (error) throw error
  return data
}

export function useItems(section, parentId = null) {
  const key = `${section}:${parentId || ''}`
  const [items, setItems] = useState(() => cache.get(key) ?? readLS(key))
  const [error, setError] = useState(null)
  useEffect(() => {
    let live = true
    setItems(cache.get(key) ?? readLS(key))
    fetchItems(section, parentId)
      .then((d) => { cache.set(key, d); writeLS(key, d); live && setItems(d) })
      .catch((e) => live && setError(e))
    return () => { live = false }
  }, [key])
  return { items, loading: items === null && !error, error }
}

function mergeSettings(rows) {
  const merged = { ...DEFAULT_SETTINGS }
  for (const row of rows || []) merged[row.key] = { ...DEFAULT_SETTINGS[row.key], ...row.value }
  return merged
}

// Several components ask for settings on the same render; share one request.
let settingsRequest = null
function fetchSettings() {
  settingsRequest ??= getClient()
    .then((supabase) => supabase?.from('site_settings').select('*'))
    .then((res) => {
      if (!res || res.error) throw res?.error || new Error('no client')
      writeLS('settings', res.data)
      const merged = mergeSettings(res.data)
      cache.set('settings', merged)
      return merged
    })
    .finally(() => setTimeout(() => { settingsRequest = null }, 1000))
  return settingsRequest
}

/** Site settings, always revalidated on mount so admin edits show up without a hard refresh. */
export function useSettings() {
  const [settings, setSettings] = useState(() => cache.get('settings') ?? (readLS('settings') ? mergeSettings(readLS('settings')) : DEFAULT_SETTINGS))
  useEffect(() => {
    if (USE_DUMMY) return
    let live = true
    fetchSettings().then((s) => live && setSettings(s)).catch(() => {})
    return () => { live = false }
  }, [])
  return settings
}

export function clearCache() {
  cache.clear()
  try { Object.keys(localStorage).filter((k) => k.startsWith(LS)).forEach((k) => localStorage.removeItem(k)) } catch { /* ignore */ }
}

/** Warm the cache for the main catalogue pages once the browser is idle. */
export function prefetchCatalog() {
  const run = () => ['stock_collection', 'door_profile', 'paint', 'stain', 'melamine', 'countertop', 'flooring', 'backsplash'].forEach((sec) =>
    fetchItems(sec).then((d) => { cache.set(`${sec}:`, d); writeLS(`${sec}:`, d) }).catch(() => {}))
  ;(window.requestIdleCallback || ((f) => setTimeout(f, 1500)))(run)
}

/** Header search: matches catalogue items by name across every section. */
export async function searchItems(q) {
  const term = q.trim().toLowerCase()
  if (!term) return []
  if (USE_DUMMY) return DUMMY_ITEMS.filter((i) => i.name.toLowerCase().includes(term)).slice(0, 60)
  const supabase = await getClient()
  if (!supabase) return []
  const { data, error } = await supabase.from('catalog_items').select('*')
    .eq('published', true).ilike('name', `%${term.replace(/[%_,()]/g, ' ')}%`).order('sort_order').limit(60)
  if (error) throw error
  return data
}

export async function submitForm(payload) {
  if (USE_DUMMY) return console.info('Dummy mode – submission not saved:', payload)
  const supabase = await getClient()
  if (!supabase) throw new Error('The site is not connected to Supabase yet.')
  const { error } = await supabase.from('submissions').insert(payload)
  if (error) throw error
}

/** Resize in the browser and encode as WebP. Throws if the browser can't (caller falls back). */
async function toWebp(file, max, quality) {
  const bmp = await createImageBitmap(file)
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bmp.width * scale)
  canvas.height = Math.round(bmp.height * scale)
  canvas.getContext('2d').drawImage(bmp, 0, 0, canvas.width, canvas.height)
  bmp.close?.()
  const blob = await new Promise((res) => canvas.toBlob(res, 'image/webp', quality))
  if (!blob || blob.type !== 'image/webp') throw new Error('WebP encoding not supported')
  return blob
}

/**
 * Uploads an image as a ≤2000px WebP plus a ≤640px thumbnail, so admins can drop in
 * 10–20 MB camera/slab photos without slowing the site. Returns the full-size URL.
 */
export async function uploadImage(file) {
  const supabase = await getClient()
  const bucket = supabase.storage.from('media')
  const opts = { cacheControl: '31536000', contentType: 'image/webp' }
  const id = crypto.randomUUID()
  let encoded = null
  if (/^image\/(jpeg|png|webp|bmp|avif)$/.test(file.type)) {
    try { encoded = await Promise.all([toWebp(file, 2000, 0.82), toWebp(file, 640, 0.8)]) } catch { /* upload original below */ }
  }
  if (!encoded) return uploadFile(file, id)
  const up = await Promise.all([bucket.upload(`${id}.full.webp`, encoded[0], opts), bucket.upload(`${id}.thumb.webp`, encoded[1], opts)])
  const failed = up.find((r) => r.error)
  if (failed) throw failed.error
  return bucket.getPublicUrl(`${id}.full.webp`).data.publicUrl
}

/** Uploads any file as-is (PDFs etc.), keeping its name so downloads look right. */
export async function uploadFile(file, id = crypto.randomUUID()) {
  const supabase = await getClient()
  const safe = file.name.replace(/[^\w.-]+/g, '-')
  const path = `files/${id}/${safe}`
  const { error } = await supabase.storage.from('media').upload(path, file, { cacheControl: '31536000', contentType: file.type || undefined })
  if (error) throw error
  return supabase.storage.from('media').getPublicUrl(path).data.publicUrl
}
