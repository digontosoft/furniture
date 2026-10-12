import { Link, useParams } from 'react-router-dom'
import { useItems, useSettings } from '../lib/api'
import { PAGES, photosOf } from '../lib/catalog'
import { PageHeader, Section, Tile, Grid, FilterTabs, useTabs, PhotoViewer, SpecsList } from '../components/ui'

/** Standard construction specs (Admin → Site Content), unless a collection has its own. */
function useStockSpecs(collection) {
  const { stockSpecs } = useSettings()
  return collection?.specs?.length ? collection.specs : stockSpecs?.rows
}

/** Level 2: one collection — name + specs on the left, door photo (with photo strip) in the centre. */
function Collection({ id }) {
  const { items: cols } = useItems('stock_collection')
  const { items, loading } = useItems('stock_item', id)
  const { tabs, active, setActive, shown } = useTabs('stock_item', items)
  const col = cols?.find((c) => c.id === id)
  const specs = useStockSpecs(col)

  return (
    <>
      <section style={{ backgroundColor: PAGES.stock.bg }}>
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 md:grid-cols-2 md:py-14 lg:grid-cols-[minmax(0,1fr)_480px_minmax(0,1fr)]">
          <div className="md:col-start-1 md:row-start-1">
            <Link to="/stock-cabinetry" className="text-sm text-ink/80 hover:underline">← Stock Cabinetry</Link>
            <h1 className="mt-3 text-4xl font-semibold md:text-6xl">{col?.name}</h1>
          </div>
          <div className="md:col-start-2 md:row-span-2 md:row-start-1">
            {col && <PhotoViewer photos={photosOf(col)} alt={col.name} bordered height="h-[380px] md:h-[520px]" />}
          </div>
          <div className="md:col-start-1 md:row-start-2">
            <SpecsList rows={specs} title="Specs" />
          </div>
        </div>
      </section>

      <Section>
        <FilterTabs tabs={tabs} active={active} onChange={setActive} className="justify-start" />
        {loading ? null : !shown.length ? (
          <p className="py-10 text-center text-muted">Items for this collection are coming soon.</p>
        ) : (
          <Grid>{shown.map((it) => <Tile key={it.id} item={it} fit="contain" bordered />)}</Grid>
        )}
      </Section>
    </>
  )
}

export default function StockCabinetry() {
  const { id } = useParams()
  const { items, loading } = useItems('stock_collection')
  const { tabs, active, setActive, shown } = useTabs('stock_collection', items)
  const specs = useStockSpecs()

  if (id) return <Collection id={id} />
  return (
    <>
      <PageHeader page="stock" />
      <Section className="!pb-0">
        <div className="bg-sand/60 p-6 md:p-8"><SpecsList rows={specs} title="Specs" /></div>
      </Section>
      <Section>
        {loading ? null : (
          <>
            <FilterTabs tabs={tabs} active={active} onChange={setActive} />
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
