import { NextRequest, NextResponse } from 'next/server'
import { verifyLemonSqueezySignature } from '@/lib/lemonsqueezy'
import { db } from '@/lib/db'
import { resend, FROM_EMAIL, isResendConfigured } from '@/lib/resend'

const SPONSOR_PLANS = ['1month', '3months', '12months'] as const
const SPONSOR_DURATION_DAYS: Record<string, number> = {
  '1month': 30,
  '3months': 90,
  '12months': 365,
}

// POST /api/billing/webhook — handle LemonSqueezy webhooks
// Handles both per-launch startup payments AND sponsor ad placements
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
    const sponsorPlan = customData.plan
    const startupName = customData.startupName
    const sponsorName = customData.sponsorName
    const sponsorWebsite = customData.website
    const userId = customData.userId
    const buyerEmail = body.data?.attributes?.user_email || customData.email || ''

    const isSponsorPayment = sponsorPlan && SPONSOR_PLANS.includes(sponsorPlan)
    const isLaunchPayment = !!tier

    console.log(`[Webhook] ${eventName} | ${isSponsorPayment ? `Sponsor: ${sponsorPlan}` : isLaunchPayment ? `Launch: ${tier}` : 'Unknown'} | OrderID: ${body.data?.id}`)

    switch (eventName) {
      case 'order_created': {
        const order = body.data.attributes
        const total = order.total
        const status = order.status
        const orderId = body.data?.id
        console.log(`[Webhook] Order created: $${total} | Status: ${status} | OrderID: ${orderId}`)

        if (status !== 'paid') break

        // ─── Handle Sponsor Payment ───
        if (isSponsorPayment) {
          try {
            const days = SPONSOR_DURATION_DAYS[sponsorPlan] || 30
            const expiresAt = new Date()
            expiresAt.setDate(expiresAt.getDate() + days)

            await db.sponsorSlot.create({
              data: {
                companyName: sponsorName || 'Sponsor',
                website: sponsorWebsite || '',
                logo: null,
                tagline: null,
                plan: sponsorPlan,
                status: 'active',
                startsAt: new Date(),
                expiresAt,
              },
            })

            console.log(`[Webhook] Sponsor slot created: ${sponsorName || 'Sponsor'} | Plan: ${sponsorPlan} | Expires: ${expiresAt.toISOString()}`)

            // Send confirmation email to buyer
            if (buyerEmail && isResendConfigured()) {
              try {
                await resend.emails.send({
                  from: FROM_EMAIL,
                  to: [buyerEmail],
                  subject: `Sponsorship Activated — ${sponsorPlan} Plan`,
                  html: `
                    <div style="max-width: 560px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1a1a1a;">
                      <div style="background: linear-gradient(135deg, #F97316, #F59E0B); padding: 32px; border-radius: 12px 12px 0 0; text-align: center;">
                        <h1 style="color: white; margin: 0; font-size: 24px;">Welcome, Sponsor!</h1>
                        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">Your ${sponsorPlan} sponsorship is now active.</p>
                      </div>
                      <div style="padding: 32px; background: white; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
                        <p style="font-size: 16px; line-height: 1.6;">Thank you for sponsoring Revolaunch! Your brand will be visible to thousands of founders, investors, and tech enthusiasts.</p>
                        <div style="background: #FFF7ED; border: 1px solid #FED7AA; border-radius: 8px; padding: 16px; margin: 20px 0;">
                          <p style="margin: 0 0 4px; font-weight: 600; font-size: 14px;">Next Steps</p>
                          <p style="margin: 0; font-size: 14px; color: #6B7280;">Reply to this email with your logo (SVG or PNG) and we will get your sponsorship live within 24 hours.</p>
                        </div>
                        <p style="font-size: 14px; color: #6B7280;">Your sponsorship expires on <strong>${expiresAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong>.</p>
                        <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
                          <a href="https://revolaunch.net" style="display: inline-block; background: #F97316; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Visit Revolaunch</a>
                        </div>
                      </div>
                    </div>
                  `,
                })
                console.log(`[Webhook] Sponsor confirmation email sent to ${buyerEmail}`)
              } catch (emailErr) {
                console.error('[Webhook] Failed to send sponsor confirmation email:', emailErr)
              }
            }
          } catch (dbErr) {
            console.error('[Webhook] Sponsor slot creation failed:', dbErr)
          }
          break
        }

        // ─── Handle Launch Payment ───
        if (isLaunchPayment) {
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
        console.log(`[Webhook] Order refunded | OrderID: ${body.data?.id}`)

        // Handle sponsor refund — expire the sponsor slot
        if (isSponsorPayment && sponsorName) {
          try {
            await db.sponsorSlot.updateMany({
              where: { companyName: sponsorName, status: 'active' },
              data: { status: 'expired' },
            })
            console.log(`[Webhook] Expired sponsor slot for ${sponsorName}`)
          } catch (dbErr) {
            console.error('[Webhook] Sponsor refund DB update failed:', dbErr)
          }
          break
        }

        // Handle launch refund — remove paid tier benefits
        if (isLaunchPayment) {
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
