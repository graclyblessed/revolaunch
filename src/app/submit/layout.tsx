import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Launch Your Startup — Revolaunch',
  description: 'Submit your startup to Revolaunch and get discovered by thousands of founders, investors, and early adopters. Free and premium launch plans available.',
}

export default function SubmitLayout({ children }: { children: React.ReactNode }) {
  return children
}
