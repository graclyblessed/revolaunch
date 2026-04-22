import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const startup = await db.startup.findUnique({
      where: { slug },
      include: {
        _count: { select: { votes: true, perks: true } },
        perks: true,
      },
    })

    if (!startup) {
      return NextResponse.json({ error: 'Startup not found' }, { status: 404 })
    }

    return NextResponse.json({ startup })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch startup' }, { status: 500 })
  }
}
