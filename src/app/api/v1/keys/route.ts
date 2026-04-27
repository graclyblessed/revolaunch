import { db } from '@/lib/db'
import { handlePreflight, apiResponse } from '@/lib/api-auth'
import { headers } from 'next/headers'

// Simple rate limiter: max 5 key creations per IP per hour
const ipRateLimitMap = new Map<string, { count: number; resetAt: number }>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = ipRateLimitMap.get(ip)

  if (!entry || now > entry.resetAt) {
    ipRateLimitMap.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 })
    return false
  }

  if (entry.count >= 5) return true

  entry.count++
  return false
}

function generateApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let key = 'rvl_'
  for (let i = 0; i < 40; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return key
}

export async function OPTIONS() {
  return handlePreflight(new Request('')) || new Response(null, { status: 204 })
}

export async function POST(request: Request) {
  const preflight = handlePreflight(request)
  if (preflight) return preflight

  try {
    // Rate limit by IP
    const headersList = await headers()
    const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

    if (isRateLimited(ip)) {
      return apiResponse({ error: 'Rate limit exceeded. Max 5 keys per hour per IP.' }, 429)
    }

    if (!db) {
      return apiResponse({ error: 'Database unavailable' }, 503)
    }

    const body = await request.json()
    const { name, rateLimit, tier: requestedTier } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return apiResponse({ error: 'Name is required' }, 400)
    }

    if (name.length > 50) {
      return apiResponse({ error: 'Name must be 50 characters or fewer' }, 400)
    }

    // Determine tier and rate limits
    const validTiers = ['free', 'pro', 'enterprise'] as const
    const tier = validTiers.includes(requestedTier) ? requestedTier : 'free'
    const tierDefaults: Record<string, number> = {
      free: 1000,
      pro: 10000,
      enterprise: 100000,
    }
    const monthlyRateLimit = tierDefaults[tier] || 1000

    const key = generateApiKey()

    const apiKey = await db.apiKey.create({
      data: {
        name: name.trim(),
        key,
        rateLimit: typeof rateLimit === 'number' ? Math.min(10000, Math.max(1, rateLimit)) : monthlyRateLimit,
        tier,
        monthlyRateLimit,
      },
    })

    // Only return the full key on creation — never again
    return apiResponse({
      id: apiKey.id,
      name: apiKey.name,
      key: apiKey.key,
      rateLimit: apiKey.rateLimit,
      tier: apiKey.tier,
      monthlyRateLimit: apiKey.monthlyRateLimit,
      createdAt: apiKey.createdAt.toISOString(),
      message: 'Save this key now — it cannot be retrieved again.',
    }, 201)
  } catch (error) {
    console.error('[API v1 /keys] Error:', error)
    return apiResponse({ error: 'Failed to create API key' }, 500)
  }
}
