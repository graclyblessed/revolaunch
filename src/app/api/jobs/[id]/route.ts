import { db, isDbAvailable } from '@/lib/db'
import { NextResponse } from 'next/server'

function formatJob(j: any) {
  return {
    ...j,
    createdAt: j.createdAt.toISOString(),
    updatedAt: j.updatedAt.toISOString(),
    expiresAt: j.expiresAt.toISOString(),
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const dbUp = await isDbAvailable()
    if (dbUp && db) {
      const job = await db.jobListing.findUnique({
        where: { id },
      })

      if (job) {
        return NextResponse.json({ job: formatJob(job) })
      }
    }

    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  } catch (error) {
    console.error(`[API /jobs/${id}] Error:`, error)
    return NextResponse.json({ error: 'Failed to fetch job' }, { status: 500 })
  }
}
