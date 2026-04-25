import { db } from '@/lib/db'
import type { ApiKey } from '@prisma/client'

export interface ApiAuthResult {
  valid: boolean
  apiKey?: ApiKey
  error?: string
}

/**
 * Validate an API key from the request.
 * Supports both `Authorization: Bearer <key>` and `?api_key=<key>` query param.
 * Checks rate limit (callsCount in the last hour) and increments usage on success.
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

  // 3. Check rate limit — if lastUsedAt is within the last hour, use callsCount
  const now = new Date()
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

  if (apiKey.lastUsedAt && apiKey.lastUsedAt > oneHourAgo) {
    if (apiKey.callsCount >= apiKey.rateLimit) {
      return {
        valid: false,
        error: `Rate limit exceeded (${apiKey.rateLimit} requests per hour). Try again later.`,
      }
    }
  } else {
    // Hour has elapsed — reset counter
    await db.apiKey.update({
      where: { id: apiKey.id },
      data: { callsCount: 0 },
    })
  }

  // 4. Increment usage
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
