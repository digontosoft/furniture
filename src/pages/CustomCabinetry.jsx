import { useSearchParams } from 'react-router-dom'
import { useSettings } from '../lib/api'
import { DEFAULT_CUSTOM_TABS } from '../lib/catalog'
import { PageHeader, Section, ItemsGrid } from '../components/ui'

export default function CustomCabinetry() {
  const [params, setParams] = useSearchParams()
  // main tabs are managed in Admin → Categories (the client can add their own)
  const { customTabs } = useSettings()
  const tabs = customTabs?.tabs?.length ? customTabs.tabs : DEFAULT_CUSTOM_TABS
  const tab = tabs.some((t) => t.key === params.get('tab')) ? params.get('tab') : tabs[0]?.key
  return (
    <>
      <PageHeader page="custom" />
      <Section>
        <div role="tablist" className="mb-10 flex flex-wrap justify-center gap-x-2 border-b border-ink/10">
          {tabs.map(({ key, label }) => (
            <button key={key} role="tab" aria-selected={tab === key}
              onClick={() => setParams({ tab: key }, { replace: true })}
              className={`-mb-px border-b-2 px-3 py-3 font-serif text-lg transition md:px-4 md:text-xl ${tab === key ? 'border-brand text-brand' : 'border-transparent text-muted hover:text-ink'}`}>
              {label}
            </button>
          ))}
        </div>
        {/* door profile images are 4:5 — a matching box shows the full door with no white frame */}
        {tab && <ItemsGrid key={tab} section={tab} fit={tab === 'door_profile' ? 'contain' : 'cover'} aspect={tab === 'door_profile' ? 'aspect-[4/5]' : undefined} />}
      </Section>
    </>
  )
}
