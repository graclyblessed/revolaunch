import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'

// LemonSqueezy webhook signature verification
export function verifyLemonSqueezySignature(
  body: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature || !secret) return false

  // Signature format: t=timestamp,v1=hex
  const parts = signature.split(',')
  const timestamp = parts.find(p => p.startsWith('t='))?.replace('t=', '')
  const v1Signature = parts.find(p => p.startsWith('v1='))?.replace('v1=', '')

  if (!timestamp || !v1Signature) return false

  // 5 minute replay window
  const fiveMinutes = 300
  const currentTime = Math.floor(Date.now() / 1000)
  if (Math.abs(currentTime - parseInt(timestamp)) > fiveMinutes) {
    return false
  }

  // Rebuild signed payload
  const signedPayload = `${timestamp}.${body}`
  const expectedSignature = createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex')

  // Timing-safe comparison
  const expectedBuffer = Buffer.from(expectedSignature)
  const providedBuffer = Buffer.from(v1Signature)

  if (expectedBuffer.length !== providedBuffer.length) {
    return false
  }

  return crypto.timingSafeEqual(expectedBuffer, providedBuffer)
}

export function lemonSqueezyWebhookHandler(req: NextRequest) {
  const signature = req.headers.get('x-signature')
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET || ''

  if (!secret) {
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    )
  }

  return signature
}
