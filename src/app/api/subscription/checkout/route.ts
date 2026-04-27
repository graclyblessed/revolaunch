import { NextRequest, NextResponse } from 'next/server'
import { isLemonSqueezyConfigured } from '@/lib/lemonsqueezy-client'

// POST /api/subscription/checkout — Create a subscription checkout
// Body: { plan: "pro" | "enterprise", email: string }
export async function POST(req: NextRequest) {
  try {
    const { plan, email } = await req.json()

    if (!plan || !['pro', 'enterprise'].includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan. Must be pro or enterprise.' },
        { status: 400 }
      )
    }

    if (!email) {
      return NextResponse.json(
        { error: 'email is required' },
        { status: 400 }
      )
    }

    if (!isLemonSqueezyConfigured) {
      // Demo mode — return a placeholder response
      return NextResponse.json({
        checkoutUrl: null,
        plan,
        email,
        demo: true,
        message: 'Demo mode — subscription checkout not configured. Set LEMONSQUEEZY_API_KEY and subscription product variants in environment variables to enable.',
      })
    }

    // TODO: When LemonSqueezy subscription products are configured:
    // 1. Get variant ID from SUBSCRIPTION_VARIANTS[plan]
    // 2. Create checkout with createCheckout() using the variant
    // 3. Return the checkout URL
    //
    // Example:
    // const variantId = getVariantForSubscriptionPlan(plan)
    // if (!variantId) {
    //   return NextResponse.json({ error: `No subscription variant configured for ${plan}` }, { status: 500 })
    // }
    // const { data, error } = await createCheckout({
    //   storeId: process.env.LEMONSQUEEZY_STORE_ID || '',
    //   variantId,
    //   custom: { userId: email, plan },
    //   checkoutData: {
    //     redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://revolaunch.net'}/dashboard`,
    //     expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    //   },
    // })

    return NextResponse.json({
      checkoutUrl: null,
      plan,
      email,
      message: 'Subscription products need to be configured in LemonSqueezy dashboard.',
    })
  } catch (err) {
    console.error('Subscription checkout error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
