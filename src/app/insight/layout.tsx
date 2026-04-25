import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Insight — Startup Analytics | Revolaunch',
  description: 'Real-time analytics and data across all Revolaunch startups. Track growth trends, categories, stages, and community engagement.',
}

export default function InsightLayout({ children }: { children: React.ReactNode }) {
  return children
}
