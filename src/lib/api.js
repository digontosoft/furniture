import { useEffect, useState } from 'react'
const getClient = () => import('./supabase').then((m) => m.supabase)
import { DUMMY_ITEMS, DUMMY_HERO, DUMMY_IMAGES } from './dummy'

// Placeholder content until the client's real data is loaded. Set VITE_USE_DUMMY=false to use Supabase.
export const USE_DUMMY = import.meta.env.VITE_USE_DUMMY !== 'false'
export { DUMMY_IMAGES }

export const DEFAULT_SETTINGS = {
  hero: {
    title: 'Where thoughtful planning meets beautiful design.',
    subtitle: 'Interior design, cabinetry, countertops and flooring — planned from the blueprint to the finished space.',
    image_url: USE_DUMMY ? DUMMY_HERO : '',
  },
  home: { stock_image: '', custom_image: '' },
  philosophy: {
    text: 'Good interiors begin before construction. We work alongside contractors, engineers, builders and homeowners to shape function, flow and proportion from the very first plan.',
  },
  about: {
    heading: 'Thoughtful Design Begins Before Construction.',
    title: 'Interior Planning & Design Specialist',
    image_url: '',
    body:
      'Great interior design starts long before construction begins. We work with contractors, engineers, builders and homeowners from the blueprint stage through project completion.\n\nWhen reviewing architectural plans we look at function, flow, proportion and everyday usability, identifying layout and structural adjustments before construction becomes permanent or costly.\n\nOur planning covers kitchens, bathrooms, cabinetry, storage, appliance placement and overall interior flow. We bridge the gap between the blueprint and the finished interior.\n\nSmall changes — a shifted wall, a revised opening, a few extra inches, a better cabinet layout — can make a big difference in the finished space.',
    closing: 'Small changes before construction can make a world of difference after it.',
  },
  contact: { phone: '', email: '', address: '', hours: 'Mon–Fri: 9:00 AM – 5:00 PM', instagram: '' },
  terms: { body: 'Terms and Conditions will be published here soon.' },
}

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
