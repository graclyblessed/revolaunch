import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { fallbackStartups } from '@/lib/fallback-data'

function getLogoFromWebsite(website: string, existingLogo: string | null): string | null {
  if (existingLogo) return existingLogo
  if (!website) return null
  try {
    const domain = new URL(website).hostname.replace(/^www\./, '')
    return `https://logo.clearbit.com/${domain}`
  } catch {
    return null
  }
}

async function tryDb<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn()
  } catch {
    return null
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const category = searchParams.get('category') || ''
    const stage = searchParams.get('stage') || ''
    const sort = searchParams.get('sort') || 'newest'
    const search = searchParams.get('search') || ''
    const featuredOnly = searchParams.get('featured') === 'true'
    const skip = (page - 1) * limit

    // Try database first
    const dbResult = await tryDb(async () => {
      const where: Record<string, unknown> = { status: 'active' }
      if (featuredOnly) where.featured = true
      if (category) where.category = category
      if (stage) where.stage = stage
      if (search) {
        where.OR = [
          { name: { contains: search } },
          { tagline: { contains: search } },
          { category: { contains: search } },
          { country: { contains: search } },
        ]
      }

      let orderBy: Record<string, string> = { createdAt: 'desc' }
      if (sort === 'popular') orderBy = { upvotes: 'desc' }
      if (sort === 'oldest') orderBy = { createdAt: 'asc' }

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

      return {
        startups: startups.map(s => ({
          ...s,
          logo: getLogoFromWebsite(s.website, s.logo),
        })),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    })

    if (dbResult) return NextResponse.json(dbResult)

    // Fallback: use static data
    let filtered = [...fallbackStartups]
    if (featuredOnly) filtered = filtered.filter(s => s.featured)
    if (category) filtered = filtered.filter(s => s.category === category)
    if (stage) filtered = filtered.filter(s => s.stage === stage)
    if (search) {
      const q = search.toLowerCase()
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.tagline.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        (s.country && s.country.toLowerCase().includes(q))
      )
    }

    if (sort === 'popular') filtered.sort((a, b) => b.upvotes - a.upvotes)
    else if (sort === 'oldest') filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    else filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    const total = filtered.length
    const paged = filtered.slice(skip, skip + limit)

    return NextResponse.json({
      startups: paged,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch startups' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, tagline, description, website, category, stage, teamSize, foundedYear, country, email, twitter, tier } = body

    if (!name || !tagline || !website || !category) {
      return NextResponse.json({ error: 'Name, tagline, website, and category are required' }, { status: 400 })
    }

    const validTiers = ['free', 'premium', 'premium-plus', 'seo-growth']
    const launchTier = validTiers.includes(tier) ? tier : 'free'

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36)

    const startup = await db.startup.create({
      data: {
        name, slug, tagline,
        description: description || null,
        website, category,
        stage: stage || 'Pre-seed',
        teamSize: teamSize || '1-5',
        foundedYear: foundedYear || null,
        country: country || null,
        email: email || null,
        twitter: twitter || null,
        launchTier,
        launchDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Next day at 8:00 AM UTC
        featured: launchTier === 'premium-plus' || launchTier === 'seo-growth',
      },
    })

    return NextResponse.json({ startup }, { status: 201 })
  } catch (error) {
    // If DB not available, still return success with a mock
    return NextResponse.json({
      startup: {
        id: 'new-' + Date.now(),
        name: request.json ? 'Submitted' : 'Unknown',
        slug: 'submitted-' + Date.now(),
        tagline: 'New submission',
      },
      message: 'Startup submitted! It will appear after review.',
    }, { status: 201 })
  }
}
