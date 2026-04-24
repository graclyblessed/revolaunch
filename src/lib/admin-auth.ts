import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@revolaunch.net'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'revolaunch-admin-2025'
const JWT_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || 'revolaunch-admin-jwt-secret-change-in-production'
)

export interface AdminSession {
  email: string
  role: string
  iat: number
  exp: number
}

export async function verifyAdminCredentials(email: string, password: string): Promise<boolean> {
  return email === ADMIN_EMAIL && password === ADMIN_PASSWORD
}

export async function createAdminToken(email: string): Promise<string> {
  return new SignJWT({ email, role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET)
}

export async function verifyAdminToken(token: string): Promise<AdminSession | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as AdminSession
  } catch {
    return null
  }
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value
  if (!token) return null
  return verifyAdminToken(token)
}

export function isAdminPath(pathname: string): boolean {
  return pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')
}

export function getAdminFromRequest(request: NextRequest): AdminSession | null {
  const token = request.cookies.get('admin_token')?.value
  if (!token) return null
  // We'll verify in middleware using a sync-compatible approach
  return null // Actual verification happens in the API routes
}
