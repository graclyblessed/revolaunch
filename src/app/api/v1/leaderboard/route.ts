import { db } from '@/lib/db'
import { validateApiKey, handlePreflight, apiResponse } from '@/lib/api-auth'
import { Prisma } from '@prisma/client'
import type { NextRequest } from 'next/server'

export async function OPTIONS() {
  return handlePreflight(new Request('')) || new Response(null, { status: 204 })
}

export async function GET(request: NextRequest) {
  const preflight = handlePreflight(request)
  if (preflight) return preflight

  try {
    const auth = await validateApiKey(request)
    if (!auth.valid) {
      return apiResponse({ error: auth.error }, 401)
    }

    if (!db) {
      return apiResponse({ error: 'Database unavailable' }, 503)
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'weekly'
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10')))

    // Determine the cutoff date based on period
    const now = new Date()

    const where: Prisma.StartupWhereInput = { status: 'active' }

    if (period === 'weekly') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      where.votes = { some: { createdAt: { gte: weekAgo } } }
    } else if (period === 'monthly') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      where.votes = { some: { createdAt: { gte: monthAgo } } }
    }
    // 'all' — no vote date filter

    const startups = await db.startup.findMany({
      where,
      orderBy: { upvotes: 'desc' },
      take: limit,
      include: {
        _count: { select: { votes: true, perks: true } },
      },
    })

    return apiResponse({
      leaderboard: startups.map(s => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        tagline: s.tagline,
        logo: s.logo,
        category: s.category,
        stage: s.stage,
        country: s.country,
        upvotes: s.upvotes,
        featured: s.featured,
        badgeVerified: s.badgeVerified,
        _count: { votes: s._count.votes, perks: s._count.perks },
      })),
      period,
      count: startups.length,
    })
  } catch (error) {
    console.error('[API v1 /leaderboard] Error:', error)
    return apiResponse({ error: 'Failed to fetch leaderboard' }, 500)
  }
}
