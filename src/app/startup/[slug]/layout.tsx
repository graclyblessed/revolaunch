import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const name = slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')

  return {
    title: `${name} | Revolaunch`,
    description: `Discover ${name} on Revolaunch — the next-generation startup directory. Star, explore, and claim exclusive perks.`,
    openGraph: {
      title: `${name} | Revolaunch`,
      description: `Discover ${name} on Revolaunch — the next-generation startup directory.`,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${name} on Revolaunch`,
      description: `Discover ${name} on Revolaunch — the next-generation startup directory.`,
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
