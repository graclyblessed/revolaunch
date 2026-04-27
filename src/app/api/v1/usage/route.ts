import { db } from '@/lib/db'
import { validateApiKey, handlePreflight, apiResponse } from '@/lib/api-auth'

// Monthly tier limits
const TIER_MONTHLY_LIMITS: Record<string, number> = {
  free: 1000,
  pro: 10_000,
  enterprise: 100_000,
}

export async function OPTIONS() {
  return handlePreflight(new Request('')) || new Response(null, { status: 204 })
}

// GET /api/v1/usage — Get current API key usage and limits
export async function GET(request: Request) {
  const preflight = handlePreflight(request)
  if (preflight) return preflight

  try {
    const auth = await validateApiKey(request)
    if (!auth.valid || !auth.apiKey) {
      return apiResponse({ error: auth.error || 'Unauthorized' }, 401)
    }

    if (!db) {
      return apiResponse({ error: 'Database unavailable' }, 503)
    }

    const key = auth.apiKey
    const now = new Date()
    const limit = key.monthlyRateLimit || TIER_MONTHLY_LIMITS[key.tier] || TIER_MONTHLY_LIMITS.free

    // Calculate days remaining in current month
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const daysRemaining = endOfMonth.getDate() - now.getDate()

    // Check if lastUsedAt is in the current month (otherwise usage should be 0)
    let currentUsage = 0
    if (key.lastUsedAt) {
      if (key.lastUsedAt.getFullYear() === now.getFullYear() && key.lastUsedAt.getMonth() === now.getMonth()) {
        currentUsage = key.callsCount
      }
    }

    // Check if user has an active subscription
    let subscription = null
    // We can't look up by API key email directly, but the key tier indicates subscription status
    const hasActiveSubscription = key.tier !== 'free'

    return apiResponse({
      tier: key.tier,
      limit,
      usage: currentUsage,
      remaining: Math.max(0, limit - currentUsage),
      usagePercent: limit > 0 ? Math.round((currentUsage / limit) * 100) : 0,
      resetDate: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString(),
      daysRemaining,
      lastUsedAt: key.lastUsedAt?.toISOString() || null,
      hasActiveSubscription,
      keyName: key.name,
      createdAt: key.createdAt.toISOString(),
      upgradeUrl: key.tier === 'free'
        ? `${process.env.NEXT_PUBLIC_APP_URL || 'https://revolaunch.net'}/pricing`
        : null,
    })
  } catch (error) {
    console.error('[API v1 /usage] Error:', error)
    return apiResponse({ error: 'Failed to fetch usage' }, 500)
  }
}
