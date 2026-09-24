import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useSettings } from '../lib/api'

export const NAV = [
  ['/', 'Home'],
  ['/stock-cabinetry', 'Stock Cabinetry'],
  ['/custom-cabinetry', 'Custom Cabinetry'],
  ['/countertops', 'Countertops'],
  ['/flooring', 'Flooring'],
  ['/spaces-weve-created', "Spaces We've Created"],
  ['/schedule', 'Schedule With Us'],
  ['/about', 'About Us'],
  ['/contact', 'Contact Us'],
]

export default function Layout() {
  const [open, setOpen] = useState(false)
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
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-4">
          <Link to="/" className="font-serif text-xl font-bold leading-tight">
            Two G’s In A Pod
            <span className="block text-[11px] font-sans font-normal uppercase tracking-[0.2em] text-muted">Design &amp; Interiors</span>
          </Link>
          <nav className="hidden items-center gap-5 xl:flex">
            {NAV.map(([to, label]) => (
              <NavLink key={to} to={to} end={to === '/'} className={link}>{label}</NavLink>
            ))}
          </nav>
          <button className="xl:hidden" aria-label="Menu" onClick={() => setOpen(!open)}>
            <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2"><path d={open ? 'M5 5l16 16M21 5L5 21' : 'M3 7h20M3 13h20M3 19h20'} /></svg>
          </button>
        </div>
        {open && (
          <nav className="flex flex-col gap-4 border-t border-ink/10 px-5 py-5 xl:hidden">
            {NAV.map(([to, label]) => (
              <NavLink key={to} to={to} end={to === '/'} className={link}>{label}</NavLink>
            ))}
          </nav>
        )}
      </header>

      <main className="flex-1"><Outlet /></main>

      <footer className="bg-ink text-white/80">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 md:grid-cols-3">
          <div>
            <p className="font-serif text-2xl text-white">Two G’s In A Pod</p>
            <p className="text-sm">Design &amp; Interiors</p>
          </div>
          <div className="space-y-1 text-sm">
            {contact.phone && <p>Phone: <a href={`tel:${contact.phone}`} className="hover:text-white">{contact.phone}</a></p>}
            {contact.email && <p>Email: <a href={`mailto:${contact.email}`} className="hover:text-white">{contact.email}</a></p>}
            {contact.hours && <p>{contact.hours}</p>}
            {contact.instagram && <p><a href={contact.instagram} target="_blank" rel="noreferrer" className="hover:text-white">Instagram</a></p>}
          </div>
          <div className="flex flex-col gap-1 text-sm md:items-end">
            <Link to="/schedule" className="hover:text-white">Schedule With Us</Link>
            <Link to="/contact" className="hover:text-white">Contact Us</Link>
            <Link to="/terms" className="hover:text-white">Terms and Conditions</Link>
          </div>
        </div>
        <p className="border-t border-white/10 py-4 text-center text-xs">© {new Date().getFullYear()} Two G’s In A Pod | Design &amp; Interiors</p>
      </footer>
    </div>
  )
}
