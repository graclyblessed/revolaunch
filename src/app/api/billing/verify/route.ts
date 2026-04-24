import { NextRequest, NextResponse } from 'next/server'
import { getSubscription, getOrder, isLemonSqueezyConfigured } from '@/lib/lemonsqueezy-client'

// GET /api/billing/verify — verify subscription status
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const orderId = searchParams.get('order_id')
    const subscriptionId = searchParams.get('subscription_id')

    if (!isLemonSqueezyConfigured) {
      return NextResponse.json({ active: false, plan: 'free' }, { status: 200 })
    }

    let active = false
    let plan = 'free'
    let cycle: string | null = null

    if (subscriptionId) {
      const { data, error } = await getSubscription(subscriptionId)
      if (!error && data) {
        const attrs = data.attributes
        active = attrs.status === 'active' || attrs.status === 'on_trial'
        if (active) {
          plan = 'pro'
          cycle = 'recurring'
        }
      }
    } else if (orderId) {
      const { data, error } = await getOrder(orderId)
      if (!error && data) {
        const attrs = data.attributes
        active = attrs.status === 'paid'
        if (active) {
          plan = 'pro'
          cycle = 'lifetime'
        }
      }
    }

    return NextResponse.json({ active, plan, cycle })
  } catch (err) {
    console.error('Verify error:', err)
    return NextResponse.json({ active: false, plan: 'free' }, { status: 200 })
  }
}
