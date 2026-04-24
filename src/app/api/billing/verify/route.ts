import { NextRequest, NextResponse } from 'next/server'
import { getOrder, isLemonSqueezyConfigured } from '@/lib/lemonsqueezy-client'

// GET /api/billing/verify — verify a one-time launch payment
// Query: order_id, tier
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const orderId = searchParams.get('order_id')
    const tier = searchParams.get('tier')

    if (!isLemonSqueezyConfigured) {
      // Demo mode — always active
      return NextResponse.json({
        active: true,
        plan: tier || 'free',
        cycle: 'one-time',
        demo: true,
      })
    }

    if (!orderId) {
      return NextResponse.json({ active: false, plan: 'free', cycle: null })
    }

    const { data, error } = await getOrder(orderId)
    if (!error && data) {
      const attrs = data.attributes
      const isPaid = attrs.status === 'paid'
      return NextResponse.json({
        active: isPaid,
        plan: isPaid ? (tier || 'premium') : 'free',
        cycle: isPaid ? 'one-time' : null,
        amount: attrs.total,
        currency: attrs.currency_code || 'usd',
      })
    }

    return NextResponse.json({ active: false, plan: 'free', cycle: null })
  } catch (err) {
    console.error('Verify error:', err)
    return NextResponse.json({ active: false, plan: 'free', cycle: null })
  }
}
