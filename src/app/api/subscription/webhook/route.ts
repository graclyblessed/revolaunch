import { NextRequest, NextResponse } from 'next/server'
import { verifyLemonSqueezySignature } from '@/lib/lemonsqueezy'
import { db, isDbAvailable } from '@/lib/db'

// POST /api/subscription/webhook — Handle LemonSqueezy subscription webhooks
// Processes: subscription_created, subscription_updated, subscription_cancelled
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get('x-signature')
    const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET || ''

    // Verify signature
    if (!verifyLemonSqueezySignature(rawBody, signature, secret)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const body = JSON.parse(rawBody)
    const eventName = body.meta?.event_name
    const subscriptionData = body.data
    const attrs = subscriptionData?.attributes
    const lemonSqueezyId = subscriptionData?.id?.toString()
    const userEmail = attrs?.user_email || ''
    const status = attrs?.status // active, paused, cancelled, expired, past_due
    const currentPeriodEnd = attrs?.renews_at ? new Date(attrs.renews_at) : null
    const plan = 'pro' // Default plan; adjust based on variant_id if needed

    console.log(`[Subscription Webhook] ${eventName} | ID: ${lemonSqueezyId} | Email: ${userEmail} | Status: ${status}`)

    if (!db || !(await isDbAvailable())) {
      console.error('[Subscription Webhook] Database not available')
      return NextResponse.json({ error: 'Database not available' }, { status: 503 })
    }

    if (!userEmail || !lemonSqueezyId) {
      console.error('[Subscription Webhook] Missing required data: email or subscription ID')
      return NextResponse.json({ error: 'Missing required data' }, { status: 400 })
    }

    // Map LemonSqueezy status to our status
    const mapStatus = (lsStatus: string): string => {
      switch (lsStatus) {
        case 'active': return 'active'
        case 'paused': return 'paused'
        case 'cancelled': return 'cancelled'
        case 'expired': return 'expired'
        case 'past_due': return 'past_due'
        default: return 'active'
      }
    }

    switch (eventName) {
      case 'subscription_created': {
        try {
          // Check if subscription already exists (idempotent)
          const existing = await db.subscription.findUnique({
            where: { lemonSqueezyId },
          })

          if (existing) {
            // Update existing
            await db.subscription.update({
              where: { lemonSqueezyId },
              data: {
                email: userEmail,
                status: mapStatus(status),
                currentPeriodEnd,
              },
            })
            console.log(`[Subscription Webhook] Updated existing subscription: ${lemonSqueezyId}`)
          } else {
            // Create new
            await db.subscription.create({
              data: {
                email: userEmail,
                plan,
                status: mapStatus(status),
                lemonSqueezyId,
                currentPeriodEnd,
              },
            })
            console.log(`[Subscription Webhook] Created new subscription: ${lemonSqueezyId} for ${userEmail}`)
          }
        } catch (dbErr) {
          console.error('[Subscription Webhook] DB error (subscription_created):', dbErr)
        }
        break
      }

      case 'subscription_updated': {
        try {
          const existing = await db.subscription.findUnique({
            where: { lemonSqueezyId },
          })

          if (existing) {
            await db.subscription.update({
              where: { lemonSqueezyId },
              data: {
                email: userEmail,
                status: mapStatus(status),
                currentPeriodEnd,
              },
            })
            console.log(`[Subscription Webhook] Updated subscription: ${lemonSqueezyId} -> ${status}`)
          } else {
            // Create if doesn't exist (shouldn't happen but safety net)
            await db.subscription.create({
              data: {
                email: userEmail,
                plan,
                status: mapStatus(status),
                lemonSqueezyId,
                currentPeriodEnd,
              },
            })
            console.log(`[Subscription Webhook] Created subscription on update: ${lemonSqueezyId}`)
          }
        } catch (dbErr) {
          console.error('[Subscription Webhook] DB error (subscription_updated):', dbErr)
        }
        break
      }

      case 'subscription_cancelled': {
        try {
          const existing = await db.subscription.findUnique({
            where: { lemonSqueezyId },
          })

          if (existing) {
            await db.subscription.update({
              where: { lemonSqueezyId },
              data: {
                status: 'cancelled',
              },
            })
            console.log(`[Subscription Webhook] Cancelled subscription: ${lemonSqueezyId}`)
          }
        } catch (dbErr) {
          console.error('[Subscription Webhook] DB error (subscription_cancelled):', dbErr)
        }
        break
      }

      default:
        console.log(`[Subscription Webhook] Unhandled event: ${eventName}`)
    }

    return NextResponse.json({ received: true, event: eventName })
  } catch (err) {
    console.error('Subscription webhook error:', err)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
