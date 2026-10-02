import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { searchItems } from '../lib/api'
import { PageHeader, Section, Grid } from '../components/ui'

// Where each catalogue section lives on the site.
const WHERE = {
  stock_collection: ['Stock Cabinetry', (it) => `/stock-cabinetry/${it.id}`],
  stock_item: ['Stock Cabinetry Item', () => '/stock-cabinetry'],
  door_profile: ['Door Profile', () => '/custom-cabinetry?tab=door_profile'],
  paint: ['Paint', () => '/custom-cabinetry?tab=paint'],
  stain: ['Stain', () => '/custom-cabinetry?tab=stain'],
  countertop: ['Countertop', () => '/countertops'],
  flooring: ['Flooring', () => '/flooring'],
  gallery: ['Spaces We’ve Created', () => '/spaces-weve-created'],
}

export default function Search() {
  const [params] = useSearchParams()
  const q = params.get('q') || ''
  const [results, setResults] = useState(null)

  useEffect(() => {
    let live = true
    setResults(null)
    searchItems(q).then((r) => live && setResults(r)).catch(() => live && setResults([]))
    return () => { live = false }
  }, [q])

  return (
    <>
      <PageHeader title="Search" subtitle={q ? `Results for “${q}”` : undefined} />
      <Section>
        {results === null ? null : !results.length ? (
          <p className="py-10 text-center text-muted">No results found.</p>
        ) : (
          <Grid>
            {results.map((it) => {
              const [label, href] = WHERE[it.section] || ['', () => '/']
              return (
                <Link key={it.id} to={href(it)} className="group block">
                  <div className="aspect-square overflow-hidden">
                    {it.image_url && <img src={it.image_url} alt={it.name} loading="lazy" className="h-full w-full object-contain transition duration-500 group-hover:scale-105" />}
                  </div>
                  <h3 className="mt-3 text-base font-semibold md:text-lg">{it.name}</h3>
                  <p className="text-xs uppercase tracking-wider text-muted">{label}</p>
                </Link>
              )
            })}
          </Grid>
        )}
      </Section>
    </>
  )
}
