'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Rocket, ChevronDown, Users, TrendingUp, BarChart3,
  MessageSquare, Building2, Package, Briefcase, Handshake, Gift,
  Calendar, PenSquare, LogIn, Menu, X, Globe
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const communityItems = [
  { name: 'MRR Board', icon: BarChart3, href: '/community?type=mrr-board' },
  { name: 'Weekly Board', icon: TrendingUp, href: '/community?type=weekly-board' },
  { name: 'Raising Capital', icon: Handshake, href: '/community?type=raising-capital' },
  { name: 'Job Board', icon: Briefcase, href: '/community?type=job-board' },
  { name: 'Open to Acquisition', icon: Building2, href: '/community?type=open-to-acquisition' },
  { name: 'Perks Directory', icon: Gift, href: '/community?type=perks-directory' },
  { name: 'Affiliate Directory', icon: Users, href: '/community' },
]

const growItems = [
  { name: 'Add Startup', icon: Rocket, href: '/submit' },
  { name: 'Content Scheduler', icon: Calendar, href: '/dashboard' },
]

export default function Header() {
  const [communityOpen, setCommunityOpen] = useState(false)
  const [growOpen, setGrowOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-black/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
              <Rocket className="w-4 h-4 text-white" />
            </div>
            <Link href="/" className="text-lg font-semibold text-white hover:text-blue-400 transition-colors">
              revolaunch.net
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {/* Startups - dropdown could go here */}
            <Link href="/#startups" className="px-3 py-2 text-sm text-gray-300 hover:text-white transition-colors rounded-md hover:bg-white/[0.05]">
              Startups
            </Link>

            {/* Community Dropdown */}
            <div className="relative">
              <button
                onClick={() => { setCommunityOpen(!communityOpen); setGrowOpen(false) }}
                className="flex items-center gap-1 px-3 py-2 text-sm text-gray-300 hover:text-white transition-colors rounded-md hover:bg-white/[0.05]"
              >
                Community
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${communityOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {communityOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 mt-1 w-56 rounded-xl border border-white/[0.08] bg-[#111] shadow-2xl shadow-black/50 py-1 z-50"
                    onMouseLeave={() => setCommunityOpen(false)}
                  >
                    {communityItems.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/[0.05] transition-colors"
                        onClick={() => setCommunityOpen(false)}
                      >
                        <item.icon className="w-4 h-4 text-gray-500" />
                        {item.name}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Grow Dropdown */}
            <div className="relative">
              <button
                onClick={() => { setGrowOpen(!growOpen); setCommunityOpen(false) }}
                className="flex items-center gap-1 px-3 py-2 text-sm text-gray-300 hover:text-white transition-colors rounded-md hover:bg-white/[0.05]"
              >
                Grow
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${growOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {growOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 mt-1 w-48 rounded-xl border border-white/[0.08] bg-[#111] shadow-2xl shadow-black/50 py-1 z-50"
                    onMouseLeave={() => setGrowOpen(false)}
                  >
                    {growItems.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/[0.05] transition-colors"
                        onClick={() => setGrowOpen(false)}
                      >
                        <item.icon className="w-4 h-4 text-gray-500" />
                        {item.name}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link href="/inside" className="px-3 py-2 text-sm text-gray-300 hover:text-white transition-colors rounded-md hover:bg-white/[0.05]">
              Inside
            </Link>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <Link href="/submit" className="hidden sm:block">
              <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white h-8 text-sm font-medium rounded-lg px-4">
                <Rocket className="w-3.5 h-3.5 mr-1.5" />
                Launch
              </Button>
            </Link>
            <Link href="/dashboard" className="hidden sm:block">
              <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white h-8 text-sm rounded-lg px-3">
                <LogIn className="w-3.5 h-3.5 mr-1.5" />
                Login
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-gray-300 hover:text-white h-8 w-8"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden pb-4 border-t border-white/[0.06] pt-3 space-y-1"
            >
              <Link href="/#startups" className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-300 hover:text-white rounded-lg hover:bg-white/[0.05]" onClick={() => setMobileMenuOpen(false)}>
                Startups
              </Link>
              <div className="px-3 py-2">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Community</p>
                <div className="space-y-0.5">
                  {communityItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-400 hover:text-white rounded-lg hover:bg-white/[0.05]"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="px-3 py-2">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Grow</p>
                <div className="space-y-0.5">
                  {growItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-400 hover:text-white rounded-lg hover:bg-white/[0.05]"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
              <Link href="/inside" className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-300 hover:text-white rounded-lg hover:bg-white/[0.05]" onClick={() => setMobileMenuOpen(false)}>
                Inside
              </Link>
              <div className="flex gap-2 pt-2 px-3">
                <Link href="/submit" className="flex-1">
                  <Button size="sm" className="w-full bg-blue-500 hover:bg-blue-600 text-white h-9 text-sm font-medium rounded-lg">
                    Launch
                  </Button>
                </Link>
                <Link href="/dashboard" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full border-white/10 text-gray-300 hover:text-white h-9 text-sm rounded-lg">
                    Login
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}
