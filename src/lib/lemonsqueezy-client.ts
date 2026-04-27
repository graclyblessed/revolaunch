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

// ─── Sponsor Product Variants (one-time) ───
export const SPONSOR_VARIANTS = {
  '1month': process.env.LEMONSQUEEZY_VARIANT_SPONSOR_1M || '',
  '3months': process.env.LEMONSQUEEZY_VARIANT_SPONSOR_3M || '',
  '12months': process.env.LEMONSQUEEZY_VARIANT_SPONSOR_12M || '',
}

// Legacy subscription variants (kept for backward compatibility)
export const VARIANTS = {
  monthly: process.env.LEMONSQUEEZY_VARIANT_MONTHLY || '',
  annual: process.env.LEMONSQUEEZY_VARIANT_ANNUAL || '',
  lifetime: process.env.LEMONSQUEEZY_VARIANT_LIFETIME || '',
}

// ─── Monthly Subscription Variants ───
// Create these products in LemonSqueezy dashboard as "subscription" products
export const SUBSCRIPTION_VARIANTS = {
  pro: process.env.LEMONSQUEEZY_VARIANT_SUBSCRIPTION_PRO || '',
  enterprise: process.env.LEMONSQUEEZY_VARIANT_SUBSCRIPTION_ENTERPRISE || '',
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

export function getVariantForSponsorPlan(plan: string): string {
  switch (plan) {
    case '1month': return SPONSOR_VARIANTS['1month']
    case '3months': return SPONSOR_VARIANTS['3months']
    case '12months': return SPONSOR_VARIANTS['12months']
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

// ─── Subscription plan to variant mapping ───
export function getVariantForSubscriptionPlan(plan: string): string {
  switch (plan) {
    case 'pro': return SUBSCRIPTION_VARIANTS.pro
    case 'enterprise': return SUBSCRIPTION_VARIANTS.enterprise
    default: return ''
  }
}
