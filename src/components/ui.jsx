import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useItems, useSettings } from '../lib/api'
import { PAGES, SECTIONS, tabsFor, inTab, thumb } from '../lib/catalog'

/** Coloured page header; `page` picks the colour and the admin-editable headline. */
export function PageHeader({ page, title, subtitle }) {
  const { pages } = useSettings()
  const p = PAGES[page] || {}
  const heading = (page && pages?.[`${page}_title`]) || title || p.title || ''
  const sub = page && pages?.[`${page}_subtitle`] !== undefined ? pages[`${page}_subtitle`] : subtitle ?? p.subtitle
  useEffect(() => { document.title = `${heading} | Two G’s In A Pod` }, [heading])
  return (
    <section style={{ backgroundColor: p.bg || '#D8C8B4' }} className={p.dark ? 'text-white' : 'text-ink'}>
      <div className="mx-auto max-w-7xl px-5 py-14 text-center md:py-20">
        <h1 className="text-4xl font-semibold md:text-6xl">{heading}</h1>
        {sub && <p className={`mx-auto mt-4 max-w-2xl text-lg ${p.dark ? 'text-white' : 'text-ink/90'}`}>{sub}</p>}
      </div>
    </section>
  )
}

/**
 * Per client notes: cabinetry door tiles stay square-cornered and uncropped —
 * no rounded corners, no "white border" box. `fit="cover"` is used for the
 * full-bleed tiles; `fit="contain"` shows the whole tile with an optional ring border.
 */
export function Tile({ item, onClick, to, fit = 'cover', bordered = false, aspect = 'aspect-square', priority, caption }) {
  // `aspect` should match the image's shape so `contain` leaves no visible frame.
  const box = bordered ? 'bg-white p-3 ring-1 ring-ink/10' : fit === 'contain' ? '' : 'bg-sand'
  const inner = (
    <>
      <div className={`${aspect} overflow-hidden ${box}`}>
        {item.image_url && (
          <img src={thumb(item.image_url)} alt={item.name} loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : undefined} decoding="async"
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

/** Category tabs for a section's items, using the admin-managed category list. */
export function useTabs(section, items) {
  const { categories } = useSettings()
  const list = categories?.[section]
  const tabs = useMemo(() => tabsFor(section, items, list), [section, items, list])
  const [picked, setPicked] = useState(null)
  const firstFilled = tabs.find((t) => (items || []).some((i) => inTab(section, list, t, i)))
  const active = tabs.includes(picked) ? picked : firstFilled ?? tabs[0] ?? null
  const shown = (items || []).filter((i) => inTab(section, list, active, i))
  return { tabs, active, setActive: setPicked, shown }
}

export function FilterTabs({ tabs, active, onChange, className = 'justify-center' }) {
  if (tabs.length < 2) return null
  return (
    <div role="tablist" className={`mb-8 flex flex-wrap gap-2 ${className}`}>
      {tabs.map((t) => (
        <button key={t} role="tab" aria-selected={active === t} onClick={() => onChange(t)}
          className={`rounded-full border px-4 py-2 text-sm transition ${active === t ? 'border-brand bg-brand text-white' : 'border-ink/20 hover:border-brand'}`}>{t}</button>
      ))}
    </div>
  )
}

/**
 * Fetches a section and renders it as a tile grid with category tabs.
 * Sections with their own detail page (countertops, flooring, backsplash) link there;
 * the rest open a lightbox.
 */
export function ItemsGrid({ section, parentId, fit = 'cover', bordered = false, aspect, emptyText = 'Coming soon.' }) {
  const { items, loading, error } = useItems(section, parentId)
  const { tabs, active, setActive, shown } = useTabs(section, items)
  const [zoomed, setZoomed] = useState(null)
  const conf = SECTIONS[section] || {}
  const link = conf.detail
  if (loading) return <Skeleton />
  if (error) return <p className="text-center text-red-700">Could not load content.</p>
  return (
    <>
      <FilterTabs tabs={tabs} active={active} onChange={setActive} />
      {!shown.length ? (
        <p className="py-10 text-center text-muted">{emptyText}</p>
      ) : (
        <Grid>
          {shown.map((it, i) => (
            <Tile key={it.id} item={it} fit={fit} bordered={bordered} aspect={aspect} priority={i < 8}
              to={link ? conf.path(it) : undefined}
              onClick={!link && it.image_url ? () => setZoomed(it) : undefined} />
          ))}
        </Grid>
      )}
      <Lightbox item={zoomed} onClose={() => setZoomed(null)} />
    </>
  )
}

/**
 * Main photo + a small scrolling strip of thumbnails to switch between photos.
 * With `aspect` the photo fills a fixed shape (e.g. a slab); otherwise it is shown whole.
 */
export function PhotoViewer({ photos, alt, aspect, height = 'h-[420px] md:h-[520px]', bordered }) {
  const [index, setIndex] = useState(0)
  const [zoom, setZoom] = useState(false)
  useEffect(() => setIndex(0), [photos.join('|')])
  if (!photos.length) return null
  const current = photos[Math.min(index, photos.length - 1)]
  return (
    <div>
      <button type="button" onClick={() => setZoom(true)} aria-label="Enlarge photo"
        className={`flex w-full cursor-zoom-in items-center justify-center overflow-hidden ${aspect || height}`}>
        <img src={current} alt={alt} decoding="async"
          className={aspect ? 'h-full w-full object-cover' : `max-h-full max-w-full ${bordered ? 'border border-ink/30' : ''}`} />
      </button>
      {photos.length > 1 && (
        <div className="mx-auto mt-4 flex w-fit max-w-full gap-2 overflow-x-auto pb-1">
          {photos.map((src, n) => (
            <button key={src + n} type="button" onClick={() => setIndex(n)} aria-label={`Show photo ${n + 1}`}
              className={`h-16 w-16 shrink-0 overflow-hidden border-2 md:h-20 md:w-20 ${n === index ? 'border-brand' : 'border-transparent opacity-70 hover:opacity-100'}`}>
              <img src={thumb(src)} alt="" loading="lazy" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
      <Lightbox item={zoom ? { image_url: current, name: alt } : null} onClose={() => setZoom(false)} />
    </div>
  )
}

/** Spec rows ([label, value]) in one of three looks: list (stock), cards (slab), table (flooring). */
export function SpecsList({ rows, variant = 'list', title }) {
  const list = (rows || []).filter(([k, v]) => k && v)
  if (!list.length) return null
  return (
    <div>
      {title && <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.15em] text-ink/80">{title}</h2>}
      {variant === 'cards' ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map(([k, v]) => (
            <div key={k} className="border border-ink/15 bg-white/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted">{k}</p>
              <p className="mt-1 whitespace-pre-line">{v}</p>
            </div>
          ))}
        </div>
      ) : variant === 'table' ? (
        <dl className="grid grid-cols-[auto_1fr] text-sm">
          {list.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="py-2 pr-5 text-right text-xs font-semibold uppercase tracking-wider text-ink/80">{k}</dt>
              <dd className="whitespace-pre-line border-l-2 border-brand/60 py-2 pl-5 uppercase text-ink/75">{v}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <dl className="space-y-2">
          {list.map(([k, v]) => (
            <div key={k} className="text-sm">
              <dt className="inline font-semibold">{k}: </dt>
              <dd className="inline">{v}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  )
}

const inline = (text) =>
  text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    /^\*\*[^*]+\*\*$/.test(part) ? <strong key={i} className="font-semibold text-ink">{part.slice(2, -2)}</strong> : part)

const BULLET = /^\s*[-•*]\s+/

/**
 * Admin-written long text (Terms, FAQ, …). Blank lines split paragraphs; a short line on its
 * own like "1. Our Services" or "## Heading" becomes a bold heading; **text** is bold;
 * lines starting with "- ", "* " or "• " become a bullet list.
 */
export function RichText({ text }) {
  const blocks = (text || '').split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean)
  return (
    <div className="space-y-4 text-ink/80">
      {blocks.map((b, i) => {
        if (!b.includes('\n') && (/^#{1,3}\s+/.test(b) || /^\d+\.\s+\S.{0,90}$/.test(b)))
          return <h2 key={i} className="pt-4 font-sans text-lg font-bold text-ink">{b.replace(/^#{1,3}\s+/, '')}</h2>
        // split the block into runs of plain lines and runs of bullet lines
        const runs = []
        for (const line of b.split('\n')) {
          const isBullet = BULLET.test(line)
          const last = runs[runs.length - 1]
          if (last && last.bullet === isBullet) last.lines.push(line)
          else runs.push({ bullet: isBullet, lines: [line] })
        }
        return (
          <div key={i} className="space-y-2">
            {runs.map((r, j) => r.bullet
              ? <ul key={j} className="list-disc space-y-1 pl-6">{r.lines.map((l, k) => <li key={k}>{inline(l.replace(BULLET, ''))}</li>)}</ul>
              : <p key={j} className="whitespace-pre-line">{inline(r.lines.join('\n'))}</p>)}
          </div>
        )
      })}
    </div>
  )
}

export function Section({ children, className = '' }) {
  return <section className={`mx-auto max-w-7xl px-5 py-12 md:py-16 ${className}`}>{children}</section>
}
