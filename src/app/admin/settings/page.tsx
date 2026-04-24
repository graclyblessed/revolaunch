'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Settings, Shield, Key, Database, Globe, Zap, ExternalLink,
  Copy, CheckCircle2, AlertTriangle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function AdminSettingsPage() {
  const [session, setSession] = useState<{ email: string; role: string } | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/auth/session')
      .then(res => res.ok ? res.json() : null)
      .then(data => data?.authenticated ? setSession(data.user) : null)
  }, [])

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(null), 2000)
  }

  const envVars = [
    { key: 'ADMIN_EMAIL', label: 'Admin Email', desc: 'Email address for admin login', value: process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'Set in .env' },
    { key: 'DATABASE_URL', label: 'Database URL', desc: 'Neon PostgreSQL connection string', value: 'Set in .env (hidden)' },
    { key: 'LEMONSQUEEZY_API_KEY', label: 'LemonSqueezy API Key', desc: 'For payment processing', value: process.env.NEXT_PUBLIC_LEMONSQUEEZY_API_KEY ? 'Configured' : 'Not set' },
    { key: 'LEMONSQUEEZY_STORE_ID', label: 'LemonSqueezy Store ID', desc: 'Your LemonSqueezy store', value: process.env.NEXT_PUBLIC_LEMONSQUEEZY_STORE_ID || 'Not set' },
    { key: 'LEMONSQUEEZY_WEBHOOK_SECRET', label: 'Webhook Secret', desc: 'For verifying webhook signatures', value: process.env.LEMONSQUEEZY_WEBHOOK_SECRET ? 'Configured' : 'Not set' },
  ]

  const integrations = [
    {
      name: 'Neon PostgreSQL',
      status: 'connected',
      desc: 'Serverless PostgreSQL database',
      icon: Database,
      url: 'https://console.neon.tech',
    },
    {
      name: 'LemonSqueezy',
      status: process.env.LEMONSQUEEZY_API_KEY ? 'connected' : 'disconnected',
      desc: 'Payment processing for launches and sponsors',
      icon: Zap,
      url: 'https://app.lemonsqueezy.com',
    },
    {
      name: 'Vercel (Deployment)',
      status: 'active',
      desc: 'Edge hosting and deployment',
      icon: Globe,
      url: 'https://vercel.com',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Platform configuration and integrations</p>
      </div>

      {/* Admin Account */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border surface p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-orange-500" />
          <h3 className="text-sm font-semibold text-foreground">Admin Account</h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
            <Key className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{session?.email || 'admin@revolaunch.net'}</p>
            <p className="text-xs text-muted-foreground">Role: {session?.role || 'admin'}</p>
          </div>
        </div>
        <div className="mt-3 p-3 rounded-lg bg-orange-500/5 border border-orange-500/10">
          <p className="text-xs text-muted-foreground">
            To change admin credentials, update <code className="text-orange-500 bg-orange-500/10 px-1 rounded">ADMIN_EMAIL</code> and <code className="text-orange-500 bg-orange-500/10 px-1 rounded">ADMIN_PASSWORD</code> in your <code className="text-orange-500 bg-orange-500/10 px-1 rounded">.env</code> file or Vercel environment variables, then redeploy.
          </p>
        </div>
      </motion.div>

      {/* Environment Variables */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-xl border border-border surface p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <Key className="w-4 h-4 text-orange-500" />
          <h3 className="text-sm font-semibold text-foreground">Environment Variables</h3>
        </div>
        <div className="space-y-3">
          {envVars.map((env) => (
            <div key={env.key} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono text-foreground">{env.key}</code>
                  <span className={cn(
                    'px-1.5 py-0.5 rounded text-[9px] font-medium',
                    env.value === 'Not set' ? 'bg-red-500/10 text-red-400' :
                    env.value === 'Set in .env' || env.value === 'Configured' ? 'bg-green-500/10 text-green-400' :
                    'bg-yellow-500/10 text-yellow-400'
                  )}>
                    {env.value === 'Not set' ? 'Missing' : env.value === 'Set in .env' || env.value === 'Configured' ? 'Set' : 'Protected'}
                  </span>
                </div>
                <p className="text-[10px] text-faint mt-0.5">{env.desc}</p>
              </div>
              <button
                onClick={() => copyToClipboard(env.key, env.key)}
                className="p-1.5 rounded-md hover:bg-muted transition-colors shrink-0"
              >
                {copied === env.key ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                )}
              </button>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Integrations */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl border border-border surface p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-orange-500" />
          <h3 className="text-sm font-semibold text-foreground">Integrations</h3>
        </div>
        <div className="space-y-3">
          {integrations.map((integration) => (
            <div key={integration.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-9 h-9 rounded-lg flex items-center justify-center',
                  integration.status === 'connected' || integration.status === 'active'
                    ? 'bg-green-500/10'
                    : 'bg-red-500/10'
                )}>
                  <integration.icon className={cn(
                    'w-4 h-4',
                    integration.status === 'connected' || integration.status === 'active'
                      ? 'text-green-500'
                      : 'text-red-500'
                  )} />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{integration.name}</p>
                  <p className="text-[10px] text-faint">{integration.desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn(
                  'px-2 py-0.5 rounded-full text-[10px] font-medium',
                  integration.status === 'connected' || integration.status === 'active'
                    ? 'bg-green-500/10 text-green-400'
                    : 'bg-red-500/10 text-red-400'
                )}>
                  {integration.status}
                </span>
                <a href={integration.url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-md hover:bg-muted transition-colors">
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Neon Auth Note */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-xl border border-border surface p-5"
      >
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-yellow-500" />
          <h3 className="text-sm font-semibold text-foreground">Upgrade to Neon Auth</h3>
        </div>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            The admin panel currently uses simple JWT-based authentication. To upgrade to
            <span className="text-foreground font-medium"> Neon Auth</span> (managed auth with user management):
          </p>
          <ol className="list-decimal list-inside space-y-1 text-xs text-faint">
            <li>Go to your Neon Console and enable Auth on your project</li>
            <li>Copy the Auth URL and generate a cookie secret</li>
            <li>Add <code className="text-orange-500 bg-orange-500/10 px-1 rounded">NEON_AUTH_BASE_URL</code> and <code className="text-orange-500 bg-orange-500/10 px-1 rounded">NEON_AUTH_COOKIE_SECRET</code> to your env vars</li>
            <li>Create your admin user and mark them as admin in the Neon Console</li>
          </ol>
          <p className="text-xs text-faint">
            The <code className="bg-muted px-1 rounded">@neondatabase/auth</code> package is already installed.
          </p>
        </div>
      </motion.div>
    </div>
  )
}
