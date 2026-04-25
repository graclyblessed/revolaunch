import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Launch Confirmed — Revolaunch',
  description: 'Your startup has been submitted to Revolaunch. Complete your listing to maximize visibility.',
}

export default function LaunchConfirmationLayout({ children }: { children: React.ReactNode }) {
  return children
}
