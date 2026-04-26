import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminSession } from '@/lib/admin-auth'
import { scrapeStartup, type ScrapedData } from '@/lib/scrape'

interface EnrichResult {
  slug: string
  name: string
  website: string
  scraped: ScrapedData
  updated: string[]  // field names that were updated
}

/**
 * POST /api/admin/enrich/[slug]
 * Enrich a single startup by scraping its website.
 * Admin-session protected. Only fills null/empty fields — never overwrites existing data.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Verify admin session
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug } = await params

    if (!slug || typeof slug !== 'string') {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 })
    }

    // Fetch startup from DB
    const startup = await db!.startup.findUnique({ where: { slug } })
    if (!startup) {
      return NextResponse.json({ error: 'Startup not found' }, { status: 404 })
    }

    if (!startup.website) {
      return NextResponse.json({ error: 'Startup has no website URL' }, { status: 422 })
    }

    // Scrape the website
    console.log(`[Enrich] Scraping ${startup.name} (${startup.website})...`)
    const scraped = await scrapeStartup(startup.website)

    // Build update payload — only include fields that are currently null/empty
    const updateData: Record<string, any> = {}
    const updatedFields: string[] = []

    if (!startup.logo && scraped.logo) {
      updateData.logo = scraped.logo
      updatedFields.push('logo')
    }

    if (!startup.twitter && scraped.twitter) {
      // Store as full URL if not already
      const twitterUrl = scraped.twitter.startsWith('@')
        ? `https://x.com/${scraped.twitter.slice(1)}`
        : scraped.twitter
      updateData.twitter = twitterUrl
      updatedFields.push('twitter')
    }

    if (!startup.linkedin && scraped.linkedin) {
      updateData.linkedin = scraped.linkedin
      updatedFields.push('linkedin')
    }

    if ((!startup.description || startup.description.trim() === '') && scraped.description) {
      updateData.description = scraped.description
      updatedFields.push('description')
    }

    // Apply updates if any
    let updated: any = startup
    if (Object.keys(updateData).length > 0) {
      updated = await db!.startup.update({
        where: { slug },
        data: updateData,
      })
      console.log(`[Enrich] Updated ${startup.name}: ${updatedFields.join(', ')}`)
    } else {
      console.log(`[Enrich] No new data found for ${startup.name}`)
    }

    const result: EnrichResult = {
      slug: startup.slug,
      name: startup.name,
      website: startup.website,
      scraped,
      updated: updatedFields,
    }

    return NextResponse.json({ result })
  } catch (error) {
    console.error('[API /api/admin/enrich] Error:', error)
    return NextResponse.json({ error: 'Enrichment failed' }, { status: 500 })
  }
}
