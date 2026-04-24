import { NextRequest, NextResponse } from 'next/server'
import { db, isDbAvailable } from '@/lib/db'
import { getAdminSession } from '@/lib/admin-auth'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbReady = await isDbAvailable()
    if (!dbReady) {
      return NextResponse.json({ startups: [], total: 0, page: 1, totalPages: 0 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const tier = searchParams.get('tier') || ''
    const status = searchParams.get('status') || ''
    const category = searchParams.get('category') || ''
    const featured = searchParams.get('featured') || ''

    const skip = (page - 1) * limit

    const where: Prisma.StartupWhereInput = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { tagline: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (tier) where.launchTier = tier
    if (status) where.status = status
    if (category) where.category = category
    if (featured === 'true') where.featured = true
    if (featured === 'false') where.featured = false

    const [startups, total] = await Promise.all([
      db.startup.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { votes: true, perks: true } },
        },
      }),
      db.startup.count({ where }),
    ])

    return NextResponse.json({
      startups: startups.map(s => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        tagline: s.tagline,
        logo: s.logo || null,
        website: s.website,
        category: s.category,
        stage: s.stage,
        launchTier: s.launchTier,
        launchDate: s.launchDate,
        featured: s.featured,
        upvotes: s.upvotes,
        status: s.status,
        country: s.country,
        teamSize: s.teamSize,
        email: s.email,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        votesCount: s._count.votes,
        perksCount: s._count.perks,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Admin startups list error:', error)
    return NextResponse.json({ error: 'Failed to fetch startups' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbReady = await isDbAvailable()
    if (!dbReady) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
    }

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'Startup ID is required' }, { status: 400 })
    }

    const startup = await db.startup.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ success: true, startup })
  } catch (error) {
    console.error('Admin startup update error:', error)
    return NextResponse.json({ error: 'Failed to update startup' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbReady = await isDbAvailable()
    if (!dbReady) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Startup ID is required' }, { status: 400 })
    }

    await db.startup.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Startup deleted' })
  } catch (error) {
    console.error('Admin startup delete error:', error)
    return NextResponse.json({ error: 'Failed to delete startup' }, { status: 500 })
  }
}
