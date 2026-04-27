'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Filter, X, Loader2, ExternalLink, Building2,
  DollarSign, UserPlus, ChevronRight, Briefcase, Globe
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { toast } from 'sonner'

interface Investor {
  id: string
  name: string
  email: string
  company: string | null
  website: string | null
  focus: string[]
  stages: string[]
  checkSize: string | null
  bio: string | null
  status: string
  createdAt: string
}

const ALL_FOCUS_AREAS = [
  'SaaS', 'AI', 'FinTech', 'HealthTech', 'EdTech', 'E-commerce',
  'DevTools', 'Marketing', 'Cybersecurity', 'ClimateTech',
  'PropTech', 'Web3', 'Enterprise', 'Consumer', 'Biotech',
  'Logistics', 'HR Tech', 'Gaming', 'AgriTech', 'LegalTech',
]

const ALL_STAGES = [
  'Pre-seed', 'Seed', 'Series A', 'Series B', 'Series C+', 'Growth',
]

function InvestorsContent() {
  const [investors, setInvestors] = useState<Investor[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)

  // Filter state
  const [focusFilter, setFocusFilter] = useState<string | null>(null)
  const [stageFilter, setStageFilter] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  // Join form state
  const [joinOpen, setJoinOpen] = useState(false)
  const [joinLoading, setJoinLoading] = useState(false)
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formCompany, setFormCompany] = useState('')
  const [formWebsite, setFormWebsite] = useState('')
  const [formCheckSize, setFormCheckSize] = useState('')
  const [formBio, setFormBio] = useState('')
  const [formFocusAreas, setFormFocusAreas] = useState<string[]>([])
  const [formStages, setFormStages] = useState<string[]>([])

  const fetchInvestors = useCallback(async (focus?: string | null, stage?: string | null) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (focus) params.set('focus', focus)
      if (stage) params.set('stage', stage)

      const res = await fetch(`/api/investors?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setInvestors(data.investors)
        setTotalCount(data.total)
      } else {
        setInvestors([])
        setTotalCount(0)
      }
    } catch {
      setInvestors([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchInvestors(focusFilter, stageFilter)
  }, [focusFilter, stageFilter, fetchInvestors])

  const clearFilters = () => {
    setFocusFilter(null)
    setStageFilter(null)
  }

  const toggleFormFocus = (area: string) => {
    setFormFocusAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    )
  }

  const toggleFormStage = (stage: string) => {
    setFormStages((prev) =>
      prev.includes(stage) ? prev.filter((s) => s !== stage) : [...prev, stage]
    )
  }

  const handleJoinSubmit = async () => {
    if (!formName.trim() || !formEmail.trim()) {
      toast.error('Name and email are required')
      return
    }

    setJoinLoading(true)
    try {
      const res = await fetch('/api/investors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim(),
          email: formEmail.trim(),
          company: formCompany.trim() || undefined,
          website: formWebsite.trim() || undefined,
          focus: formFocusAreas.length > 0 ? formFocusAreas : undefined,
          stages: formStages.length > 0 ? formStages : undefined,
          checkSize: formCheckSize.trim() || undefined,
          bio: formBio.trim() || undefined,
        }),
      })

      if (res.ok) {
        toast.success('Investor profile submitted successfully!')
        setJoinOpen(false)
        // Reset form
        setFormName('')
        setFormEmail('')
        setFormCompany('')
        setFormWebsite('')
        setFormCheckSize('')
        setFormBio('')
        setFormFocusAreas([])
        setFormStages([])
        // Refresh
        fetchInvestors(focusFilter, stageFilter)
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to submit profile')
      }
    } catch {
      toast.error('Failed to submit profile')
    } finally {
      setJoinLoading(false)
    }
  }

  const hasActiveFilters = focusFilter || stageFilter

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b subtle-border">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-orange-500/5" />
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 relative">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <Briefcase className="w-4 h-4 text-orange-500" />
                  </div>
                  <span className="text-xs font-medium text-orange-500 uppercase tracking-wider">Investor Network</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                  Find Your Next Investor
                </h1>
                <p className="text-sm text-muted-foreground max-w-lg">
                  Discover angel investors and VCs actively investing in early-stage startups.
                  Filter by focus area and investment stage to find the perfect match.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-2xl font-bold text-foreground">{totalCount}</p>
                  <p className="text-xs text-muted-foreground">Active Investors</p>
                </div>
                <Button
                  onClick={() => setJoinOpen(true)}
                  className="bg-orange-500 hover:bg-orange-600 text-white h-9 text-sm font-medium rounded-lg"
                >
                  <UserPlus className="w-4 h-4 mr-1.5" />
                  Join as Investor
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="border-b subtle-border bg-muted/30">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="h-8 text-xs text-muted-foreground hover:text-foreground"
              >
                <Filter className="w-3.5 h-3.5 mr-1" />
                Filters
              </Button>

              {hasActiveFilters && (
                <div className="flex items-center gap-1.5">
                  {focusFilter && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 border border-orange-500/20 cursor-pointer"
                      onClick={() => setFocusFilter(null)}
                    >
                      {focusFilter}
                      <X className="w-2.5 h-2.5 ml-1" />
                    </Badge>
                  )}
                  {stageFilter && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 border border-orange-500/20 cursor-pointer"
                      onClick={() => setStageFilter(null)}
                    >
                      {stageFilter}
                      <X className="w-2.5 h-2.5 ml-1" />
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-6 text-[10px] text-muted-foreground hover:text-foreground px-2"
                  >
                    Clear
                  </Button>
                </div>
              )}
            </div>

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pt-3 pb-1 space-y-3">
                    <div>
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Focus Area</p>
                      <div className="flex flex-wrap gap-1.5">
                        {ALL_FOCUS_AREAS.map((area) => (
                          <button
                            key={area}
                            onClick={() => setFocusFilter(focusFilter === area ? null : area)}
                            className={`text-[10px] px-2.5 py-1 rounded-full border transition-all ${
                              focusFilter === area
                                ? 'bg-orange-500 text-white border-orange-500'
                                : 'text-muted-foreground border-border hover:border-orange-500/50 hover:text-foreground'
                            }`}
                          >
                            {area}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Investment Stage</p>
                      <div className="flex flex-wrap gap-1.5">
                        {ALL_STAGES.map((stage) => (
                          <button
                            key={stage}
                            onClick={() => setStageFilter(stageFilter === stage ? null : stage)}
                            className={`text-[10px] px-2.5 py-1 rounded-full border transition-all ${
                              stageFilter === stage
                                ? 'bg-orange-500 text-white border-orange-500'
                                : 'text-muted-foreground border-border hover:border-orange-500/50 hover:text-foreground'
                            }`}
                          >
                            {stage}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Investor Grid */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : investors.length === 0 ? (
            <div className="rounded-xl border subtle-border surface p-16 text-center">
              <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
                <Search className="w-6 h-6 text-orange-500" />
              </div>
              <h3 className="text-sm font-medium text-foreground mb-1">
                {hasActiveFilters ? 'No matching investors' : 'No investors yet'}
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                {hasActiveFilters
                  ? 'Try adjusting your filters to see more results.'
                  : 'Be the first to join our growing investor network.'}
              </p>
              {!hasActiveFilters && (
                <Button
                  onClick={() => setJoinOpen(true)}
                  className="bg-orange-500 hover:bg-orange-600 text-white text-xs h-8 rounded-lg"
                >
                  <UserPlus className="w-3 h-3 mr-1.5" />
                  Join as Investor
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence>
                {investors.map((investor, index) => (
                  <motion.div
                    key={investor.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="rounded-xl border subtle-border surface hover:border-orange-500/30 transition-all p-5"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-white">
                          {investor.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-foreground">{investor.name}</h3>
                        {investor.company && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {investor.company}
                          </p>
                        )}
                      </div>
                      {investor.website && (
                        <a
                          href={investor.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-orange-500 transition-colors shrink-0"
                        >
                          <Globe className="w-4 h-4" />
                        </a>
                      )}
                    </div>

                    {/* Focus Areas */}
                    {investor.focus.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {investor.focus.map((area) => (
                          <Badge
                            key={area}
                            variant="secondary"
                            className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 border border-orange-500/20"
                          >
                            {area}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Stages */}
                    {investor.stages.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {investor.stages.map((stage) => (
                          <Badge
                            key={stage}
                            variant="secondary"
                            className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border"
                          >
                            {stage}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Check Size */}
                    {investor.checkSize && (
                      <div className="flex items-center gap-1.5 mb-3">
                        <DollarSign className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{investor.checkSize}</span>
                      </div>
                    )}

                    {/* Bio */}
                    {investor.bio && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {investor.bio}
                      </p>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>
      </main>

      <Footer />

      {/* Join as Investor Dialog */}
      <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
        <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Join as Investor</DialogTitle>
            <DialogDescription>
              Submit your investor profile to be listed in our network. Founders will be able to discover and connect with you.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Full Name <span className="text-red-500">*</span></label>
                <Input
                  placeholder="John Doe"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email <span className="text-red-500">*</span></label>
                <Input
                  placeholder="john@example.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  type="email"
                  maxLength={200}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Company / Fund</label>
                <Input
                  placeholder="Acme Ventures"
                  value={formCompany}
                  onChange={(e) => setFormCompany(e.target.value)}
                  maxLength={200}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Website</label>
                <Input
                  placeholder="https://acme.vc"
                  value={formWebsite}
                  onChange={(e) => setFormWebsite(e.target.value)}
                  maxLength={500}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Check Size</label>
              <Input
                placeholder="e.g., $50K-$500K"
                value={formCheckSize}
                onChange={(e) => setFormCheckSize(e.target.value)}
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Focus Areas</label>
              <div className="flex flex-wrap gap-1.5 p-3 rounded-lg border subtle-border surface">
                {ALL_FOCUS_AREAS.slice(0, 12).map((area) => (
                  <button
                    key={area}
                    type="button"
                    onClick={() => toggleFormFocus(area)}
                    className={`text-[10px] px-2.5 py-1 rounded-full border transition-all ${
                      formFocusAreas.includes(area)
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'text-muted-foreground border-border hover:border-orange-500/50'
                    }`}
                  >
                    {area}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Investment Stages</label>
              <div className="flex flex-wrap gap-1.5 p-3 rounded-lg border subtle-border surface">
                {ALL_STAGES.map((stage) => (
                  <button
                    key={stage}
                    type="button"
                    onClick={() => toggleFormStage(stage)}
                    className={`text-[10px] px-2.5 py-1 rounded-full border transition-all ${
                      formStages.includes(stage)
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'text-muted-foreground border-border hover:border-orange-500/50'
                    }`}
                  >
                    {stage}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Bio</label>
              <Textarea
                placeholder="Brief description of your investment thesis and what you look for in startups..."
                value={formBio}
                onChange={(e) => setFormBio(e.target.value)}
                rows={3}
                maxLength={1000}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setJoinOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleJoinSubmit}
                disabled={joinLoading || !formName.trim() || !formEmail.trim()}
                className="bg-orange-500 hover:bg-orange-600 text-white text-xs rounded-lg"
              >
                {joinLoading ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Profile'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function InvestorsPage() {
  return <InvestorsContent />
}
