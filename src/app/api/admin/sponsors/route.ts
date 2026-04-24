import { NextRequest, NextResponse } from 'next/server'
import { db, isDbAvailable } from '@/lib/db'
import { getAdminSession } from '@/lib/admin-auth'

export async function GET() {
  try {
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbReady = await isDbAvailable()
    if (!dbReady) {
      return NextResponse.json({ sponsors: [] })
    }

    const sponsors = await db.sponsorSlot.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ sponsors })
  } catch (error) {
    console.error('Admin sponsors list error:', error)
    return NextResponse.json({ error: 'Failed to fetch sponsors' }, { status: 500 })
  }
}

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
    const { companyName, logo, website, tagline, plan, status, startsAt, expiresAt } = body

    if (!companyName || !website) {
      return NextResponse.json({ error: 'Company name and website are required' }, { status: 400 })
    }

    const sponsor = await db.sponsorSlot.create({
      data: {
        companyName,
        logo: logo || null,
        website,
        tagline: tagline || null,
        plan: plan || '1month',
        status: status || 'active',
        startsAt: startsAt ? new Date(startsAt) : new Date(),
        expiresAt: expiresAt ? new Date(expiresAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    })

    return NextResponse.json({ success: true, sponsor }, { status: 201 })
  } catch (error) {
    console.error('Admin sponsor create error:', error)
    return NextResponse.json({ error: 'Failed to create sponsor' }, { status: 500 })
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
    const { id, startsAt, expiresAt, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'Sponsor ID is required' }, { status: 400 })
    }

    const sponsor = await db.sponsorSlot.update({
      where: { id },
      data: {
        ...updateData,
        ...(startsAt && { startsAt: new Date(startsAt) }),
        ...(expiresAt && { expiresAt: new Date(expiresAt) }),
      },
    })

    return NextResponse.json({ success: true, sponsor })
  } catch (error) {
    console.error('Admin sponsor update error:', error)
    return NextResponse.json({ error: 'Failed to update sponsor' }, { status: 500 })
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
      return NextResponse.json({ error: 'Sponsor ID is required' }, { status: 400 })
    }

    await db.sponsorSlot.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Sponsor deleted' })
  } catch (error) {
    console.error('Admin sponsor delete error:', error)
    return NextResponse.json({ error: 'Failed to delete sponsor' }, { status: 500 })
  }
}
