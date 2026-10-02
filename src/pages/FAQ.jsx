import { useSettings } from '../lib/api'
import { PageHeader, Section } from '../components/ui'

export default function FAQ() {
  const { faq } = useSettings()
  return (
    <>
      <PageHeader title="FAQ’s" />
      <Section className="max-w-3xl"><div className="whitespace-pre-line text-muted">{faq.body}</div></Section>
    </>
  )
}
