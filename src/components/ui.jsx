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

export function Tile({ item, onClick, to, portrait, priority }) {
  const inner = (
    <>
      <div className={`overflow-hidden rounded-xl ${portrait ? 'aspect-[3/4] bg-white p-3 ring-1 ring-ink/5' : 'aspect-square bg-sand'}`}>
        {item.image_url && (
          <img src={item.image_url} alt={item.name} loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : undefined} decoding="async"
            className={`h-full w-full transition duration-500 group-hover:scale-105 ${portrait ? 'object-contain' : 'object-cover'}`} />
        )}
      </div>
      <h3 className="mt-3 text-xl font-semibold">{item.name}</h3>
      {item.description && <p className="text-sm text-muted">{item.description}</p>}
    </>
  )
  const cls = 'group block text-left'
  if (to) return <Link to={to} className={cls}>{inner}</Link>
  return <button type="button" onClick={onClick} className={`${cls} ${onClick ? 'cursor-zoom-in' : 'cursor-default'}`}>{inner}</button>
}

export function Grid({ children }) {
  return <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">{children}</div>
}

function Skeleton() {
  return (
    <Grid>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i}><div className="aspect-square animate-pulse rounded-xl bg-sand" /><div className="mt-3 h-5 w-2/3 animate-pulse rounded bg-sand" /></div>
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
        <img src={item.image_url} alt={item.name} className="max-h-[85vh] rounded-lg bg-white object-contain" />
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

/** Fetches a section and renders it as a tile grid with optional lightbox. */
export function ItemsGrid({ section, parentId, lightbox = true, portrait, emptyText = 'Coming soon.' }) {
  const { items, loading, error } = useItems(section, parentId)
  const [active, setActive] = useState(null)
  const [cat, setCat] = useState('All')
  const cats = useMemo(() => ['All', ...new Set((items || []).map((i) => i.category).filter(Boolean))], [items])
  if (loading) return <Skeleton />
  if (error) return <p className="text-center text-red-700">Could not load content.</p>
  if (!items.length) return <p className="py-10 text-center text-muted">{emptyText}</p>
  return (
    <>
      {cats.length > 2 && (
        <div className="mb-8 flex flex-wrap justify-center gap-2">
          {cats.map((c) => (
            <button key={c} onClick={() => setCat(c)}
              className={`rounded-full border px-4 py-2 text-sm transition ${cat === c ? 'border-brand bg-brand text-white' : 'border-ink/20 hover:border-brand'}`}>{c}</button>
          ))}
        </div>
      )}
      <Grid>{items.filter((it) => cat === 'All' || it.category === cat).map((it, i) => <Tile key={it.id} item={it} portrait={portrait} priority={i < 8} onClick={lightbox && it.image_url ? () => setActive(it) : undefined} />)}</Grid>
      <Lightbox item={active} onClose={() => setActive(null)} />
    </>
  )
}

export function Section({ children, className = '' }) {
  return <section className={`mx-auto max-w-7xl px-5 py-12 md:py-16 ${className}`}>{children}</section>
}
