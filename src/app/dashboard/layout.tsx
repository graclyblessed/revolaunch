import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard — Revolaunch',
  description: 'Manage your startups, track reviews, browse perks, and monitor your community activity on Revolaunch.',
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children
}
