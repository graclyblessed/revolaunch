'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Rocket, LayoutDashboard, Building2, Megaphone, Users, Settings,
  LogOut, ChevronLeft, Menu, ExternalLink, Globe, BarChart3, Image,
  ChevronRight, Mail
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const sidebarItems = [
  { name: 'Overview', icon: LayoutDashboard, href: '/admin' },
  { name: 'Startups', icon: Building2, href: '/admin/startups' },
  { name: 'Sponsors', icon: Megaphone, href: '/admin/sponsors' },
  { name: 'Banners', icon: Image, href: '/admin/banners' },
  { name: 'Outreach', icon: Mail, href: '/admin/outreach' },
  { name: 'Subscribers', icon: Users, href: '/admin/subscribers' },
  { name: 'Analytics', icon: BarChart3, href: '/insight', external: true },
  { name: 'Settings', icon: Settings, href: '/admin/settings' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const isLoginPage = pathname === '/admin/login'

  useEffect(() => {
    // Skip auth check on the login page
    if (isLoginPage) {
      setLoading(false)
      return
    }

    fetch('/api/admin/auth/session')
      .then(res => {
        if (!res.ok) {
          router.push('/admin/login')
        } else {
          setLoading(false)
        }
      })
      .catch(() => router.push('/admin/login'))
  }, [router, isLoginPage])

  const handleLogout = async () => {
    await fetch('/api/admin/auth/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  // Login page renders without sidebar
  if (isLoginPage) {
    return <>{children}</>
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center animate-pulse">
            <Rocket className="w-5 h-5 text-white" />
          </div>
          <p className="text-sm text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={cn(
      'flex flex-col h-full',
      mobile ? 'w-64' : cn('transition-all duration-200', collapsed ? 'w-16' : 'w-60')
    )}>
      <div className={cn(
        'flex items-center h-14 px-3 border-b border-border',
        collapsed && !mobile && 'justify-center px-2'
      )}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center shrink-0">
            <Rocket className="w-3.5 h-3.5 text-white" />
          </div>
          {(!collapsed || mobile) && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground leading-tight">Admin</span>
              <span className="text-[10px] text-faint leading-tight">revolaunch.net</span>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {sidebarItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
          const isExternal = item.href.startsWith('http') || (item as any).external

          const linkContent = (
            <div className={cn(
              'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors',
              isActive
                ? 'bg-orange-500/10 text-orange-500'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted',
              collapsed && !mobile && 'justify-center px-0'
            )}>
              <item.icon className="w-4 h-4 shrink-0" />
              {(!collapsed || mobile) && (
                <span className="truncate">{item.name}</span>
              )}
              {isExternal && (!collapsed || mobile) && (
                <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
              )}
            </div>
          )

          if (isExternal) {
            return (
              <a key={item.name} href={item.href} target="_blank" rel="noopener noreferrer">
                {linkContent}
              </a>
            )
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => mobile && setMobileOpen(false)}
            >
              {linkContent}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-border p-2 space-y-1">
        <Link href="/" target="_blank" className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <Globe className="w-4 h-4 shrink-0" />
          {(!collapsed || mobile) && <span>View Site</span>}
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-red-500 hover:bg-red-500/10 transition-colors w-full text-left"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {(!collapsed || mobile) && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop sidebar */}
      <aside className={cn(
        'hidden lg:flex flex-col h-screen sticky top-0 border-r border-border surface',
        collapsed ? 'w-16' : 'w-60'
      )}>
        <Sidebar />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute top-1/2 -right-3 w-6 h-6 rounded-full border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors z-10"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -256 }}
              animate={{ x: 0 }}
              exit={{ x: -256 }}
              transition={{ duration: 0.2 }}
              className="fixed left-0 top-0 bottom-0 w-64 surface border-r border-border z-50 lg:hidden"
            >
              <Sidebar mobile />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        <div className="sticky top-0 z-30 h-14 flex items-center gap-3 px-4 lg:px-6 border-b border-border bg-background/80 backdrop-blur-sm">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-8 w-8 text-muted-foreground"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>

          <div className="flex items-center gap-1.5 text-sm">
            <span className="text-faint">Admin</span>
            {pathname !== '/admin' && (
              <>
                <ChevronRight className="w-3 h-3 text-faint" />
                <span className="text-foreground font-medium capitalize">
                  {pathname.split('/').pop()}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="p-4 lg:p-6 max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  )
}
