import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'All Startups | Revolaunch',
  description: 'Browse all startups on Revolaunch — discover innovative companies across AI, SaaS, Developer Tools, and more.',
  openGraph: {
    title: 'All Startups | Revolaunch',
    description: 'Browse all startups on Revolaunch — discover innovative companies across AI, SaaS, Developer Tools, and more.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'All Startups | Revolaunch',
    description: 'Browse all startups on Revolaunch — discover innovative companies across AI, SaaS, Developer Tools, and more.',
  },
}

export default function StartupsLayout({ children }: { children: React.ReactNode }) {
  return children
}
