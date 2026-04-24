import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  try {
    if (!process.env.DATABASE_URL) {
      console.error('[DB] DATABASE_URL is not set')
      return null
    }

    return new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error'] : ['error'],
    })
  } catch (e) {
    console.error('[DB] Failed to create PrismaClient:', e)
    return null
  }
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production' && db) {
  globalForPrisma.prisma = db
}

export async function isDbAvailable(): Promise<boolean> {
  if (!db) {
    console.error('[DB] Prisma client is null')
    return false
  }
  try {
    await db.startup.count()
    return true
  } catch (e) {
    console.error('[DB] Connection failed:', e)
    return false
  }
}
