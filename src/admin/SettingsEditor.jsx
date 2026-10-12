import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { DEFAULT_SETTINGS, clearCache } from '../lib/api'
import { PAGES } from '../lib/catalog'
import { ImageField, FileField, SpecsEditor } from './fields'

const RICH_TIP = 'Tip: leave a blank line between paragraphs. A line on its own like “1. Our Services” (or starting with ##) becomes a bold heading; wrap words in **double stars** to make them bold; start lines with “- ” for a bullet list.'

// key -> [group title, fields]; field = [name, label, type]
const GROUPS = {
  hero: ['Home — Hero banner', [['title', 'Headline', 'text'], ['subtitle', 'Sub-text', 'textarea'], ['image_url', 'Background image', 'image']]],
  philosophy: ['Home — Our Philosophy', [['text', 'Text', 'textarea']]],
  pages: ['Page headlines (coloured banner at the top of each page)', Object.entries(PAGES).flatMap(([k, p]) => [
    [`${k}_title`, `${p.title} — headline`, 'text'],
    [`${k}_subtitle`, `${p.title} — sub-text (leave empty for none)`, 'textarea'],
  ])],
  stockSpecs: ['Stock Cabinetry — standard specs', [['rows', 'Shown on the Stock page and every door style (unless the door style has its own specs)', 'specs']]],
  about: ['About Us', [['heading', 'Heading', 'text'], ['title', 'Professional title', 'text'], ['image_url', 'Photo', 'image'], ['body', 'Bio', 'textarea'], ['closing', 'Closing line (also used on the Home page)', 'text']]],
  contact: ['Contact info & footer', [['phone', 'Phone', 'text'], ['email', 'Public email', 'text'], ['address', 'Address', 'textarea'], ['hours', 'Business hours (each line shows on its own line)', 'textarea'], ['instagram', 'Instagram URL', 'text'], ['linkedin', 'LinkedIn URL', 'text']]],
  measurementGuide: ['Measurement Guide', [['pdf_url', 'Printable PDF (customers get a “Download” button)', 'file'], ['body', 'Page text', 'rich']]],
  shipping: ['Shipment & Delivery Information', [['body', 'Content', 'rich']]],
  faq: ["FAQ's", [['body', 'Content', 'rich']]],
  terms: ['Terms and Conditions', [['body', 'Content', 'rich']]],
}

function Group({ k, title, fields, initial }) {
  const [v, setV] = useState(initial)
  const [msg, setMsg] = useState('')
  const [open, setOpen] = useState(false)
  async function save() {
    const { error } = await supabase.from('site_settings').upsert({ key: k, value: v })
    clearCache()
    setMsg(error ? error.message : 'Saved ✓')
  }
  const field = (name, type) => {
    const change = (x) => { setV({ ...v, [name]: x }); setMsg('') }
    if (type === 'image') return <ImageField value={v[name]} onChange={change} />
    if (type === 'file') return <FileField value={v[name]} onChange={change} />
    if (type === 'specs') return <SpecsEditor value={v[name]} onChange={change} />
    if (type === 'textarea' || type === 'rich')
      return <textarea rows={type === 'rich' || name === 'body' ? 12 : 3} className="input" value={v[name] || ''} onChange={(e) => change(e.target.value)} />
    return <input className="input" value={v[name] || ''} onChange={(e) => change(e.target.value)} />
  }
  return (
    <section className="mb-4 rounded-2xl bg-white shadow-sm">
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between p-5 text-left">
        <h2 className="text-xl font-semibold">{title}</h2>
        <span className="text-ink/50">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="space-y-4 px-5 pb-5">
          {fields.map(([name, label, type]) => (
            <div key={name}>
              <label className="label">{label}</label>
              {field(name, type)}
              {type === 'rich' && <p className="mt-1 text-xs text-muted">{RICH_TIP}</p>}
            </div>
          ))}
          <div className="flex items-center gap-3"><button className="btn" onClick={save}>Save</button><span className="text-sm text-muted">{msg}</span></div>
        </div>
      )}
    </section>
  )
}

export default function SettingsEditor() {
  const [data, setData] = useState(null)
  useEffect(() => {
    supabase.from('site_settings').select('*').then(({ data: rows }) => {
      const m = {}
      for (const k in GROUPS) m[k] = { ...DEFAULT_SETTINGS[k], ...(rows?.find((r) => r.key === k)?.value || {}) }
      setData(m)
    })
  }, [])
  if (!data) return <p>Loading…</p>
  return (
    <div className="max-w-3xl">
      <h1 className="mb-2 text-3xl font-semibold">Site Content</h1>
      <p className="mb-6 text-sm text-muted">Click a section to open it. Changes show on the website as soon as you save.</p>
      {Object.entries(GROUPS).map(([k, [title, fields]]) => <Group key={k} k={k} title={title} fields={fields} initial={data[k]} />)}
    </div>
  )
}
