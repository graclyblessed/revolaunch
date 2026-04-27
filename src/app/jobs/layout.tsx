import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Startup Jobs | Revolaunch',
  description: 'Browse job openings at the most innovative startups. Find your next role in engineering, design, product, marketing, and more.',
  openGraph: {
    title: 'Startup Jobs | Revolaunch',
    description: 'Browse job openings at the most innovative startups.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Startup Jobs | Revolaunch',
    description: 'Browse job openings at the most innovative startups.',
  },
}

export default function JobsLayout({ children }: { children: React.ReactNode }) {
  return children
}
