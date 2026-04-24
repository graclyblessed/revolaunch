import { NextRequest, NextResponse } from 'next/server'
import { createCheckout, isLemonSqueezyConfigured, getVariantForTier, getCheckoutRedirectUrl } from '@/lib/lemonsqueezy-client'
import { LAUNCH_TIERS, type LaunchTier } from '@/lib/launch-tiers'

// POST /api/billing/checkout — create a per-launch checkout
// Body: { tier: LaunchTier, startupName?: string, founderEmail?: string }
export async function POST(req: NextRequest) {
  try {
    const { tier, startupName, founderEmail } = await req.json()

    if (!tier || !['premium', 'premium-plus', 'seo-growth'].includes(tier)) {
      return NextResponse.json(
        { error: 'Invalid tier. Must be premium, premium-plus, or seo-growth.' },
        { status: 400 }
      )
    }

    // Free tier doesn't need checkout
    if (tier === 'free') {
      return NextResponse.json({
        checkoutUrl: null,
        tier: 'free',
        message: 'Free launch — no payment required',
      })
    }

    if (!isLemonSqueezyConfigured) {
      // Demo mode — proceed without payment
      return NextResponse.json({
        checkoutUrl: null,
        tier,
        demo: true,
        message: 'Demo mode — launch proceeding without payment',
      })
    }

    const variantId = getVariantForTier(tier)
    if (!variantId) {
      return NextResponse.json(
        { error: `No product variant configured for ${tier}. Set LEMONSQUEEZY_VARIANT_${tier.toUpperCase().replace('-', '_')} in env.` },
        { status: 500 }
      )
    }

    const redirectUrl = getCheckoutRedirectUrl(tier, startupName)

    const { data, error } = await createCheckout({
      storeId: process.env.LEMONSQUEEZY_STORE_ID || '',
      variantId,
      custom: {
        userId: founderEmail || 'anonymous',
        tier,
        startupName: startupName || 'unnamed',
      },
      checkoutData: {
        redirectUrl,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h expiry
      },
    })

    if (error) {
      console.error('LemonSqueezy checkout error:', error)
      return NextResponse.json({ error: 'Failed to create checkout' }, { status: 500 })
    }

    const tierConfig = LAUNCH_TIERS[tier as LaunchTier]

    return NextResponse.json({
      checkoutUrl: data?.url,
      checkoutId: data?.id,
      tier,
      amount: tierConfig.price,
      currency: 'USD',
    })
  } catch (err) {
    console.error('Checkout API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
