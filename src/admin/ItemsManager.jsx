import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { clearCache, useSettings } from '../lib/api'
import { confOf, catField, catsOf, joinCats, thumb } from '../lib/catalog'
import { ImageField, ImagesField, SpecsEditor } from './fields'
import { selectAll } from './db'

const NO_CAT = '(No category)'

function explain(error) {
  const m = error?.message || String(error)
  if (/section_check/i.test(m)) return `${m}. New Custom Cabinetry tabs need one database change — run supabase/migration_3.sql in the Supabase SQL Editor.`
  if (/column/i.test(m)) return `${m}. Run supabase/migration_2.sql in the Supabase SQL Editor.`
  return m
}

// copy of an item for another door style (no id / created_at)
const copyOf = (it, parent_id) => ({
  section: it.section, parent_id, name: it.name, description: it.description || '', image_url: it.image_url || '',
  category: it.category || '', sku: it.sku || '', size: it.size || '', sort_order: it.sort_order ?? 0,
  published: it.published, specs: it.specs || [], images: it.images || [],
})

// run `fn` on the ids 100 at a time (a long id list would not fit in one request URL)
async function inChunks(ids, fn) {
  for (let i = 0; i < ids.length; i += 100) {
    const { error } = await fn(ids.slice(i, i + 100))
    if (error) throw error
  }
}

async function insertMany(rows) {
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await supabase.from('catalog_items').insert(rows.slice(i, i + 500))
    if (error) throw error
  }
}

/** Admin list for one catalogue section: tabs, drag to reorder, add / edit / hide / delete. */
export default function ItemsManager({ section, title, childSection, back }) {
  const { parentId } = useParams()
  const conf = confOf(section)
  const field = catField(section)
  const list = useSettings().categories?.[section] || []
  const isStockItems = section === 'stock_item'
  const [rows, setRows] = useState(null)
  const rowsRef = useRef([])
  const [tab, setTab] = useState('All')
  const [form, setForm] = useState(null)
  const [err, setErr] = useState('')
  const [status, setStatus] = useState('')
  const [drag, setDrag] = useState(null)
  const lastTarget = useRef(null)
  const [styles, setStyles] = useState([]) // stock door styles (for item copy / move)
  const [ownCounts, setOwnCounts] = useState({}) // door style id → its own item count
  const [picked, setPicked] = useState(() => new Set())
  const [bulk, setBulk] = useState(null) // 'copy' | 'move'

  const put = (next) => { rowsRef.current = next; setRows(next) }

  const load = useCallback(async () => {
    let q = supabase.from('catalog_items').select('*').eq('section', section)
    if (isStockItems) q = parentId ? q.eq('parent_id', parentId) : q.is('parent_id', null)
    const { data, error } = await q.order('sort_order').order('created_at')
    if (error) setErr(explain(error))
    put(data || [])
    setPicked(new Set())
    if (isStockItems) {
      const { data: s } = await supabase.from('catalog_items').select('id,name').eq('section', 'stock_collection').order('sort_order')
      setStyles(s || [])
    }
    if (childSection) {
      const kids = await selectAll((q) => q.eq('section', childSection).not('parent_id', 'is', null), 'parent_id').catch(() => [])
      const c = {}
      for (const k of kids) c[k.parent_id] = (c[k.parent_id] || 0) + 1
      setOwnCounts(c)
    }
  }, [section, parentId, isStockItems, childSection])

  useEffect(() => { load() }, [load])

  const inList = (r) => catsOf(section, r).some((c) => list.includes(c))
  const hasOrphans = list.length > 0 && (rows || []).some((r) => !inList(r))
  const tabs = list.length ? ['All', ...list, ...(hasOrphans ? [NO_CAT] : [])] : []
  const matches = (t, r) => (t === 'All' ? true : t === NO_CAT ? !inList(r) : catsOf(section, r).includes(t))
  const visible = (rows || []).filter((r) => !tabs.includes(tab) || matches(tab, r))
  const styleName = styles.find((s) => s.id === parentId)?.name

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
      if (bad) { setErr(explain(bad.error)); setStatus(''); return }
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
    if (isStockItems) Object.assign(payload, { sku: form.sku || '', size: form.size || '' })
    if (conf.gallery) payload.images = form.images || []
    if (conf.specs) payload.specs = (form.specs || []).map(([k, v]) => [k.trim(), v.trim()]).filter(([k]) => k)
    if (conf.rail) payload.featured = !!form.featured
    const { data: savedRow, error } = id
      ? await supabase.from('catalog_items').update(payload).eq('id', id).select('id').single()
      : await supabase.from('catalog_items').insert(payload).select('id').single()
    if (error) return setErr(explain(error))
    setForm(null)
    // a new door style starts with a copy of the Default Items, ready to edit (client request)
    if (!id && section === 'stock_collection') {
      setStatus('Adding the default items to the new door style…')
      try {
        const defaults = await selectAll((q) => q.eq('section', 'stock_item').is('parent_id', null))
        await insertMany(defaults.map((it) => copyOf(it, savedRow.id)))
        setStatus(`New door style added with ${defaults.length} default items ✓`)
      } catch (x) { setErr(`The door style was added, but copying the default items failed: ${explain(x)}. Open its Items page and use “Copy items here”.`); setStatus('') }
    }
    clearCache(); load()
  }

  async function patch(row, change) {
    const { error } = await supabase.from('catalog_items').update(change).eq('id', row.id)
    if (error) return setErr(explain(error))
    put(rowsRef.current.map((r) => (r.id === row.id ? { ...r, ...change } : r)))
    clearCache()
  }

  async function remove(row) {
    const kids = childSection ? ownCounts[row.id] || 0 : 0
    if (!confirm(`Delete "${row.name || 'this image'}"?${kids ? ` Its ${kids} items will be deleted too.` : ''}`)) return
    const { error } = await supabase.from('catalog_items').delete().eq('id', row.id)
    if (error) return setErr(explain(error))
    clearCache(); load()
  }

  // ---- stock items: bulk copy / move / delete -------------------------------------------
  const selected = (rows || []).filter((r) => picked.has(r.id))
  const toggle = (id) => setPicked((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })

  async function run(label, fn) {
    setErr(''); setStatus(label)
    try { await fn(); clearCache(); setStatus(`${label.replace(/…$/, '')} — done ✓`) } catch (x) { setErr(explain(x)); setStatus('') }
    setBulk(null); load()
  }
  const copyTo = (targets) => run(`Copying ${selected.length} items to ${targets.length} door style(s)…`,
    () => insertMany(targets.flatMap((pid) => selected.map((it) => copyOf(it, pid === 'shared' ? null : pid)))))
  const ids = () => selected.map((r) => r.id)
  const moveTo = (target) => run(`Moving ${selected.length} items…`, () =>
    inChunks(ids(), (chunk) => supabase.from('catalog_items').update({ parent_id: target === 'shared' ? null : target }).in('id', chunk)))
  const deleteSelected = () => confirm(`Delete ${selected.length} selected items?`) && run(`Deleting ${selected.length} items…`, () =>
    inChunks(ids(), (chunk) => supabase.from('catalog_items').delete().in('id', chunk)))
  async function copyFrom(source) {
    let data
    try {
      data = await selectAll((q) => (source === 'shared' ? q.eq('section', 'stock_item').is('parent_id', null) : q.eq('section', 'stock_item').eq('parent_id', source)))
    } catch (x) { return setErr(explain(x)) }
    if (!data.length) return setErr('That list has no items to copy.')
    run(`Copying ${data.length} items here…`, () => insertMany(data.sort((a, b) => a.sort_order - b.sort_order).map((it) => copyOf(it, parentId))))
  }

  const featuredCount = (rows || []).filter((r) => r.featured).length

  return (
    <div>
      {back && <Link to={back} className="text-sm text-brand hover:underline">← Back</Link>}
      <div className="mb-2 mt-1 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold">{parentId && styleName ? `${styleName} — Items` : title}</h1>
        <button className="btn" onClick={openNew}>+ Add</button>
      </div>
      <p className="mb-5 text-sm text-muted">
        Drag cards (or use ← →) to change the order on the website.
        {conf.rail && <> “On Home” items are the ones in the Home page scroll bar{featuredCount ? ` (${featuredCount} picked)` : ' — none picked, so the first 24 are shown'}.</>}
      </p>

      {isStockItems && !parentId && (
        <p className="mb-5 rounded-xl bg-white p-4 text-sm shadow-sm">
          This is the <b>default list</b>: every <b>new</b> door style starts with a copy of these items, which you can then edit.
          Changing this list does not change existing door styles — to add an item to them too, tick it and use
          <b> Copy to door styles</b>. Each door style’s own items are under Stock — Door Styles → Items.
        </p>
      )}
      {isStockItems && parentId && rows && (
        <div className="mb-5 rounded-xl bg-white p-4 text-sm shadow-sm">
          {rows.length
            ? <>The website shows these {rows.length} items for {styleName || 'this door style'}. Edit any item to change its photo or name here only.</>
            : <>This door style has no items of its own yet, so the website shows the <b>Default Items</b> list. Copy a list here to start from it:</>}
          <CopyFromPicker styles={styles.filter((s) => s.id !== parentId)} onCopy={copyFrom} compact={rows.length > 0} />
        </div>
      )}

      {err && <p className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">{err}</p>}

      {tabs.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`rounded-full border px-3 py-1.5 text-sm ${tab === t ? 'border-brand bg-brand text-white' : 'border-ink/20 bg-white hover:border-brand'} ${t === NO_CAT ? 'border-red-300 text-red-700' : ''}`}>
              {t} <span className="opacity-70">({(rows || []).filter((r) => matches(t, r)).length})</span>
            </button>
          ))}
        </div>
      )}

      {isStockItems && visible.length > 0 && (
        <div className="sticky top-0 z-10 mb-4 flex flex-wrap items-center gap-3 rounded-xl bg-cream/95 py-2 text-sm backdrop-blur">
          <button className="hover:underline" onClick={() => setPicked(new Set(visible.map((r) => r.id)))}>Select all in this tab</button>
          {picked.size > 0 && <>
            <button className="hover:underline" onClick={() => setPicked(new Set())}>Clear</button>
            <span className="font-medium">{picked.size} selected:</span>
            <button className="btn !px-4 !py-2" onClick={() => setBulk('copy')}>Copy to door styles…</button>
            <button className="btn-outline !px-4 !py-2" onClick={() => setBulk('move')}>Move to…</button>
            <button className="text-red-700 hover:underline" onClick={deleteSelected}>Delete selected</button>
          </>}
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
              className={`flex cursor-grab gap-3 rounded-xl bg-white p-3 shadow-sm active:cursor-grabbing ${r.published ? '' : 'opacity-50'} ${drag === r.id || picked.has(r.id) ? 'ring-2 ring-brand' : ''}`}>
              {isStockItems
                ? <input type="checkbox" checked={picked.has(r.id)} onChange={() => toggle(r.id)} aria-label={`Select ${r.name}`} className="self-center" />
                : <span className="select-none self-center text-ink/30" aria-hidden="true">⠿</span>}
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-sand">{r.image_url && <img src={thumb(r.image_url)} alt="" loading="lazy" draggable={false} className="h-full w-full object-contain" />}</div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{r.name || '(no caption)'}</p>
                <p className="text-xs text-muted">
                  {list.length > 0 && (inList(r) ? catsOf(section, r).filter((c) => list.includes(c)).join(', ') : <span className="text-red-700">{NO_CAT}</span>)}
                  {!r.published && ' · hidden'}
                  {r.featured && <span className="ml-1 rounded bg-brand/15 px-1.5 text-brand-dark">On Home</span>}
                </p>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                  {childSection && (
                    <Link className="font-medium text-brand hover:underline" to={`/admin/stock/${r.id}`}>
                      Items {ownCounts[r.id] ? `(${ownCounts[r.id]})` : '(using default list)'}
                    </Link>
                  )}
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

      {form && <ItemForm form={form} setForm={setForm} section={section} list={list} rows={rows || []} onSave={save} err={err} />}
      {bulk && (
        <TargetPicker
          multi={bulk === 'copy'} count={selected.length}
          options={[...(parentId ? [{ id: 'shared', name: 'Default Items list' }] : []), ...styles.filter((s) => s.id !== parentId)]}
          onCancel={() => setBulk(null)}
          onDone={(ids) => (bulk === 'copy' ? copyTo(ids) : moveTo(ids[0]))}
        />
      )}
    </div>
  )
}

/** "Copy items from: [list ▾] [Copy]" on a door style's Items page. */
function CopyFromPicker({ styles, onCopy, compact }) {
  const [source, setSource] = useState('shared')
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {compact && <span className="text-muted">Add more by copying from:</span>}
      <select className="input !w-auto !py-2" value={source} onChange={(e) => setSource(e.target.value)}>
        <option value="shared">Default Items list</option>
        {styles.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
      <button className="btn !px-4 !py-2" onClick={() => onCopy(source)}>Copy items here</button>
    </div>
  )
}

/** Pick one (move) or several (copy) door styles. */
function TargetPicker({ multi, count, options, onCancel, onDone }) {
  const [ids, setIds] = useState([])
  const flip = (id) => setIds(multi ? (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]) : [id])
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 md:p-10" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-2xl font-semibold">{multi ? `Copy ${count} items to…` : `Move ${count} items to…`}</h2>
        {multi && (
          <button type="button" className="text-sm text-brand hover:underline" onClick={() => setIds(ids.length === options.length ? [] : options.map((o) => o.id))}>
            {ids.length === options.length ? 'Untick all' : 'Tick all door styles'}
          </button>
        )}
        <div className="grid max-h-[50vh] gap-1 overflow-y-auto sm:grid-cols-2">
          {options.map((o) => (
            <label key={o.id} className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-sand/40">
              <input type={multi ? 'checkbox' : 'radio'} name="target" checked={ids.includes(o.id)} onChange={() => flip(o.id)} /> {o.name}
            </label>
          ))}
        </div>
        <div className="flex gap-3">
          <button className="btn" disabled={!ids.length} onClick={() => onDone(ids)}>{multi ? 'Copy' : 'Move'}</button>
          <button className="btn-outline" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

function ItemForm({ form, setForm, section, list, rows, onSave, err }) {
  const conf = confOf(section)
  const field = catField(section)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const isGallery = section === 'gallery'
  const cats = catsOf(section, form)
  const flipCat = (c) => setForm({ ...form, category: joinCats(cats.includes(c) ? cats.filter((x) => x !== c) : [...cats, c]) })
  const specSources = rows.filter((r) => r.id !== form.id && r.specs?.length)
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 md:p-10" onMouseDown={(e) => e.target === e.currentTarget && setForm(null)}>
      <form onSubmit={onSave} className="w-full max-w-2xl space-y-5 rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">{form.id ? 'Edit' : 'New'}</h2>
          <button type="button" onClick={() => setForm(null)} className="text-2xl text-ink/50" aria-label="Close">×</button>
        </div>

        <div><label className="label">{conf.gallery ? 'Main photo (tile)' : 'Photo'}</label><ImageField value={form.image_url} onChange={(v) => setForm({ ...form, image_url: v })} /></div>

        <div><label className="label">{isGallery ? 'Caption (optional)' : 'Name'}</label><input required={!isGallery} className="input" value={form.name} onChange={set('name')} /></div>

        {section === 'stock_collection' ? (
          <div>
            <label className="label">Door style tab</label>
            <select className="input" value={form[field] || ''} onChange={set(field)}>
              <option value="">Auto (guess from name)</option>
              {list.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
        ) : list.length > 0 && (
          <div>
            <label className="label">Category tabs <span className="font-normal text-muted">(tick one or more)</span></label>
            <div className="flex flex-wrap gap-x-5 gap-y-2 rounded-lg border border-ink/15 p-3">
              {[...list, ...cats.filter((c) => !list.includes(c))].map((c) => (
                <label key={c} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={cats.includes(c)} onChange={() => flipCat(c)} /> {c}
                  {!list.includes(c) && <span className="text-xs text-red-700">(no longer a tab)</span>}
                </label>
              ))}
            </div>
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
            {specSources.length > 0 && (
              <select className="input mb-3 !py-2 text-sm" value="" onChange={(e) => {
                const src = specSources.find((r) => r.id === e.target.value)
                if (src && (!form.specs?.some(([, v]) => v) || confirm(`Replace these specs with the ones from ${src.name}?`)))
                  setForm({ ...form, specs: src.specs.map((r) => [...r]) })
              }}>
                <option value="">Copy specs from…</option>
                {specSources.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            )}
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
