import {
  lemonSqueezySetup,
  createCheckout,
  getSubscription,
  getOrder,
} from '@lemonsqueezy/lemonsqueezy.js'

// Configure LemonSqueezy if API key is present
if (process.env.LEMONSQUEEZY_API_KEY) {
  lemonSqueezySetup({
    apiKey: process.env.LEMONSQUEEZY_API_KEY,
  })
}

export const isLemonSqueezyConfigured = !!process.env.LEMONSQUEEZY_API_KEY

// ─── One-time Launch Product Variants (pay-per-launch) ───
// Create these products in LemonSqueezy dashboard as "one-time" products
export const LAUNCH_VARIANTS = {
  premium: process.env.LEMONSQUEEZY_VARIANT_PREMIUM || '',
  'premium-plus': process.env.LEMONSQUEEZY_VARIANT_PREMIUM_PLUS || '',
  'seo-growth': process.env.LEMONSQUEEZY_VARIANT_SEO_GROWTH || '',
}

// Legacy subscription variants (kept for backward compatibility)
export const VARIANTS = {
  monthly: process.env.LEMONSQUEEZY_VARIANT_MONTHLY || '',
  annual: process.env.LEMONSQUEEZY_VARIANT_ANNUAL || '',
  lifetime: process.env.LEMONSQUEEZY_VARIANT_LIFETIME || '',
}

// ─── Tier to variant mapping ───
export function getVariantForTier(tier: string): string {
  switch (tier) {
    case 'premium': return LAUNCH_VARIANTS.premium
    case 'premium-plus': return LAUNCH_VARIANTS['premium-plus']
    case 'seo-growth': return LAUNCH_VARIANTS['seo-growth']
    default: return ''
  }
}

// ─── Checkout redirect URLs ───
export function getCheckoutRedirectUrl(tier: string, startupName?: string): string {
  const params = new URLSearchParams()
  if (tier) params.set('tier', tier)
  if (startupName) params.set('name', startupName)
  return `${process.env.NEXT_PUBLIC_APP_URL || 'https://revolaunch.net'}/launch-confirmation?${params.toString()}`
}

export { createCheckout, getSubscription, getOrder }
