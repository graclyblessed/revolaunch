import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { type, data } = await req.json()

    // Note: For production, verify the webhook signature using svix:
    // import { Webhook } from 'svix'
    // const wh = new Webhook(process.env.RESEND_WEBHOOK_SECRET)

    if (!type || !data?.email_id) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const { db } = await import('@/lib/db')
    if (!db) {
      console.warn('[Resend Webhook] DB not available')
      return NextResponse.json({ received: true })
    }

    // Find the claim email by Resend ID
    const claimEmail = await db.claimEmail.findFirst({
      where: { resendId: data.email_id },
    })

    if (!claimEmail) {
      // Not a claim email — might be another type of email
      console.log(`[Resend Webhook] No claim email found for resendId: ${data.email_id}`)
      return NextResponse.json({ received: true })
    }

    const updates: Record<string, unknown> = {}

    switch (type) {
      case 'email.delivered':
        updates.status = 'delivered'
        updates.deliveredAt = new Date()
        break
      case 'email.bounced':
        updates.status = 'bounced'
        updates.bouncedAt = new Date()
        updates.bounceReason = data.reason || 'Unknown'
        break
      case 'email.opened':
        if (!claimEmail.openedAt) {
          updates.status = 'opened'
          updates.openedAt = new Date()
        }
        break
      case 'email.clicked':
        if (!claimEmail.clickedAt) {
          updates.status = 'clicked'
          updates.clickedAt = new Date()
        }
        break
      case 'email.complained':
        updates.status = 'bounced'
        updates.bouncedAt = new Date()
        updates.bounceReason = 'Spam complaint'
        break
      case 'email.failed':
        updates.status = 'failed'
        break
      default:
        console.log(`[Resend Webhook] Unhandled event type: ${type}`)
    }

    if (Object.keys(updates).length > 0) {
      await db.claimEmail.update({
        where: { id: claimEmail.id },
        data: updates,
      })
    }

    console.log(`[Resend Webhook] ${type} for ${claimEmail.startupId} → status: ${updates.status || 'unchanged'}`)

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[Resend Webhook] Error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
