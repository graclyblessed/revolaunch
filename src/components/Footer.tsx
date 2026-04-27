import Link from 'next/link'
import { Rocket } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t subtle-border">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-8">
          {/* Discover */}
          <div>
            <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">Discover</p>
            <ul className="space-y-2">
              <li><Link href="/#startups" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Startups</Link></li>
              <li><Link href="/community" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Community</Link></li>
              <li><Link href="/insight" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Insight</Link></li>
            </ul>
          </div>

          {/* Launch */}
          <div>
            <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">Launch</p>
            <ul className="space-y-2">
              <li><Link href="/submit" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Submit Startup</Link></li>
              <li><Link href="/pricing" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Pricing</Link></li>
              <li><Link href="/dashboard" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link></li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">Community</p>
            <ul className="space-y-2">
              <li><Link href="/community?type=mrr" className="text-xs text-muted-foreground hover:text-foreground transition-colors">MRR Board</Link></li>
              <li><Link href="/community?type=weekly" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Weekly Board</Link></li>
              <li><Link href="/community?type=raising-capital" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Raising Capital</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">Company</p>
            <ul className="space-y-2">
              <li><Link href="/about" className="text-xs text-muted-foreground hover:text-foreground transition-colors">About</Link></li>
              <li><Link href="/sponsor" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Sponsor</Link></li>
              <li><Link href="/pricing" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Pricing</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t subtle-border">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center">
              <Rocket className="w-2.5 h-2.5 text-white" />
            </div>
            <span className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} Revolaunch
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
            <Link href="/sponsor" className="hover:text-foreground transition-colors">Sponsor</Link>
            <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
            <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
