import { NextRequest, NextResponse } from 'next/server'
import { createCheckout, isLemonSqueezyConfigured } from '@/lib/lemonsqueezy-client'

// POST /api/billing/checkout — create a checkout URL
export async function POST(req: NextRequest) {
  try {
    const { variantId, customData } = await req.json()

    if (!variantId) {
      return NextResponse.json({ error: 'variantId is required' }, { status: 400 })
    }

    if (!isLemonSqueezyConfigured) {
      return NextResponse.json(
        { error: 'LemonSqueezy not configured. Set LEMONSQUEEZY_API_KEY in env.' },
        { status: 500 }
      )
    }

    const { data, error } = await createCheckout({
      storeId: process.env.LEMONSQUEEZY_STORE_ID || '',
      variantId,
      custom: customData || {},
    })

    if (error) {
      console.error('LemonSqueezy checkout error:', error)
      return NextResponse.json({ error: 'Failed to create checkout' }, { status: 500 })
    }

    return NextResponse.json({
      checkoutUrl: data?.url,
      checkoutId: data?.id,
    })
  } catch (err) {
    console.error('Checkout API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
