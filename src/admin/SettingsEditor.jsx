import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { DEFAULT_SETTINGS, clearCache } from '../lib/api'
import ImageField from './ImageField'

// key -> [group title, fields]; field = [name, label, type]
const GROUPS = {
  hero: ['Home — Hero banner', [['title', 'Headline', 'text'], ['subtitle', 'Sub-text', 'textarea'], ['image_url', 'Background image', 'image']]],
  philosophy: ['Home — Philosophy', [['text', 'Text', 'textarea']]],
  about: ['About Us', [['heading', 'Heading', 'text'], ['title', 'Professional title', 'text'], ['image_url', 'Photo', 'image'], ['body', 'Bio', 'textarea'], ['closing', 'Closing line (also used on the Home CTA)', 'text']]],
  contact: ['Contact info & footer', [['phone', 'Phone', 'text'], ['email', 'Public email', 'text'], ['address', 'Address', 'textarea'], ['hours', 'Business hours', 'textarea'], ['instagram', 'Instagram URL', 'text'], ['linkedin', 'LinkedIn URL', 'text']]],
  terms: ['Terms and Conditions', [['body', 'Content', 'textarea']]],
  measurementGuide: ['Measurement Guide', [['body', 'Content', 'textarea']]],
  shipping: ['Shipment & Delivery Information', [['body', 'Content', 'textarea']]],
  faq: ["FAQ's", [['body', 'Content', 'textarea']]],
}

function Group({ k, title, fields, initial }) {
  const [v, setV] = useState(initial)
  const [msg, setMsg] = useState('')
  async function save() {
    const { error } = await supabase.from('site_settings').upsert({ key: k, value: v })
    clearCache()
    setMsg(error ? error.message : 'Saved ✓')
  }
  return (
    <section className="mb-6 space-y-4 rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="text-2xl font-semibold">{title}</h2>
      {fields.map(([name, label, type]) => (
        <div key={name}>
          <label className="label">{label}</label>
          {type === 'image' ? <ImageField value={v[name]} onChange={(x) => setV({ ...v, [name]: x })} />
            : type === 'textarea' ? <textarea rows={name === 'body' ? 10 : 3} className="input" value={v[name] || ''} onChange={(e) => setV({ ...v, [name]: e.target.value })} />
            : <input className="input" value={v[name] || ''} onChange={(e) => setV({ ...v, [name]: e.target.value })} />}
        </div>
      ))}
      <div className="flex items-center gap-3"><button className="btn" onClick={save}>Save</button><span className="text-sm text-muted">{msg}</span></div>
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
      <h1 className="mb-6 text-3xl font-semibold">Site Content</h1>
      {Object.entries(GROUPS).map(([k, [title, fields]]) => <Group key={k} k={k} title={title} fields={fields} initial={data[k]} />)}
    </div>
  )
}
