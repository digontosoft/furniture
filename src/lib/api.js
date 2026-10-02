import { useEffect, useState } from 'react'
const getClient = () => import('./supabase').then((m) => m.supabase)
import { DUMMY_ITEMS, DUMMY_HERO, DUMMY_IMAGES } from './dummy'

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
  about: {
    heading: 'Thoughtful Design Begins Before Construction.',
    title: 'Interior Planning & Design Specialist',
    image_url: '',
    body:
      'Great interior design starts long before construction begins. We work with contractors, engineers, builders and homeowners from the blueprint stage through project completion.\n\nWhen reviewing architectural plans we look at function, flow, proportion and everyday usability, identifying layout and structural adjustments before construction becomes permanent or costly.\n\nOur planning covers kitchens, bathrooms, cabinetry, storage, appliance placement and overall interior flow. We bridge the gap between the blueprint and the finished interior.\n\nSmall changes — a shifted wall, a revised opening, a few extra inches, a better cabinet layout — can make a big difference in the finished space.',
    closing: 'Small changes before construction can make a world of difference after it.',
  },
  contact: { phone: '702-418-2018', email: '', address: '', hours: 'Monday – Friday 9:00am-5:00pm', instagram: '', linkedin: '' },
  terms: { body: 'Terms and Conditions will be published here soon.' },
  measurementGuide: { body: 'Our measurement guide will be published here soon. In the meantime, request a consultation and we will measure your space for you.' },
  shipping: { body: 'Shipment & delivery information will be published here soon.' },
  faq: { body: 'Frequently asked questions will be published here soon.' },
}

// Stock Cabinetry door-style groups (client notes). Collections without a matching
// `style` column value fall back to this name-based lookup, then "Shaker".
export const STYLE_GROUPS = ['Flat Panel', 'Shaker', 'Double Shaker', 'Slim Shaker', 'Raised Panel']
const STYLE_BY_NAME = {
  'Double Smoked': 'Double Shaker', 'Double White': 'Double Shaker',
  'Slim Oak': 'Slim Shaker', 'Slim Pine': 'Slim Shaker', 'Slim White': 'Slim Shaker',
  'Classic Brown': 'Raised Panel', 'Classic Cream': 'Raised Panel', 'Traditional White': 'Raised Panel',
}
export const styleOf = (collection) => collection.style || STYLE_BY_NAME[collection.name] || 'Shaker'

const cache = new Map()

// Stale-while-revalidate: show last known data instantly, refresh in the background.
const LS = 'gg:v1:'
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

export function useSettings() {
  const [settings, setSettings] = useState(cache.get('settings') ?? DEFAULT_SETTINGS)
  useEffect(() => {
    if (USE_DUMMY || cache.has('settings')) return
    getClient().then((supabase) => supabase?.from('site_settings').select('*').then(({ data }) => {
      const merged = { ...DEFAULT_SETTINGS }
      for (const row of data || []) merged[row.key] = { ...DEFAULT_SETTINGS[row.key], ...row.value }
      cache.set('settings', merged)
      setSettings(merged)
    }))
  }, [])
  return settings
}

export function clearCache() {
  cache.clear()
  try { Object.keys(localStorage).filter((k) => k.startsWith(LS)).forEach((k) => localStorage.removeItem(k)) } catch { /* ignore */ }
}

/** Warm the cache for the main catalogue pages once the browser is idle. */
export function prefetchCatalog() {
  const run = () => ['stock_collection', 'door_profile', 'paint', 'stain'].forEach((sec) =>
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

export async function uploadImage(file) {
  const supabase = await getClient()
  const ext = file.name.split('.').pop()
  const path = `${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from('media').upload(path, file, { cacheControl: '31536000' })
  if (error) throw error
  return supabase.storage.from('media').getPublicUrl(path).data.publicUrl
}
