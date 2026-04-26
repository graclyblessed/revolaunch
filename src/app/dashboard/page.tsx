import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import DashboardContent from './DashboardContent'

export default async function DashboardPage() {
  let session = null
  try {
    session = await getServerSession(authOptions)
  } catch (err) {
    console.warn('[Dashboard] NextAuth not configured:', err)
  }

  if (!session?.user) {
    redirect('/login')
  }

  return (
    <DashboardContent
      user={{
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      }}
    />
  )
}
