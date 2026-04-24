import { NextRequest, NextResponse } from 'next/server'
import { db, isDbAvailable } from '@/lib/db'
import { getAdminSession } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbReady = await isDbAvailable()
    if (!dbReady) {
      return NextResponse.json({ subscribers: [], total: 0 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const [subscribers, total] = await Promise.all([
      db.subscriber.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.subscriber.count(),
    ])

    return NextResponse.json({
      subscribers,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Admin subscribers list error:', error)
    return NextResponse.json({ error: 'Failed to fetch subscribers' }, { status: 500 })
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
      return NextResponse.json({ error: 'Subscriber ID is required' }, { status: 400 })
    }

    await db.subscriber.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Subscriber deleted' })
  } catch (error) {
    console.error('Admin subscriber delete error:', error)
    return NextResponse.json({ error: 'Failed to delete subscriber' }, { status: 500 })
  }
}
