import { NextResponse } from 'next/server'
import { apiResponse } from '@/lib/api-auth'

// POST /api/api-subscription/checkout — Placeholder for API tier checkout
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { tier, email } = body

    // Validate inputs
    const validTiers = ['pro', 'enterprise']
    if (!validTiers.includes(tier)) {
      return apiResponse({ error: 'Invalid tier. Must be "pro" or "enterprise".' }, 400)
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return apiResponse({ error: 'A valid email address is required.' }, 400)
    }

    // Check if LemonSqueezy is configured
    const lemonSqueezyKey = process.env.LEMONSQUEEZY_API_KEY
    const isConfigured = !!lemonSqueezyKey

    if (isConfigured) {
      // Placeholder: in production, create a LemonSqueezy checkout here
      // For now, return a message indicating the feature is coming
      return apiResponse({
        demo: true,
        tier,
        email,
        message: `API subscription checkout for "${tier}" tier is not yet configured. Subscription products will be available soon. Contact sales@revolaunch.net for early access.`,
      }, 200)
    }

    return apiResponse({
      demo: true,
      tier,
      email,
      message: 'API subscription checkout not yet configured. Contact sales@revolaunch.net',
    }, 200)
  } catch (error) {
    console.error('[API Subscription Checkout] Error:', error)
    return apiResponse({ error: 'Failed to process checkout request' }, 500)
  }
}
