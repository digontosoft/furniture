import { Link } from 'react-router-dom'
import { useSettings } from '../lib/api'
import { PageHeader, Section } from '../components/ui'

export default function About() {
  const { about } = useSettings()
  return (
    <>
      <PageHeader title="About Us" />
      <Section className="max-w-4xl">
        <div className={about.image_url ? 'grid items-start gap-10 md:grid-cols-[1fr_1.4fr]' : ''}>
          {about.image_url && <img src={about.image_url} alt="" className="w-full rounded-2xl object-cover" />}
          <div>
            <h2 className="text-3xl font-semibold md:text-4xl">{about.heading}</h2>
            <p className="mt-2 text-sm uppercase tracking-widest text-brand">{about.title}</p>
            <div className="mt-6 space-y-4 whitespace-pre-line text-muted">{about.body}</div>
            <p className="mt-8 font-serif text-2xl italic">{about.closing}</p>
            <p className="font-serif text-xl text-brand">Where thoughtful planning meets beautiful design.</p>
            <Link to="/contact" className="btn mt-8">Contact Us</Link>
          </div>
        </div>
      </Section>
    </>
  )
}
