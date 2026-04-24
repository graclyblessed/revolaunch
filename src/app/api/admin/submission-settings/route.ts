import { NextResponse } from 'next/server'
import { db, isDbAvailable } from '@/lib/db'

const FREE_THRESHOLD = parseInt(process.env.REVOLAUNCH_FREE_THRESHOLD || '1000', 10)
const BACKLINK_REQUIRED = process.env.REVOLAUNCH_BACKLINK_REQUIRED !== 'false'

export async function GET() {
  try {
    const dbUp = await isDbAvailable()
    let startupCount = 0

    if (dbUp && db) {
      startupCount = await db.startup.count()
    }

    const freeListingsEnabled = startupCount >= FREE_THRESHOLD

    return NextResponse.json({
      freeListingsEnabled,
      backlinkRequired: BACKLINK_REQUIRED,
      startupCount,
      threshold: FREE_THRESHOLD,
    })
  } catch (error) {
    console.error('[API GET /admin/submission-settings] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch submission settings' },
      { status: 500 }
    )
  }
}
