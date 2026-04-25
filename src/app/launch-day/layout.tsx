import type { Metadata } from 'next'

const title = "Today's Launches | Revolaunch"
const description =
  'Discover the startups launching today on Revolaunch. Be the first to explore, upvote, and support the newest innovations.'
const url = 'https://revolaunch.com/launch-day'

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

export default function LaunchDayLayout({ children }: { children: React.ReactNode }) {
  return children
}
