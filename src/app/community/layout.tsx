import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Community — Revolaunch',
  description: 'Connect, compete, and grow with the Revolaunch community. MRR board, weekly leaderboard, job board, and more.',
}

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return children
}
