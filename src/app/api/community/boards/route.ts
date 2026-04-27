import { NextResponse } from 'next/server'
import { db, isDbAvailable } from '@/lib/db'
import { fallbackCommunityBoards } from '@/lib/fallback-data'

export async function GET() {
  try {
    const dbUp = await isDbAvailable()
    if (dbUp && db) {
      const boards = await db.communityBoard.findMany({
        orderBy: { sortOrder: 'asc' },
        include: {
          _count: { select: { posts: true } },
        },
      })

      // Auto-seed boards if none exist yet
      if (boards.length === 0) {
        const { seedCommunityBoards } = await import('@/lib/seed-community')
        await seedCommunityBoards()

        const seeded = await db.communityBoard.findMany({
          orderBy: { sortOrder: 'asc' },
          include: {
            _count: { select: { posts: true } },
          },
        })

        return NextResponse.json({
          boards: seeded.map((b) => ({
            id: b.slug,
            name: b.name,
            description: b.description,
            icon: b.icon,
            itemCount: b._count.posts,
            items: [],
          })),
        })
      }

      return NextResponse.json({
        boards: boards.map((b) => ({
          id: b.slug,
          name: b.name,
          description: b.description,
          icon: b.icon,
          itemCount: b._count.posts,
          items: [],
        })),
      })
    }

    // Fallback to static data
    console.warn('[API /community/boards] Database unavailable, using fallback data')
    return NextResponse.json({
      boards: fallbackCommunityBoards.map((b) => ({
        id: b.id,
        name: b.name,
        description: b.description,
        icon: b.icon,
        itemCount: b.itemCount,
        items: [],
      })),
    })
  } catch (error) {
    console.error('[API /community/boards] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch boards' }, { status: 500 })
  }
}
