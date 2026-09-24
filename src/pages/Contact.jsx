import { useSettings } from '../lib/api'
import { PageHeader, Section } from '../components/ui'
import ContactForm from '../components/ContactForm'

export default function Contact() {
  const { contact } = useSettings()
  return (
    <>
      <PageHeader title="Contact Us" />
      <Section>
        <div className="grid gap-12 md:grid-cols-[1fr_1.4fr]">
          <div className="space-y-5">
            <h2 className="text-3xl font-semibold">Get in touch</h2>
            {contact.phone && <p><span className="block text-sm text-muted">Phone</span><a href={`tel:${contact.phone}`} className="hover:text-brand">{contact.phone}</a></p>}
            {contact.email && <p><span className="block text-sm text-muted">Email</span><a href={`mailto:${contact.email}`} className="hover:text-brand">{contact.email}</a></p>}
            {contact.address && <p className="whitespace-pre-line"><span className="block text-sm text-muted">Address</span>{contact.address}</p>}
            {contact.hours && <p className="whitespace-pre-line"><span className="block text-sm text-muted">Business hours</span>{contact.hours}</p>}
            {contact.instagram && <p><a href={contact.instagram} target="_blank" rel="noreferrer" className="text-brand hover:underline">Follow us on Instagram →</a></p>}
          </div>
          <ContactForm kind="contact" />
        </div>
      </Section>
    </>
  )
}
