import { useSearchParams } from 'react-router-dom'
import { PageHeader, Section, ItemsGrid } from '../components/ui'

const TABS = [
  ['door_profile', 'Door Profiles'],
  ['paint', 'Paints'],
  ['stain', 'Stains'],
  ['melamine', 'Textured Melamine'],
]

export default function CustomCabinetry() {
  const [params, setParams] = useSearchParams()
  const tab = TABS.some(([k]) => k === params.get('tab')) ? params.get('tab') : 'door_profile'
  return (
    <>
      <PageHeader page="custom" />
      <Section>
        <div role="tablist" className="mb-10 flex flex-wrap justify-center gap-x-2 border-b border-ink/10">
          {TABS.map(([key, label]) => (
            <button key={key} role="tab" aria-selected={tab === key}
              onClick={() => setParams({ tab: key }, { replace: true })}
              className={`-mb-px border-b-2 px-4 py-3 font-serif text-xl transition md:px-7 md:text-2xl ${tab === key ? 'border-brand text-brand' : 'border-transparent text-muted hover:text-ink'}`}>
              {label}
            </button>
          ))}
        </div>
        {/* door profile images are 4:5 — a matching box shows the full door with no white frame */}
        <ItemsGrid key={tab} section={tab} fit={tab === 'door_profile' ? 'contain' : 'cover'} aspect={tab === 'door_profile' ? 'aspect-[4/5]' : undefined} />
      </Section>
    </>
  )
}
