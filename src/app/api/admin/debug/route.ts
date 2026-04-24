import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    hasAdminEmail: !!process.env.ADMIN_EMAIL,
    hasAdminPassword: !!process.env.ADMIN_PASSWORD,
    hasJwtSecret: !!process.env.ADMIN_JWT_SECRET,
    hasDbUrl: !!process.env.DATABASE_URL,
    adminEmailPreview: process.env.ADMIN_EMAIL ? process.env.ADMIN_EMAIL.substring(0, 3) + '***' : 'NOT SET',
    nodeEnv: process.env.NODE_ENV || 'not set',
  })
}
