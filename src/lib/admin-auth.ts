import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

const _defaultAdminEmail = 'admin@revolaunch.net'
const _defaultAdminPassword = 'revolaunch-admin-2025'
const _defaultJwtSecret = 'revolaunch-admin-jwt-secret-change-in-production'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || _defaultAdminEmail
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || _defaultAdminPassword
const JWT_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || _defaultJwtSecret
)

// Warn if running with default credentials
if (process.env.NODE_ENV === 'production' && !process.env.ADMIN_PASSWORD) {
  console.warn('[SECURITY WARNING] ADMIN_PASSWORD is not set. Using default value. Set ADMIN_PASSWORD env var in production!')
}
if (process.env.NODE_ENV === 'production' && !process.env.ADMIN_JWT_SECRET) {
  console.warn('[SECURITY WARNING] ADMIN_JWT_SECRET is not set. Using default value. Set ADMIN_JWT_SECRET env var in production!')
}

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

export async function getAdminFromRequest(request: NextRequest): Promise<AdminSession | null> {
  const token = request.cookies.get('admin_token')?.value
  if (!token) return null
  return verifyAdminToken(token)
}
