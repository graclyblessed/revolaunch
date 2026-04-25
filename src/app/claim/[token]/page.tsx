'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Rocket, CheckCircle2, ExternalLink, Loader2, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ClaimData {
  token: string
  startup: {
    id: string
    name: string
    slug: string
    tagline: string
    logo: string | null
    website: string
    category: string
    stage: string
  }
  email: string
}

export default function ClaimPage({ params }: { params: Promise<{ token: string }> }) {
  const [token, setToken] = useState<string>('')
  const [data, setData] = useState<ClaimData | null>(null)
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(false)
  const [claimed, setClaimed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    params.then(p => setToken(p.token))
  }, [params])

  useEffect(() => {
    if (!token) return

    fetch(`/api/claim/${token}`)
      .then(res => {
        if (res.redirected) {
          router.push(res.url)
          return null
        }
        if (!res.ok) throw new Error('Invalid token')
        return res.json()
      })
      .then(d => {
        if (d) setData(d)
        setLoading(false)
      })
      .catch(() => {
        setError('This claim link is invalid or has expired.')
        setLoading(false)
      })
  }, [token, router])

  const handleClaim = async () => {
    if (!token) return
    setClaiming(true)
    try {
      const res = await fetch(`/api/claim/${token}`, { method: 'POST' })
      const result = await res.json()
      if (res.ok) {
        setClaimed(true)
      } else {
        setError(result.error || 'Something went wrong')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setClaiming(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center animate-pulse">
            <Rocket className="w-5 h-5 text-white" />
          </div>
          <p className="text-sm text-muted-foreground">Verifying claim link...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full mx-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="surface rounded-2xl p-8 border border-border"
          >
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <ExternalLink className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-xl font-semibold text-foreground mb-2">Link Expired</h1>
            <p className="text-sm text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => router.push('/')} variant="outline">
              Back to Revolaunch
            </Button>
          </motion.div>
        </div>
      </div>
    )
  }

  if (claimed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full mx-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="surface rounded-2xl p-8 border border-border"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4"
            >
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </motion.div>
            <h1 className="text-xl font-semibold text-foreground mb-2">Profile Claimed!</h1>
            <p className="text-sm text-muted-foreground mb-2">
              <strong>{data?.startup.name}</strong> is now verified on Revolaunch.
            </p>
            <p className="text-xs text-muted-foreground mb-6">
              Your startup has received the verified badge. You can now manage your listing from the dashboard.
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => router.push(`/startup/${data?.startup.slug}`)}>
                View Profile
              </Button>
              <Button variant="outline" onClick={() => router.push('/')}>
                Browse Startups
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full mx-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="surface rounded-2xl border border-border overflow-hidden"
        >
          {/* Orange header */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Rocket className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Claim Your Startup</p>
                <p className="text-white/70 text-xs">Verify your listing on Revolaunch</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Startup card */}
            <div className="rounded-xl border border-border p-4 space-y-3">
              <div className="flex items-center gap-3">
                {data.startup.logo ? (
                  <img
                    src={data.startup.logo}
                    alt={data.startup.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <Rocket className="w-6 h-6 text-orange-500" />
                  </div>
                )}
                <div>
                  <h2 className="font-semibold text-foreground">{data.startup.name}</h2>
                  <p className="text-xs text-muted-foreground">{data.startup.category} · {data.startup.stage}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{data.startup.tagline}</p>
              {data.startup.website && (
                <div className="flex items-center gap-1.5 text-xs text-orange-500">
                  <ExternalLink className="w-3 h-3" />
                  <span className="truncate">{data.startup.website}</span>
                </div>
              )}
            </div>

            {/* Benefits */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">You get when you claim</p>
              <ul className="space-y-1.5">
                {[
                  'Verified badge on your profile',
                  'Update description and details',
                  'Add perks for early users',
                  'Analytics dashboard access',
                  'Priority support',
                ].map((benefit) => (
                  <li key={benefit} className="flex items-center gap-2 text-sm text-foreground">
                    <ShieldCheck className="w-3.5 h-3.5 text-green-500 shrink-0" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>

            {/* Email confirmation */}
            <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              This claim link was sent to <strong>{data.email}</strong>
            </div>

            {/* Action */}
            <Button
              onClick={handleClaim}
              disabled={claiming}
              className="w-full h-11 bg-orange-500 hover:bg-orange-600 text-white font-medium"
            >
              {claiming ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Claiming...
                </>
              ) : (
                'Claim This Profile'
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
