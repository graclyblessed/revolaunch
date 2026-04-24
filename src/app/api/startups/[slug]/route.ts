import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { fallbackStartups, fallbackPerks } from '@/lib/fallback-data'

function getLogoFromWebsite(website: string, existingLogo: string | null): string | null {
  if (existingLogo) return existingLogo
  if (!website) return null
  try {
    const domain = new URL(website).hostname.replace(/^www\./, '')
    return `https://logo.clearbit.com/${domain}`
  } catch {
    return null
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // Try database first
    const dbStartup = await db.startup.findUnique({
      where: { slug },
      include: { _count: { select: { votes: true, perks: true } }, perks: true },
    }).catch(() => null)

    if (dbStartup) {
      return NextResponse.json({
        startup: {
          ...dbStartup,
          logo: getLogoFromWebsite(dbStartup.website, dbStartup.logo),
        }
      })
    }

    // Fallback: use static data
    const startup = fallbackStartups.find(s => s.slug === slug)
    if (!startup) return NextResponse.json({ error: 'Startup not found' }, { status: 404 })

    const perks = fallbackPerks[slug] || []

    return NextResponse.json({
      startup: {
        ...startup,
        perks,
        _count: { votes: startup.upvotes, perks: perks.length },
      },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch startup' }, { status: 500 })
  }
}
