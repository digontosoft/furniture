import { useSettings } from '../lib/api'
import { PageHeader, Section } from '../components/ui'

export default function Terms() {
  const { terms } = useSettings()
  return (
    <>
      <PageHeader title="Terms and Conditions" />
      <Section className="max-w-3xl"><div className="whitespace-pre-line text-muted">{terms.body}</div></Section>
    </>
  )
}
