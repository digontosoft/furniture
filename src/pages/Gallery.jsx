import { useState } from 'react'
import { useItems } from '../lib/api'
import { PageHeader, Section, Lightbox } from '../components/ui'

export default function Gallery() {
  const { items, loading } = useItems('gallery')
  const [active, setActive] = useState(null)
  return (
    <>
      <PageHeader title="Spaces We’ve Created" subtitle="A look at our finished interiors." />
      <Section>
        {loading ? null : !items?.length ? (
          <p className="py-10 text-center text-muted">Coming soon.</p>
        ) : (
          <div className="columns-2 gap-4 md:columns-3 [&>*]:mb-4">
            {items.map((it) => (
              <button key={it.id} type="button" onClick={() => setActive(it)} className="group block w-full cursor-zoom-in overflow-hidden rounded-xl">
                <img src={it.image_url} alt={it.name || 'Completed space'} loading="lazy" decoding="async"
                  className="w-full transition duration-500 group-hover:scale-105" />
              </button>
            ))}
          </div>
        )}
      </Section>
      <Lightbox item={active} onClose={() => setActive(null)} />
    </>
  )
}
