import { NextRequest, NextResponse } from 'next/server'
import { db, isDbAvailable } from '@/lib/db'
import { getAdminSession } from '@/lib/admin-auth'
import { fallbackStartups, fallbackPerks } from '@/lib/fallback-data'

// POST /api/admin/seed — Clean DB and re-seed with real companies
// This removes fake user-submitted startups and re-seeds verified Product Hunt data
export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbReady = await isDbAvailable()
    if (!dbReady) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
    }

    const body = await request.json()
    const confirm = body.confirm === 'clean-and-reseed'

    if (!confirm) {
      return NextResponse.json({
        error: 'Confirmation required',
        message: 'Send { "confirm": "clean-and-reseed" } to proceed',
      }, { status: 400 })
    }

    // 1. Get all existing slugs
    const existing = await db.startup.findMany({ select: { slug: true, id: true } })
    const fallbackSlugs = new Set(fallbackStartups.map(s => s.slug))

    // 2. Delete all startups NOT in the fallback list (fake/user-submitted ones)
    const toDelete = existing.filter(s => !fallbackSlugs.has(s.slug))
    let deletedCount = 0
    for (const s of toDelete) {
      await db.startup.delete({ where: { id: s.id } })
      deletedCount++
    }

    // 3. Strip Google Favicon URLs from remaining startups
    const toClean = existing.filter(s => fallbackSlugs.has(s.slug))
    let cleanedCount = 0
    for (const s of toClean) {
      const startup = await db.startup.findUnique({ where: { slug: s.slug } })
      if (startup && startup.logo && startup.logo.includes('google.com/s2/favicons')) {
        await db.startup.update({
          where: { slug: s.slug },
          data: { logo: null },
        })
        cleanedCount++
      }
    }

    // 4. Upsert all fallback startups with clean data (no stored logo URLs)
    let upsertedCount = 0
    for (const s of fallbackStartups) {
      await db.startup.upsert({
        where: { slug: s.slug },
        update: {
          name: s.name,
          tagline: s.tagline,
          description: s.description || null,
          logo: null, // Client generates Clearbit/Google Favicon URLs dynamically
          website: s.website,
          twitter: s.twitter || null,
          linkedin: s.linkedin || null,
          category: s.category,
          stage: s.stage,
          teamSize: s.teamSize,
          foundedYear: s.foundedYear || null,
          country: s.country || null,
          email: s.email || null,
          upvotes: s.upvotes,
          featured: s.featured,
          status: s.status,
        },
        create: {
          id: s.id,
          name: s.name,
          slug: s.slug,
          tagline: s.tagline,
          description: s.description || null,
          logo: null,
          website: s.website,
          twitter: s.twitter || null,
          linkedin: s.linkedin || null,
          category: s.category,
          stage: s.stage,
          teamSize: s.teamSize,
          foundedYear: s.foundedYear || null,
          country: s.country || null,
          email: s.email || null,
          upvotes: s.upvotes,
          featured: s.featured,
          status: s.status,
        },
      })
      upsertedCount++
    }

    // 5. Seed perks
    let perkCount = 0
    for (const [slug, perks] of Object.entries(fallbackPerks)) {
      const startup = await db.startup.findUnique({ where: { slug } })
      if (startup) {
        for (const perk of perks) {
          await db.perk.upsert({
            where: { id: perk.id },
            update: {
              startupId: startup.id,
              title: perk.title,
              description: perk.description,
              discount: perk.discount || null,
              url: perk.url,
            },
            create: {
              id: perk.id,
              startupId: startup.id,
              title: perk.title,
              description: perk.description,
              discount: perk.discount || null,
              url: perk.url,
            },
          })
          perkCount++
        }
      }
    }

    const totalStartups = await db.startup.count()

    return NextResponse.json({
      success: true,
      deleted: deletedCount,
      cleaned: cleanedCount,
      upserted: upsertedCount,
      perksSeeded: perkCount,
      totalStartups,
      message: `Done! Deleted ${deletedCount} fake startups, cleaned ${cleanedCount} logo URLs, upserted ${upsertedCount} real companies.`,
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: 'Failed to seed database' }, { status: 500 })
  }
}
