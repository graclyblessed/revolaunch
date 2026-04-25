import { NextRequest, NextResponse } from 'next/server'
import { db, isDbAvailable } from '@/lib/db'

// Track click on a banner
export async function POST(request: NextRequest) {
  try {
    const dbReady = await isDbAvailable()
    if (!dbReady) {
      return NextResponse.json({ success: false })
    }

    const { bannerId } = await request.json()
    if (!bannerId) {
      return NextResponse.json({ error: 'Banner ID required' }, { status: 400 })
    }

    await db.banner.update({
      where: { id: bannerId },
      data: { clicks: { increment: 1 } },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Banner click tracking error:', error)
    return NextResponse.json({ success: false })
  }
}
