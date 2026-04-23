'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  Rocket, User, Star, Trophy, ChevronRight, ChevronLeft, Loader2,
  ExternalLink, Sparkles, Camera, X, Linkedin, Twitter, Globe
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import Header from '@/components/Header'

const categories = ['AI', 'SaaS', 'Finance', 'Developer Tools', 'Productivity', 'Marketing', 'Business', 'Healthcare', 'Education', 'Other']
const stages = ['Pre-seed', 'Seed', 'Series A', 'Series B', 'Growth']

export default function SubmitPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState({
    firstName: '', lastName: '', role: '', twitter: '', linkedin: '', roleType: 'founder'
  })
  const [startup, setStartup] = useState({
    name: '', website: '', tagline: '', description: '', category: '', stage: 'Pre-seed',
    teamSize: '1-5', foundedYear: '', country: '', email: ''
  })

  const totalSteps = 3
  const progress = (step / totalSteps) * 100

  const handleProfileNext = () => {
    if (!profile.firstName || !profile.lastName) {
      toast.error('Please enter your name')
      return
    }
    setStep(2)
  }

  const handleStartupNext = () => {
    if (!startup.name || !startup.website || !startup.tagline || !startup.category) {
      toast.error('Please fill in all required fields')
      return
    }
    setStep(3)
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/startups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: startup.name,
          tagline: startup.tagline,
          description: startup.description,
          website: startup.website,
          category: startup.category,
          stage: startup.stage,
          teamSize: startup.teamSize,
          foundedYear: startup.foundedYear ? parseInt(startup.foundedYear) : null,
          country: startup.country,
          email: startup.email,
          twitter: profile.twitter || null,
        }),
      })
      if (res.ok) {
        router.push(`/launch-confirmation?name=${encodeURIComponent(startup.name)}&url=${encodeURIComponent(startup.website)}&founder=${encodeURIComponent(profile.firstName + ' ' + profile.lastName)}&email=${encodeURIComponent(startup.email || '')}`)
      } else {
        toast.error('Failed to submit startup')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Step {step} of {totalSteps}</span>
              <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-blue-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1: Profile */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col lg:flex-row gap-8"
              >
                {/* Form */}
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-foreground mb-1">
                    Let&apos;s personalize your experience, {profile.firstName || 'founder'}.
                  </h1>
                  <p className="text-sm text-muted-foreground mb-6">
                    Tell us about yourself so we can tailor your Revolaunch experience.
                  </p>

                  {/* Profile photo placeholder */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 border-2 border-border flex items-center justify-center">
                      <Camera className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground text-xs h-8">
                        <Camera className="w-3.5 h-3.5 mr-1.5" />
                        Upload Photo
                      </Button>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Optional - helps build trust</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground">First name *</label>
                        <Input
                          placeholder="John"
                          value={profile.firstName}
                          onChange={e => setProfile({ ...profile, firstName: e.target.value })}
                          className="input-bg input-bg-focus text-foreground h-10 rounded-lg"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground">Last name *</label>
                        <Input
                          placeholder="Doe"
                          value={profile.lastName}
                          onChange={e => setProfile({ ...profile, lastName: e.target.value })}
                          className="input-bg input-bg-focus text-foreground h-10 rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground">Role</label>
                      <Input
                        placeholder="Co-founder at SpaceX"
                        value={profile.role}
                        onChange={e => setProfile({ ...profile, role: e.target.value })}
                        className="input-bg input-bg-focus text-foreground h-10 rounded-lg"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground">
                          X (Twitter) <span className="text-muted-foreground">optional</span>
                        </label>
                        <div className="relative">
                          <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                          <Input
                            placeholder="https://x.com/handle"
                            value={profile.twitter}
                            onChange={e => setProfile({ ...profile, twitter: e.target.value })}
                            className="pl-9 input-bg input-bg-focus text-foreground h-10 rounded-lg"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground">
                          LinkedIn <span className="text-muted-foreground">optional</span>
                        </label>
                        <div className="relative">
                          <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                          <Input
                            placeholder="https://linkedin.com/in/profile"
                            value={profile.linkedin}
                            onChange={e => setProfile({ ...profile, linkedin: e.target.value })}
                            className="pl-9 input-bg input-bg-focus text-foreground h-10 rounded-lg"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground mb-2 block">You are here as</label>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setProfile({ ...profile, roleType: 'founder' })}
                          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all border ${
                            profile.roleType === 'founder'
                              ? 'bg-foreground text-background border-foreground'
                              : 'bg-muted text-muted-foreground border-border hover:border-foreground/20'
                          }`}
                        >
                          <Rocket className="w-4 h-4 inline mr-1.5" />
                          I&apos;m a Founder / Maker
                        </button>
                        <button
                          onClick={() => setProfile({ ...profile, roleType: 'investor' })}
                          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all border ${
                            profile.roleType === 'investor'
                              ? 'bg-foreground text-background border-foreground'
                              : 'bg-muted text-muted-foreground border-border hover:border-foreground/20'
                          }`}
                        >
                          <Trophy className="w-4 h-4 inline mr-1.5" />
                          I&apos;m an Investor / Buyer
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end mt-6">
                    <Button onClick={handleProfileNext} className="bg-foreground text-background hover:bg-foreground/80 font-medium rounded-lg h-10 px-6">
                      Next <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>

                {/* Live preview card */}
                <div className="lg:w-[300px] shrink-0">
                  <div className="lg:sticky lg:top-[72px]">
                    <p className="text-xs text-muted-foreground mb-3">Preview</p>
                    <div className="rounded-xl border-2 border-blue-500/30 surface p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center">
                          <Rocket className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">revolaunch.net</span>
                      </div>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center text-foreground font-bold text-lg">
                          {profile.firstName ? profile.firstName[0].toUpperCase() : '?'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {profile.firstName} {profile.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">{profile.role || 'Your role'}</p>
                        </div>
                      </div>
                      {profile.twitter && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Twitter className="w-3 h-3" />
                          <span>{profile.twitter}</span>
                        </div>
                      )}
                      {profile.linkedin && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Linkedin className="w-3 h-3" />
                          <span>{profile.linkedin}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Win the Week */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col lg:flex-row gap-8"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-4xl">🏅</span>
                  </div>
                  <h1 className="text-2xl font-bold text-foreground mb-2">
                    Win the Week. Every Single Week.
                  </h1>
                  <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                    Collect stars and reviews from the community to climb the weekly leaderboard.
                    The top 3 startups every week get featured to 50K+ visitors.
                  </p>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-muted border subtle-border">
                      <span className="text-xl">⭐</span>
                      <div>
                        <p className="text-sm font-medium text-foreground">Collect Stars</p>
                        <p className="text-xs text-muted-foreground">Every star from the community counts toward your weekly ranking</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-muted border subtle-border">
                      <span className="text-xl">🏆</span>
                      <div>
                        <p className="text-sm font-medium text-foreground">Win the Week</p>
                        <p className="text-xs text-muted-foreground">Top 3 every week get featured on our homepage and newsletter</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-muted border subtle-border">
                      <span className="text-xl">🚀</span>
                      <div>
                        <p className="text-sm font-medium text-foreground">Get Discovered</p>
                        <p className="text-xs text-muted-foreground">Investors and early adopters browse Revolaunch daily</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between mt-6">
                    <Button variant="ghost" onClick={() => setStep(1)} className="text-muted-foreground hover:text-foreground h-10">
                      <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                    </Button>
                    <Button onClick={() => setStep(3)} className="bg-foreground text-background hover:bg-foreground/80 font-medium rounded-lg h-10 px-6">
                      Next <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>

                {/* Leaderboard preview */}
                <div className="lg:w-[300px] shrink-0">
                  <div className="lg:sticky lg:top-[72px]">
                    <div className="rounded-xl border subtle-border surface overflow-hidden">
                      <div className="p-4 border-b subtle-border">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Current Leaders</p>
                      </div>
                      <div className="divide-y divide-border">
                        {[
                          { name: 'Your Startup', pts: 0, medal: '🥇', color: 'bg-yellow-500/20' },
                          { name: 'NeuralForge', pts: 340, medal: '🥈', color: 'bg-gray-400/20' },
                          { name: 'PayStream', pts: 290, medal: '🥉', color: 'bg-orange-700/20' },
                        ].map((item, i) => (
                          <div key={i} className={`flex items-center gap-3 p-3 ${i === 0 ? 'card-active-bg' : ''}`}>
                            <div className={`w-8 h-8 rounded-lg ${item.color} flex items-center justify-center text-base`}>
                              {item.medal}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-amber-500" />
                              <span className="text-sm font-bold text-foreground tabular-nums">{item.pts}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Launch */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col lg:flex-row gap-8"
              >
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-foreground mb-2">
                    Ready to launch?
                  </h1>
                  <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                    Launch your startup and compete on our weekly leaderboard. Earn stars, get reviews, and get discovered by thousands.
                  </p>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground">Startup Name *</label>
                        <Input
                          placeholder="e.g., Acme Inc."
                          value={startup.name}
                          onChange={e => setStartup({ ...startup, name: e.target.value })}
                          className="input-bg input-bg-focus text-foreground h-10 rounded-lg"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground">Startup URL *</label>
                        <div className="relative">
                          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                          <Input
                            placeholder="example.com"
                            value={startup.website}
                            onChange={e => setStartup({ ...startup, website: e.target.value })}
                            className="pl-9 input-bg input-bg-focus text-foreground h-10 rounded-lg"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground">Tagline *</label>
                      <Input
                        placeholder="One sentence that describes your startup"
                        value={startup.tagline}
                        onChange={e => setStartup({ ...startup, tagline: e.target.value })}
                        className="input-bg input-bg-focus text-foreground h-10 rounded-lg"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground">Description</label>
                      <textarea
                        placeholder="Tell us more about what you're building..."
                        value={startup.description}
                        onChange={e => setStartup({ ...startup, description: e.target.value })}
                        className="w-full min-h-[80px] input-bg input-bg-focus text-foreground rounded-lg px-3 py-2 text-sm resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground">Category *</label>
                        <Select value={startup.category} onValueChange={v => setStartup({ ...startup, category: v })}>
                          <SelectTrigger className="input-bg text-foreground h-10 rounded-lg">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent className="popover-bg border-border">
                            {categories.map(c => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground">Stage</label>
                        <Select value={startup.stage} onValueChange={v => setStartup({ ...startup, stage: v })}>
                          <SelectTrigger className="input-bg text-foreground h-10 rounded-lg">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="popover-bg border-border">
                            {stages.map(s => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground">Team Size</label>
                        <Select value={startup.teamSize} onValueChange={v => setStartup({ ...startup, teamSize: v })}>
                          <SelectTrigger className="input-bg text-foreground h-10 rounded-lg">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="popover-bg border-border">
                            {['1-5', '6-20', '21-50', '51-200', '200+'].map(s => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground">Founded Year</label>
                        <Input
                          type="number"
                          placeholder="2024"
                          value={startup.foundedYear}
                          onChange={e => setStartup({ ...startup, foundedYear: e.target.value })}
                          className="input-bg input-bg-focus text-foreground h-10 rounded-lg"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground">Country</label>
                        <Input
                          placeholder="United States"
                          value={startup.country}
                          onChange={e => setStartup({ ...startup, country: e.target.value })}
                          className="input-bg input-bg-focus text-foreground h-10 rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground">Contact Email</label>
                      <Input
                        type="email"
                        placeholder="founder@startup.com"
                        value={startup.email}
                        onChange={e => setStartup({ ...startup, email: e.target.value })}
                        className="input-bg input-bg-focus text-foreground h-10 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between mt-6">
                    <Button variant="ghost" onClick={() => setStep(2)} className="text-muted-foreground hover:text-foreground h-10">
                      <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                    </Button>
                    <div className="flex items-center gap-3">
                      <Button variant="ghost" onClick={() => router.push('/')} className="text-muted-foreground hover:text-foreground text-sm h-10">
                        I&apos;ll do this later
                      </Button>
                      <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg h-10 px-6"
                      >
                        {loading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Rocket className="w-4 h-4 mr-1.5" />
                            Launch Now
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Launch Now CTA */}
                <div className="lg:w-[300px] shrink-0">
                  <div className="lg:sticky lg:top-[72px]">
                    <div className="rounded-xl border border-blue-500/20 card-active-bg p-6 text-center">
                      <h2 className="text-3xl font-bold gradient-text-blue mb-2">LAUNCH NOW</h2>
                      <p className="text-xs text-muted-foreground mb-4">
                        Join 36 startups already competing for the top spot this week.
                      </p>
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="rounded-lg bg-muted p-3">
                          <p className="text-lg font-bold text-foreground">50K+</p>
                          <p className="text-[10px] text-muted-foreground">Monthly Visitors</p>
                        </div>
                        <div className="rounded-lg bg-muted p-3">
                          <p className="text-lg font-bold text-foreground">200+</p>
                          <p className="text-[10px] text-muted-foreground">Investors Active</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}
