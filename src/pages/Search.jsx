import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { searchItems } from '../lib/api'
import { SECTIONS, thumb } from '../lib/catalog'
import { PageHeader, Section, Grid } from '../components/ui'

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
              const conf = SECTIONS[it.section] || { name: '', path: () => '/' }
              return (
                <Link key={it.id} to={conf.path(it)} className="group block">
                  <div className="aspect-square overflow-hidden">
                    {it.image_url && <img src={thumb(it.image_url)} alt={it.name} loading="lazy" className="h-full w-full object-contain transition duration-500 group-hover:scale-105" />}
                  </div>
                  <h3 className="mt-3 text-base font-semibold md:text-lg">{it.name}</h3>
                  <p className="text-xs uppercase tracking-wider text-muted">{conf.name}</p>
                </Link>
              )
            })}
          </Grid>
        )}
      </Section>
    </>
  )
}
