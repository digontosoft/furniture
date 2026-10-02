import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useSettings } from '../lib/api'

const NAV_LEFT = [
  ['/', 'Home'],
  ['/stock-cabinetry', 'Stock Cabinetry'],
  ['/custom-cabinetry', 'Custom Cabinetry'],
  ['/countertops', 'Countertops'],
  ['/flooring', 'Flooring'],
]
const NAV_RIGHT = [
  ['/spaces-weve-created', "Spaces We've Created"],
  ['/about', 'About Us'],
  ['/contact', 'Contact Us'],
]
// Full list, used by the mobile hamburger menu (per client notes).
export const NAV_MOBILE = [
  ...NAV_LEFT,
  ...NAV_RIGHT.slice(0, 1),
  ['/measurement-guide', 'Measurement Guide'],
  ['/shipping', 'Shipment & Delivery Information'],
  ...NAV_RIGHT.slice(1),
]

const SearchIcon = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="9" r="7" /><path d="M19 19l-5-5" /></svg>
)

function SearchForm({ onDone, autoFocus, className = '' }) {
  const [q, setQ] = useState('')
  const navigate = useNavigate()
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (!q.trim()) return
        navigate(`/search?q=${encodeURIComponent(q.trim())}`)
        setQ('')
        onDone?.()
      }}
      className={`flex items-center gap-2 rounded-full border border-ink/20 bg-white px-3 py-1.5 ${className}`}
    >
      <span className="text-ink/50"><SearchIcon /></span>
      <input autoFocus={autoFocus} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" aria-label="Search" className="w-full min-w-0 bg-transparent text-sm outline-none" />
      {onDone && <button type="button" aria-label="Close search" onClick={onDone} className="text-ink/50">×</button>}
    </form>
  )
}

function SearchBox({ open, setOpen }) {
  if (!open)
    return (
      <button aria-label="Search" onClick={() => setOpen(true)} className="text-ink/70 hover:text-brand"><SearchIcon /></button>
    )
  return <SearchForm autoFocus onDone={() => setOpen(false)} className="w-48" />
}

const InstagramIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>
)
const LinkedInIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.6c0-1.34-.03-3.06-1.86-3.06-1.87 0-2.15 1.46-2.15 2.96V21H9z" /></svg>
)

export default function Layout() {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState(false)
  const { pathname } = useLocation()
  const { contact } = useSettings()

  useEffect(() => {
    setOpen(false)
    window.scrollTo(0, 0)
  }, [pathname])

  const link = ({ isActive }) =>
    `whitespace-nowrap text-sm transition hover:text-brand ${isActive ? 'text-brand font-semibold' : 'text-ink/80'}`

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-ink/10 bg-cream/90 backdrop-blur">
        <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-5 py-4">
          <nav className="hidden items-center gap-5 xl:flex">
            {NAV_LEFT.map(([to, label]) => (
              <NavLink key={to} to={to} end={to === '/'} className={link}>{label}</NavLink>
            ))}
          </nav>

          <Link to="/" className="justify-self-center text-center font-serif text-xl font-semibold uppercase leading-tight tracking-[0.08em] md:text-2xl xl:justify-self-auto">
            Two G’s In A Pod
            <span className="block text-[11px] font-sans font-normal tracking-[0.2em] text-muted">Design &amp; Interiors</span>
          </Link>

          <div className="flex items-center justify-end gap-5">
            <nav className="hidden items-center gap-5 xl:flex">
              {NAV_RIGHT.map(([to, label]) => (
                <NavLink key={to} to={to} end={to === '/'} className={link}>{label}</NavLink>
              ))}
            </nav>
            <div className="hidden xl:block"><SearchBox open={search} setOpen={setSearch} /></div>
            <button className="xl:hidden" aria-label="Menu" onClick={() => setOpen(!open)}>
              <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2"><path d={open ? 'M5 5l16 16M21 5L5 21' : 'M3 7h20M3 13h20M3 19h20'} /></svg>
            </button>
          </div>
        </div>
        {open && (
          <nav className="flex flex-col gap-4 border-t border-ink/10 px-5 py-5 xl:hidden">
            <SearchForm onDone={() => setOpen(false)} />
            {NAV_MOBILE.map(([to, label]) => (
              <NavLink key={to} to={to} end={to === '/'} className={link}>{label}</NavLink>
            ))}
          </nav>
        )}
      </header>

      <main className="flex-1"><Outlet /></main>

      <footer className="bg-ink text-white/80">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 md:grid-cols-3">
          <div className="space-y-1">
            <p className="font-serif text-2xl text-white">Two G’s In A Pod</p>
            <p className="text-sm">Design &amp; Interiors</p>
            {contact.hours && <p className="pt-3 text-sm">{contact.hours}</p>}
            {contact.phone && <p className="text-sm"><a href={`tel:${contact.phone}`} className="hover:text-white">{contact.phone}</a></p>}
          </div>

          <div className="space-y-2 text-sm md:text-center">
            <p className="font-medium text-white">Connect with Us</p>
            <div className="flex gap-4 md:justify-center">
              {contact.instagram && <a href={contact.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="hover:text-white"><InstagramIcon /></a>}
              {contact.linkedin && <a href={contact.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn" className="hover:text-white"><LinkedInIcon /></a>}
            </div>
          </div>

          <div className="flex flex-col gap-1 text-sm md:items-end">
            <Link to="/contact" className="hover:text-white">Contact Us</Link>
            <Link to="/faq" className="hover:text-white">FAQ’s</Link>
            <Link to="/terms" className="hover:text-white">Terms and Conditions</Link>
          </div>
        </div>
        <p className="border-t border-white/10 py-4 text-center text-xs">© {new Date().getFullYear()} Two G’s In A Pod | Design &amp; Interiors</p>
      </footer>
    </div>
  )
}
