import type { Metadata } from 'next'

const title = 'Categories | Revolaunch'
const description =
  'Explore all startup categories on Revolaunch. Discover AI, Developer Tools, Design, SaaS, Productivity, and more — filter startups by industry.'
const url = 'https://revolaunch.com/categories'

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    url,
    siteName: 'Revolaunch',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
}

export default function CategoriesLayout({ children }: { children: React.ReactNode }) {
  return children
}
