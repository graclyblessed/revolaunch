import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminSession } from '@/lib/admin-auth'
import { scrapeStartup, type ScrapedData } from '@/lib/scrape'

const DELAY_MS = 2000

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

interface EnrichDetail {
  slug: string
  name: string
  website: string
  scraped: ScrapedData
  updated: string[]
  error?: string
}

/**
 * POST /api/admin/enrich-all
 * Bulk-enrich all startups sequentially with delays between requests.
 * Admin-session protected. Only fills null/empty fields.
 */
export async function POST() {
  try {
    // Verify admin session
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all startups
    const startups = await db!.startup.findMany({
      where: { status: 'active' },
      select: { id: true, name: true, slug: true, website: true, logo: true, twitter: true, linkedin: true, description: true },
      orderBy: { createdAt: 'asc' },
    })

    console.log(`[EnrichAll] Starting bulk enrichment for ${startups.length} startups...`)

    const details: EnrichDetail[] = []
    let updated = 0
    let failed = 0

    for (let i = 0; i < startups.length; i++) {
      const startup = startups[i]

      if (!startup.website) {
        details.push({
          slug: startup.slug,
          name: startup.name,
          website: '',
          scraped: { logo: null, twitter: null, linkedin: null, description: null, favicon: null, title: null, tagline: null },
          updated: [],
          error: 'No website URL',
        })
        failed++
        continue
      }

      console.log(`[EnrichAll] ${i + 1}/${startups.length} — ${startup.name} (${startup.website})`)

      try {
        const scraped = await scrapeStartup(startup.website)

        // Build update payload — only include fields that are currently null/empty
        const updateData: Record<string, any> = {}
        const updatedFields: string[] = []

        if (!startup.logo && scraped.logo) {
          updateData.logo = scraped.logo
          updatedFields.push('logo')
        }

        if (!startup.twitter && scraped.twitter) {
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
        if (Object.keys(updateData).length > 0) {
          await db!.startup.update({
            where: { slug: startup.slug },
            data: updateData,
          })
          updated++
        }

        details.push({
          slug: startup.slug,
          name: startup.name,
          website: startup.website,
          scraped,
          updated: updatedFields,
        })
      } catch (err: any) {
        console.error(`[EnrichAll] Error for ${startup.name}:`, err.message)
        failed++
        details.push({
          slug: startup.slug,
          name: startup.name,
          website: startup.website,
          scraped: { logo: null, twitter: null, linkedin: null, description: null, favicon: null, title: null, tagline: null },
          updated: [],
          error: err.message,
        })
      }

      // Delay between requests (skip delay after last item)
      if (i < startups.length - 1) {
        await delay(DELAY_MS)
      }
    }

    console.log(`[EnrichAll] Complete: ${startups.length} total, ${updated} updated, ${failed} failed`)

    return NextResponse.json({
      total: startups.length,
      updated,
      failed,
      details,
    })
  } catch (error) {
    console.error('[API /api/admin/enrich-all] Error:', error)
    return NextResponse.json({ error: 'Bulk enrichment failed' }, { status: 500 })
  }
}
