import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { fallbackStartups } from '@/lib/fallback-data'

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

    // ALWAYS start with the 36 verified real companies from fallback data
    // These have real .com websites where Clearbit/Google can fetch logos
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
    return NextResponse.json({ error: 'Failed to fetch startups' }, { status: 500 })
  }
}
