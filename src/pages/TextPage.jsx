import { useSettings } from '../lib/api'
import { PageHeader, Section, RichText } from '../components/ui'

const DownloadIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-2"><path d="M12 3v12m0 0l-5-5m5 5l5-5M4 21h16" /></svg>
)

/**
 * Terms, FAQ's, Shipping and Measurement Guide: admin-written text.
 * With a picture (Measurement Guide) it is laid out like About Us — picture left, text right —
 * and a PDF gets a download button.
 */
export default function TextPage({ page, settingsKey }) {
  const content = useSettings()[settingsKey] || {}
  const download = content.pdf_url && (
    <a href={content.pdf_url} target="_blank" rel="noreferrer" download className="btn">
      <DownloadIcon /> Measurement Guide
    </a>
  )

  if (content.image_url)
    return (
      <>
        <PageHeader page={page} />
        <Section className="max-w-6xl">
          <div className="grid items-start gap-10 md:grid-cols-[1.25fr_1fr]">
            <a href={content.pdf_url || undefined} target="_blank" rel="noreferrer" className="block border border-ink/15 bg-white p-2 shadow-sm">
              <img src={content.image_url} alt="Measurement guide preview" className="w-full" />
            </a>
            <div className="space-y-8">
              <RichText text={content.body} />
              {download && (
                <div>
                  {download}
                  <p className="mt-2 text-sm text-muted">PDF — print it, fill it in, and send it back to us.</p>
                </div>
              )}
            </div>
          </div>
        </Section>
      </>
    )

  return (
    <>
      <PageHeader page={page} />
      <Section className="max-w-3xl">
        {download && <div className="mb-10">{download}</div>}
        <RichText text={content.body} />
      </Section>
    </>
  )
}
