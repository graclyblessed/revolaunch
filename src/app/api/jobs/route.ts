import { db, isDbAvailable } from '@/lib/db'
import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'

const VALID_TYPES = ['full-time', 'part-time', 'contract', 'internship']
const VALID_CATEGORIES = ['Engineering', 'Design', 'Product', 'Marketing', 'Sales', 'Operations', 'Finance', 'Customer Success']
const DEFAULT_EXPIRY_DAYS = 30

function formatJob(j: any) {
  return {
    ...j,
    createdAt: j.createdAt.toISOString(),
    updatedAt: j.updatedAt.toISOString(),
    expiresAt: j.expiresAt.toISOString(),
  }
}

// GET /api/jobs — list active, non-expired jobs
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const category = searchParams.get('category') || ''
    const type = searchParams.get('type') || ''
    const location = searchParams.get('location') || ''
    const search = searchParams.get('search') || ''
    const skip = (page - 1) * limit

    const dbUp = await isDbAvailable()
    if (dbUp && db) {
      const now = new Date()
      const where: Prisma.JobListingWhereInput = {
        status: 'active',
        expiresAt: { gt: now },
      }

      if (category && VALID_CATEGORIES.includes(category)) {
        where.category = category
      }
      if (type && VALID_TYPES.includes(type)) {
        where.type = type
      }
      if (location) {
        where.OR = [
          ...((where.OR as any) || []),
          { location: { contains: location, mode: 'insensitive' } },
        ]
      }
      if (search) {
        const searchOr: Prisma.JobListingWhereInput[] = [
          { title: { contains: search, mode: 'insensitive' } },
          { company: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { tags: { has: search } },
        ]
        where.OR = [...((where.OR as any) || []), ...searchOr]
      }

      const [jobs, total] = await Promise.all([
        db.jobListing.findMany({
          where,
          orderBy: [
            { isFeatured: 'desc' },
            { createdAt: 'desc' },
          ],
          skip,
          take: limit,
        }),
        db.jobListing.count({ where }),
      ])

      return NextResponse.json({
        jobs: jobs.map(formatJob),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      })
    }

    // Fallback: no DB available
    console.warn('[API /jobs] Database unavailable, returning empty results')
    return NextResponse.json({
      jobs: [],
      total: 0,
      page,
      limit,
      totalPages: 0,
    })
  } catch (error) {
    console.error('[API /jobs] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 })
  }
}

// POST /api/jobs — create a job listing
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
    const {
      title, company, description, type, category,
      location, salaryMin, salaryMax, currency, tags,
      website, logo,
    } = body

    // Validate required fields
    if (!title || !company || !description || !type) {
      return NextResponse.json(
        { error: 'Title, company, description, and type are required.' },
        { status: 400 }
      )
    }

    const trimmedTitle = title.trim()
    if (trimmedTitle.length < 3 || trimmedTitle.length > 120) {
      return NextResponse.json(
        { error: 'Title must be between 3 and 120 characters.' },
        { status: 400 }
      )
    }

    const trimmedCompany = company.trim()
    if (trimmedCompany.length < 2 || trimmedCompany.length > 80) {
      return NextResponse.json(
        { error: 'Company name must be between 2 and 80 characters.' },
        { status: 400 }
      )
    }

    const trimmedDescription = description.trim()
    if (trimmedDescription.length < 20) {
      return NextResponse.json(
        { error: 'Description must be at least 20 characters.' },
        { status: 400 }
      )
    }

    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `Type must be one of: ${VALID_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    const validCategory = category && VALID_CATEGORIES.includes(category) ? category : 'Engineering'

    // Calculate expiry (default 30 days)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + DEFAULT_EXPIRY_DAYS)

    const job = await db.jobListing.create({
      data: {
        title: trimmedTitle,
        company: trimmedCompany,
        description: trimmedDescription,
        type,
        category: validCategory,
        location: location?.trim() || null,
        salaryMin: salaryMin ? parseInt(salaryMin, 10) : null,
        salaryMax: salaryMax ? parseInt(salaryMax, 10) : null,
        currency: currency || 'USD',
        tags: Array.isArray(tags) ? tags.map((t: string) => t.trim()).filter(Boolean) : [],
        website: website?.trim() || null,
        logo: logo?.trim() || null,
        expiresAt,
      },
    })

    return NextResponse.json({ job: formatJob(job) }, { status: 201 })
  } catch (error) {
    console.error('[API POST /jobs] Error:', error)
    return NextResponse.json({ error: 'Failed to create job listing' }, { status: 500 })
  }
}
