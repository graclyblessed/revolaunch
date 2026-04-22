import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const category = searchParams.get('category') || ''
    const stage = searchParams.get('stage') || ''
    const sort = searchParams.get('sort') || 'newest'
    const search = searchParams.get('search') || ''

    const skip = (page - 1) * limit

    const where: Record<string, unknown> = { status: 'active' }
    
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

    return NextResponse.json({
      startups,
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
    const { name, tagline, description, website, category, stage, teamSize, foundedYear, country, email, twitter } = body

    if (!name || !tagline || !website || !category) {
      return NextResponse.json({ error: 'Name, tagline, website, and category are required' }, { status: 400 })
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36)

    const startup = await db.startup.create({
      data: {
        name,
        slug,
        tagline,
        description: description || null,
        website,
        category,
        stage: stage || 'Pre-seed',
        teamSize: teamSize || '1-5',
        foundedYear: foundedYear || null,
        country: country || null,
        email: email || null,
        twitter: twitter || null,
      },
    })

    return NextResponse.json({ startup }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create startup' }, { status: 500 })
  }
}
