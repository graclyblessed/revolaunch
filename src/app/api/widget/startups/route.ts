import { db, isDbAvailable } from '@/lib/db'
import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { fallbackStartups } from '@/lib/fallback-data'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'revolaunch.net'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Cache-Control': 'public, max-age=300, s-maxage=300',
}

function formatStartup(s: any) {
  return {
    id: s.id,
    name: s.name,
    slug: s.slug,
    tagline: s.tagline,
    description: s.description || null,
    logo: s.logo || null,
    website: s.website,
    category: s.category,
    stage: s.stage,
    upvotes: s.upvotes,
    featured: s.featured,
    badgeVerified: s.badgeVerified || false,
    logoColor: s.logoColor || null,
    profileUrl: `${SITE_URL}/startup/${s.slug}`,
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders })
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '6'), 24)
    const category = searchParams.get('category') || ''
    const featured = searchParams.get('featured') === 'true'
    const sort = searchParams.get('sort') || 'popular'

    // Try database first
    const dbUp = await isDbAvailable()
    if (dbUp && db) {
      const where: Prisma.StartupWhereInput = {
        status: 'active',
      }
      if (featured) where.featured = true
      if (category) where.category = category

      const orderBy: Prisma.StartupOrderByWithRelationInput =
        sort === 'newest'
          ? { createdAt: 'desc' }
          : sort === 'oldest'
          ? { createdAt: 'asc' }
          : { upvotes: 'desc' }

      const [startups, totalCount] = await Promise.all([
        db.startup.findMany({
          where,
          orderBy,
          take: limit,
        }),
        db.startup.count({ where }),
      ])

      return NextResponse.json(
        {
          startups: startups.map(formatStartup),
          generatedAt: new Date().toISOString(),
          totalCount,
        },
        { headers: corsHeaders }
      )
    }

    // Fallback: static data
    let filtered = [...fallbackStartups].filter(s => s.status !== 'paused')
    if (featured) filtered = filtered.filter(s => s.featured)
    if (category) filtered = filtered.filter(s => s.category === category)

    if (sort === 'newest') filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    else if (sort === 'oldest') filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    else filtered.sort((a, b) => b.upvotes - a.upvotes)

    return NextResponse.json(
      {
        startups: filtered.slice(0, limit).map(formatStartup),
        generatedAt: new Date().toISOString(),
        totalCount: filtered.length,
      },
      { headers: corsHeaders }
    )
  } catch (error) {
    console.error('[API /widget/startups] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch widget data' },
      { status: 500, headers: corsHeaders }
    )
  }
}
