import { NextRequest, NextResponse } from 'next/server'
import { db, isDbAvailable } from '@/lib/db'
import { getAdminSession } from '@/lib/admin-auth'

// GET /api/admin/banners — list all banners
export async function GET() {
  try {
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbReady = await isDbAvailable()
    if (!dbReady) {
      return NextResponse.json({ banners: [] })
    }

    const banners = await db.banner.findMany({
      orderBy: { createdAt: 'desc' },
      include: { sponsor: { select: { id: true, companyName: true, logo: true } } },
    })

    return NextResponse.json({ banners })
  } catch (error) {
    console.error('Admin banners list error:', error)
    return NextResponse.json({ error: 'Failed to fetch banners' }, { status: 500 })
  }
}

// POST /api/admin/banners — create banner
export async function POST(request: NextRequest) {
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
    const { headline, description, ctaText, ctaUrl, imageUrl, logoUrl, position, status, startsAt, expiresAt, sponsorId } = body

    if (!headline || !ctaUrl) {
      return NextResponse.json({ error: 'Headline and CTA URL are required' }, { status: 400 })
    }

    const banner = await db.banner.create({
      data: {
        headline,
        description: description || null,
        ctaText: ctaText || 'Learn More',
        ctaUrl,
        imageUrl: imageUrl || null,
        logoUrl: logoUrl || null,
        position: position || 4,
        status: status || 'active',
        startsAt: startsAt ? new Date(startsAt) : new Date(),
        expiresAt: expiresAt ? new Date(expiresAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        sponsorId: sponsorId || null,
      },
    })

    return NextResponse.json({ success: true, banner }, { status: 201 })
  } catch (error) {
    console.error('Admin banner create error:', error)
    return NextResponse.json({ error: 'Failed to create banner' }, { status: 500 })
  }
}

// PATCH /api/admin/banners — update banner
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
    const { id, startsAt, expiresAt, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'Banner ID is required' }, { status: 400 })
    }

    const banner = await db.banner.update({
      where: { id },
      data: {
        ...updateData,
        ...(startsAt && { startsAt: new Date(startsAt) }),
        ...(expiresAt && { expiresAt: new Date(expiresAt) }),
      },
    })

    return NextResponse.json({ success: true, banner })
  } catch (error) {
    console.error('Admin banner update error:', error)
    return NextResponse.json({ error: 'Failed to update banner' }, { status: 500 })
  }
}

// DELETE /api/admin/banners — delete banner
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
      return NextResponse.json({ error: 'Banner ID is required' }, { status: 400 })
    }

    await db.banner.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Banner deleted' })
  } catch (error) {
    console.error('Admin banner delete error:', error)
    return NextResponse.json({ error: 'Failed to delete banner' }, { status: 500 })
  }
}
