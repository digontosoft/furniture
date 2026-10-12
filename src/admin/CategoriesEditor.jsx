import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { clearCache, DEFAULT_SETTINGS } from '../lib/api'
import { SECTIONS, DEFAULT_CATEGORIES, catField, catOf } from '../lib/catalog'

const EDITABLE = Object.keys(DEFAULT_CATEGORIES)

/**
 * The tabs shown on each catalogue page. Renaming a tab moves its items along with it;
 * removing one leaves its items without a tab (they show under "All"/"Other").
 */
export default function CategoriesEditor() {
  const [saved, setSaved] = useState(null) // { section: [names] } as stored
  const [counts, setCounts] = useState({}) // { section: { name: n } }

  async function load() {
    const [{ data: row }, { data: items }] = await Promise.all([
      supabase.from('site_settings').select('value').eq('key', 'categories').maybeSingle(),
      supabase.from('catalog_items').select('section,name,category,style'),
    ])
    setSaved({ ...DEFAULT_SETTINGS.categories, ...(row?.value || {}) })
    const c = {}
    for (const it of items || []) {
      const k = catOf(it.section, it)
      c[it.section] ??= {}
      c[it.section][k] = (c[it.section][k] || 0) + 1
    }
    setCounts(c)
  }
  useEffect(() => { load() }, [])

  if (!saved) return <p>Loading…</p>
  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-semibold">Categories (tabs)</h1>
      <p className="mb-6 mt-2 text-sm text-muted">
        These are the filter tabs on each page, in this order. A section with no tabs shows all its items together.
        After adding a tab, open an item and pick the tab in its “Category” box.
      </p>
      {EDITABLE.map((s) => (
        <SectionTabs key={s} section={s} initial={saved[s] || []} counts={counts[s] || {}} all={saved} onSaved={load} />
      ))}
    </div>
  )
}

function SectionTabs({ section, initial, counts, all, onSaved }) {
  const [rows, setRows] = useState(() => initial.map((name) => ({ name, from: name })))
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => setRows(initial.map((name) => ({ name, from: name }))), [initial.join('|')])

  const set = (i, name) => setRows(rows.map((r, j) => (j === i ? { ...r, name } : r)))
  const move = (i, d) => { const n = [...rows]; [n[i], n[i + d]] = [n[i + d], n[i]]; setRows(n) }
  const del = (i) => {
    const n = counts[rows[i].from] || 0
    if (n && !confirm(`${n} item(s) are in “${rows[i].from}”. They will have no tab until you move them. Remove anyway?`)) return
    setRows(rows.filter((_, j) => j !== i))
  }

  async function save() {
    const names = rows.map((r) => r.name.trim())
    if (names.some((n) => !n)) return setMsg('Tab names cannot be empty.')
    if (new Set(names).size !== names.length) return setMsg('Two tabs have the same name.')
    setBusy(true); setMsg('')
    const field = catField(section)
    for (const r of rows) {
      if (r.from && r.from !== r.name.trim()) {
        const { error } = await supabase.from('catalog_items').update({ [field]: r.name.trim() }).eq('section', section).eq(field, r.from)
        if (error) { setBusy(false); return setMsg(error.message) }
      }
    }
    const { error } = await supabase.from('site_settings').upsert({ key: 'categories', value: { ...all, [section]: names } })
    setBusy(false)
    if (error) return setMsg(error.message)
    clearCache()
    setMsg('Saved ✓')
    onSaved()
  }

  return (
    <section className="mb-6 space-y-3 rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="text-xl font-semibold">{SECTIONS[section].admin}</h2>
      {!rows.length && <p className="text-sm text-muted">No tabs — all items are shown together.</p>}
      {rows.map((r, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="flex flex-col text-xs leading-none">
            <button type="button" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up" className="disabled:opacity-30">▲</button>
            <button type="button" disabled={i === rows.length - 1} onClick={() => move(i, 1)} aria-label="Move down" className="disabled:opacity-30">▼</button>
          </span>
          <input className="input" value={r.name} onChange={(e) => set(i, e.target.value)} />
          <span className="w-20 shrink-0 text-right text-xs text-muted">{counts[r.from] || 0} items</span>
          <button type="button" onClick={() => del(i)} className="px-2 text-red-700" aria-label={`Remove ${r.name}`}>✕</button>
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-4">
        <button type="button" className="text-sm text-brand hover:underline" onClick={() => setRows([...rows, { name: '', from: null }])}>+ Add tab</button>
        <button type="button" className="btn ml-auto" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save'}</button>
      </div>
      {msg && <p className="text-sm text-muted">{msg}</p>}
    </section>
  )
}
