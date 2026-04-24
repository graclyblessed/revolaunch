import { NextResponse } from 'next/server'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'revolaunch.vercel.app'

function generateBadgeSvg(theme: 'light' | 'dark', siteUrl: string): string {
  const isLight = theme === 'light'
  const bg = isLight ? '#ffffff' : '#1a1a1a'
  const textColor = isLight ? '#171717' : '#f5f5f5'
  const subtextColor = isLight ? '#737373' : '#a3a3a3'
  const borderColor = isLight ? '#e5e5e5' : '#333333'
  const rocketFill = isLight ? '#f97316' : '#fb923c'

  return `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="48" viewBox="0 0 220 48">
  <a href="https://${siteUrl}" target="_blank" rel="noopener noreferrer">
    <rect width="220" height="48" rx="8" ry="8" fill="${bg}" stroke="${borderColor}" stroke-width="1"/>
    <g transform="translate(12, 12)">
      <path d="M12 2C12 2 6 8 6 14C6 18 9 22 12 24C15 22 18 18 18 14C18 8 12 2 12 2Z" fill="${rocketFill}" opacity="0.9"/>
      <path d="M12 6L14 12L12 14L10 12L12 6Z" fill="${bg}" opacity="0.6"/>
      <path d="M9 20C8 22 7 24 8 25C9 24 10 22 10 20" fill="${rocketFill}" opacity="0.4"/>
    </g>
    <text x="38" y="20" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="600" fill="${textColor}">Listed on</text>
    <text x="38" y="36" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="700" fill="${rocketFill}">Revolaunch</text>
  </a>
</svg>`
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const theme = (searchParams.get('theme') as 'light' | 'dark') || 'light'

  if (theme !== 'light' && theme !== 'dark') {
    return NextResponse.json({ error: 'Invalid theme. Use "light" or "dark".' }, { status: 400 })
  }

  const svg = generateBadgeSvg(theme, SITE_URL)

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  })
}
