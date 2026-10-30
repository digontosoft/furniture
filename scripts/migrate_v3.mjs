// Data updates for the client's third round of notes ("Notes on site 3.docx").
//   ADMIN_EMAIL=you@x.com ADMIN_PASSWORD=secret node scripts/migrate_v3.mjs [--dry]
//  - Textured Melamine: the 38 swatches go back under their own tab (they were removed from Paints)
//  - Countertops: uncategorised slabs whose description says "quartz" → Quartz tab;
//    "Size / Texture / Thickness" pulled out of the description into specs (only where specs are empty)
//  - Flooring: Contemporary Calm specs from the client's example sheet (only if empty); names trimmed
//  - Measurement Guide: uploads Measurement_Guide.pdf + a preview picture (only if no PDF is set yet)
//    (preview: python -c "import pymupdf as f; f.open('Measurement_Guide.pdf')[0].get_pixmap(dpi=150).save('scripts/_out/measurement-guide.png')")
import { readFileSync, existsSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'
import ws from 'ws'

const DRY = process.argv.includes('--dry')
const root = new URL('../', import.meta.url)
const env = Object.fromEntries(
  readFileSync(new URL('.env', root), 'utf8')
    .split(/\r?\n/).filter((l) => l.includes('=')).map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
)
const sb = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, { realtime: { transport: ws } })
const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env
if (!ADMIN_EMAIL || !ADMIN_PASSWORD) throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD')
const { error: authErr } = await sb.auth.signInWithPassword({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
if (authErr) throw authErr
const log = (...a) => console.log(DRY ? '[dry]' : '', ...a)
const must = ({ error }) => { if (error) throw error }

// 1. Textured Melamine -------------------------------------------------------------------
const manifest = JSON.parse(readFileSync(new URL('scripts/_out/manifest.json', root), 'utf8'))
const swatches = manifest.filter((m) => m.category === 'Textured Melamine')
const { data: strays } = await sb.from('catalog_items').select('id,name').eq('section', 'paint').eq('category', 'Textured Melamine')
log(`moving ${strays.length} Textured Melamine item(s) still under Paints:`, strays.map((s) => s.name).join(', '))
if (!DRY && strays.length) must(await sb.from('catalog_items').update({ section: 'melamine', category: '' }).in('id', strays.map((s) => s.id)))
const { data: have } = await sb.from('catalog_items').select('name').eq('section', 'melamine')
const haveNames = new Set([...(have || []).map((h) => h.name), ...(DRY ? strays.map((s) => s.name) : [])])
const seed = (file) => `${env.VITE_SUPABASE_URL}/storage/v1/object/public/media/seed/${file}`
const missing = swatches.filter((m) => !haveNames.has(m.name))
log(`adding ${missing.length} Textured Melamine swatches`)
if (!DRY && missing.length)
  must(await sb.from('catalog_items').insert(missing.map((m) => ({
    section: 'melamine', name: m.name, category: '', image_url: seed(m.file), sort_order: m.sort_order, published: true,
  }))))
if (!DRY) {
  // keep everything in the original A–Z order
  const { data: all } = await sb.from('catalog_items').select('id,name').eq('section', 'melamine')
  const order = swatches.map((m) => m.name)
  for (const it of all) {
    const i = order.indexOf(it.name)
    must(await sb.from('catalog_items').update({ sort_order: i === -1 ? 100 : i }).eq('id', it.id))
  }
}

// 2. Countertops -------------------------------------------------------------------------
const SPEC_RE = /^([\s\S]*?)\s{2,}Size\s{2,}([\s\S]*?)\s{2,}Texture\s{2,}([\s\S]*?)\s{2,}Thickness\s{2,}([\s\S]*)$/
const { data: tops } = await sb.from('catalog_items').select('*').eq('section', 'countertop')
for (const t of tops) {
  const change = {}
  if (!t.category && /quartz/i.test(t.description || '')) change.category = 'Quartz'
  const m = (t.description || '').match(SPEC_RE)
  if (m && !(t.specs || []).length) {
    change.description = m[1].trim()
    change.specs = [['Size', m[2].trim()], ['Texture', m[3].trim()], ['Thickness', m[4].trim()]]
  }
  if (!Object.keys(change).length) continue
  log(`countertop ${t.name}:`, Object.keys(change).join(', '), change.specs ? JSON.stringify(change.specs) : '')
  if (!DRY) must(await sb.from('catalog_items').update(change).eq('id', t.id))
}

// 3. Flooring ----------------------------------------------------------------------------
const { data: floors } = await sb.from('catalog_items').select('*').eq('section', 'flooring')
for (const f of floors) {
  const change = {}
  if (f.name !== f.name.trim()) change.name = f.name.trim()
  if (f.name.trim() === 'Contemporary Calm' && !(f.specs || []).length) {
    if (!f.category) change.category = 'Engineered Wood'
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
  if (!Object.keys(change).length) continue
  log(`flooring ${f.name.trim()}:`, Object.keys(change).join(', '))
  if (!DRY) must(await sb.from('catalog_items').update(change).eq('id', f.id))
}

// 4. Measurement Guide -------------------------------------------------------------------
const { data: mgRow } = await sb.from('site_settings').select('value').eq('key', 'measurementGuide').maybeSingle()
const mg = mgRow?.value || {}
const pdfPath = new URL('Measurement_Guide.pdf', root)
const pngPath = new URL('scripts/_out/measurement-guide.png', root)
if (mg.pdf_url) log('Measurement Guide already has a PDF — left as is')
else if (!existsSync(pdfPath) || !existsSync(pngPath)) log('Measurement_Guide.pdf or its preview PNG not found — skipped')
else {
  log('uploading Measurement_Guide.pdf + preview picture')
  if (!DRY) {
    const bucket = sb.storage.from('media')
    const id = randomUUID()
    const pdf = `files/${id}/Measurement_Guide.pdf`
    must(await bucket.upload(pdf, readFileSync(pdfPath), { contentType: 'application/pdf', cacheControl: '31536000' }))
    const opts = { contentType: 'image/webp', cacheControl: '31536000' }
    const img = sharp(readFileSync(pngPath))
    must(await bucket.upload(`${id}.full.webp`, await img.clone().resize({ width: 2000, withoutEnlargement: true }).webp({ quality: 85 }).toBuffer(), opts))
    must(await bucket.upload(`${id}.thumb.webp`, await img.clone().resize({ width: 640 }).webp({ quality: 80 }).toBuffer(), opts))
    const value = { ...mg, pdf_url: bucket.getPublicUrl(pdf).data.publicUrl, image_url: bucket.getPublicUrl(`${id}.full.webp`).data.publicUrl }
    must(await sb.from('site_settings').upsert({ key: 'measurementGuide', value }))
  }
}
console.log(DRY ? 'dry run done — nothing changed' : 'done')
