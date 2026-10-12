import { Link } from 'react-router-dom'
import { useItems, useSettings } from '../lib/api'
import { railItems, thumb } from '../lib/catalog'

/**
 * Auto-scrolling strip of tiles (client notes: "Scroll Bars like on gginapod.com").
 * Admins pick which items appear ("Show on Home page") and their order (drag to reorder).
 */
function Rail({ title, to, section, aspect, width, fit = 'contain' }) {
  const { items } = useItems(section)
  const list = railItems(items)
  if (!list.length) return null
  // Rendered twice for a seamless loop; the second copy is hidden from screen readers.
  const tile = (it, copy) => (
    <div key={`${copy}-${it.id}`} className={`${width} shrink-0 pr-3 md:pr-4`} aria-hidden={copy ? true : undefined}>
      <div className={`${aspect} overflow-hidden`}>
        {it.image_url && <img src={thumb(it.image_url)} alt={copy ? '' : it.name} loading="lazy" decoding="async" className={`h-full w-full ${fit === 'cover' ? 'object-cover' : 'object-contain'}`} />}
      </div>
      <p className="mt-2 truncate text-sm font-medium">{it.name}</p>
    </div>
  )
  return (
    <div>
      <Link to={to} className="mb-6 block text-center font-serif text-3xl font-semibold uppercase tracking-[0.12em] hover:text-brand md:text-4xl">{title}</Link>
      <div className="marquee-wrap">
        <div className="marquee" style={{ '--marquee-duration': `${Math.max(list.length, 6) * 4}s` }}>
          {list.map((it) => tile(it, 0))}
          {list.map((it) => tile(it, 1))}
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const { hero, philosophy, about } = useSettings()

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

      {/* SCROLL BARS */}
      <section className="bg-sand">
        <div className="mx-auto max-w-7xl space-y-14 px-5 py-16 md:py-20">
          <Rail title="Stock Cabinetry" to="/stock-cabinetry" section="stock_collection" aspect="aspect-[52/100]" width="w-36 md:w-48" />
          <Rail title="Custom Cabinetry" to="/custom-cabinetry" section="door_profile" aspect="aspect-[4/5]" width="w-44 md:w-60" />
          <Rail title="Countertops" to="/countertops" section="countertop" aspect="aspect-square" width="w-44 md:w-56" fit="cover" />
          <Rail title="Flooring" to="/flooring" section="flooring" aspect="aspect-square" width="w-44 md:w-56" fit="cover" />
          <Rail title="Backsplash" to="/backsplash" section="backsplash" aspect="aspect-square" width="w-44 md:w-56" fit="cover" />
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
