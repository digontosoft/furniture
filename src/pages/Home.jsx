import { Link } from 'react-router-dom'
import { useItems, useSettings } from '../lib/api'

function Photo({ src, alt = '', className = '' }) {
  return src ? <img src={src} alt={alt} loading="lazy" decoding="async" className={`h-full w-full object-cover ${className}`} /> : <div className="h-full w-full bg-sand" />
}

/** Horizontal scrolling strip of door tiles (client notes: "Scroll Bars like on gginapod.com"). */
function DoorRail({ title, to, items, aspect, width }) {
  if (!items?.length) return null
  // Rendered twice for a seamless loop; the second copy is hidden from screen readers.
  const tile = (it, copy) => (
    <div key={`${copy}-${it.id}`} className={`${width} shrink-0 pr-3 md:pr-4`} aria-hidden={copy ? true : undefined}>
      <div className={`${aspect} overflow-hidden`}>
        {it.image_url && <img src={it.image_url} alt={copy ? '' : it.name} loading="lazy" decoding="async" className="h-full w-full object-contain" />}
      </div>
      <p className="mt-2 truncate text-sm font-medium">{it.name}</p>
    </div>
  )
  return (
    <div>
      <Link to={to} className="mb-6 block text-center font-serif text-3xl font-semibold uppercase tracking-[0.12em] hover:text-brand md:text-4xl">{title}</Link>
      <div className="marquee-wrap">
        <div className="marquee" style={{ '--marquee-duration': `${items.length * 4}s` }}>
          {items.map((it) => tile(it, 0))}
          {items.map((it) => tile(it, 1))}
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const { hero, philosophy, about } = useSettings()
  const { items: stockCols } = useItems('stock_collection')
  const { items: doorProfiles } = useItems('door_profile')
  const { items: gallery } = useItems('gallery')

  return (
    <>
      {/* HERO */}
      <section className="relative isolate flex min-h-[88vh] items-center overflow-hidden bg-brand-dark text-white">
        {hero.image_url && <img src={hero.image_url} alt="" fetchPriority="high" className="absolute inset-0 -z-10 h-full w-full object-cover" />}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/70 via-black/40 to-black/10" />
        <div className="mx-auto w-full max-w-7xl px-5 py-24">
          <h1 className="max-w-3xl text-5xl font-semibold leading-[1.05] md:text-7xl">{hero.title}</h1>
          <hr className="my-6 w-24 border-white/40" />
          <p className="max-w-xl text-lg text-white/85">{hero.subtitle}</p>
          <Link to="/contact" className="btn mt-9 !bg-white !px-8 !py-4 !text-ink hover:!bg-sand">Let’s Talk</Link>
        </div>
      </section>

      {/* PHILOSOPHY */}
      <section className="mx-auto max-w-7xl px-5 py-16 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-brand">Our Philosophy</p>
          <p className="mt-5 text-lg text-muted md:text-xl">{philosophy.text}</p>
        </div>
      </section>

      {/* CABINETRY — scrolling door tiles */}
      <section className="bg-sand">
        <div className="mx-auto max-w-7xl space-y-12 px-5 py-16 md:py-20">
          <DoorRail title="Stock Cabinetry" to="/stock-cabinetry" items={stockCols} aspect="aspect-[52/100]" width="w-36 md:w-48" />
          <DoorRail title="Custom Cabinetry" to="/custom-cabinetry" items={doorProfiles?.slice(0, 16)} aspect="aspect-[4/5]" width="w-44 md:w-60" />
        </div>
      </section>

      {/* PORTFOLIO */}
      <section className="mx-auto max-w-7xl px-5 py-16 md:py-24">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-brand">Portfolio</p>
            <h2 className="mt-3 text-4xl font-semibold md:text-5xl">Spaces We’ve Created</h2>
          </div>
          <Link to="/spaces-weve-created" className="btn-outline">View all</Link>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">
          {(gallery || []).slice(0, 6).map((g, i) => (
            <Link to="/spaces-weve-created" key={g.id} className={`group overflow-hidden bg-sand ${i === 0 ? 'col-span-2 row-span-2 aspect-square md:col-span-1' : 'aspect-square'}`}>
              <Photo src={g.image_url} alt={g.name} className="transition duration-700 group-hover:scale-105" />
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative isolate overflow-hidden bg-ink text-white">
        <div className="mx-auto max-w-3xl px-5 py-20 text-center md:py-28">
          <h2 className="text-4xl font-semibold md:text-6xl">Ready to plan your space?</h2>
          <p className="mx-auto mt-4 max-w-xl text-white/75">{about.closing}</p>
          <Link to="/contact" className="btn !bg-white !px-9 !py-4 mt-8 !text-ink hover:!bg-sand">Contact Us</Link>
        </div>
      </section>
    </>
  )
}
