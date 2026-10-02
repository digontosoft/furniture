import { useSettings } from '../lib/api'
import { PageHeader, Section } from '../components/ui'

export default function MeasurementGuide() {
  const { measurementGuide } = useSettings()
  return (
    <>
      <PageHeader title="Measurement Guide" />
      <Section className="max-w-3xl"><div className="whitespace-pre-line text-muted">{measurementGuide.body}</div></Section>
    </>
  )
}
