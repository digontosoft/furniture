import { useState } from 'react'
import { uploadImage, uploadFile } from '../lib/api'
import { thumb } from '../lib/catalog'

/** One image. Large photos are shrunk to WebP in the browser before upload. */
export function ImageField({ value, onChange }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  async function pick(e) {
    const file = e.target.files[0]
    e.target.value = ''
    if (!file) return
    setBusy(true); setErr('')
    try { onChange(await uploadImage(file)) } catch (x) { setErr(x.message) }
    setBusy(false)
  }
  return (
    <div className="flex items-center gap-3">
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-sand">
        {value && <img src={thumb(value)} alt="" className="h-full w-full object-contain" />}
      </div>
      <div className="space-y-1 text-sm">
        <input type="file" accept="image/*" onChange={pick} disabled={busy} />
        {busy && <p className="text-muted">Uploading…</p>}
        {err && <p className="text-red-700">{err}</p>}
        {value && <button type="button" className="text-red-700 hover:underline" onClick={() => onChange('')}>Remove</button>}
      </div>
    </div>
  )
}

/** Extra photos for the scroll gallery: add several at once, reorder with arrows, remove. */
export function ImagesField({ value, onChange }) {
  const list = Array.isArray(value) ? value : []
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')
  async function pick(e) {
    const files = [...e.target.files]
    e.target.value = ''
    setErr('')
    const added = []
    for (const [i, f] of files.entries()) {
      setBusy(`Uploading ${i + 1} of ${files.length}…`)
      try { added.push(await uploadImage(f)) } catch (x) { setErr(x.message) }
    }
    setBusy('')
    onChange([...list, ...added])
  }
  const move = (i, d) => {
    const next = [...list]
    ;[next[i], next[i + d]] = [next[i + d], next[i]]
    onChange(next)
  }
  return (
    <div>
      {list.length > 0 && (
        <ul className="mb-3 flex flex-wrap gap-3">
          {list.map((src, i) => (
            <li key={src + i} className="w-24 text-center text-xs">
              <img src={thumb(src)} alt="" className="h-24 w-24 rounded-lg bg-sand object-cover" />
              <div className="mt-1 flex justify-center gap-2">
                <button type="button" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move earlier" className="disabled:opacity-30">←</button>
                <button type="button" onClick={() => onChange(list.filter((_, j) => j !== i))} className="text-red-700" aria-label="Remove photo">✕</button>
                <button type="button" disabled={i === list.length - 1} onClick={() => move(i, 1)} aria-label="Move later" className="disabled:opacity-30">→</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <input type="file" accept="image/*" multiple onChange={pick} disabled={!!busy} className="text-sm" />
      {busy && <p className="text-sm text-muted">{busy}</p>}
      {err && <p className="text-sm text-red-700">{err}</p>}
    </div>
  )
}

/** Any downloadable file (e.g. the Measurement Guide PDF). */
export function FileField({ value, onChange, accept = 'application/pdf' }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  async function pick(e) {
    const file = e.target.files[0]
    e.target.value = ''
    if (!file) return
    setBusy(true); setErr('')
    try { onChange(await uploadFile(file)) } catch (x) { setErr(x.message) }
    setBusy(false)
  }
  return (
    <div className="space-y-1 text-sm">
      {value && <p><a href={value} target="_blank" rel="noreferrer" className="text-brand underline">{decodeURIComponent(value.split('/').pop())}</a></p>}
      <input type="file" accept={accept} onChange={pick} disabled={busy} />
      {busy && <p className="text-muted">Uploading…</p>}
      {err && <p className="text-red-700">{err}</p>}
      {value && <button type="button" className="text-red-700 hover:underline" onClick={() => onChange('')}>Remove file</button>}
    </div>
  )
}

/** Label / value rows. Rows with an empty value are not shown on the website. */
export function SpecsEditor({ value, onChange, template }) {
  const rows = Array.isArray(value) ? value : []
  const set = (i, j, v) => onChange(rows.map((r, k) => (k === i ? (j ? [r[0], v] : [v, r[1]]) : r)))
  const missing = (template || []).filter((t) => !rows.some((r) => r[0] === t))
  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <div key={i} className="flex gap-2">
          <input className="input !w-2/5" placeholder="Label (e.g. Size)" value={r[0]} onChange={(e) => set(i, 0, e.target.value)} />
          <input className="input" placeholder="Value" value={r[1]} onChange={(e) => set(i, 1, e.target.value)} />
          <button type="button" onClick={() => onChange(rows.filter((_, k) => k !== i))} className="px-2 text-red-700" aria-label="Remove row">✕</button>
        </div>
      ))}
      <div className="flex flex-wrap gap-4 text-sm">
        <button type="button" className="text-brand hover:underline" onClick={() => onChange([...rows, ['', '']])}>+ Add row</button>
        {missing.length > 0 && (
          <button type="button" className="text-brand hover:underline" onClick={() => onChange([...rows, ...missing.map((t) => [t, ''])])}>
            + Add usual rows ({missing.join(', ')})
          </button>
        )}
      </div>
    </div>
  )
}
