'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Rocket, Plus, Star, TrendingUp, BarChart3, Briefcase, Handshake,
  Gift, Users, Calendar, Inbox, LayoutDashboard, ChevronRight, ExternalLink, Mail
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Header from '@/components/Header'
import { fallbackCommunityBoards, fallbackWeeklyWinners, fallbackStats } from '@/lib/fallback-data'

const sidebarItems = [
  { name: 'Dashboard', icon: LayoutDashboard, active: true },
  { name: 'Inbox', icon: Inbox, badge: '1 new' },
  { name: 'My Startups', icon: Rocket, active: false },
  { name: 'My Profile', icon: Users, progress: '50%' },
  { name: 'My Reviews', icon: Star, badge: '0' },
  { name: 'My Signals', icon: TrendingUp },
  { name: 'My Jobs', icon: Briefcase, badge: '0' },
  { name: 'My Perks', icon: Gift },
  { name: 'My Affiliate', icon: Users },
  { name: 'Content Scheduler', icon: Calendar },
  { name: 'Earn $25', icon: Handshake },
]

export default function DashboardPage() {
  const [activeItem, setActiveItem] = useState('Dashboard')
  const [showAddStartup, setShowAddStartup] = useState(false)

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <Header />

      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar */}
            <div className="lg:w-[240px] shrink-0">
              <div className="lg:sticky lg:top-[72px]">
                <nav className="space-y-0.5">
                  {sidebarItems.map((item) => (
                    <button
                      key={item.name}
                      onClick={() => setActiveItem(item.name)}
                      className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-all ${
                        activeItem === item.name
                          ? 'bg-white/[0.06] text-white font-medium'
                          : 'text-gray-400 hover:text-white hover:bg-white/[0.03]'
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span className="flex-1 text-left">{item.name}</span>
                      {item.badge && (
                        <span className="text-[10px] text-gray-500">{item.badge}</span>
                      )}
                      {item.progress && (
                        <span className="text-[10px] text-blue-400">{item.progress}</span>
                      )}
                    </button>
                  ))}
                </nav>

                {/* Quick boards */}
                <div className="mt-6 border-t border-white/[0.06] pt-4 space-y-1">
                  <p className="text-[10px] text-gray-600 uppercase tracking-wider px-3 mb-2">Quick Boards</p>
                  {fallbackCommunityBoards.slice(0, 4).map((board) => (
                    <Link
                      key={board.id}
                      href={`/community?type=${board.id}`}
                      className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:text-white hover:bg-white/[0.03] transition-all"
                    >
                      <span className="text-sm">{board.icon}</span>
                      <span className="flex-1">{board.name}</span>
                      <span className="tabular-nums">{board.itemCount > 999 ? `${(board.itemCount / 1000).toFixed(1)}K` : board.itemCount}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Main content */}
            <div className="flex-1 min-w-0">
              {activeItem === 'Dashboard' && (
                <>
                  <h1 className="text-xl font-bold text-white mb-1">Startup Panel</h1>
                  <p className="text-xs text-gray-500 mb-6">List only businesses you are authorized to represent</p>

                  {/* Add New Startup button */}
                  {showAddStartup ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="rounded-xl border border-white/[0.06] bg-[#0a0a0a] p-8 mb-6 text-center"
                    >
                      <Rocket className="w-8 h-8 text-blue-400 mx-auto mb-3" />
                      <h2 className="text-lg font-semibold text-white mb-2">Ready to launch?</h2>
                      <p className="text-sm text-gray-400 mb-4">
                        Start your multi-step submission to get your startup listed on Revolaunch.
                      </p>
                      <div className="flex items-center justify-center gap-3">
                        <Link href="/submit">
                          <Button className="bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg h-10 px-6">
                            <Rocket className="w-4 h-4 mr-1.5" />
                            Start Submission
                          </Button>
                        </Link>
                        <Button variant="ghost" onClick={() => setShowAddStartup(false)} className="text-gray-400 hover:text-white h-10">
                          Cancel
                        </Button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="rounded-xl border border-dashed border-white/[0.1] bg-white/[0.01] p-8 mb-6 text-center hover:border-white/[0.2] transition-colors cursor-pointer"
                      onClick={() => setShowAddStartup(true)}
                    >
                      <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-3">
                        <Plus className="w-6 h-6 text-blue-400" />
                      </div>
                      <p className="text-sm font-medium text-white mb-1">Add New Startup</p>
                      <p className="text-xs text-gray-500">Click to launch a new startup on Revolaunch</p>
                    </motion.div>
                  )}

                  {/* Inbox preview */}
                  <div className="rounded-xl border border-white/[0.06] bg-[#0a0a0a] overflow-hidden mb-6">
                    <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
                      <div className="flex items-center gap-2">
                        <Inbox className="w-4 h-4 text-gray-400" />
                        <h2 className="text-sm font-semibold text-white">Recent Inbox</h2>
                      </div>
                      <Badge variant="secondary" className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 h-5">
                        1 new
                      </Badge>
                    </div>
                    <div className="divide-y divide-white/[0.04]">
                      <div className="p-4 hover:bg-white/[0.02] transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                            <Rocket className="w-4 h-4 text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="text-sm font-medium text-white truncate">Welcome to Revolaunch!</p>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">New</span>
                            </div>
                            <p className="text-xs text-gray-500 line-clamp-2">
                              Hi there! Your Revolaunch account is ready. List your first startup and start competing for the weekly leaderboard.
                            </p>
                            <p className="text-[10px] text-gray-600 mt-1">from Revolaunch · just now</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Profile completion */}
                  <div className="rounded-xl border border-white/[0.06] bg-[#0a0a0a] p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-sm font-semibold text-white">Profile Completion</h2>
                      <span className="text-xs text-blue-400 font-medium">50%</span>
                    </div>
                    <div className="w-full h-2 bg-white/[0.04] rounded-full overflow-hidden mb-3">
                      <div className="h-full w-1/2 bg-blue-500 rounded-full" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'Add profile photo', done: false },
                        { label: 'List a startup', done: false },
                        { label: 'Complete profile info', done: true },
                        { label: 'Connect social accounts', done: false },
                      ].map((task) => (
                        <div key={task.label} className="flex items-center gap-2 text-xs">
                          <span className={`w-4 h-4 rounded-full flex items-center justify-center ${task.done ? 'bg-green-500/20 text-green-400' : 'bg-white/[0.04] text-gray-600'}`}>
                            {task.done ? '✓' : '○'}
                          </span>
                          <span className={task.done ? 'text-gray-400 line-through' : 'text-gray-300'}>{task.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {activeItem === 'My Startups' && (
                <div className="text-center py-16">
                  <Rocket className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                  <h2 className="text-sm font-medium text-white mb-1">No startups yet</h2>
                  <p className="text-xs text-gray-500 mb-4">Launch your first startup to get started</p>
                  <Link href="/submit">
                    <Button className="bg-blue-500 hover:bg-blue-600 text-white text-sm h-9 rounded-lg">
                      <Plus className="w-4 h-4 mr-1.5" />
                      Add Your Startup
                    </Button>
                  </Link>
                </div>
              )}

              {activeItem === 'My Profile' && (
                <div className="rounded-xl border border-white/[0.06] bg-[#0a0a0a] p-6">
                  <h2 className="text-lg font-semibold text-white mb-4">My Profile</h2>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 border-2 border-white/[0.08] flex items-center justify-center">
                        <span className="text-xl text-gray-400">?</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-300">Complete your profile in the submit flow</p>
                        <p className="text-xs text-gray-500">Add your photo, name, role, and social links</p>
                      </div>
                    </div>
                    <Link href="/submit">
                      <Button className="bg-blue-500 hover:bg-blue-600 text-white text-sm h-9 rounded-lg">
                        Complete Profile
                      </Button>
                    </Link>
                  </div>
                </div>
              )}

              {!['Dashboard', 'My Startups', 'My Profile'].includes(activeItem) && (
                <div className="text-center py-16">
                  <p className="text-sm text-gray-400">Coming soon</p>
                  <p className="text-xs text-gray-600 mt-1">{activeItem} feature is under development</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
