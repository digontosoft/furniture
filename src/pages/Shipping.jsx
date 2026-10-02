import { useSettings } from '../lib/api'
import { PageHeader, Section } from '../components/ui'

export default function Shipping() {
  const { shipping } = useSettings()
  return (
    <>
      <PageHeader title="Shipment & Delivery Information" />
      <Section className="max-w-3xl"><div className="whitespace-pre-line text-muted">{shipping.body}</div></Section>
    </>
  )
}
