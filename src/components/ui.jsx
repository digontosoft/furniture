import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useItems } from '../lib/api'

export function PageHeader({ title, subtitle }) {
  useEffect(() => { document.title = `${title} | Two G’s In A Pod` }, [title])
  return (
    <section className="bg-sand">
      <div className="mx-auto max-w-7xl px-5 py-14 text-center md:py-20">
        <h1 className="text-4xl font-semibold md:text-6xl">{title}</h1>
        {subtitle && <p className="mx-auto mt-4 max-w-2xl text-muted">{subtitle}</p>}
      </div>
    </section>
  )
}

/**
 * Per client notes: cabinetry door tiles stay square-cornered and uncropped —
 * no rounded corners, no "white border" box. `fit="cover"` is used for the
 * full-bleed door-style tiles; `fit="contain"` shows the whole tile with an
 * optional ring border (used on a stock collection's item grid).
 */
export function Tile({ item, onClick, to, fit = 'cover', bordered = false, aspect = 'aspect-square', priority, caption }) {
  // `aspect` should match the image's shape so `contain` leaves no visible frame.
  const box = bordered ? 'bg-white p-3 ring-1 ring-ink/10' : fit === 'contain' ? '' : 'bg-sand'
  const inner = (
    <>
      <div className={`${aspect} overflow-hidden ${box}`}>
        {item.image_url && (
          <img src={item.image_url} alt={item.name} loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : undefined} decoding="async"
            className={`h-full w-full transition duration-500 group-hover:scale-105 ${fit === 'contain' ? 'object-contain' : 'object-cover'}`} />
        )}
      </div>
      {caption !== false && <h3 className="mt-3 text-base font-semibold md:text-lg">{item.name}</h3>}
    </>
  )
  const cls = 'group block text-left'
  if (to) return <Link to={to} className={cls}>{inner}</Link>
  return <button type="button" onClick={onClick} className={`${cls} ${onClick ? 'cursor-zoom-in' : 'cursor-default'}`}>{inner}</button>
}

export function Grid({ children, cols = 4 }) {
  const map = { 3: 'sm:grid-cols-2 lg:grid-cols-3', 4: 'sm:grid-cols-3 lg:grid-cols-4' }
  return <div className={`grid grid-cols-2 gap-3 md:gap-5 ${map[cols] || map[4]}`}>{children}</div>
}

function Skeleton() {
  return (
    <Grid>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i}><div className="aspect-square animate-pulse bg-sand" /><div className="mt-3 h-5 w-2/3 animate-pulse rounded bg-sand" /></div>
      ))}
    </Grid>
  )
}

export function Lightbox({ item, onClose }) {
  useEffect(() => {
    if (!item) return
    const h = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [item, onClose])
  if (!item) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4" onClick={onClose}>
      <figure className="max-h-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
        <img src={item.image_url} alt={item.name} className="max-h-[85vh] bg-white object-contain" />
        {(item.name || item.description) && (
          <figcaption className="mt-3 text-center text-white">
            <p className="font-serif text-xl">{item.name}</p>
            {item.description && <p className="text-sm text-white/70">{item.description}</p>}
          </figcaption>
        )}
      </figure>
      <button className="absolute right-5 top-5 text-3xl text-white" aria-label="Close" onClick={onClose}>×</button>
    </div>
  )
}

/** Fetches a section and renders it as a square-tile grid with optional lightbox and category filter. */
export function ItemsGrid({ section, parentId, lightbox = true, fit = 'cover', bordered = false, aspect, showAllTab = true, emptyText = 'Coming soon.' }) {
  const { items, loading, error } = useItems(section, parentId)
  const [active, setActive] = useState(null)
  const cats = useMemo(() => [...new Set((items || []).map((i) => i.category).filter(Boolean))], [items])
  const [cat, setCat] = useState(showAllTab ? 'All' : null)
  useEffect(() => { if (!showAllTab && cats.length) setCat((c) => c ?? cats[0]) }, [showAllTab, cats])
  if (loading) return <Skeleton />
  if (error) return <p className="text-center text-red-700">Could not load content.</p>
  if (!items.length) return <p className="py-10 text-center text-muted">{emptyText}</p>
  const tabs = showAllTab ? ['All', ...cats] : cats
  const shown = !cat || cat === 'All' ? items : items.filter((it) => it.category === cat)
  return (
    <>
      {tabs.length > 1 && (
        <div className="mb-8 flex flex-wrap justify-center gap-2">
          {tabs.map((c) => (
            <button key={c} onClick={() => setCat(c)}
              className={`rounded-full border px-4 py-2 text-sm transition ${cat === c ? 'border-brand bg-brand text-white' : 'border-ink/20 hover:border-brand'}`}>{c}</button>
          ))}
        </div>
      )}
      <Grid>{shown.map((it, i) => <Tile key={it.id} item={it} fit={fit} bordered={bordered} aspect={aspect} priority={i < 8} onClick={lightbox && it.image_url ? () => setActive(it) : undefined} />)}</Grid>
      <Lightbox item={active} onClose={() => setActive(null)} />
    </>
  )
}

export function Section({ children, className = '' }) {
  return <section className={`mx-auto max-w-7xl px-5 py-12 md:py-16 ${className}`}>{children}</section>
}
