import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params

  // Try to fetch real startup data from DB
  let startupName: string | null = null
  let startupTagline: string | null = null
  let startupLogo: string | null = null

  try {
    const { db, isDbAvailable } = await import('@/lib/db')
    if (await isDbAvailable() && db) {
      const startup = await db.startup.findUnique({
        where: { slug },
        select: { name: true, tagline: true, logo: true, category: true, country: true },
      })
      if (startup) {
        startupName = startup.name
        startupTagline = startup.tagline
        startupLogo = startup.logo
      }
    }
  } catch {
    // Fallback to slug-based name
  }

  const name = startupName || slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  const description = startupTagline
    ? `Discover ${name} on Revolaunch — ${startupTagline}. Star, explore, and claim exclusive perks.`
    : `Discover ${name} on Revolaunch — the next-generation startup directory. Star, explore, and claim exclusive perks.`

  return {
    title: `${name} | Revolaunch`,
    description,
    openGraph: {
      title: `${name} | Revolaunch`,
      description: startupTagline || `Discover ${name} on Revolaunch — the next-generation startup directory.`,
      type: 'article',
      ...(startupLogo ? { images: [{ url: startupLogo, width: 1200, height: 630, alt: name }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${name} on Revolaunch`,
      description: startupTagline || `Discover ${name} on Revolaunch — the next-generation startup directory.`,
      ...(startupLogo ? { images: [startupLogo] } : {}),
    },
  }
}

export default function StartupSlugLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
