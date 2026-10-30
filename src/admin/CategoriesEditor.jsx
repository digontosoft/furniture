import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { clearCache, DEFAULT_SETTINGS } from '../lib/api'
import { DEFAULT_CATEGORIES, DEFAULT_CUSTOM_TABS, confOf, catField, catsOf, joinCats } from '../lib/catalog'

/**
 * Admin → Tabs & Categories
 *  - Custom Cabinetry main tabs (Door Profiles, Paints, … and any the client adds)
 *  - the filter tabs inside each section. Renaming a tab moves its items along with it;
 *    removing one leaves its items under "All".
 */
export default function CategoriesEditor() {
  const [saved, setSaved] = useState(null) // { section: [names] }
  const [custom, setCustom] = useState(null) // [{ key, label }]
  const [counts, setCounts] = useState({}) // { section: { name: n, '*': total } }

  async function load() {
    const [{ data: rows }, { data: items }] = await Promise.all([
      supabase.from('site_settings').select('key,value').in('key', ['categories', 'customTabs']),
      supabase.from('catalog_items').select('section,name,category,style'),
    ])
    const get = (k) => rows?.find((r) => r.key === k)?.value
    setSaved({ ...DEFAULT_SETTINGS.categories, ...(get('categories') || {}) })
    setCustom(get('customTabs')?.tabs?.length ? get('customTabs').tabs : DEFAULT_CUSTOM_TABS)
    const c = {}
    for (const it of items || []) {
      c[it.section] ??= { '*': 0 }
      c[it.section]['*']++
      for (const k of catsOf(it.section, it)) c[it.section][k] = (c[it.section][k] || 0) + 1
    }
    setCounts(c)
  }
  useEffect(() => { load() }, [])

  if (!saved || !custom) return <p>Loading…</p>
  const sections = [...new Set([...Object.keys(DEFAULT_CATEGORIES), ...custom.map((t) => t.key)])]
  const labelOf = (s) => custom.find((t) => t.key === s)?.label
  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-semibold">Tabs &amp; Categories</h1>
      <p className="mb-6 mt-2 text-sm text-muted">
        Add, rename, remove or reorder the tabs on the website. A section with no tabs shows all its items together.
        After adding a category tab, open an item and tick it in the item’s “Category tabs” box.
      </p>
      <CustomTabs initial={custom} counts={counts} onSaved={load} />
      {sections.map((s) => (
        <SectionTabs key={s} section={s} title={labelOf(s) ? `Custom — ${labelOf(s)}` : confOf(s).admin}
          initial={saved[s] || []} counts={counts[s] || {}} all={saved} onSaved={load} />
      ))}
    </div>
  )
}

const slug = (label) => label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')

/** The main tabs of the Custom Cabinetry page. */
function CustomTabs({ initial, counts, onSaved }) {
  const [rows, setRows] = useState(initial)
  const [msg, setMsg] = useState('')
  useEffect(() => setRows(initial), [initial])
  const move = (i, d) => { const n = [...rows]; [n[i], n[i + d]] = [n[i + d], n[i]]; setRows(n) }
  const del = (i) => {
    const n = counts[rows[i].key]?.['*'] || 0
    if (n && !confirm(`“${rows[i].label}” has ${n} item(s). Removing the tab hides them from the website (they are not deleted). Remove?`)) return
    setRows(rows.filter((_, j) => j !== i))
  }
  function add() {
    const label = prompt('Name of the new Custom Cabinetry tab:')?.trim()
    if (!label) return
    let key = `custom_${slug(label)}`
    while (rows.some((r) => r.key === key)) key += '_2'
    setRows([...rows, { key, label }])
  }
  async function save() {
    if (rows.some((r) => !r.label.trim())) return setMsg('Tab names cannot be empty.')
    const { error } = await supabase.from('site_settings').upsert({ key: 'customTabs', value: { tabs: rows.map((r) => ({ key: r.key, label: r.label.trim() })) } })
    if (error) return setMsg(error.message)
    clearCache(); setMsg('Saved ✓ — the new tab is in the admin menu under Custom Cabinetry.'); onSaved()
  }
  return (
    <section className="mb-6 space-y-3 rounded-2xl border-2 border-brand/30 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-semibold">Custom Cabinetry — main tabs</h2>
      {rows.map((r, i) => (
        <div key={r.key} className="flex items-center gap-2">
          <Arrows i={i} n={rows.length} move={move} />
          <input className="input" value={r.label} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
          <span className="w-20 shrink-0 text-right text-xs text-muted">{counts[r.key]?.['*'] || 0} items</span>
          <button type="button" onClick={() => del(i)} className="px-2 text-red-700" aria-label={`Remove ${r.label}`}>✕</button>
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-4">
        <button type="button" className="text-sm text-brand hover:underline" onClick={add}>+ Add main tab</button>
        <button type="button" className="btn ml-auto" onClick={save}>Save</button>
      </div>
      {msg && <p className="text-sm text-muted">{msg}</p>}
    </section>
  )
}

function Arrows({ i, n, move }) {
  return (
    <span className="flex flex-col text-xs leading-none">
      <button type="button" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up" className="disabled:opacity-30">▲</button>
      <button type="button" disabled={i === n - 1} onClick={() => move(i, 1)} aria-label="Move down" className="disabled:opacity-30">▼</button>
    </span>
  )
}

function SectionTabs({ section, title, initial, counts, all, onSaved }) {
  const [rows, setRows] = useState(() => initial.map((name) => ({ name, from: name })))
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => setRows(initial.map((name) => ({ name, from: name }))), [initial.join('|')])

  const set = (i, name) => setRows(rows.map((r, j) => (j === i ? { ...r, name } : r)))
  const move = (i, d) => { const n = [...rows]; [n[i], n[i + d]] = [n[i + d], n[i]]; setRows(n) }
  const del = (i) => {
    const n = counts[rows[i].from] || 0
    if (n && !confirm(`${n} item(s) are in “${rows[i].from}”. They will only show under “All” until you give them another tab. Remove anyway?`)) return
    setRows(rows.filter((_, j) => j !== i))
  }

  async function save() {
    const names = rows.map((r) => r.name.trim())
    if (names.some((n) => !n || n.includes('|'))) return setMsg('Tab names cannot be empty or contain “|”.')
    if (new Set(names).size !== names.length) return setMsg('Two tabs have the same name.')
    setBusy(true); setMsg('')
    const renames = rows.filter((r) => r.from && r.from !== r.name.trim()).map((r) => [r.from, r.name.trim()])
    if (renames.length) {
      const field = catField(section)
      const { data: items, error } = await supabase.from('catalog_items').select(`id,${field}`).eq('section', section)
      if (error) { setBusy(false); return setMsg(error.message) }
      const map = Object.fromEntries(renames)
      for (const it of items) {
        const before = field === 'style' ? [it.style || ''] : catsOf(section, it)
        if (!before.some((c) => map[c])) continue
        const after = before.map((c) => map[c] || c)
        const { error: e } = await supabase.from('catalog_items').update({ [field]: field === 'style' ? after[0] : joinCats(after) }).eq('id', it.id)
        if (e) { setBusy(false); return setMsg(e.message) }
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
      <h2 className="text-xl font-semibold">{title}</h2>
      {!rows.length && <p className="text-sm text-muted">No tabs — all items are shown together.</p>}
      {rows.map((r, i) => (
        <div key={i} className="flex items-center gap-2">
          <Arrows i={i} n={rows.length} move={move} />
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
