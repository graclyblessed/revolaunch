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

// Variant IDs — set these in .env after creating products in LemonSqueezy
export const VARIANTS = {
  monthly: process.env.LEMONSQUEEZY_VARIANT_MONTHLY || '',
  annual: process.env.LEMONSQUEEZY_VARIANT_ANNUAL || '',
  lifetime: process.env.LEMONSQUEEZY_VARIANT_LIFETIME || '',
}

export { createCheckout, getSubscription, getOrder }
