import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About — Revolaunch',
  description: 'Learn about Revolaunch, the next-generation startup directory built to help founders get discovered, get funded, and get acquired.',
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children
}
