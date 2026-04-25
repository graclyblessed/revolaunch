'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Mail, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function UnsubscribePage({ params }: { params: Promise<{ token: string }> }) {
  const [token, setToken] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [unsubscribing, setUnsubscribing] = useState(false)
  const [unsubscribed, setUnsubscribed] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    params.then(p => setToken(p.token))
  }, [params])

  useEffect(() => {
    if (!token) return

    fetch(`/api/unsubscribe/${token}`)
      .then(res => {
        if (!res.ok) throw new Error('Invalid token')
        return res.json()
      })
      .then(d => {
        setEmail(d.email)
        setLoading(false)
      })
      .catch(() => {
        setError('This unsubscribe link is invalid or has already been used.')
        setLoading(false)
      })
  }, [token])

  const handleUnsubscribe = async () => {
    if (!token) return
    setUnsubscribing(true)
    try {
      const res = await fetch(`/api/unsubscribe/${token}`, { method: 'POST' })
      if (res.ok) {
        setUnsubscribed(true)
      } else {
        const result = await res.json()
        setError(result.error || 'Something went wrong')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setUnsubscribing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center animate-pulse">
            <Mail className="w-5 h-5 text-white" />
          </div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (error && !unsubscribed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full mx-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="surface rounded-2xl p-8 border border-border"
          >
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-xl font-semibold text-foreground mb-2">Link Not Found</h1>
            <p className="text-sm text-muted-foreground mb-6">{error}</p>
            <Button variant="outline" onClick={() => window.location.href = '/'}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Revolaunch
            </Button>
          </motion.div>
        </div>
      </div>
    )
  }

  if (unsubscribed) {
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
            <h1 className="text-xl font-semibold text-foreground mb-2">You&apos;re Unsubscribed</h1>
            <p className="text-sm text-muted-foreground mb-2">
              <strong>{email}</strong> has been removed from our mailing list.
            </p>
            <p className="text-xs text-muted-foreground mb-6">
              You will no longer receive emails from Revolaunch. You can re-subscribe at any time from our homepage.
            </p>
            <Button variant="outline" onClick={() => window.location.href = '/'}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Revolaunch
            </Button>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full mx-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="surface rounded-2xl border border-border overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Mail className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Unsubscribe</p>
                <p className="text-white/70 text-xs">Manage your email preferences</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-5">
            <p className="text-sm text-muted-foreground">
              We&apos;re sorry to see you go. You will stop receiving all newsletter emails from Revolaunch.
            </p>

            {/* Email display */}
            <div className="rounded-lg bg-muted/50 p-3 text-sm text-foreground flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
              {email}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleUnsubscribe}
                disabled={unsubscribing}
                variant="destructive"
                className="flex-1 h-11 font-medium"
              >
                {unsubscribing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Unsubscribing...
                  </>
                ) : (
                  'Unsubscribe'
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/'}
                className="h-11"
              >
                Cancel
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              This action is permanent. You can always re-subscribe later.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
