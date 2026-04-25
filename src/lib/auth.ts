import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { db } from '@/lib/db'

// Check if database is available for adapter
function getAdapter() {
  if (!db) {
    console.warn('[Auth] Database not available — auth adapter disabled')
    return undefined
  }
  return PrismaAdapter(db)
}

export const authOptions: NextAuthOptions = {
  // Use database sessions for persistence
  adapter: getAdapter(),

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID || '',
      clientSecret: process.env.GITHUB_SECRET || '',
    }),
  ],

  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // Update session every 24 hours
  },

  pages: {
    signIn: '/login',
  },

  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
        ;(session.user as any).role = user.role || 'user'
      }
      return session
    },
    async signIn({ user, account }) {
      // Allow sign in for Google and GitHub providers
      if (account?.provider === 'google' || account?.provider === 'github') {
        return true
      }
      return false
    },
  },

  // Use environment variable for secret, with fallback
  secret: process.env.NEXTAUTH_SECRET,
}
