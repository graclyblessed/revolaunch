import { Resend } from 'resend'

let _resend: Resend | null = null

function getResendClient(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY)
  }
  return _resend
}

// Lazy accessor — safe to import even without RESEND_API_KEY set
export const resend = new Proxy({} as Resend, {
  get(_target, prop) {
    return (getResendClient() as Record<string, unknown>)[prop as string]
  },
})

export function isResendConfigured(): boolean {
  return !!process.env.RESEND_API_KEY
}

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Revolaunch <noreply@revolaunch.net>'
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://revolaunch.net'
