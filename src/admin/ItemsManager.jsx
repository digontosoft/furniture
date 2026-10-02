import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { clearCache, STYLE_GROUPS } from '../lib/api'
import ImageField from './ImageField'

const EMPTY = { name: '', description: '', image_url: '', category: '', sku: '', size: '', style: '', sort_order: 0, published: true }

export default function ItemsManager({ section, title, childSection, back, noText }) {
  const { parentId } = useParams()
  const [rows, setRows] = useState(null)
  const [form, setForm] = useState(null) // item being edited/created
  const [err, setErr] = useState('')

  const load = useCallback(async () => {
    let q = supabase.from('catalog_items').select('*').eq('section', section)
    if (parentId) q = q.eq('parent_id', parentId)
    const { data, error } = await q.order('sort_order').order('created_at')
    if (error) setErr(error.message)
    setRows(data || [])
  }, [section, parentId])

  useEffect(() => { load() }, [load])

  async function save(e) {
    e.preventDefault()
    setErr('')
    const { id, created_at, ...payload } = form
    payload.section = section
    payload.parent_id = parentId || null
    payload.sort_order = Number(payload.sort_order) || 0
    const { error } = id
      ? await supabase.from('catalog_items').update(payload).eq('id', id)
      : await supabase.from('catalog_items').insert(payload)
    if (error) return setErr(error.message)
    clearCache(); setForm(null); load()
  }

  async function remove(row) {
    if (!confirm(`Delete "${row.name || 'this image'}"?${childSection ? ' Its items will be deleted too.' : ''}`)) return
    const { error } = await supabase.from('catalog_items').delete().eq('id', row.id)
    if (error) return setErr(error.message)
    clearCache(); load()
  }

  async function togglePublished(row) {
    await supabase.from('catalog_items').update({ published: !row.published }).eq('id', row.id)
    clearCache(); load()
  }

  return (
    <div>
      {back && <Link to={back} className="text-sm text-brand hover:underline">← Back</Link>}
      <div className="mb-6 mt-1 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold">{title}</h1>
        <button className="btn" onClick={() => setForm({ ...EMPTY, sort_order: (rows?.length || 0) + 1 })}>+ Add</button>
      </div>
      {err && <p className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">{err}</p>}

      {form && (
        <form onSubmit={save} className="mb-8 space-y-4 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold">{form.id ? 'Edit' : 'New'}</h2>
          <ImageField value={form.image_url} onChange={(v) => setForm({ ...form, image_url: v })} />
          {!noText && (
            <>
              <div><label className="label">Name</label><input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><label className="label">Short description (optional)</label><input className="input" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            </>
          )}
          {section === 'stock_collection' && (
            <div>
              <label className="label">Door style group</label>
              <select className="input" value={form.style || ''} onChange={(e) => setForm({ ...form, style: e.target.value })}>
                <option value="">Auto (guess from name)</option>
                {STYLE_GROUPS.map((g) => <option key={g}>{g}</option>)}
              </select>
            </div>
          )}
          {section === 'stock_item' && (
            <div className="grid gap-4 md:grid-cols-3">
              <div><label className="label">Category (e.g. Base Cabinets)</label><input className="input" value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
              <div><label className="label">SKU</label><input className="input" value={form.sku || ''} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></div>
              <div><label className="label">Size</label><input className="input" value={form.size || ''} onChange={(e) => setForm({ ...form, size: e.target.value })} /></div>
            </div>
          )}
          {noText && (
            <div><label className="label">Caption (optional)</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          )}
          <div className="flex flex-wrap items-center gap-6">
            <div><label className="label">Order</label><input type="number" className="input !w-24" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} /></div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} /> Published</label>
          </div>
          <div className="flex gap-3">
            <button className="btn">Save</button>
            <button type="button" className="btn-outline" onClick={() => setForm(null)}>Cancel</button>
          </div>
        </form>
      )}

      {rows === null ? <p>Loading…</p> : !rows.length ? <p className="text-muted">Nothing here yet. Click “Add”.</p> : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((r) => (
            <li key={r.id} className={`flex gap-3 rounded-xl bg-white p-3 shadow-sm ${r.published ? '' : 'opacity-50'}`}>
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-sand">{r.image_url && <img src={r.image_url} alt="" loading="lazy" className="h-full w-full object-cover" />}</div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{r.name || '(no caption)'}</p>
                <p className="text-xs text-muted">Order {r.sort_order}{r.published ? '' : ' · hidden'}</p>
                <div className="mt-2 flex flex-wrap gap-3 text-xs">
                  {childSection && <Link className="font-medium text-brand hover:underline" to={`/admin/stock/${r.id}`}>Items</Link>}
                  <button className="hover:underline" onClick={() => setForm(r)}>Edit</button>
                  <button className="hover:underline" onClick={() => togglePublished(r)}>{r.published ? 'Hide' : 'Show'}</button>
                  <button className="text-red-700 hover:underline" onClick={() => remove(r)}>Delete</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
