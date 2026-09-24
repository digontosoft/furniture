import { useState } from 'react'
import { submitForm } from '../lib/api'

const SERVICES = ['Interior design', 'Stock cabinetry', 'Custom cabinetry', 'Countertops', 'Flooring', 'Other']

/** kind: 'schedule' | 'contact' */
export default function ContactForm({ kind }) {
  const [state, setState] = useState({ status: 'idle', error: '' })
  const schedule = kind === 'schedule'

  async function onSubmit(e) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    if (f.get('website')) return // honeypot
    setState({ status: 'sending', error: '' })
    try {
      await submitForm({
        kind,
        name: f.get('name').trim(),
        email: f.get('email').trim(),
        phone: f.get('phone').trim() || null,
        subject: f.get('subject')?.trim() || null,
        service_type: f.get('service_type') || null,
        preferred_datetime: f.get('preferred_datetime') || null,
        message: f.get('message').trim() || null,
      })
      setState({ status: 'done', error: '' })
    } catch (err) {
      setState({ status: 'idle', error: err.message || 'Something went wrong. Please try again.' })
    }
  }

  if (state.status === 'done')
    return (
      <div className="rounded-2xl bg-sand p-8 text-center">
        <h3 className="text-3xl font-semibold">Thank you!</h3>
        <p className="mt-2 text-muted">We received your {schedule ? 'request' : 'message'} and will be in touch soon.</p>
      </div>
    )

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input name="website" tabIndex="-1" autoComplete="off" className="hidden" aria-hidden="true" />
      <div className="grid gap-4 md:grid-cols-2">
        <div><label className="label" htmlFor="name">Name *</label><input id="name" name="name" required maxLength="200" className="input" /></div>
        <div><label className="label" htmlFor="email">Email *</label><input id="email" name="email" type="email" required maxLength="200" className="input" /></div>
        <div><label className="label" htmlFor="phone">Phone</label><input id="phone" name="phone" type="tel" className="input" /></div>
        {schedule ? (
          <div><label className="label" htmlFor="pdt">Preferred date/time</label><input id="pdt" name="preferred_datetime" type="datetime-local" className="input" /></div>
        ) : (
          <div><label className="label" htmlFor="subject">Subject</label><input id="subject" name="subject" className="input" /></div>
        )}
      </div>
      {schedule && (
        <div>
          <label className="label" htmlFor="svc">Project/service type</label>
          <select id="svc" name="service_type" className="input" defaultValue="">
            <option value="" disabled>Select…</option>
            {SERVICES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
      )}
      <div>
        <label className="label" htmlFor="message">{schedule ? 'Message / project details' : 'Message'}</label>
        <textarea id="message" name="message" rows="5" maxLength="4000" className="input" />
      </div>
      {state.error && <p className="text-sm text-red-700">{state.error}</p>}
      <button className="btn" disabled={state.status === 'sending'}>
        {state.status === 'sending' ? 'Sending…' : schedule ? 'Request Consultation' : 'Send Message'}
      </button>
    </form>
  )
}
