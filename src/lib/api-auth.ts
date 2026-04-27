import { db } from '@/lib/db'
import type { ApiKey } from '@prisma/client'

export interface ApiAuthResult {
  valid: boolean
  apiKey?: ApiKey
  error?: string
}

// Tier rate limits (requests per month)
const TIER_MONTHLY_LIMITS: Record<string, number> = {
  free: 1000,
  pro: 10_000,
  enterprise: 100_000,
}

/**
 * Validate an API key from the request.
 * Supports both `Authorization: Bearer <key>` and `?api_key=<key>` query param.
 * Enforces monthly rate limits based on the key's tier.
 * Automatically resets counters at the start of each month.
 */
export async function validateApiKey(request: Request): Promise<ApiAuthResult> {
  if (!db) {
    return { valid: false, error: 'Database unavailable' }
  }

  // 1. Extract key from request
  let rawKey = ''

  // Check Authorization header first
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    rawKey = authHeader.slice(7).trim()
  }

  // Fall back to query param
  if (!rawKey) {
    const { searchParams } = new URL(request.url)
    rawKey = searchParams.get('api_key') || ''
  }

  if (!rawKey) {
    return { valid: false, error: 'Missing API key. Provide via Authorization: Bearer <key> or ?api_key=<key>' }
  }

  // 2. Look up key in DB
  const apiKey = await db.apiKey.findUnique({ where: { key: rawKey } })
  if (!apiKey) {
    return { valid: false, error: 'Invalid API key' }
  }

  // 3. Determine effective monthly limit
  const effectiveLimit = apiKey.monthlyRateLimit && apiKey.monthlyRateLimit > 0
    ? apiKey.monthlyRateLimit
    : TIER_MONTHLY_LIMITS[apiKey.tier] || TIER_MONTHLY_LIMITS.free

  // 4. Check monthly rate limit
  // Reset counter if we're in a new month since the key was last used
  const now = new Date()
  const lastUsed = apiKey.lastUsedAt

  if (lastUsed) {
    // If lastUsed was in a previous month, reset the counter
    if (lastUsed.getFullYear() !== now.getFullYear() || lastUsed.getMonth() !== now.getMonth()) {
      await db.apiKey.update({
        where: { id: apiKey.id },
        data: { callsCount: 0, lastUsedAt: now },
      })
    } else if (apiKey.callsCount >= effectiveLimit) {
      // Same month but limit exceeded
      return {
        valid: false,
        error: `Monthly rate limit exceeded (${effectiveLimit.toLocaleString()} requests). Your limit resets on the 1st of next month. Upgrade your plan for more requests.`,
      }
    }
  }

  // 5. Increment usage
  await db.apiKey.update({
    where: { id: apiKey.id },
    data: {
      callsCount: { increment: 1 },
      lastUsedAt: now,
    },
  })

  return { valid: true, apiKey }
}

/**
 * Create CORS headers for public API responses.
 */
export function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  }
}

/**
 * Create a NextResponse with CORS headers attached.
 */
export function apiResponse(data: unknown, status = 200) {
  const headers = corsHeaders()
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  })
}

/**
 * Handle CORS preflight requests. Returns null if the request is not a preflight.
 */
export function handlePreflight(request: Request): Response | null {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() })
  }
  return null
}
