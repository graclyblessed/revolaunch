import { NextResponse } from 'next/server'
import { db, isDbAvailable } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { fallbackCommunityBoards } from '@/lib/fallback-data'

// GET /api/community/posts — list posts for a board
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const board = searchParams.get('board') || 'weekly'
    const sort = searchParams.get('sort') || 'popular'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const dbUp = await isDbAvailable()
    if (dbUp && db) {
      // Find the board
      const boardData = await db.communityBoard.findUnique({ where: { slug: board } })
      if (!boardData) {
        // Board might not exist in DB yet — auto-seed
        const { seedCommunityBoards } = await import('@/lib/seed-community')
        await seedCommunityBoards()
      }

      const where: Prisma.CommunityPostWhereInput = {
        board: { slug: board },
      }

      const orderBy: Prisma.CommunityPostOrderByWithRelationInput =
        sort === 'popular'
          ? { upvotes: 'desc' }
          : { createdAt: 'desc' }

      const [posts, total] = await Promise.all([
        db.communityPost.findMany({
          where,
          orderBy,
          skip,
          take: limit,
        }),
        db.communityPost.count({ where }),
      ])

      return NextResponse.json({
        posts: posts.map((p) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          author: p.author,
          createdAt: p.createdAt.toISOString(),
          upvotes: p.upvotes,
          tags: p.tags,
          startup: p.startupName || undefined,
          mrr: p.mrr ?? undefined,
        })),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      })
    }

    // Fallback to static data
    console.warn('[API /community/posts] Database unavailable, using fallback data')
    const fbBoard = fallbackCommunityBoards.find((b) => b.id === board) || fallbackCommunityBoards[0]

    let items = [...fbBoard.items]
    if (sort === 'popular') {
      items.sort((a, b) => b.upvotes - a.upvotes)
    } else {
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }

    const total = items.length
    const paged = items.slice(skip, skip + limit)

    return NextResponse.json({
      posts: paged.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        author: item.author,
        createdAt: item.createdAt,
        upvotes: item.upvotes,
        tags: item.tags,
        startup: item.startup,
        mrr: item.mrr,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('[API /community/posts] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }
}

// POST /api/community/posts — create a new post
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
    const { title, description, boardId, author, startupName, tags, mrr } = body

    if (!title || !description || !boardId || !author) {
      return NextResponse.json(
        { error: 'Title, description, boardId, and author are required.' },
        { status: 400 }
      )
    }

    // Validate board exists, auto-seed if needed
    let board = await db.communityBoard.findUnique({ where: { slug: boardId } })
    if (!board) {
      const { seedCommunityBoards } = await import('@/lib/seed-community')
      await seedCommunityBoards()
      board = await db.communityBoard.findUnique({ where: { slug: boardId } })
    }

    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 })
    }

    const post = await db.communityPost.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        author: author.trim(),
        boardId: board.id,
        startupName: startupName?.trim() || null,
        tags: Array.isArray(tags) ? tags : [],
        mrr: mrr ? Math.round(mrr * 100) : null, // Convert dollars to cents
      },
    })

    return NextResponse.json({
      post: {
        id: post.id,
        title: post.title,
        description: post.description,
        author: post.author,
        createdAt: post.createdAt.toISOString(),
        upvotes: post.upvotes,
        tags: post.tags,
        startup: post.startupName || undefined,
        mrr: post.mrr ?? undefined,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('[API POST /community/posts] Error:', error)
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
}
