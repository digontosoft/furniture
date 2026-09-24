// One-time import of the client's tiles into Supabase (Storage + catalog_items).
// Prepare images first:  python scripts/optimize.py   (creates scripts/_out)
// Run:  ADMIN_EMAIL=you@x.com ADMIN_PASSWORD=secret node scripts/import.mjs
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import ws from 'ws' // Node < 22 has no native WebSocket

const env = Object.fromEntries(
  readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split(/\r?\n/).filter((l) => l.includes('=')).map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
)
const sb = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, { realtime: { transport: ws } })
const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env
if (!ADMIN_EMAIL || !ADMIN_PASSWORD) throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD')

const { error: authErr } = await sb.auth.signInWithPassword({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
if (authErr) throw authErr

const dir = new URL('./_out/', import.meta.url)
const manifest = JSON.parse(readFileSync(new URL('manifest.json', dir), 'utf8'))

// skip sections that already have data so the script is safe to re-run
const done = new Set()
for (const s of new Set(manifest.map((m) => m.section))) {
  const { count } = await sb.from('catalog_items').select('*', { count: 'exact', head: true }).eq('section', s)
  if (count) { done.add(s); console.log(`skip ${s} (already has ${count} rows)`) }
}
const todo = manifest.filter((m) => !done.has(m.section))

// upload with a small concurrency pool
let n = 0
const urls = new Map()
async function worker() {
  while (todo.length > n) {
    const m = todo[n++]
    const path = `seed/${m.file}`
    const { error } = await sb.storage.from('media').upload(path, readFileSync(new URL(m.file, dir)), {
      contentType: 'image/webp', cacheControl: '31536000', upsert: true,
    })
    if (error) throw new Error(`${m.file}: ${error.message}`)
    urls.set(m.file, sb.storage.from('media').getPublicUrl(path).data.publicUrl)
  }
}
await Promise.all(Array.from({ length: 6 }, worker))
console.log(`uploaded ${urls.size} images`)

const rows = todo.map((m) => ({
  section: m.section, category: m.category, name: m.name, sku: m.sku, sort_order: m.sort_order, image_url: urls.get(m.file),
}))
for (let i = 0; i < rows.length; i += 100) {
  const { error } = await sb.from('catalog_items').insert(rows.slice(i, i + 100))
  if (error) throw error
}
console.log(`inserted ${rows.length} rows. Now set VITE_USE_DUMMY=false in .env`)
