import { db } from '@/lib/db'
import { validateApiKey, handlePreflight, apiResponse } from '@/lib/api-auth'
import { Prisma } from '@prisma/client'
import type { NextRequest } from 'next/server'

function formatStartup(s: Record<string, unknown>) {
  return {
    ...s,
    createdAt: (s.createdAt as Date).toISOString(),
    updatedAt: (s.updatedAt as Date).toISOString(),
  }
}

export async function OPTIONS() {
  return handlePreflight(new Request('')) || new Response(null, { status: 204 })
}

export async function GET(request: NextRequest) {
  // Handle CORS preflight
  const preflight = handlePreflight(request)
  if (preflight) return preflight

  try {
    // Validate API key
    const auth = await validateApiKey(request)
    if (!auth.valid) {
      return apiResponse({ error: auth.error }, 401)
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const category = searchParams.get('category') || ''
    const stage = searchParams.get('stage') || ''
    const sort = searchParams.get('sort') || 'newest'
    const search = searchParams.get('search') || ''
    const featured = searchParams.get('featured') === 'true'
    const skip = (page - 1) * limit

    if (!db) {
      return apiResponse({ error: 'Database unavailable' }, 503)
    }

    const where: Prisma.StartupWhereInput = { status: 'active' }

    if (featured) where.featured = true
    if (category) where.category = category
    if (stage) where.stage = stage
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { tagline: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
        { country: { contains: search, mode: 'insensitive' } },
      ]
    }

    const orderBy: Prisma.StartupOrderByWithRelationInput =
      sort === 'popular'
        ? { upvotes: 'desc' }
        : sort === 'oldest'
        ? { createdAt: 'asc' }
        : { createdAt: 'desc' }

    const [startups, total] = await Promise.all([
      db.startup.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: { _count: { select: { votes: true, perks: true } } },
      }),
      db.startup.count({ where }),
    ])

    return apiResponse({
      startups: startups.map(formatStartup),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('[API v1 /startups] Error:', error)
    return apiResponse({ error: 'Failed to fetch startups' }, 500)
  }
}
