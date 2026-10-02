import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useItems, STYLE_GROUPS, styleOf } from '../lib/api'
import { PageHeader, Section, ItemsGrid, Tile, Grid } from '../components/ui'

// General construction specs shown on every stock collection page (client notes).
const SPECS = [
  ['Box Material', '1/2" Birch Plywood'],
  ['Box Interior', 'Natural Birch Interior'],
  ['Box Face Frame', '3/4" x 1-1/2" Solid Birch'],
  ['Door Material', 'Solid Wood Frame, MDF Panel'],
  ['Door Style', 'Full Overlay'],
  ['Door Hinges', 'Soft Close, Concealed, 6-Way Adjustable'],
  ['Drawer Glides', 'Soft Close Undermount Full Extension'],
  ['Drawer Material', '5/8" wood, Dovetail'],
  ['Shelves', '3/4" Plywood, Adjustable, full in wall, ½ depth in base'],
]

function SpecsTable() {
  return (
    <div className="rounded-2xl bg-sand p-6 md:p-8">
      <h2 className="mb-4 text-2xl font-semibold">Specs</h2>
      <dl className="grid gap-3 sm:grid-cols-2">
        {SPECS.map(([k, v]) => (
          <div key={k} className="flex gap-2 text-sm">
            <dt className="shrink-0 font-semibold">{k}:</dt>
            <dd className="text-muted">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

/** Level 2: one collection — full tile, bordered item grid, construction specs. */
function Collection({ id }) {
  const { items: cols } = useItems('stock_collection')
  const { items, loading } = useItems('stock_item', id)
  const [cat, setCat] = useState(null)
  const col = cols?.find((c) => c.id === id)
  const cats = useMemo(() => [...new Set((items || []).map((i) => i.category).filter(Boolean))], [items])
  const activeCat = cat ?? cats[0]
  const shown = items?.filter((i) => i.category === activeCat)

  return (
    <>
      <section className="bg-sand">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-5 py-10 md:grid-cols-2 md:py-14">
          <div>
            <Link to="/stock-cabinetry" className="text-sm text-brand hover:underline">← Stock Cabinetry</Link>
            <h1 className="mt-3 text-4xl font-semibold md:text-6xl">{col?.name}</h1>
          </div>
          {/* full door only, with a border — no white box around it (client notes) */}
          <div className="flex justify-center md:justify-end">
            {col?.image_url && <img src={col.image_url} alt={col.name} className="h-80 w-auto border border-ink/30 md:h-[440px]" />}
          </div>
        </div>
      </section>

      <Section>
        {cats.length > 1 && (
          <div className="mb-8 flex flex-wrap gap-2">
            {cats.map((c) => (
              <button key={c} onClick={() => setCat(c)}
                className={`rounded-full border px-4 py-2 text-sm transition ${activeCat === c ? 'border-brand bg-brand text-white' : 'border-ink/20 hover:border-brand'}`}>{c}</button>
            ))}
          </div>
        )}
        {loading ? null : !shown?.length ? (
          <p className="py-10 text-center text-muted">Items for this collection are coming soon.</p>
        ) : (
          <Grid>{shown.map((it) => <Tile key={it.id} item={it} fit="contain" bordered />)}</Grid>
        )}
      </Section>

      <Section className="!pt-0"><SpecsTable /></Section>
    </>
  )
}

export default function StockCabinetry() {
  const { id } = useParams()
  const { items, loading } = useItems('stock_collection')
  const [style, setStyle] = useState(null)
  // All five tabs always show (Flat Panel is coming later); default to the first with doors.
  const firstFilled = useMemo(() => STYLE_GROUPS.find((g) => (items || []).some((c) => styleOf(c) === g)), [items])
  const activeStyle = style ?? firstFilled
  const shown = (items || []).filter((c) => styleOf(c) === activeStyle)

  if (id) return <Collection id={id} />
  return (
    <>
      <PageHeader title="Stock Cabinetry" />
      <Section className="!pb-0"><SpecsTable /></Section>
      <Section>
        {loading ? null : (
          <>
            <div className="mb-8 flex flex-wrap justify-center gap-2">
              {STYLE_GROUPS.map((g) => (
                <button key={g} onClick={() => setStyle(g)}
                  className={`rounded-full border px-4 py-2 text-sm transition ${activeStyle === g ? 'border-brand bg-brand text-white' : 'border-ink/20 hover:border-brand'}`}>{g}</button>
              ))}
            </div>
            {!shown.length ? (
              <p className="py-10 text-center text-muted">Coming soon.</p>
            ) : (
              // stock door images are ~1:2 portrait; matching box = full door, no crop, no frame
              <Grid>{shown.map((c, i) => <Tile key={c.id} item={c} to={`/stock-cabinetry/${c.id}`} fit="contain" aspect="aspect-[52/100]" priority={i < 8} />)}</Grid>
            )}
          </>
        )}
      </Section>
    </>
  )
}
