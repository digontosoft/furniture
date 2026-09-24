import { useEffect, useState } from 'react'
import { NavLink, Route, Routes, Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import ItemsManager from './ItemsManager'
import SettingsEditor from './SettingsEditor'
import Submissions from './Submissions'

function Login() {
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  async function onSubmit(e) {
    e.preventDefault()
    setBusy(true)
    const f = new FormData(e.currentTarget)
    const { error } = await supabase.auth.signInWithPassword({ email: f.get('email'), password: f.get('password') })
    setBusy(false)
    if (error) setErr(error.message)
  }
  return (
    <div className="grid min-h-screen place-items-center bg-sand p-5">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-8 shadow">
        <h1 className="text-3xl font-semibold">Admin Login</h1>
        <input name="email" type="email" placeholder="Email" required className="input" />
        <input name="password" type="password" placeholder="Password" required className="input" />
        {err && <p className="text-sm text-red-700">{err}</p>}
        <button className="btn w-full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </div>
  )
}

const MENU = [
  ['submissions', 'Requests & Messages'],
  ['stock', 'Stock — Door Styles'],
  ['stock-items', 'Stock — Items (all)'],
  ['door-profiles', 'Door Profiles'],
  ['paints', 'Paints'],
  ['stains', 'Stains'],
  ['countertops', 'Countertops'],
  ['flooring', 'Flooring'],
  ['gallery', 'Spaces Gallery'],
  ['settings', 'Site Content'],
]

export default function Admin() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  if (!supabase)
    return <div className="p-10 text-center">Supabase is not configured. Copy <b>.env.example</b> to <b>.env</b> and fill in your keys.</div>
  if (session === undefined) return null
  if (!session) return <Login />

  return (
    <div className="flex min-h-screen flex-col bg-cream md:flex-row">
      <aside className="shrink-0 bg-ink p-4 text-white md:w-60">
        <p className="mb-4 font-serif text-xl">Admin Panel</p>
        <nav className="flex gap-1 overflow-x-auto md:flex-col">
          {MENU.map(([to, label]) => (
            <NavLink key={to} to={to}
              className={({ isActive }) => `whitespace-nowrap rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-white/15' : 'text-white/70 hover:bg-white/10'}`}>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-4 flex gap-4 text-xs text-white/60">
          <a href="/" target="_blank" className="hover:text-white">View site ↗</a>
          <button onClick={() => supabase.auth.signOut()} className="hover:text-white">Sign out</button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-5 md:p-8">
        <Routes>
          <Route index element={<Navigate to="submissions" replace />} />
          <Route path="submissions" element={<Submissions />} />
          <Route path="stock" element={<ItemsManager key="stock" section="stock_collection" title="Stock Cabinetry — Door Styles & Colors" childSection="stock_item" />} />
          <Route path="stock-items" element={<ItemsManager key="stock_all" section="stock_item" title="Stock Cabinetry Items (shared by every collection)" />} />
          <Route path="stock/:parentId" element={<ItemsManager key="stock_item" section="stock_item" title="Collection Items" back="/admin/stock" />} />
          <Route path="door-profiles" element={<ItemsManager key="dp" section="door_profile" title="Custom — Door Profiles" />} />
          <Route path="paints" element={<ItemsManager key="pa" section="paint" title="Custom — Paints" />} />
          <Route path="stains" element={<ItemsManager key="st" section="stain" title="Custom — Stains" />} />
          <Route path="countertops" element={<ItemsManager key="ct" section="countertop" title="Countertop Slabs" />} />
          <Route path="flooring" element={<ItemsManager key="fl" section="flooring" title="Flooring Options" />} />
          <Route path="gallery" element={<ItemsManager key="ga" section="gallery" title="Spaces We've Created" noText />} />
          <Route path="settings" element={<SettingsEditor />} />
        </Routes>
      </main>
    </div>
  )
}
