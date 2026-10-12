import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { clearCache, useSettings } from '../lib/api'
import { SECTIONS, catField, catOf, thumb } from '../lib/catalog'
import { ImageField, ImagesField, SpecsEditor } from './fields'

const NO_CAT = '(No category)'
const MIGRATION_HINT = 'The database needs the new columns — run supabase/migration_2.sql in the Supabase SQL Editor.'

/** Admin list for one catalogue section: tabs, drag to reorder, add / edit / hide / delete. */
export default function ItemsManager({ section, title, childSection, back }) {
  const { parentId } = useParams()
  const conf = SECTIONS[section] || {}
  const field = catField(section)
  const list = useSettings().categories?.[section] || []
  const [rows, setRows] = useState(null)
  const rowsRef = useRef([])
  const [tab, setTab] = useState('All')
  const [form, setForm] = useState(null)
  const [err, setErr] = useState('')
  const [status, setStatus] = useState('')
  const [drag, setDrag] = useState(null)
  const lastTarget = useRef(null)

  const put = (next) => { rowsRef.current = next; setRows(next) }

  const load = useCallback(async () => {
    let q = supabase.from('catalog_items').select('*').eq('section', section)
    if (parentId) q = q.eq('parent_id', parentId)
    const { data, error } = await q.order('sort_order').order('created_at')
    if (error) setErr(error.message)
    put(data || [])
  }, [section, parentId])

  useEffect(() => { load() }, [load])

  const hasOrphans = list.length > 0 && (rows || []).some((r) => !list.includes(catOf(section, r)))
  const tabs = list.length ? ['All', ...list, ...(hasOrphans ? [NO_CAT] : [])] : []
  const visible = (rows || []).filter((r) =>
    tab === 'All' || !tabs.includes(tab) ? true : tab === NO_CAT ? !list.includes(catOf(section, r)) : catOf(section, r) === tab)

  // ---- ordering -----------------------------------------------------------------------
  function reorder(dragId, targetId) {
    const prev = rowsRef.current
    const from = prev.findIndex((r) => r.id === dragId)
    const to = prev.findIndex((r) => r.id === targetId)
    if (from < 0 || to < 0 || from === to) return prev
    const next = [...prev]
    next.splice(to, 0, next.splice(from, 1)[0])
    put(next)
    return next
  }

  async function saveOrder(next) {
    const changed = next.map((r, i) => [r, i]).filter(([r, i]) => r.sort_order !== i)
    if (!changed.length) return
    put(next.map((r, i) => ({ ...r, sort_order: i })))
    setStatus('Saving order…')
    for (let i = 0; i < changed.length; i += 8) {
      const res = await Promise.all(changed.slice(i, i + 8).map(([r, n]) => supabase.from('catalog_items').update({ sort_order: n }).eq('id', r.id)))
      const bad = res.find((x) => x.error)
      if (bad) { setErr(bad.error.message); setStatus(''); return }
    }
    clearCache()
    setStatus('Order saved ✓')
  }

  const nudge = (r, d) => {
    const i = visible.findIndex((x) => x.id === r.id)
    const other = visible[i + d]
    if (other) saveOrder(reorder(r.id, other.id))
  }

  // ---- edit ---------------------------------------------------------------------------
  function openNew() {
    const max = Math.max(-1, ...(rows || []).map((r) => r.sort_order ?? 0))
    setForm({
      name: '', description: '', image_url: '', images: [], sku: '', size: '', featured: false, published: true,
      [field]: list.includes(tab) ? tab : '',
      specs: section === 'stock_collection' ? [] : (conf.specs || []).map((t) => [t, '']),
      sort_order: max + 1,
    })
  }

  async function save(e) {
    e.preventDefault()
    setErr('')
    const { id } = form
    const payload = {
      section, parent_id: parentId || null,
      name: form.name.trim(), description: form.description || '', image_url: form.image_url || '',
      [field]: form[field] || '', published: !!form.published, sort_order: form.sort_order ?? 0,
    }
    if (section === 'stock_item') Object.assign(payload, { sku: form.sku || '', size: form.size || '' })
    if (conf.gallery) payload.images = form.images || []
    if (conf.specs) payload.specs = (form.specs || []).map(([k, v]) => [k.trim(), v.trim()]).filter(([k]) => k)
    if (conf.rail) payload.featured = !!form.featured
    const { error } = id
      ? await supabase.from('catalog_items').update(payload).eq('id', id)
      : await supabase.from('catalog_items').insert(payload)
    if (error) return setErr(/column/i.test(error.message) ? `${error.message}. ${MIGRATION_HINT}` : error.message)
    clearCache(); setForm(null); load()
  }

  async function patch(row, change) {
    const { error } = await supabase.from('catalog_items').update(change).eq('id', row.id)
    if (error) return setErr(/column/i.test(error.message) ? MIGRATION_HINT : error.message)
    put(rowsRef.current.map((r) => (r.id === row.id ? { ...r, ...change } : r)))
    clearCache()
  }

  async function remove(row) {
    if (!confirm(`Delete "${row.name || 'this image'}"?${childSection ? ' Its items will be deleted too.' : ''}`)) return
    const { error } = await supabase.from('catalog_items').delete().eq('id', row.id)
    if (error) return setErr(error.message)
    clearCache(); load()
  }

  const featuredCount = (rows || []).filter((r) => r.featured).length

  return (
    <div>
      {back && <Link to={back} className="text-sm text-brand hover:underline">← Back</Link>}
      <div className="mb-2 mt-1 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold">{title}</h1>
        <button className="btn" onClick={openNew}>+ Add</button>
      </div>
      <p className="mb-5 text-sm text-muted">
        Drag cards (or use ← →) to change the order on the website.
        {conf.rail && <> “On Home” items are the ones in the Home page scroll bar{featuredCount ? ` (${featuredCount} picked)` : ' — none picked, so the first 24 are shown'}.</>}
      </p>
      {err && <p className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">{err}</p>}

      {tabs.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`rounded-full border px-3 py-1.5 text-sm ${tab === t ? 'border-brand bg-brand text-white' : 'border-ink/20 bg-white hover:border-brand'} ${t === NO_CAT ? 'border-red-300 text-red-700' : ''}`}>
              {t} <span className="opacity-70">({t === 'All' ? rows?.length ?? 0 : (rows || []).filter((r) => (t === NO_CAT ? !list.includes(catOf(section, r)) : catOf(section, r) === t)).length})</span>
            </button>
          ))}
        </div>
      )}
      {status && <p className="mb-3 text-sm text-brand">{status}</p>}

      {rows === null ? <p>Loading…</p> : !visible.length ? <p className="text-muted">Nothing here yet. Click “Add”.</p> : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((r, i) => (
            <li key={r.id} draggable
              onDragStart={(e) => { setDrag(r.id); lastTarget.current = null; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', r.id) }}
              onDragEnter={() => {
                if (!drag || r.id === drag) { lastTarget.current = null; return }
                if (lastTarget.current !== r.id) { lastTarget.current = r.id; reorder(drag, r.id) }
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => e.preventDefault()}
              onDragEnd={() => { setDrag(null); saveOrder(rowsRef.current) }}
              className={`flex cursor-grab gap-3 rounded-xl bg-white p-3 shadow-sm active:cursor-grabbing ${r.published ? '' : 'opacity-50'} ${drag === r.id ? 'ring-2 ring-brand' : ''}`}>
              <span className="select-none self-center text-ink/30" aria-hidden="true">⠿</span>
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-sand">{r.image_url && <img src={thumb(r.image_url)} alt="" loading="lazy" draggable={false} className="h-full w-full object-contain" />}</div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{r.name || '(no caption)'}</p>
                <p className="text-xs text-muted">
                  {list.length > 0 && (list.includes(catOf(section, r)) ? catOf(section, r) : <span className="text-red-700">{NO_CAT}</span>)}
                  {!r.published && ' · hidden'}
                  {r.featured && <span className="ml-1 rounded bg-brand/15 px-1.5 text-brand-dark">On Home</span>}
                </p>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                  {childSection && <Link className="font-medium text-brand hover:underline" to={`/admin/stock/${r.id}`}>Items</Link>}
                  <button className="hover:underline" onClick={() => setForm({ ...r, images: r.images || [], specs: r.specs || [] })}>Edit</button>
                  <button className="hover:underline" onClick={() => patch(r, { published: !r.published })}>{r.published ? 'Hide' : 'Show'}</button>
                  {conf.rail && <button className="hover:underline" onClick={() => patch(r, { featured: !r.featured })}>{r.featured ? 'Remove from Home' : 'Show on Home'}</button>}
                  <button className="text-red-700 hover:underline" onClick={() => remove(r)}>Delete</button>
                  <span className="ml-auto flex gap-2">
                    <button disabled={i === 0} onClick={() => nudge(r, -1)} aria-label="Move earlier" className="disabled:opacity-30">←</button>
                    <button disabled={i === visible.length - 1} onClick={() => nudge(r, 1)} aria-label="Move later" className="disabled:opacity-30">→</button>
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {form && <ItemForm form={form} setForm={setForm} section={section} list={list} onSave={save} err={err} />}
    </div>
  )
}

function ItemForm({ form, setForm, section, list, onSave, err }) {
  const conf = SECTIONS[section] || {}
  const field = catField(section)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const isGallery = section === 'gallery'
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 md:p-10" onMouseDown={(e) => e.target === e.currentTarget && setForm(null)}>
      <form onSubmit={onSave} className="w-full max-w-2xl space-y-5 rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">{form.id ? 'Edit' : 'New'}</h2>
          <button type="button" onClick={() => setForm(null)} className="text-2xl text-ink/50" aria-label="Close">×</button>
        </div>

        <div><label className="label">{conf.gallery ? 'Main photo (tile)' : 'Photo'}</label><ImageField value={form.image_url} onChange={(v) => setForm({ ...form, image_url: v })} /></div>

        <div><label className="label">{isGallery ? 'Caption (optional)' : 'Name'}</label><input required={!isGallery} className="input" value={form.name} onChange={set('name')} /></div>

        {(list.length > 0 || section === 'stock_collection') && (
          <div>
            <label className="label">{section === 'stock_collection' ? 'Door style tab' : 'Category tab'}</label>
            <select className="input" value={form[field] || ''} onChange={set(field)}>
              <option value="">{section === 'stock_collection' ? 'Auto (guess from name)' : '(No category)'}</option>
              {list.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
        )}

        {section === 'stock_item' && (
          <div className="grid gap-4 md:grid-cols-2">
            <div><label className="label">SKU</label><input className="input" value={form.sku || ''} onChange={set('sku')} /></div>
            <div><label className="label">Size</label><input className="input" value={form.size || ''} onChange={set('size')} /></div>
          </div>
        )}

        {!isGallery && (
          <div><label className="label">Description {section === 'countertop' && '(“About this stone”)'}</label><textarea rows="4" className="input" value={form.description || ''} onChange={set('description')} /></div>
        )}

        {conf.specs && (
          <div>
            <label className="label">Specs</label>
            {section === 'stock_collection' && <p className="mb-2 text-xs text-muted">Leave empty to use the standard Stock specs (Site Content → Stock Cabinetry specs).</p>}
            <SpecsEditor value={form.specs} onChange={(v) => setForm({ ...form, specs: v })} template={conf.specs} />
          </div>
        )}

        {conf.gallery && (
          <div>
            <label className="label">More photos (scroll gallery on the item page)</label>
            <ImagesField value={form.images} onChange={(v) => setForm({ ...form, images: v })} />
          </div>
        )}

        <div className="flex flex-wrap gap-6 text-sm">
          {conf.rail && <label className="flex items-center gap-2"><input type="checkbox" checked={!!form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} /> Show in the Home page scroll bar</label>}
          <label className="flex items-center gap-2"><input type="checkbox" checked={!!form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} /> Published</label>
        </div>

        {err && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{err}</p>}
        <div className="flex gap-3">
          <button className="btn">Save</button>
          <button type="button" className="btn-outline" onClick={() => setForm(null)}>Cancel</button>
        </div>
      </form>
    </div>
  )
}
