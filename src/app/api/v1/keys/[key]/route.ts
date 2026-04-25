import { db } from '@/lib/db'
import { validateApiKey, handlePreflight, apiResponse } from '@/lib/api-auth'
import type { NextRequest } from 'next/server'

export async function OPTIONS() {
  return handlePreflight(new Request('')) || new Response(null, { status: 204 })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const preflight = handlePreflight(request)
  if (preflight) return preflight

  try {
    const { key } = await params

    if (!db) {
      return apiResponse({ error: 'Database unavailable' }, 503)
    }

    // Find the key — the key param is the actual API key value
    const apiKey = await db.apiKey.findUnique({ where: { key } })

    if (!apiKey) {
      return apiResponse({ error: 'API key not found' }, 404)
    }

    // Require the key itself to view its info
    const auth = await validateApiKey(request)
    if (!auth.valid || auth.apiKey?.id !== apiKey.id) {
      return apiResponse({ error: 'Unauthorized. Provide your API key to view its details.' }, 401)
    }

    return apiResponse({
      id: apiKey.id,
      name: apiKey.name,
      rateLimit: apiKey.rateLimit,
      callsCount: apiKey.callsCount,
      lastUsedAt: apiKey.lastUsedAt?.toISOString() || null,
      createdAt: apiKey.createdAt.toISOString(),
    })
  } catch (error) {
    console.error('[API v1 /keys/:key] GET Error:', error)
    return apiResponse({ error: 'Failed to fetch key info' }, 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const preflight = handlePreflight(request)
  if (preflight) return preflight

  try {
    const { key } = await params

    if (!db) {
      return apiResponse({ error: 'Database unavailable' }, 503)
    }

    const apiKey = await db.apiKey.findUnique({ where: { key } })

    if (!apiKey) {
      return apiResponse({ error: 'API key not found' }, 404)
    }

    // Require the key itself to delete
    const auth = await validateApiKey(request)
    if (!auth.valid || auth.apiKey?.id !== apiKey.id) {
      return apiResponse({ error: 'Unauthorized. Provide your API key to delete it.' }, 401)
    }

    await db.apiKey.delete({ where: { id: apiKey.id } })

    return apiResponse({ message: 'API key deleted successfully', id: apiKey.id })
  } catch (error) {
    console.error('[API v1 /keys/:key] DELETE Error:', error)
    return apiResponse({ error: 'Failed to delete API key' }, 500)
  }
}
