// Shrinks photos that were uploaded through the admin before uploads were compressed
// (some countertop slabs were 5–17 MB). Each one becomes <id>.full.webp (≤2000px) +
// <id>.thumb.webp (≤640px) and every reference is pointed at the new file.
// Originals stay in storage; old→new URLs are written to scripts/_image_map.json for rollback.
//   ADMIN_EMAIL=you@x.com ADMIN_PASSWORD=secret node scripts/optimize_uploads.mjs [--dry]
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'
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

const isCandidate = (u) => typeof u === 'string' && u.includes('/object/public/media/') && !u.includes('/media/seed/') && !u.includes('/media/files/') && !u.endsWith('.full.webp')

const { data: items, error } = await sb.from('catalog_items').select('*')
if (error) throw error
const { data: settings } = await sb.from('site_settings').select('*')

const urls = new Set()
for (const it of items) [it.image_url, ...(Array.isArray(it.images) ? it.images : [])].filter(isCandidate).forEach((u) => urls.add(u))
for (const s of settings) Object.values(s.value).filter(isCandidate).forEach((u) => urls.add(u))
console.log(`${urls.size} uploaded images to check`)

const mapFile = new URL('./_image_map.json', import.meta.url)
const map = existsSync(mapFile) ? JSON.parse(readFileSync(mapFile, 'utf8')) : {}
const bucket = sb.storage.from('media')
const opts = { contentType: 'image/webp', cacheControl: '31536000' }
let before = 0, after = 0

for (const url of urls) {
  const buf = Buffer.from(await (await fetch(url)).arrayBuffer())
  const img = sharp(buf, { failOn: 'none' }).rotate()
  const meta = await img.metadata()
  const full = await img.clone().resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toBuffer()
  const small = await img.clone().resize({ width: 640, height: 640, fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toBuffer()
  before += buf.length; after += full.length
  console.log(`${(buf.length / 1024).toFixed(0).padStart(6)} KB ${meta.width}x${meta.height} → ${(full.length / 1024).toFixed(0).padStart(5)} KB (thumb ${(small.length / 1024).toFixed(0)} KB)  ${url.split('/').pop()}`)
  if (DRY) continue
  const id = randomUUID()
  for (const [path, body] of [[`${id}.full.webp`, full], [`${id}.thumb.webp`, small]]) {
    const { error: upErr } = await bucket.upload(path, body, opts)
    if (upErr) throw upErr
  }
  map[url] = bucket.getPublicUrl(`${id}.full.webp`).data.publicUrl
  writeFileSync(mapFile, JSON.stringify(map, null, 1))
}
console.log(`total ${(before / 1048576).toFixed(1)} MB → ${(after / 1048576).toFixed(1)} MB`)
if (DRY) process.exit(0)

// point every reference at the new files
const swap = (u) => map[u] || u
for (const it of items) {
  const change = {}
  if (map[it.image_url]) change.image_url = swap(it.image_url)
  if (Array.isArray(it.images) && it.images.some((u) => map[u])) change.images = it.images.map(swap)
  if (!Object.keys(change).length) continue
  const { error: e } = await sb.from('catalog_items').update(change).eq('id', it.id)
  if (e) throw e
}
for (const s of settings) {
  if (!Object.values(s.value).some((u) => map[u])) continue
  const value = Object.fromEntries(Object.entries(s.value).map(([k, v]) => [k, swap(v)]))
  const { error: e } = await sb.from('site_settings').update({ value }).eq('key', s.key)
  if (e) throw e
}
console.log('references updated')
