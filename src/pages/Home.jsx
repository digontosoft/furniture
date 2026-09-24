import { Link } from 'react-router-dom'
import { useItems, useSettings, USE_DUMMY, DUMMY_IMAGES } from '../lib/api'

const img = (v, fallback) => v || (USE_DUMMY ? fallback : '')

const STEPS = [
  ['01', 'Blueprint Review', 'We study your plans for function, flow, proportion and everyday usability.'],
  ['02', 'Plan & Adjust', 'Small layout changes are found before construction makes them costly.'],
  ['03', 'Select Finishes', 'Choose cabinetry, countertops and flooring with us, sample by sample.'],
  ['04', 'Finished Space', 'We bridge the gap between the blueprint and the beautiful result.'],
]

function Photo({ src, alt = '', className = '' }) {
  return src ? <img src={src} alt={alt} loading="lazy" decoding="async" className={`h-full w-full object-cover ${className}`} /> : <div className="h-full w-full bg-sand" />
}

function Feature({ to, title, text, src, tall }) {
  return (
    <Link to={to} className={`group relative block overflow-hidden rounded-2xl bg-sand ${tall ? 'md:row-span-2' : ''}`}>
      <div className={tall ? 'aspect-[4/3] md:aspect-auto md:h-full' : 'aspect-[4/3]'}>
        <Photo src={src} className="transition duration-700 group-hover:scale-105" />
      </div>
      <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-black/10 to-transparent p-6 text-white md:p-8">
        <h3 className="text-3xl font-semibold md:text-4xl">{title}</h3>
        <p className="mt-1 text-sm text-white/85">{text}</p>
        <span className="mt-3 text-sm font-medium underline-offset-4 group-hover:underline">Explore →</span>
      </div>
    </Link>
  )
}

export default function Home() {
  const { hero, philosophy, home, about } = useSettings()
  const { items: gallery } = useItems('gallery')

  return (
    <>
      {/* HERO */}
      <section className="relative isolate flex min-h-[88vh] items-center overflow-hidden bg-brand-dark text-white">
        {hero.image_url && <img src={hero.image_url} alt="" fetchPriority="high" className="absolute inset-0 -z-10 h-full w-full object-cover" />}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/70 via-black/40 to-black/10" />
        <div className="mx-auto w-full max-w-7xl px-5 py-24">
          <p className="mb-5 text-xs uppercase tracking-[0.35em] text-white/75">Two G’s In A Pod | Design &amp; Interiors</p>
          <h1 className="max-w-3xl text-5xl font-semibold leading-[1.05] md:text-7xl">{hero.title}</h1>
          <p className="mt-6 max-w-xl text-lg text-white/85">{hero.subtitle}</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link to="/schedule" className="btn !bg-white !px-8 !py-4 !text-ink hover:!bg-sand">Schedule With Us</Link>
            <Link to="/spaces-weve-created" className="btn-outline !border-white/70 !px-8 !py-4 !text-white hover:!bg-white hover:!text-ink">See Our Work</Link>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="border-b border-ink/10 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-y-4 px-5 py-6 text-center text-sm md:grid-cols-4">
          {['Interior Design', 'Stock & Custom Cabinetry', 'Countertops', 'Flooring'].map((t) => (
            <p key={t} className="font-serif text-lg font-semibold text-brand-dark md:text-xl">{t}</p>
          ))}
        </div>
      </section>

      {/* PHILOSOPHY */}
      <section className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 md:grid-cols-2 md:py-24">
        <div className="aspect-[4/5] overflow-hidden rounded-2xl"><Photo src={img(about.image_url, DUMMY_IMAGES.philosophy)} /></div>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-brand">Our Philosophy</p>
          <h2 className="mt-3 text-4xl font-semibold leading-tight md:text-5xl">{about.heading}</h2>
          <p className="mt-5 text-lg text-muted">{philosophy.text}</p>
          <p className="mt-4 font-serif text-2xl italic text-brand-dark">{about.closing}</p>
          <Link to="/about" className="btn-outline mt-7">About Us</Link>
        </div>
      </section>

      {/* CABINETRY */}
      <section className="bg-sand">
        <div className="mx-auto max-w-7xl px-5 py-16 md:py-24">
          <div className="mb-10 text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-brand">Cabinetry</p>
            <h2 className="mt-3 text-4xl font-semibold md:text-5xl">Ready-made or made for you</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <Feature to="/stock-cabinetry" title="Stock Cabinetry" text="Browse door styles and colors ready to order." src={img(home.stock_image, DUMMY_IMAGES.stock)} />
            <Feature to="/custom-cabinetry" title="Custom Cabinetry" text="Choose your door profile, paint and stain." src={img(home.custom_image, DUMMY_IMAGES.custom)} />
          </div>
        </div>
      </section>

      {/* COUNTERTOPS + FLOORING */}
      <section className="mx-auto max-w-7xl px-5 py-16 md:py-24">
        <div className="mb-10 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-brand">Finishes</p>
          <h2 className="mt-3 text-4xl font-semibold md:text-5xl">Complete the room</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Feature to="/countertops" title="Countertops" text="Explore our available slabs." src={DUMMY_IMAGES.countertops} />
          <Feature to="/flooring" title="Flooring" text="Hardwood, tile, vinyl and more." src={DUMMY_IMAGES.flooring} />
        </div>
      </section>

      {/* PROCESS */}
      <section className="bg-brand-dark text-white">
        <div className="mx-auto max-w-7xl px-5 py-16 md:py-24">
          <h2 className="mb-12 text-center text-4xl font-semibold md:text-5xl">How we work</h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(([n, t, d]) => (
              <div key={n} className="border-t border-white/25 pt-5">
                <p className="font-serif text-4xl text-white/50">{n}</p>
                <h3 className="mt-2 text-2xl font-semibold">{t}</h3>
                <p className="mt-2 text-sm text-white/75">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GALLERY PREVIEW */}
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
            <Link to="/spaces-weve-created" key={g.id} className={`group overflow-hidden rounded-xl bg-sand ${i === 0 ? 'col-span-2 row-span-2 aspect-square md:col-span-1' : 'aspect-square'}`}>
              <Photo src={g.image_url} alt={g.name} className="transition duration-700 group-hover:scale-105" />
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative isolate overflow-hidden bg-ink text-white">
        <div className="mx-auto max-w-3xl px-5 py-20 text-center md:py-28">
          <h2 className="text-4xl font-semibold md:text-6xl">Ready to plan your space?</h2>
          <p className="mx-auto mt-4 max-w-xl text-white/75">Small changes before construction can make a world of difference after it. Request a consultation today.</p>
          <Link to="/schedule" className="btn !bg-white !px-9 !py-4 mt-8 !text-ink hover:!bg-sand">Schedule With Us</Link>
        </div>
      </section>
    </>
  )
}
