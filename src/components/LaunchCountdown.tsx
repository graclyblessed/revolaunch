'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Rocket, CheckCircle2 } from 'lucide-react'

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

interface LaunchCountdownProps {
  launchDate: string // ISO date string
}

function calculateTimeLeft(targetDate: string): TimeLeft | null {
  const now = new Date().getTime()
  const target = new Date(targetDate).getTime()
  const diff = target - now

  if (diff <= 0) return null

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  }
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-12 h-12 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
        <span className="text-lg font-bold text-orange-500 tabular-nums">
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider font-medium">
        {label}
      </span>
    </div>
  )
}

export default function LaunchCountdown({ launchDate }: LaunchCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(() => calculateTimeLeft(launchDate))

  useEffect(() => {
    // Update every second — never call setState synchronously in effect body
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft(launchDate))
    }, 1000)

    return () => clearInterval(interval)
  }, [launchDate])

  // Launch date has passed
  if (!timeLeft) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20"
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
        <span className="text-xs font-semibold text-emerald-500">Launched!</span>
      </motion.div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5">
        <Rocket className="w-3.5 h-3.5 text-orange-500" />
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mr-1">
          Launches in
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <TimeUnit value={timeLeft.days} label="D" />
        <span className="text-orange-500/40 font-light text-lg mb-4">:</span>
        <TimeUnit value={timeLeft.hours} label="H" />
        <span className="text-orange-500/40 font-light text-lg mb-4">:</span>
        <TimeUnit value={timeLeft.minutes} label="M" />
        <span className="text-orange-500/40 font-light text-lg mb-4">:</span>
        <TimeUnit value={timeLeft.seconds} label="S" />
      </div>
    </div>
  )
}
