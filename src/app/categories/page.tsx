'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Skeleton } from '@/components/ui/skeleton'
import { getCategoryColor, getCategoryIcon, fallbackCategories } from '@/lib/fallback-data'

interface Category {
  name: string
  count: number
  icon: string
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

function CategorySkeleton() {
  return (
    <div className="rounded-2xl border border-border p-6 space-y-4">
      <div className="flex items-start justify-between">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-4 w-24" />
    </div>
  )
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[] | null>(null)

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('/api/categories')
        if (res.ok) {
          const data = await res.json()
          if (data.categories && data.categories.length > 0) {
            setCategories(data.categories)
          } else {
            setCategories(fallbackCategories)
          }
        } else {
          setCategories(fallbackCategories)
        }
      } catch {
        setCategories(fallbackCategories)
      }
    }
    fetchCategories()
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-border">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-center">
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight"
            >
              Explore Categories
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="mt-3 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto"
            >
              Discover startups across all industries and technologies
            </motion.p>
          </div>
        </section>

        {/* Grid */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          {!categories ? (
            /* Loading state */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 9 }).map((_, i) => (
                <CategorySkeleton key={i} />
              ))}
            </div>
          ) : (
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {categories.map((cat) => {
                const color = getCategoryColor(cat.name)
                const icon = getCategoryIcon(cat.name) || cat.icon || '🚀'
                return (
                  <motion.div key={cat.name} variants={item}>
                    <Link
                      href={`/startups?category=${encodeURIComponent(cat.name)}`}
                      className="group block rounded-2xl border border-border p-6 transition-all duration-200 hover:border-orange-500/30 hover:shadow-lg hover:shadow-orange-500/5"
                      style={
                        {
                          '--cat-color': color,
                        } as React.CSSProperties
                      }
                    >
                      <div className="flex items-start justify-between mb-4">
                        <span
                          className="text-3xl"
                          role="img"
                          aria-label={cat.name}
                        >
                          {icon}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted rounded-full px-2.5 py-1">
                          {cat.count} {cat.count === 1 ? 'startup' : 'startups'}
                        </span>
                      </div>

                      <h3 className="text-base font-semibold text-foreground mb-1 group-hover:text-foreground">
                        {cat.name}
                      </h3>

                      <div className="flex items-center gap-1 text-xs text-muted-foreground group-hover:text-orange-500 transition-colors">
                        <span>Browse startups</span>
                        <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                      </div>

                      {/* Accent bar */}
                      <div
                        className="mt-4 h-0.5 rounded-full opacity-30 group-hover:opacity-100 transition-opacity duration-200"
                        style={{ backgroundColor: color }}
                      />
                    </Link>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  )
}
