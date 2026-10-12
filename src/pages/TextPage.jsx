import { useSettings } from '../lib/api'
import { PageHeader, Section, RichText } from '../components/ui'

/** Terms, FAQ's, Shipping and Measurement Guide: admin-written text (+ optional PDF download). */
export default function TextPage({ page, settingsKey }) {
  const content = useSettings()[settingsKey] || {}
  return (
    <>
      <PageHeader page={page} />
      <Section className="max-w-3xl">
        {content.pdf_url && (
          <a href={content.pdf_url} target="_blank" rel="noreferrer" download className="btn mb-10">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-2"><path d="M12 3v12m0 0l-5-5m5 5l5-5M4 21h16" /></svg>
            Download printable guide (PDF)
          </a>
        )}
        <RichText text={content.body} />
      </Section>
    </>
  )
}
