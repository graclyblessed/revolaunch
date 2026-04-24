import { db, isDbAvailable } from '@/lib/db'
import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { fallbackStartups } from '@/lib/fallback-data'

// Helper: format a DB startup record to match the API response shape
function formatStartup(s: any) {
  return {
    ...s,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
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

    // ── Try database first ──
    const dbUp = await isDbAvailable()
    if (dbUp && db) {
      const where: Prisma.StartupWhereInput = {}

      if (featuredOnly) where.featured = true
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
          include: {
            _count: { select: { votes: true, perks: true } },
          },
        }),
        db.startup.count({ where }),
      ])

      return NextResponse.json({
        startups: startups.map(formatStartup),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      })
    }

    // ── Fallback: serve from static data if DB is down ──
    console.warn('[API /startups] Database unavailable, using fallback data')
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
    console.error('[API /startups] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch startups' }, { status: 500 })
  }
}

// POST /api/startups — Submit a new startup (uses DB)
export async function POST(request: Request) {
  try {
    const dbUp = await isDbAvailable()
    if (!dbUp || !db) {
      return NextResponse.json(
        { error: 'Database is currently unavailable. Please try again later.' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { name, tagline, description, website, category, twitter, linkedin, country } = body

    if (!name || !tagline || !website || !category) {
      return NextResponse.json(
        { error: 'Name, tagline, website, and category are required.' },
        { status: 400 }
      )
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    // Check for duplicate slug
    const existing = await db.startup.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json(
        { error: 'A startup with a similar name already exists.' },
        { status: 409 }
      )
    }

    const startup = await db.startup.create({
      data: {
        name,
        slug,
        tagline,
        description: description || null,
        logo: null,
        website,
        twitter: twitter || null,
        linkedin: linkedin || null,
        category,
        country: country || null,
      },
      include: {
        _count: { select: { votes: true, perks: true } },
      },
    })

    return NextResponse.json({ startup: formatStartup(startup) }, { status: 201 })
  } catch (error) {
    console.error('[API POST /startups] Error:', error)
    return NextResponse.json({ error: 'Failed to create startup' }, { status: 500 })
  }
}
