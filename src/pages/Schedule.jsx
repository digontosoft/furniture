import { PageHeader, Section } from '../components/ui'
import ContactForm from '../components/ContactForm'

export default function Schedule() {
  return (
    <>
      <PageHeader title="Schedule With Us" subtitle="Tell us about your project and preferred time — we’ll confirm with you." />
      <Section className="max-w-2xl"><ContactForm kind="schedule" /></Section>
    </>
  )
}
