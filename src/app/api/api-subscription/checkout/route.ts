import { NextRequest, NextResponse } from 'next/server'
import { apiResponse, corsHeaders } from '@/lib/api-auth'
import {
  createCheckout,
  isLemonSqueezyConfigured,
  getVariantForSubscriptionPlan,
} from '@/lib/lemonsqueezy-client'

// API tier pricing details (for receipt display)
const API_TIER_DETAILS: Record<string, { name: string; monthlyLimit: number; price: string }> = {
  pro: { name: 'Pro', monthlyLimit: 10_000, price: '$19/mo' },
  enterprise: { name: 'Enterprise', monthlyLimit: 100_000, price: '$79/mo' },
}

// POST /api/api-subscription/checkout — Create a LemonSqueezy checkout for API tier upgrade
export async function POST(request: NextRequest) {
  const preflightResponse = handlePreflight(request)
  if (preflightResponse) return preflightResponse

  try {
    const body = await request.json()
    const { tier, email, redirectUrl: customRedirect } = body

    // Validate inputs
    const validTiers = ['pro', 'enterprise']
    if (!validTiers.includes(tier)) {
      return apiResponse({ error: 'Invalid tier. Must be "pro" or "enterprise".' }, 400)
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return apiResponse({ error: 'A valid email address is required.' }, 400)
    }

    // If LemonSqueezy not configured, return demo message
    if (!isLemonSqueezyConfigured) {
      return apiResponse({
        demo: true,
        tier,
        email,
        tierDetails: API_TIER_DETAILS[tier],
        message: `API subscription checkout for "${tier}" tier is not yet configured. Subscription products will be available once LemonSqueezy is set up. Contact hello@revolaunch.net for early access.`,
      }, 200)
    }

    const variantId = getVariantForSubscriptionPlan(tier)
    if (!variantId) {
      return apiResponse(
        { error: `No product variant configured for API "${tier}" tier. Set LEMONSQUEEZY_VARIANT_SUBSCRIPTION_${tier.toUpperCase()} in env.` },
        { status: 500 }
      )
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://revolaunch.net'
    const redirectUrl = customRedirect || `${appUrl}/api/subscription?tier=${tier}&status=success`
    const successUrl = `${appUrl}/api/subscription?tier=${tier}&status=success`

    const { data, error } = await createCheckout({
      storeId: process.env.LEMONSQUEEZY_STORE_ID || '',
      variantId,
      productOptions: {
        name: `Revolaunch API — ${API_TIER_DETAILS[tier].name}`,
        description: `${API_TIER_DETAILS[tier].monthlyLimit.toLocaleString()} requests/month with priority support`,
        receiptButtonText: 'Upgrade API Access',
        redirectUrl,
      },
      checkoutData: {
        email,
        custom: {
          type: 'api_subscription',
          tier,
          email,
        },
      },
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h expiry
    })

    if (error) {
      console.error('[API Subscription Checkout] LemonSqueezy error:', error)
      return apiResponse({ error: 'Failed to create checkout session' }, 500)
    }

    return apiResponse({
      checkoutUrl: data?.url,
      checkoutId: data?.id,
      tier,
      tierDetails: API_TIER_DETAILS[tier],
    }, 201)
  } catch (error) {
    console.error('[API Subscription Checkout] Error:', error)
    return apiResponse({ error: 'Failed to process checkout request' }, 500)
  }
}

function handlePreflight(request: Request): Response | null {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() })
  }
  return null
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() })
}
