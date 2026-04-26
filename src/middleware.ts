import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || 'revolaunch-admin-jwt-secret-change-in-production'
)

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protect /dashboard routes with NextAuth
  if (pathname.startsWith('/dashboard')) {
    try {
      const { getToken } = await import('next-auth/jwt')
      const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
      })

      if (!token) {
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('callbackUrl', pathname)
        return NextResponse.redirect(loginUrl)
      }
    } catch (err) {
      // If NextAuth isn't configured yet, let the request through
      console.warn('[Middleware] NextAuth check failed:', err)
    }
  }

  // Protect /admin routes (except /admin/login) with custom JWT
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const token = request.cookies.get('admin_token')?.value

    if (!token) {
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    try {
      await jwtVerify(token, JWT_SECRET)
    } catch {
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      const response = NextResponse.redirect(loginUrl)
      response.cookies.delete('admin_token')
      return response
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
}
