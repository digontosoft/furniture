// One-time data update for the client's second round of notes. Run AFTER supabase/migration_2.sql.
//   ADMIN_EMAIL=you@x.com ADMIN_PASSWORD=secret node scripts/migrate_v2.mjs [--dry]
//  - Paints tagged "Textured Melamine" → their own Textured Melamine section
//  - Countertops → "Quartz" tab; "Size / Texture / Thickness" pulled out of the description into specs
//  - Contemporary Calm flooring → specs from the client's example sheet
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

if (!DRY) {
  const { error } = await sb.from('catalog_items').select('specs,images,featured').limit(1)
  if (error) throw new Error(`${error.message}\n→ Run supabase/migration_2.sql in the Supabase SQL Editor first.`)
}

async function update(id, change, label) {
  console.log(`${DRY ? '[dry] ' : ''}${label}:`, JSON.stringify(change).slice(0, 160))
  if (DRY) return
  const { error } = await sb.from('catalog_items').update(change).eq('id', id)
  if (error) throw new Error(`${label}: ${error.message}`)
}

// 1. Textured Melamine gets its own tab on Custom Cabinetry
const { data: melamine } = await sb.from('catalog_items').select('id,name').eq('section', 'paint').eq('category', 'Textured Melamine')
console.log(`moving ${melamine.length} Textured Melamine paints`)
if (!DRY && melamine.length) {
  const { error } = await sb.from('catalog_items').update({ section: 'melamine', category: '' }).eq('section', 'paint').eq('category', 'Textured Melamine')
  if (error) throw error
}

// 2. Countertops: Quartz tab + specs out of the description text
const SPEC_RE = /^([\s\S]*?)\s{2,}Size\s{2,}([\s\S]*?)\s{2,}Texture\s{2,}([\s\S]*?)\s{2,}Thickness\s{2,}([\s\S]*)$/
const { data: tops } = await sb.from('catalog_items').select('*').eq('section', 'countertop')
for (const t of tops) {
  const change = {}
  if (!t.category) change.category = 'Quartz'
  const m = (t.description || '').match(SPEC_RE)
  if (m && !(t.specs || []).length) {
    change.description = m[1].trim()
    change.specs = [['Size', m[2].trim()], ['Texture', m[3].trim()], ['Thickness', m[4].trim()]]
  }
  if (Object.keys(change).length) await update(t.id, change, t.name)
}

// 3. Flooring: tidy names; Contemporary Calm specs from the client's example
const { data: floors } = await sb.from('catalog_items').select('*').eq('section', 'flooring')
for (const f of floors) {
  const change = {}
  if (f.name !== f.name.trim()) change.name = f.name.trim()
  if (f.name.trim() === 'Contemporary Calm' && !(f.specs || []).length) {
    change.category = f.category || 'Engineered Wood'
    change.specs = [
      ['Collection', 'Designer Splash Oak'], ['Color', 'Contemporary Calm'], ['SKU', 'H2DS147CC'], ['Species', 'Oak'],
      ['Thickness', '1/4 Inch Overall w/ 1.2MM Wood Veneer'],
      ['Plank Width', '1/4 x 7 1/4 inches (Nominal)\n1/4 x 7 1/2 inches (Nominal)'],
      ['Plank Length', '2’ to 6’ random'], ['Plank Color Variation', '1 out of 4'],
      ['Style', 'Wire Brushed, Reactive Stain'], ['Finish', 'Low VOC, Polyurethane w/ Aluminum Oxide Matte Finish'],
      ['Installation', 'Lifecore Click Lock System: Glue or Float'], ['Coverage', '22.92 Sq. Ft. Per Carton'],
      ['Warranty', '50 Year Residential, 15 Year Light Commercial, Lifetime Structural'],
    ]
  }
  if (Object.keys(change).length) await update(f.id, change, f.name.trim())
}
console.log(DRY ? 'dry run done — nothing changed' : 'done')
