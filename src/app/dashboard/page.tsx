import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import DashboardContent from './DashboardContent'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

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
