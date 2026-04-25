import { db } from '@/lib/db'
import { validateApiKey, handlePreflight, apiResponse } from '@/lib/api-auth'
import type { NextRequest } from 'next/server'

export async function OPTIONS() {
  return handlePreflight(new Request('')) || new Response(null, { status: 204 })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const preflight = handlePreflight(request)
  if (preflight) return preflight

  try {
    const auth = await validateApiKey(request)
    if (!auth.valid) {
      return apiResponse({ error: auth.error }, 401)
    }

    const { slug } = await params

    if (!db) {
      return apiResponse({ error: 'Database unavailable' }, 503)
    }

    const startup = await db.startup.findUnique({
      where: { slug },
      include: {
        _count: { select: { votes: true, perks: true } },
        perks: {
          select: { id: true, title: true, description: true, discount: true, url: true },
        },
      },
    })

    if (!startup) {
      return apiResponse({ error: 'Startup not found' }, 404)
    }

    return apiResponse({
      startup: {
        ...startup,
        createdAt: startup.createdAt.toISOString(),
        updatedAt: startup.updatedAt.toISOString(),
        launchDate: startup.launchDate?.toISOString() || null,
        badgeVerifiedAt: startup.badgeVerifiedAt?.toISOString() || null,
      },
    })
  } catch (error) {
    console.error('[API v1 /startups/:slug] Error:', error)
    return apiResponse({ error: 'Failed to fetch startup' }, 500)
  }
}
