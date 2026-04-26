'use client'

import { ReactNode } from 'react'

// Lazy-load NextAuth SessionProvider to avoid crashing the app
// when NEXTAUTH_SECRET or OAuth credentials aren't configured
let SessionProviderInner: React.ComponentType<{ children: ReactNode }> | null = null

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('next-auth/react')
  SessionProviderInner = mod.SessionProvider
} catch {
  console.warn('[SessionProvider] NextAuth not available — running without auth')
}

export default function SessionProvider({ children }: { children: ReactNode }) {
  if (SessionProviderInner) {
    return <SessionProviderInner>{children}</SessionProviderInner>
  }
  return <>{children}</>
}
