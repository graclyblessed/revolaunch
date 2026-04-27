import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Post a Job | Revolaunch',
  description: 'Post a job opening at your startup and reach thousands of talented professionals.',
}

export default function PostJobLayout({ children }: { children: React.ReactNode }) {
  return children
}
