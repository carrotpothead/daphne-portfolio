/*
 * POST /api/cv-request
 * The photocopier won't print the resume. Visitors can bribe the carrot instead:
 * this checks the request and emails it to Daphne. The CV itself is never served here.
 *
 * Env (Vercel project settings):
 *   RESEND_API_KEY   - https://resend.com API key
 *   CV_NOTIFY_TO     - where requests are sent (your inbox)
 *   CV_NOTIFY_FROM   - optional sender, e.g. "Carrot <carrot@yourdomain.com>" (defaults to Resend's test sender)
 */
import { promises as dns } from 'node:dns'

const BRIBES = new Set(['a fresh carrot', 'carrot cake', 'a compliment', 'a job offer'])
const DISPOSABLE = new Set([
  'mailinator.com', 'guerrillamail.com', 'guerrillamail.net', '10minutemail.com', 'tempmail.com', 'temp-mail.org',
  'yopmail.com', 'trashmail.com', 'sharklasers.com', 'getnada.com', 'dispostable.com', 'maildrop.cc',
  'throwawaymail.com', 'fakeinbox.com', 'mintemail.com', 'mohmal.com', 'emailondeck.com', 'tempail.com',
  'burnermail.io', 'spamgourmet.com', 'mailnesia.com', 'mytemp.email', 'tmpmail.org', 'moakt.com',
])
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const clean = (v, max) => String(v ?? '').replace(/[\r\n]+/g, ' ').trim().slice(0, max)

// the domain has to be able to receive mail
async function canReceiveMail(domain) {
  try {
    const mx = await Promise.race([dns.resolveMx(domain), new Promise((_, no) => setTimeout(() => no(new Error('timeout')), 3000))])
    return Array.isArray(mx) && mx.length > 0
  } catch {
    return false
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'post only.' })

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
  // bots fill the hidden field; pretend it worked
  if (body.website) return res.status(200).json({ ok: true })

  const from = clean(body.from, 120)
  const email = clean(body.email, 160).toLowerCase()
  const note = clean(body.note, 280)
  const bribe = BRIBES.has(body.bribe) ? body.bribe : 'a fresh carrot'
  const domain = email.split('@')[1] || ''

  if (from.length < 2) return res.status(400).json({ ok: false, error: 'tell the carrot where you’re from.' })
  if (!EMAIL.test(email)) return res.status(400).json({ ok: false, error: 'that email doesn’t look real.' })
  if (DISPOSABLE.has(domain)) return res.status(400).json({ ok: false, error: 'the carrot doesn’t take throwaway emails.' })
  if (!(await canReceiveMail(domain))) return res.status(400).json({ ok: false, error: 'that email can’t receive mail.' })

  const key = process.env.RESEND_API_KEY
  const to = process.env.CV_NOTIFY_TO
  if (!key || !to) return res.status(503).json({ ok: false, error: 'the carrot’s mailbox isn’t connected yet.' })

  const text = [
    'Someone bribed the carrot for your CV.',
    '',
    `From:  ${from}`,
    `Email: ${email}`,
    `Bribe: ${bribe}`,
    note ? `Note:  ${note}` : null,
    '',
    `Sent ${new Date().toISOString()}. Reply to this email to send them your CV.`,
  ].filter((l) => l !== null).join('\n')

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.CV_NOTIFY_FROM || 'Carrot <onboarding@resend.dev>',
      to: [to],
      reply_to: email,
      subject: `🥕 CV request from ${from} (bribe: ${bribe})`,
      text,
    }),
  })
  if (!r.ok) return res.status(502).json({ ok: false, error: 'the carrot dropped the envelope. try again?' })
  return res.status(200).json({ ok: true })
}
