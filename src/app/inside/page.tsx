'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Rocket, Globe, TrendingUp, Building2, Star, Users, ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Header from '@/components/Header'
import { fallbackStats } from '@/lib/fallback-data'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area, ResponsiveContainer,
} from 'recharts'

// ─── Chart configs ───
const countryChartConfig = {
  'United States': { label: 'United States', color: '#3B82F6' },
  'China': { label: 'China', color: '#EF4444' },
  'Canada': { label: 'Canada', color: '#22C55E' },
  'Germany': { label: 'Germany', color: '#F59E0B' },
  'India': { label: 'India', color: '#8B5CF6' },
  'Denmark': { label: 'Denmark', color: '#06B6D4' },
  'Singapore': { label: 'Singapore', color: '#EC4899' },
  'Belgium': { label: 'Belgium', color: '#64748B' },
  'France': { label: 'France', color: '#F97316' },
} satisfies ChartConfig

const categoryChartConfig = {
  startups: { label: 'Startups', color: '#F97316' },
} satisfies ChartConfig

const growthChartConfig = {
  startups: { label: 'Startups', color: '#F97316' },
} satisfies ChartConfig

const stageChartConfig = {
  stages: { label: 'Startups', color: '#F97316' },
} satisfies ChartConfig

const COUNTRY_COLORS = ['#3B82F6', '#EF4444', '#22C55E', '#F59E0B', '#8B5CF6', '#06B6D4', '#EC4899', '#64748B', '#F97316']

export default function InsidePage() {
  const { totalStartups, totalVotes, totalCategories, featuredCount, topCategories, stages, countries, weeklyGrowth } = fallbackStats

  // ─── Prepare chart data ───
  const countryData = countries.map((c, i) => ({
    name: c.name,
    value: c.count,
    fill: COUNTRY_COLORS[i % COUNTRY_COLORS.length],
  }))

  const categoryData = topCategories.map(c => ({
    name: c.name,
    startups: c.count,
  }))

  const growthData = weeklyGrowth.map(w => ({
    week: w.week.replace('Week ', 'W'),
    startups: w.startups,
  }))

  const stageData = stages
    .filter(s => s.count > 0)
    .map(s => ({ name: s.name, stages: s.count }))

  const stageColors: Record<string, string> = {
    'Pre-seed': '#6B7280',
    'Seed': '#22C55E',
    'Series A': '#3B82F6',
    'Series B': '#8B5CF6',
    'Growth': '#F97316',
  }

  const growthPercent = Math.round((weeklyGrowth[weeklyGrowth.length - 1].startups / weeklyGrowth[0].startups - 1) * 100)

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
              { label: 'Total Startups', value: totalStartups, icon: Rocket, color: 'text-orange-500' },
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
            {/* ── Country distribution (PieChart) ── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-xl border subtle-border surface p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-foreground">Startups by Country</h2>
                <Link href="/#startups" className="text-xs text-orange-500 hover:text-orange-400">View all</Link>
              </div>

              <ChartContainer config={countryChartConfig} className="mx-auto h-[220px] w-full">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                  <Pie
                    data={countryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {countryData.map((entry, index) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartLegend
                    content={<ChartLegendContent nameKey="name" />}
                    className="flex-wrap gap-x-4 gap-y-1 [&>*]:basis-1/4"
                  />
                </PieChart>
              </ChartContainer>
            </motion.div>

            {/* ── Top categories (BarChart) ── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="rounded-xl border subtle-border surface p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-foreground">Top Categories</h2>
                <Link href="/community" className="text-xs text-orange-500 hover:text-orange-400">View all</Link>
              </div>

              <ChartContainer config={categoryChartConfig} className="h-[220px] w-full">
                <BarChart data={categoryData} layout="vertical" margin={{ left: 0, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={80}
                    tick={{ fontSize: 12, fill: 'var(--foreground)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="line" />}
                  />
                  <Bar
                    dataKey="startups"
                    fill="var(--color-startups)"
                    radius={[0, 4, 4, 0]}
                    barSize={20}
                  />
                </BarChart>
              </ChartContainer>
            </motion.div>
          </div>

          {/* ── Weekly growth (AreaChart) ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-xl border subtle-border surface p-5 mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-foreground">Weekly Growth</h2>
              <span className="text-xs text-green-500 font-medium">+{growthPercent}% growth</span>
            </div>

            <ChartContainer config={growthChartConfig} className="h-[180px] w-full">
              <AreaChart data={growthData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillStartups" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-startups)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-startups)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <ChartTooltip
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Area
                  type="monotone"
                  dataKey="startups"
                  stroke="var(--color-startups)"
                  strokeWidth={2}
                  fill="url(#fillStartups)"
                />
              </AreaChart>
            </ChartContainer>
          </motion.div>

          {/* ── Stage distribution (BarChart) ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="rounded-xl border subtle-border surface p-5 mb-8"
          >
            <h2 className="text-sm font-semibold text-foreground mb-4">By Stage</h2>

            <ChartContainer config={stageChartConfig} className="h-[160px] w-full">
              <BarChart data={stageData} margin={{ left: 0, right: 4 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: 'var(--foreground)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <ChartTooltip
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar
                  dataKey="stages"
                  radius={[4, 4, 0, 0]}
                  barSize={36}
                >
                  {stageData.map((entry) => (
                    <Cell key={entry.name} fill={stageColors[entry.name] || '#F97316'} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </motion.div>

          {/* CTA */}
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground mb-3">Want your startup featured here?</p>
            <Link href="/submit">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl h-10 px-6">
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
