import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Submissions() {
  const [rows, setRows] = useState(null)
  const load = () => supabase.from('submissions').select('*').order('created_at', { ascending: false }).then(({ data }) => setRows(data || []))
  useEffect(() => { load() }, [])

  async function toggle(r) {
    await supabase.from('submissions').update({ status: r.status === 'new' ? 'handled' : 'new' }).eq('id', r.id)
    load()
  }
  async function remove(r) {
    if (!confirm('Delete this entry?')) return
    await supabase.from('submissions').delete().eq('id', r.id)
    load()
  }

  return (
    <div className="max-w-4xl">
      <h1 className="mb-6 text-3xl font-semibold">Requests &amp; Messages</h1>
      {rows === null ? <p>Loading…</p> : !rows.length ? <p className="text-muted">No submissions yet.</p> : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.id} className={`rounded-xl bg-white p-4 shadow-sm ${r.status === 'handled' ? 'opacity-60' : ''}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">
                  <span className={`mr-2 rounded-full px-2 py-0.5 text-xs ${r.kind === 'schedule' ? 'bg-brand text-white' : 'bg-sand'}`}>{r.kind === 'schedule' ? 'Consultation' : 'Message'}</span>
                  {r.name}
                </p>
                <p className="text-xs text-muted">{new Date(r.created_at).toLocaleString()}</p>
              </div>
              <p className="mt-1 text-sm"><a className="text-brand" href={`mailto:${r.email}`}>{r.email}</a>{r.phone && <> · <a href={`tel:${r.phone}`}>{r.phone}</a></>}</p>
              {r.service_type && <p className="text-sm">Service: {r.service_type}</p>}
              {r.preferred_datetime && <p className="text-sm">Preferred: {new Date(r.preferred_datetime).toLocaleString()}</p>}
              {r.subject && <p className="text-sm">Subject: {r.subject}</p>}
              {r.message && <p className="mt-2 whitespace-pre-line text-sm text-muted">{r.message}</p>}
              <div className="mt-3 flex gap-4 text-xs">
                <button className="hover:underline" onClick={() => toggle(r)}>{r.status === 'new' ? 'Mark handled' : 'Mark as new'}</button>
                <button className="text-red-700 hover:underline" onClick={() => remove(r)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
