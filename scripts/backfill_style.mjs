// One-time: adds the `style` column (if missing) and tags existing stock_collection
// rows with their door-style group from the client's notes.
// Run:  ADMIN_EMAIL=you@x.com ADMIN_PASSWORD=secret node scripts/backfill_style.mjs
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import ws from 'ws'

const env = Object.fromEntries(
  readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split(/\r?\n/).filter((l) => l.includes('=')).map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
)
const sb = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, { realtime: { transport: ws } })
const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env
if (!ADMIN_EMAIL || !ADMIN_PASSWORD) throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD')
const { error: authErr } = await sb.auth.signInWithPassword({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
if (authErr) throw authErr

const STYLE_BY_NAME = {
  'Double Smoked': 'Double Shaker', 'Double White': 'Double Shaker',
  'Slim Oak': 'Slim Shaker', 'Slim Pine': 'Slim Shaker', 'Slim White': 'Slim Shaker',
  'Classic Brown': 'Raised Panel', 'Classic Cream': 'Raised Panel', 'Traditional White': 'Raised Panel',
}

// Display order inside each tab, as listed in the client's notes (unlisted names go last).
const ORDER = [
  'White Shaker', 'Black Shaker', 'Espresso Shaker', 'Gray Shaker', 'Moon Grey Shaker', 'Natural Shaker',
  'Navy Shaker', 'Pine Green Shaker', 'Rustic Wood Shaker', 'Sage Shaker', 'Smokey Shaker',
  'Double Smoked', 'Double White',
  'Slim Oak', 'Slim Pine', 'Slim White',
  'Classic Cream', 'Classic Brown', 'Traditional White',
]

const { data: rows, error } = await sb.from('catalog_items').select('id,name,style,sort_order').eq('section', 'stock_collection')
if (error) throw error
let n = 0
for (const r of rows) {
  const style = STYLE_BY_NAME[r.name] || 'Shaker'
  const i = ORDER.indexOf(r.name)
  const sort_order = i === -1 ? 100 : i
  if (r.style === style && r.sort_order === sort_order) continue
  const { error: upErr } = await sb.from('catalog_items').update({ style, sort_order }).eq('id', r.id)
  if (upErr) throw new Error(`${r.name}: ${upErr.message}`)
  n++
}
console.log(`updated ${n}/${rows.length} collections`)
