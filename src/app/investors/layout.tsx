import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Investor Network — Revolaunch',
  description: 'Discover angel investors and VCs actively investing in early-stage startups. Browse our curated investor network.',
}

export default function InvestorsLayout({ children }: { children: React.ReactNode }) {
  return children
}
