import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useItems } from '../lib/api'
import { PageHeader, Section, Lightbox } from '../components/ui'

/** Level 1: door style / color collections (like an RTA cabinet shop's catalogue grid). */
function CollectionCard({ c }) {
  return (
    <Link to={`/stock-cabinetry/${c.id}`} className="group block overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-ink/5 transition hover:shadow-xl">
      <div className="aspect-[4/3] overflow-hidden bg-sand p-4">
        {c.image_url && <img src={c.image_url} alt={c.name} loading="lazy" decoding="async" className="h-full w-full object-contain transition duration-700 group-hover:scale-105" />}
      </div>
      <div className="flex items-center justify-between p-4">
        <div>
          <h3 className="text-2xl font-semibold">{c.name}</h3>
          <p className="text-sm text-muted">{c.description || 'Door style & color'}</p>
        </div>
        <span className="text-sm font-medium text-brand opacity-0 transition group-hover:opacity-100">View →</span>
      </div>
    </Link>
  )
}

/** Level 2: one collection — hero + category filter + product cards. */
function Collection({ id }) {
  const { items: cols } = useItems('stock_collection')
  const { items, loading } = useItems('stock_item', id)
  const [cat, setCat] = useState('All')
  const [active, setActive] = useState(null)
  const col = cols?.find((c) => c.id === id)
  const cats = useMemo(() => ['All', ...new Set((items || []).map((i) => i.category).filter(Boolean))], [items])
  const shown = cat === 'All' ? items : items?.filter((i) => i.category === cat)

  return (
    <>
      <section className="bg-sand">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-5 py-10 md:grid-cols-[1fr_1.2fr] md:py-14">
          <div>
            <Link to="/stock-cabinetry" className="text-sm text-brand hover:underline">← All door styles &amp; colors</Link>
            <h1 className="mt-3 text-4xl font-semibold md:text-6xl">{col?.name || 'Collection'} Collection</h1>
            {col?.description && <p className="mt-3 text-muted">{col.description}</p>}
            {items && <p className="mt-2 text-sm text-muted">{items.length} items available</p>}
            <Link to="/schedule" className="btn mt-6">Schedule With Us</Link>
          </div>
          <div className="aspect-[16/10] overflow-hidden rounded-2xl bg-white p-4">
            {col?.image_url && <img src={col.image_url} alt={col.name} className="h-full w-full object-contain" />}
          </div>
        </div>
      </section>

      <Section>
        {cats.length > 2 && (
          <div className="mb-8 flex flex-wrap gap-2">
            {cats.map((c) => (
              <button key={c} onClick={() => setCat(c)}
                className={`rounded-full border px-4 py-2 text-sm transition ${cat === c ? 'border-brand bg-brand text-white' : 'border-ink/20 hover:border-brand'}`}>{c}</button>
            ))}
          </div>
        )}
        {loading ? null : !shown?.length ? (
          <p className="py-10 text-center text-muted">Items for this collection are coming soon.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
            {shown.map((it) => (
              <button key={it.id} onClick={() => setActive(it)} className="group cursor-zoom-in rounded-xl bg-white p-3 text-left ring-1 ring-ink/5 transition hover:shadow-lg">
                <div className="aspect-square overflow-hidden rounded-lg bg-white">
                  {it.image_url && <img src={it.image_url} alt={it.name} loading="lazy" decoding="async" className="h-full w-full object-contain transition duration-500 group-hover:scale-105" />}
                </div>
                <h3 className="mt-3 font-sans text-sm font-semibold leading-snug">{it.name}</h3>
                {it.sku && it.sku !== it.name && <p className="text-xs text-muted">SKU: {it.sku}</p>}
                {it.size && <p className="text-xs text-muted">{it.size}</p>}
              </button>
            ))}
          </div>
        )}
      </Section>
      <Lightbox item={active && { ...active, description: [active.sku && `SKU ${active.sku}`, active.size].filter(Boolean).join(' · ') }} onClose={() => setActive(null)} />
    </>
  )
}

export default function StockCabinetry() {
  const { id } = useParams()
  const { items, loading } = useItems('stock_collection')
  if (id) return <Collection id={id} />
  return (
    <>
      <PageHeader title="Stock Cabinetry" subtitle="Choose a door style and color to see the available cabinetry." />
      <Section>
        {loading ? null : !items?.length ? (
          <p className="py-10 text-center text-muted">Coming soon.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{items.map((c) => <CollectionCard key={c.id} c={c} />)}</div>
        )}
      </Section>
    </>
  )
}
