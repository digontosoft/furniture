import { useState } from 'react'
import { uploadImage } from '../lib/api'

export default function ImageField({ value, onChange }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  async function pick(e) {
    const file = e.target.files[0]
    if (!file) return
    setBusy(true); setErr('')
    try { onChange(await uploadImage(file)) } catch (x) { setErr(x.message) }
    setBusy(false)
  }
  return (
    <div className="flex items-center gap-3">
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-sand">
        {value && <img src={value} alt="" className="h-full w-full object-cover" />}
      </div>
      <div className="text-sm">
        <input type="file" accept="image/*" onChange={pick} disabled={busy} />
        {busy && <p className="text-muted">Uploading…</p>}
        {err && <p className="text-red-700">{err}</p>}
        {value && <button type="button" className="text-red-700 hover:underline" onClick={() => onChange('')}>Remove</button>}
      </div>
    </div>
  )
}
