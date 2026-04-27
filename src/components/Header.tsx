'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession, signOut } from 'next-auth/react'
import {
  Rocket, ChevronDown, TrendingUp, BarChart3,
  Handshake, Flame,
  LogIn, LogOut, LayoutDashboard, Menu, X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import ThemeToggle from './ThemeToggle'

const communityItems = [
  { name: 'Weekly Board', icon: TrendingUp, href: '/community?type=weekly' },
  { name: 'MRR Board', icon: BarChart3, href: '/community?type=mrr' },
  { name: 'Raising Capital', icon: Handshake, href: '/community?type=raising-capital' },
]

export default function Header() {
  const [communityOpen, setCommunityOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { data: session, status } = useSession()

  const user = session?.user

  // Get initials from name or email
  const getInitials = () => {
    if (user?.name) {
      return user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    if (user?.email) {
      return user.email[0].toUpperCase()
    }
    return '?'
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b subtle-border header-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
              <Rocket className="w-4 h-4 text-white" />
            </div>
            <Link href="/" className="text-lg font-semibold text-foreground hover:text-orange-500 transition-colors">
              revolaunch.net
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            <Link href="/startups" className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted">
              Startups
            </Link>
            <Link href="/categories" className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted">
              Categories
            </Link>
            <Link href="/launch-day" className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted inline-flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5" />
              Launch Day
            </Link>

            {/* Community Dropdown */}
            <div className="relative">
              <button
                onClick={() => setCommunityOpen(!communityOpen)}
                className="flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
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
                    className="absolute top-full left-0 mt-1 w-56 rounded-xl border subtle-border popover-bg shadow-2xl shadow-black/10 dark:shadow-black/50 py-1 z-50"
                    onMouseLeave={() => setCommunityOpen(false)}
                  >
                    {communityItems.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="flex items-center gap-2.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        onClick={() => setCommunityOpen(false)}
                      >
                        <item.icon className="w-4 h-4 text-muted-foreground" />
                        {item.name}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link href="/pricing" className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted">
              Pricing
            </Link>

            <Link href="/insight" className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted">
              Insight
            </Link>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <Link href="/submit" className="hidden sm:block">
              <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white h-8 text-sm font-medium rounded-lg px-4">
                <Rocket className="w-3.5 h-3.5 mr-1.5" />
                Launch
              </Button>
            </Link>

            {/* User menu or Sign In button */}
            {user ? (
              <div className="hidden sm:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 h-8 pl-1 pr-2 rounded-lg hover:bg-muted transition-colors cursor-pointer">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={user.image || ''} alt={user.name || ''} />
                        <AvatarFallback className="text-[10px] bg-orange-500/10 text-orange-500">{getInitials()}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-foreground font-medium max-w-[100px] truncate">
                        {user.name || user.email?.split('@')[0]}
                      </span>
                      <ChevronDown className="w-3 h-3 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer">
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="text-red-500 focus:text-red-500 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <Link href="/login" className="hidden sm:block">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground h-8 text-sm rounded-lg px-3">
                  <LogIn className="w-3.5 h-3.5 mr-1.5" />
                  Sign In
                </Button>
              </Link>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-muted-foreground hover:text-foreground h-8 w-8"
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
              className="md:hidden pb-4 border-t subtle-border pt-3 space-y-1"
            >
              <Link href="/startups" className="flex items-center gap-2 px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted" onClick={() => setMobileMenuOpen(false)}>
                Startups
              </Link>
              <Link href="/categories" className="flex items-center gap-2 px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted" onClick={() => setMobileMenuOpen(false)}>
                Categories
              </Link>
              <Link href="/launch-day" className="flex items-center gap-2 px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted" onClick={() => setMobileMenuOpen(false)}>
                <Flame className="w-4 h-4" />
                Launch Day
              </Link>
              <div className="px-3 py-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Community</p>
                <div className="space-y-0.5">
                  {communityItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
              <Link href="/pricing" className="flex items-center gap-2 px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted" onClick={() => setMobileMenuOpen(false)}>
                Pricing
              </Link>
              <Link href="/insight" className="flex items-center gap-2 px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted" onClick={() => setMobileMenuOpen(false)}>
                Insight
              </Link>
              <div className="flex gap-2 pt-2 px-3">
                <Link href="/submit" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                  <Button size="sm" className="w-full bg-orange-500 hover:bg-orange-600 text-white h-9 text-sm font-medium rounded-lg">
                    Launch
                  </Button>
                </Link>
                {user ? (
                  <>
                    <Link href="/dashboard" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" size="sm" className="w-full text-foreground h-9 text-sm rounded-lg">
                        Dashboard
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-auto text-red-500 h-9 text-sm rounded-lg px-3"
                      onClick={() => { setMobileMenuOpen(false); signOut({ callbackUrl: '/' }) }}
                    >
                      <LogOut className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <Link href="/login" className="flex-1">
                    <Button variant="outline" size="sm" className="w-full text-muted-foreground hover:text-foreground h-9 text-sm rounded-lg">
                      Sign In
                    </Button>
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}
