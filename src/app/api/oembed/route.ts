import { db, isDbAvailable } from '@/lib/db'
import { NextResponse } from 'next/server'
import { fallbackStartups } from '@/lib/fallback-data'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'revolaunch.net'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'public, max-age=3600, s-maxage=3600',
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders })
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')
    const format = searchParams.get('format') || 'json'
    const maxwidth = parseInt(searchParams.get('maxwidth') || '680')

    if (!url) {
      return NextResponse.json(
        { error: 'Missing required "url" parameter' },
        { status: 400, headers: corsHeaders }
      )
    }

    if (format !== 'json') {
      return NextResponse.json(
        { error: 'Only "json" format is supported' },
        { status: 501, headers: corsHeaders }
      )
    }

    // Parse the URL to extract slug
    let slug: string | null = null
    const patterns = [
      // revolaunch.net/startup/[slug]
      new RegExp(`revolaunch\\.net/startup/([^/?#]+)`),
      // revolaunch.vercel.app/startup/[slug]
      new RegExp(`revolaunch\\.vercel\\.app/startup/([^/?#]+)`),
      // localhost:3000/startup/[slug]
      new RegExp(`localhost[:\\d]*/startup/([^/?#]+)`),
      // any domain /startup/[slug]
      /\/startup\/([^/?#]+)/,
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) {
        slug = match[1]
        break
      }
    }

    if (!slug) {
      return NextResponse.json(
        { error: 'URL does not match a known Revolaunch startup page' },
        { status: 404, headers: corsHeaders }
      )
    }

    // Fetch startup data
    const dbUp = await isDbAvailable()
    let startup = null

    if (dbUp && db) {
      startup = await db.startup.findUnique({
        where: { slug, status: 'active' },
      })
    }

    if (!startup) {
      startup = fallbackStartups.find(s => s.slug === slug)
    }

    if (!startup) {
      return NextResponse.json(
        { error: 'Startup not found' },
        { status: 404, headers: corsHeaders }
      )
    }

    const profileUrl = `${SITE_URL}/startup/${startup.slug}`
    const thumbUrl = startup.logo
      ? startup.logo.startsWith('http')
        ? startup.logo
        : `https://www.google.com/s2/favicons?domain=${new URL(startup.website).hostname}&sz=128`
      : `https://www.google.com/s2/favicons?domain=${new URL(startup.website).hostname}&sz=128`

    const width = Math.min(maxwidth, 680)
    const height = 280

    const oembed = {
      version: '1.0',
      type: 'rich' as const,
      provider_name: 'Revolaunch',
      provider_url: `https://${SITE_URL}`,
      title: `${startup.name} — ${startup.tagline}`,
      author_name: startup.name,
      thumbnail_url: thumbUrl,
      thumbnail_width: 128,
      thumbnail_height: 128,
      width,
      height,
      html: `<iframe src="${SITE_URL}/embed?slug=${startup.slug}&embed=1" width="${width}" height="${height}" frameborder="0" scrolling="no" style="border:none;border-radius:12px;overflow:hidden;" title="${startup.name} on Revolaunch"></iframe>`,
    }

    return NextResponse.json(oembed, { headers: corsHeaders })
  } catch (error) {
    console.error('[API /oembed] Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate oEmbed' },
      { status: 500, headers: corsHeaders }
    )
  }
}
