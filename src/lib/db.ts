import { Pool, neonConfig } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'
import { PrismaClient } from '@prisma/client'
import ws from 'ws'

// Required for Neon serverless driver in Node.js environment
if (typeof WebSocket === 'undefined') {
  neonConfig.webSocketConstructor = ws
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  try {
    const connectionString = process.env.DATABASE_URL!
    // For Neon adapter, strip pgbouncer param
    const directUrl = connectionString.replace('?pgbouncer=true', '').replace('&pgbouncer=true', '')

    const pool = new Pool({ connectionString: directUrl })
    const adapter = new PrismaNeon(pool)

    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['error'] : [],
    })
  } catch {
    return null
  }
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production' && db) {
  globalForPrisma.prisma = db
}

export async function isDbAvailable(): Promise<boolean> {
  if (!db) return false
  try {
    await db.startup.count()
    return true
  } catch {
    return false
  }
}
