'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Rocket, Globe, TrendingUp, Building2, Star, Users, BarChart3, ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Header from '@/components/Header'
import { fallbackStats, fallbackStartups, fallbackWeeklyWinners } from '@/lib/fallback-data'

export default function InsidePage() {
  const { totalStartups, totalVotes, totalCategories, featuredCount, topCategories, stages, countries, weeklyGrowth } = fallbackStats

  // Donut chart segments for countries
  const countryColors = ['#3B82F6', '#22C55E', '#F59E0B', '#8B5CF6', '#EF4444', '#EC4899', '#06B6D4', '#64748B']
  const countryTotal = countries.reduce((sum, c) => sum + c.count, 0)

  // Category bar data
  const maxCatCount = Math.max(...topCategories.map(c => c.count))

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-1">Inside Revolaunch</h1>
            <p className="text-sm text-muted-foreground">
              Real-time data across our {totalStartups.toLocaleString()} submitted startups
            </p>
          </div>

          {/* Stats overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {[
              { label: 'Total Startups', value: totalStartups, icon: Rocket, color: 'text-blue-500' },
              { label: 'Total Stars', value: totalVotes, icon: Star, color: 'text-amber-500' },
              { label: 'Categories', value: totalCategories, icon: Building2, color: 'text-green-500' },
              { label: 'Featured', value: featuredCount, icon: TrendingUp, color: 'text-purple-500' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="rounded-xl border subtle-border surface p-4"
              >
                <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
                <p className="text-2xl font-bold text-foreground">{stat.value.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Country distribution */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-xl border subtle-border surface p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-foreground">Startups by Country</h2>
                <Link href="/#startups" className="text-xs text-blue-500 hover:text-blue-400">View all</Link>
              </div>

              <div className="flex items-center gap-6">
                {/* Donut chart */}
                <div className="relative w-36 h-36 shrink-0">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    {countries.map((country, i) => {
                      const pct = (country.count / countryTotal) * 100
                      const circumference = 2 * Math.PI * 14
                      const dashOffset = circumference - (pct / 100) * circumference
                      let cumulative = 0
                      for (let j = 0; j < i; j++) cumulative += (countries[j].count / countryTotal) * 100
                      const dashArray = `${(pct / 100) * circumference} ${circumference}`
                      const rotation = (cumulative / 100) * 360

                      return (
                        <circle
                          key={country.name}
                          cx="18" cy="18" r="14"
                          fill="none"
                          stroke={countryColors[i % countryColors.length]}
                          strokeWidth="3.5"
                          strokeDasharray={dashArray}
                          strokeDashoffset="0"
                          strokeLinecap="round"
                          transform={`rotate(${rotation} 18 18)`}
                          style={{ opacity: 0.85 }}
                        />
                      )
                    })}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-lg font-bold text-foreground">{totalStartups}</p>
                    <p className="text-[9px] text-muted-foreground">startups</p>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex-1 space-y-1.5">
                  {countries.map((country, i) => (
                    <div key={country.name} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: countryColors[i % countryColors.length] }} />
                      <span className="text-xs text-muted-foreground flex-1">{country.name}</span>
                      <span className="text-xs text-foreground font-medium tabular-nums">
                        {Math.round((country.count / countryTotal) * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Top categories */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="rounded-xl border subtle-border surface p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-foreground">Top Categories</h2>
                <Link href="/community" className="text-xs text-blue-500 hover:text-blue-400">View all</Link>
              </div>

              <div className="space-y-3">
                {topCategories.map((cat, i) => {
                  const pct = (cat.count / maxCatCount) * 100
                  const catColors = ['#3B82F6', '#22C55E', '#F59E0B', '#8B5CF6', '#EF4444']
                  return (
                    <div key={cat.name}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-foreground">{cat.name}</span>
                        <span className="text-xs text-muted-foreground tabular-nums">{cat.count}</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, delay: 0.5 + i * 0.1 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: catColors[i % catColors.length] }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          </div>

          {/* Weekly growth */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-xl border subtle-border surface p-5 mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-foreground">Weekly Growth</h2>
              <span className="text-xs text-green-500 font-medium">+{Math.round((weeklyGrowth[weeklyGrowth.length-1].startups / weeklyGrowth[0].startups - 1) * 100)}% growth</span>
            </div>
            <div className="flex items-end gap-2 h-32">
              {weeklyGrowth.map((week, i) => {
                const height = (week.startups / weeklyGrowth[weeklyGrowth.length-1].startups) * 100
                return (
                  <div key={week.week} className="flex-1 flex flex-col items-center gap-1">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ duration: 0.4, delay: 0.6 + i * 0.05 }}
                      className="w-full bg-blue-500/60 hover:bg-blue-500 rounded-t-md transition-colors min-h-[4px]"
                    />
                    <span className="text-[9px] text-muted-foreground tabular-nums">{week.startups}</span>
                    <span className="text-[8px] text-faint">{week.week.replace('Week ', 'W')}</span>
                  </div>
                )
              })}
            </div>
          </motion.div>

          {/* Stage distribution */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="rounded-xl border subtle-border surface p-5 mb-8"
          >
            <h2 className="text-sm font-semibold text-foreground mb-4">By Stage</h2>
            <div className="flex flex-wrap gap-3">
              {stages.filter(s => s.count > 0).map((stage) => {
                const stageColors: Record<string, string> = {
                  'Pre-seed': 'bg-gray-500/20 text-gray-600 dark:text-gray-300 border-gray-500/30',
                  'Seed': 'bg-green-500/20 text-green-600 dark:text-green-300 border-green-500/30',
                  'Series A': 'bg-blue-500/20 text-blue-600 dark:text-blue-300 border-blue-500/30',
                  'Series B': 'bg-purple-500/20 text-purple-600 dark:text-purple-300 border-purple-500/30',
                  'Growth': 'bg-orange-500/20 text-orange-600 dark:text-orange-300 border-orange-500/30',
                }
                return (
                  <div
                    key={stage.name}
                    className={`px-4 py-2.5 rounded-lg border text-center ${stageColors[stage.name] || ''}`}
                  >
                    <p className="text-lg font-bold">{stage.count}</p>
                    <p className="text-xs">{stage.name}</p>
                  </div>
                )
              })}
            </div>
          </motion.div>

          {/* CTA */}
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground mb-3">Want your startup featured here?</p>
            <Link href="/submit">
              <Button className="bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl h-10 px-6">
                <Rocket className="w-4 h-4 mr-1.5" />
                Launch Your Startup
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
