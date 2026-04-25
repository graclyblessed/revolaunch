import { NextRequest, NextResponse } from 'next/server'
import { createCheckout, isLemonSqueezyConfigured } from '@/lib/lemonsqueezy-client'
import { SPONSOR_VARIANTS } from '@/lib/lemonsqueezy-client'

export async function POST(req: NextRequest) {
  try {
    const { plan, sponsorName, website } = await req.json()

    if (!plan || !['1month', '3months', '12months'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid sponsor plan' }, { status: 400 })
    }

    if (!isLemonSqueezyConfigured) {
      return NextResponse.json({
        checkoutUrl: null,
        plan,
        demo: true,
        message: 'Demo mode — sponsorship activated without payment',
      })
    }

    const variantId = SPONSOR_VARIANTS[plan as keyof typeof SPONSOR_VARIANTS]
    if (!variantId) {
      return NextResponse.json(
        { error: 'No product variant configured for this sponsor plan' },
        { status: 500 },
      )
    }

    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://revolaunch.net'}/sponsor?confirmed=true`

    const { data, error } = await createCheckout({
      storeId: process.env.LEMONSQUEEZY_STORE_ID || '',
      variantId,
      custom: { plan, sponsorName: sponsorName || '', website: website || '' },
      checkoutData: {
        redirectUrl,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
    })

    if (error) {
      return NextResponse.json({ error: 'Failed to create checkout' }, { status: 500 })
    }

    return NextResponse.json({ checkoutUrl: data?.url, checkoutId: data?.id, plan })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
