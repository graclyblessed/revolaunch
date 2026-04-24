import { NextRequest, NextResponse } from 'next/server'
import { verifyLemonSqueezySignature } from '@/lib/lemonsqueezy'
import { db } from '@/lib/db'

// POST /api/billing/webhook — handle LemonSqueezy webhooks for per-launch payments
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
    const customData = body.meta?.custom_data || {}
    const tier = customData.tier
    const startupName = customData.startupName
    const userId = customData.userId

    console.log(`[Webhook] ${eventName} | Tier: ${tier || 'N/A'} | Startup: ${startupName || 'N/A'}`)

    switch (eventName) {
      case 'order_created': {
        const order = body.data.attributes
        const variantId = order.first_order_item?.variant_id
        const total = order.total
        const status = order.status
        console.log(`[Webhook] Order created: $${total} | Status: ${status} | Variant: ${variantId}`)

        // If order is paid, activate the launch tier on the startup
        if (status === 'paid' && tier) {
          try {
            // Find the most recent pending startup by this founder
            await db.startup.updateMany({
              where: {
                email: userId || undefined,
                launchTier: tier,
                status: 'active',
              },
              data: {
                featured: tier === 'premium-plus' || tier === 'seo-growth',
              },
            })
            console.log(`[Webhook] Activated ${tier} tier for ${startupName || userId}`)
          } catch (dbErr) {
            console.error('[Webhook] DB update failed:', dbErr)
          }
        }
        break
      }

      case 'order_refunded': {
        const order = body.data.attributes
        console.log(`[Webhook] Order refunded: ${order.first_order_item?.variant_id} | Tier: ${tier}`)
        // Could downgrade startup tier here if needed
        break
      }

      default:
        console.log(`[Webhook] Event received: ${eventName}`)
    }

    return NextResponse.json({ received: true, event: eventName })
  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
