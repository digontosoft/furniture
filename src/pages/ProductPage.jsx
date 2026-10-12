import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useItems } from '../lib/api'
import { PAGES, photosOf } from '../lib/catalog'
import { Section, PhotoViewer, SpecsList } from '../components/ui'

/**
 * Detail page for one countertop / flooring / backsplash item (client notes 2).
 *  countertop → large slab-shaped photo centred, then name, "About this stone", spec cards
 *  others     → photos (with scroll strip) on the left, name + description + spec table on the right
 */
export default function ProductPage({ page, section }) {
  const { id } = useParams()
  const { items, loading } = useItems(section)
  const item = items?.find((i) => i.id === id)
  const p = PAGES[page]
  useEffect(() => { if (item) document.title = `${item.name} | Two G’s In A Pod` }, [item])

  const back = <Link to={`/${page}`} className="text-sm text-muted hover:text-brand hover:underline">← {p.title}</Link>
  if (loading) return <div className="min-h-[60vh]" />
  if (!item)
    return <Section className="min-h-[50vh] text-center">{back}<p className="mt-8 text-muted">This item is no longer available.</p></Section>

  const photos = photosOf(item)

  if (section === 'countertop')
    return (
      <Section className="max-w-6xl">
        {back}
        <div className="mt-6"><PhotoViewer photos={photos} alt={item.name} aspect="aspect-video" /></div>
        <h1 className="mt-10 text-3xl font-semibold uppercase tracking-wide md:text-4xl">{item.name}</h1>
        {item.category && <p className="mt-1 text-sm uppercase tracking-[0.15em] text-muted">{item.category}</p>}
        {item.description && (
          <div className="mt-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.15em] text-ink/80">About this stone</h2>
            <p className="max-w-4xl whitespace-pre-line leading-relaxed text-ink/80">{item.description}</p>
          </div>
        )}
        <div className="mt-10"><SpecsList rows={item.specs} variant="cards" title="Specifications" /></div>
      </Section>
    )

  return (
    <Section>
      {back}
      <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-14">
        <PhotoViewer photos={photos} alt={item.name} aspect="aspect-[8/7]" />
        <div>
          <h1 className="text-4xl font-semibold md:text-5xl">{item.name}</h1>
          {item.category && <p className="mt-1 text-sm uppercase tracking-[0.15em] text-muted">{item.category}</p>}
          {item.description && <p className="mt-6 whitespace-pre-line text-lg leading-relaxed text-ink/75">{item.description}</p>}
          <div className="mt-8"><SpecsList rows={item.specs} variant="table" /></div>
        </div>
      </div>
    </Section>
  )
}
