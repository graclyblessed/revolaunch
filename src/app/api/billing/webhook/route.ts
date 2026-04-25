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
        const orderId = body.data?.id
        console.log(`[Webhook] Order created: $${total} | Status: ${status} | Variant: ${variantId} | OrderID: ${orderId}`)

        // If order is paid, activate the launch tier on the startup
        if (status === 'paid' && tier) {
          try {
            // Determine tier benefits
            const isPremiumPlus = tier === 'premium-plus'
            const isSeoGrowth = tier === 'seo-growth'
            const isPremium = tier === 'premium' || isPremiumPlus || isSeoGrowth
            const isFeatured = isPremiumPlus || isSeoGrowth

            // Build update data with full paid tier deliverables
            const updateData: Record<string, unknown> = {
              launchTier: tier,
              featured: isFeatured,
              badgeVerified: isPremium,
              badgeVerifiedAt: isPremium ? new Date() : null,
            }

            // Set launch date if not already set (for paid tiers)
            if (isPremium) {
              // Assign next available launch date (2 days from now)
              const launchDate = new Date()
              launchDate.setDate(launchDate.getDate() + 2)
              updateData.launchDate = launchDate
            }

            // Find and update the startup
            const whereClause = userId
              ? { email: userId, status: 'active' }
              : { name: startupName, status: 'active' }

            const result = await db.startup.updateMany({
              where: whereClause,
              data: updateData,
            })

            console.log(`[Webhook] Activated ${tier} tier for ${startupName || userId}: ${result.count} startup(s) updated`)
            console.log(`[Webhook] Benefits granted: featured=${isFeatured}, badgeVerified=${isPremium}, launchDate=${updateData.launchDate ? 'set' : 'no'}`)
          } catch (dbErr) {
            console.error('[Webhook] DB update failed:', dbErr)
          }
        }
        break
      }

      case 'order_refunded': {
        const order = body.data.attributes
        console.log(`[Webhook] Order refunded: ${order.first_order_item?.variant_id} | Tier: ${tier}`)

        // On refund, remove paid tier benefits but keep the listing
        if (tier) {
          try {
            const whereClause = userId
              ? { email: userId, status: 'active' }
              : { name: startupName, status: 'active' }

            await db.startup.updateMany({
              where: whereClause,
              data: {
                launchTier: 'free',
                featured: false,
                badgeVerified: false,
                badgeVerifiedAt: null,
              },
            })
            console.log(`[Webhook] Downgraded ${startupName || userId} to free tier after refund`)
          } catch (dbErr) {
            console.error('[Webhook] Refund DB update failed:', dbErr)
          }
        }
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
