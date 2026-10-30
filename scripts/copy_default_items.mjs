// Gives every stock door style its own copy of the Default Items list (the 228 items the client
// built for White Shaker), so each one can be edited separately. Door styles that already have
// their own items are skipped, so it is safe to run again.
// Run only once the site runs the code that shows a door style's own list INSTEAD of the default
// list — older code shows both, which would list every item twice.
//   ADMIN_EMAIL=you@x.com ADMIN_PASSWORD=secret node scripts/copy_default_items.mjs [--dry]
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import ws from 'ws'

const DRY = process.argv.includes('--dry')
const env = Object.fromEntries(
  readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split(/\r?\n/).filter((l) => l.includes('=')).map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
)
const sb = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, { realtime: { transport: ws } })
const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env
if (!ADMIN_EMAIL || !ADMIN_PASSWORD) throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD')
const { error: authErr } = await sb.auth.signInWithPassword({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
if (authErr) throw authErr

// PostgREST returns at most 1000 rows per request
async function all(build) {
  const out = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await build().range(from, from + 999)
    if (error) throw error
    out.push(...data)
    if (data.length < 1000) return out
  }
}

const styles = await all(() => sb.from('catalog_items').select('id,name').eq('section', 'stock_collection').order('sort_order'))
const defaults = await all(() => sb.from('catalog_items').select('*').eq('section', 'stock_item').is('parent_id', null).order('sort_order').order('created_at'))
const owned = await all(() => sb.from('catalog_items').select('parent_id').eq('section', 'stock_item').not('parent_id', 'is', null))
const has = new Set(owned.map((o) => o.parent_id))
console.log(`${defaults.length} default items, ${styles.length} door styles`)

let added = 0
for (const s of styles) {
  if (has.has(s.id)) { console.log(`skip ${s.name} (already has its own items)`); continue }
  const rows = defaults.map((it, i) => ({
    section: 'stock_item', parent_id: s.id, name: it.name, description: it.description || '', image_url: it.image_url || '',
    category: it.category || '', sku: it.sku || '', size: it.size || '', sort_order: i,
    published: it.published, specs: it.specs || [], images: it.images || [],
  }))
  if (!DRY)
    for (let i = 0; i < rows.length; i += 500) {
      const { error } = await sb.from('catalog_items').insert(rows.slice(i, i + 500))
      if (error) throw new Error(`${s.name}: ${error.message}`)
    }
  added += rows.length
  console.log(`${DRY ? '[dry] ' : ''}${s.name}: ${rows.length} items`)
}
console.log(`${DRY ? '[dry] would add' : 'added'} ${added} items`)
