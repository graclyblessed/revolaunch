import { NextResponse } from 'next/server'
import { fallbackCategories } from '@/lib/fallback-data'

export async function GET() {
  try {
    // Always use verified fallback categories (based on 36 real Product Hunt companies)
    return NextResponse.json({ categories: fallbackCategories })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}
