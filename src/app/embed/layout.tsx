import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Embed Widget | Revolaunch',
  description: 'Embed trending startups on your website with the Revolaunch widget. Free, customizable, and easy to install.',
  openGraph: {
    title: 'Embed Widget | Revolaunch',
    description: 'Embed trending startups on your website with the Revolaunch widget.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Embed Widget | Revolaunch',
    description: 'Embed trending startups on your website with the Revolaunch widget.',
  },
}

export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return children
}
