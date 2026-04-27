import { NextRequest, NextResponse } from 'next/server'
import { verifyLemonSqueezySignature } from '@/lib/lemonsqueezy'
import { db, isDbAvailable } from '@/lib/db'
import { SUBSCRIPTION_VARIANTS } from '@/lib/lemonsqueezy-client'

// Reverse lookup: variant_id → plan name
function getPlanFromVariantId(variantId: string): string {
  for (const [plan, vid] of Object.entries(SUBSCRIPTION_VARIANTS)) {
    if (vid === variantId) return plan
  }
  return 'pro' // Default fallback
}

// Tier to API rate limits
const TIER_LIMITS: Record<string, number> = {
  free: 1000,
  pro: 10_000,
  enterprise: 100_000,
}

// POST /api/subscription/webhook — Handle LemonSqueezy subscription webhooks
// Processes: subscription_created, subscription_updated, subscription_cancelled, subscription_expired
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
    const userEmail = attrs?.user_email || attrs?.customer_email || ''
    const status = attrs?.status // active, paused, cancelled, expired, past_due
    const currentPeriodEnd = attrs?.renews_at ? new Date(attrs.renews_at) : null
    const variantId = attrs?.variant_id?.toString() || ''

    // Detect plan from variant_id (instead of hardcoding 'pro')
    const plan = getPlanFromVariantId(variantId)

    console.log(`[Subscription Webhook] ${eventName} | ID: ${lemonSqueezyId} | Email: ${userEmail} | Plan: ${plan} | Status: ${status}`)

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
      case 'subscription_created':
      case 'subscription_updated': {
        try {
          // Upsert subscription record
          await db.subscription.upsert({
            where: { lemonSqueezyId },
            create: {
              email: userEmail,
              plan,
              status: mapStatus(status),
              lemonSqueezyId,
              currentPeriodEnd,
            },
            update: {
              email: userEmail,
              plan,
              status: mapStatus(status),
              currentPeriodEnd,
            },
          })

          // Auto-upgrade API keys: if user has API keys, boost them to match subscription tier
          if (plan && mapStatus(status) === 'active') {
            const monthlyLimit = TIER_LIMITS[plan] || TIER_LIMITS.pro
            const upgraded = await db.apiKey.updateMany({
              where: { name: { contains: userEmail } }, // Best-effort match by email in key name
              data: { tier: plan, monthlyRateLimit: monthlyLimit, rateLimit: monthlyLimit },
            })
            if (upgraded.count > 0) {
              console.log(`[Subscription Webhook] Upgraded ${upgraded.count} API key(s) to ${plan} for ${userEmail}`)
            }

            // Also try matching via a subscription email mapping
            // (users who created keys with a different name won't be auto-upgraded,
            //  but their rate limits will be enforced via the subscription record)
          }

          console.log(`[Subscription Webhook] ${eventName === 'subscription_created' ? 'Created' : 'Updated'} subscription: ${lemonSqueezyId} (${plan}) for ${userEmail}`)
        } catch (dbErr) {
          console.error(`[Subscription Webhook] DB error (${eventName}):`, dbErr)
        }
        break
      }

      case 'subscription_cancelled':
      case 'subscription_expired': {
        try {
          const existing = await db.subscription.findUnique({
            where: { lemonSqueezyId },
          })

          if (existing) {
            await db.subscription.update({
              where: { lemonSqueezyId },
              data: {
                status: eventName === 'subscription_expired' ? 'expired' : 'cancelled',
              },
            })

            // Downgrade API keys back to free tier
            const downgraded = await db.apiKey.updateMany({
              where: { name: { contains: userEmail }, tier: existing.plan },
              data: { tier: 'free', monthlyRateLimit: TIER_LIMITS.free, rateLimit: TIER_LIMITS.free },
            })
            if (downgraded.count > 0) {
              console.log(`[Subscription Webhook] Downgraded ${downgraded.count} API key(s) to free for ${userEmail}`)
            }

            console.log(`[Subscription Webhook] ${eventName}: ${lemonSqueezyId}`)
          }
        } catch (dbErr) {
          console.error(`[Subscription Webhook] DB error (${eventName}):`, dbErr)
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
