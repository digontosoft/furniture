// One-time: link every door style's stock items to the Default Items they were copied from
// (source_id), so editing / deleting a Default item can update all door styles. Run AFTER
// supabase/migration_4.sql.
//   ADMIN_EMAIL=you@x.com ADMIN_PASSWORD=secret node scripts/link_stock_items.mjs [--dry]
// For each door style, items are matched to Default items by SKU (two Default items share
// WBC2442 — those are paired by position). Along the way:
//  - duplicates left by "Copy to door styles" (e.g. Pure White Shaker had both "BT09" and
//    "9\" Single Door") are removed, keeping the one closest to the Default item
//  - each door style picks up the client's edits to the Default list (e.g. BT09 → 9" Single Door);
//    an empty Default description never wipes a door style's description
//  - a Default item missing from a door style is added
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

async function all(build) {
  const out = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await build().order('id').range(from, from + 999)
    if (error) throw error
    out.push(...data)
    if (data.length < 1000) return out
  }
}
const must = ({ error }) => { if (error) throw error }

if (!DRY) {
  const { error } = await sb.from('catalog_items').select('source_id').limit(1)
  if (error) throw new Error(`${error.message}\n→ Run supabase/migration_4.sql in the Supabase SQL Editor first.`)
}

const styles = await all(() => sb.from('catalog_items').select('id,name').eq('section', 'stock_collection'))
const items = await all(() => sb.from('catalog_items').select('*').eq('section', 'stock_item'))
const defaults = items.filter((i) => !i.parent_id).sort((a, b) => a.sort_order - b.sort_order)
const bySku = new Map()
for (const d of defaults) bySku.set(d.sku || d.name, [...(bySku.get(d.sku || d.name) || []), d])

const SYNC = ['name', 'image_url', 'category', 'sku', 'size', 'published', 'sort_order']
const totals = { linked: 0, updated: 0, deleted: 0, added: 0, unmatched: 0 }

for (const style of styles) {
  const own = items.filter((i) => i.parent_id === style.id)
  const groups = new Map()
  for (const c of own) groups.set(c.sku || c.name, [...(groups.get(c.sku || c.name) || []), c])
  const plan = { link: [], del: [], add: [], unmatched: [] }

  for (const [sku, ds] of bySku) {
    let copies = [...(groups.get(sku) || [])]
    groups.delete(sku)
    for (const d of ds) {
      // best copy for this Default item: already linked > same name > same position > same photo
      const score = (c) => (c.source_id === d.id ? 8 : 0) + (c.name === d.name ? 4 : 0) + (c.sort_order === d.sort_order ? 2 : 0) + (c.image_url === d.image_url ? 1 : 0)
      copies.sort((a, b) => score(b) - score(a) || a.created_at.localeCompare(b.created_at))
      const keep = copies.shift()
      if (!keep) { plan.add.push(d); continue }
      const change = {}
      if (keep.source_id !== d.id) change.source_id = d.id
      for (const f of SYNC) if ((keep[f] ?? '') !== (d[f] ?? '')) change[f] = d[f]
      if (d.description && keep.description !== d.description) change.description = d.description
      if (Object.keys(change).length) plan.link.push([keep, change])
    }
    plan.del.push(...copies) // anything left over is a duplicate
  }
  for (const rest of groups.values()) plan.unmatched.push(...rest)

  if (plan.del.length || plan.add.length || plan.unmatched.length || plan.link.some(([, c]) => Object.keys(c).some((k) => k !== 'source_id')))
    console.log(`${style.name}: ${plan.link.length} linked, updated ${plan.link.filter(([, c]) => Object.keys(c).some((k) => k !== 'source_id')).map(([k, c]) => `${k.name}→${c.name || '(fields)'}`).join(', ') || '—'}; ` +
      `removing duplicates: ${plan.del.map((d) => d.name).join(', ') || '—'}; adding: ${plan.add.map((d) => d.name).join(', ') || '—'}; ` +
      `not in Default list (left as is): ${plan.unmatched.map((u) => u.name).join(', ') || '—'}`)
  totals.linked += plan.link.length
  totals.updated += plan.link.filter(([, c]) => Object.keys(c).some((k) => k !== 'source_id')).length
  totals.deleted += plan.del.length
  totals.added += plan.add.length
  totals.unmatched += plan.unmatched.length
  if (DRY) continue

  for (let i = 0; i < plan.link.length; i += 8)
    (await Promise.all(plan.link.slice(i, i + 8).map(([c, change]) => sb.from('catalog_items').update(change).eq('id', c.id)))).forEach(must)
  if (plan.del.length) must(await sb.from('catalog_items').delete().in('id', plan.del.map((d) => d.id)))
  if (plan.add.length)
    must(await sb.from('catalog_items').insert(plan.add.map((d) => ({
      section: 'stock_item', parent_id: style.id, source_id: d.id, name: d.name, description: d.description || '',
      image_url: d.image_url || '', category: d.category || '', sku: d.sku || '', size: d.size || '',
      sort_order: d.sort_order, published: d.published, specs: d.specs || [], images: d.images || [],
    }))))
}
console.log(`${DRY ? '[dry] ' : ''}${styles.length} door styles: ${totals.linked} items linked (${totals.updated} brought up to date), ` +
  `${totals.deleted} duplicates removed, ${totals.added} missing items added, ${totals.unmatched} not in the Default list`)
