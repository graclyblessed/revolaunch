import { NextRequest, NextResponse } from 'next/server'
import { verifyLemonSqueezySignature } from '@/lib/lemonsqueezy'

// POST /api/billing/webhook — handle LemonSqueezy webhooks
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
    const userId = body.meta?.custom_data?.userId
    const sessionId = body.meta?.custom_data?.sessionId

    console.log(`[Webhook] ${eventName} for user ${userId || sessionId}`)

    switch (eventName) {
      case 'order_created': {
        // One-time payment (lifetime plan)
        const order = body.data.attributes
        const variantId = order.first_order_item?.variant_id
        console.log(`[Webhook] Order created: $${order.total} | Variant: ${variantId}`)

        // The client will verify plan status via /api/billing/verify
        // Store order info for verification
        break
      }

      case 'subscription_created':
      case 'subscription_payment_success': {
        // Recurring payment (monthly/annual)
        const sub = body.data.attributes
        const variantId = body.data.attributes.variant_id
        console.log(`[Webhook] Subscription: ${sub.status} | Variant: ${variantId} | Ends: ${sub.ends_at || 'renewing'}`)
        break
      }

      case 'subscription_updated': {
        const sub = body.data.attributes
        console.log(`[Webhook] Subscription updated: ${sub.status}`)
        break
      }

      case 'subscription_cancelled':
      case 'subscription_expired': {
        const sub = body.data.attributes
        console.log(`[Webhook] Subscription ${eventName}: ${sub.customer_id}`)
        break
      }

      default:
        console.log(`[Webhook] Unhandled event: ${eventName}`)
    }

    return NextResponse.json({ received: true, event: eventName })
  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
