'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Briefcase, ArrowLeft, Loader2, X, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const CATEGORIES = [
  'Engineering',
  'Design',
  'Product',
  'Marketing',
  'Sales',
  'Operations',
  'Finance',
  'Customer Success',
]

const JOB_TYPES = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
]

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD']

export default function PostJobPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])

  const [form, setForm] = useState({
    title: '',
    company: '',
    website: '',
    logo: '',
    location: '',
    type: 'full-time',
    salaryMin: '',
    salaryMax: '',
    currency: 'USD',
    category: 'Engineering',
    description: '',
  })

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase()
    if (tag && !tags.includes(tag) && tags.length < 8) {
      setTags([...tags, tag])
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
    if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      setTags(tags.slice(0, -1))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.title.trim() || !form.company.trim() || !form.description.trim()) {
      toast.error('Please fill in all required fields.')
      return
    }

    setSubmitting(true)

    try {
      const payload: Record<string, any> = {
        title: form.title,
        company: form.company,
        type: form.type,
        category: form.category,
        description: form.description,
        tags,
      }

      if (form.website.trim()) payload.website = form.website
      if (form.logo.trim()) payload.logo = form.logo
      if (form.location.trim()) payload.location = form.location
      if (form.salaryMin) payload.salaryMin = parseInt(form.salaryMin, 10)
      if (form.salaryMax) payload.salaryMax = parseInt(form.salaryMax, 10)
      if (form.currency) payload.currency = form.currency

      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Job posted successfully!', {
          description: `${form.title} at ${form.company} is now live.`,
        })
        router.push('/jobs')
      } else {
        toast.error(data.error || 'Failed to post job. Please try again.')
      }
    } catch (err) {
      console.error('Failed to post job:', err)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        <section className="hero-gradient border-b subtle-border">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <Link
              href="/jobs"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4"
            >
              <ArrowLeft className="w-3 h-3" />
              Back to Jobs
            </Link>
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="w-6 h-6 text-orange-500" />
              <span className="text-xs font-medium text-orange-500 uppercase tracking-wider">Hiring</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              Post a Job
            </h1>
            <p className="text-sm text-muted-foreground">
              Reach thousands of talented professionals looking for their next startup opportunity.
            </p>
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.form
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {/* Company Info Section */}
            <div className="rounded-xl border subtle-border surface p-5 sm:p-6 space-y-5">
              <h2 className="text-sm font-semibold text-foreground">Company Information</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company" className="text-xs font-medium">
                    Company Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="company"
                    placeholder="Acme Inc."
                    value={form.company}
                    onChange={(e) => updateField('company', e.target.value)}
                    className="h-9 text-sm rounded-lg input-bg"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website" className="text-xs font-medium">
                    Website
                  </Label>
                  <Input
                    id="website"
                    placeholder="https://acme.com"
                    value={form.website}
                    onChange={(e) => updateField('website', e.target.value)}
                    className="h-9 text-sm rounded-lg input-bg"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo" className="text-xs font-medium">
                  Logo URL
                </Label>
                <Input
                  id="logo"
                  placeholder="https://acme.com/logo.png"
                  value={form.logo}
                  onChange={(e) => updateField('logo', e.target.value)}
                  className="h-9 text-sm rounded-lg input-bg"
                />
                <p className="text-[11px] text-muted-foreground">Direct link to your company logo image.</p>
              </div>
            </div>

            {/* Job Details Section */}
            <div className="rounded-xl border subtle-border surface p-5 sm:p-6 space-y-5">
              <h2 className="text-sm font-semibold text-foreground">Job Details</h2>

              <div className="space-y-2">
                <Label htmlFor="title" className="text-xs font-medium">
                  Job Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="Senior Frontend Engineer"
                  value={form.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  className="h-9 text-sm rounded-lg input-bg"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">
                    Job Type <span className="text-destructive">*</span>
                  </Label>
                  <Select value={form.type} onValueChange={(v) => updateField('type', v)}>
                    <SelectTrigger className="h-9 text-sm rounded-lg input-bg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {JOB_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Category</Label>
                  <Select value={form.category} onValueChange={(v) => updateField('category', v)}>
                    <SelectTrigger className="h-9 text-sm rounded-lg input-bg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-xs font-medium">Location</Label>
                  <Input
                    id="location"
                    placeholder="Remote"
                    value={form.location}
                    onChange={(e) => updateField('location', e.target.value)}
                    className="h-9 text-sm rounded-lg input-bg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="salaryMin" className="text-xs font-medium">
                    Salary Min
                  </Label>
                  <Input
                    id="salaryMin"
                    type="number"
                    placeholder="80000"
                    value={form.salaryMin}
                    onChange={(e) => updateField('salaryMin', e.target.value)}
                    className="h-9 text-sm rounded-lg input-bg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salaryMax" className="text-xs font-medium">
                    Salary Max
                  </Label>
                  <Input
                    id="salaryMax"
                    type="number"
                    placeholder="120000"
                    value={form.salaryMax}
                    onChange={(e) => updateField('salaryMax', e.target.value)}
                    className="h-9 text-sm rounded-lg input-bg"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Currency</Label>
                  <Select value={form.currency} onValueChange={(v) => updateField('currency', v)}>
                    <SelectTrigger className="h-9 text-sm rounded-lg input-bg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Description Section */}
            <div className="rounded-xl border subtle-border surface p-5 sm:p-6 space-y-5">
              <h2 className="text-sm font-semibold text-foreground">Description</h2>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-xs font-medium">
                  Job Description <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe the role, responsibilities, requirements, and what makes this opportunity exciting..."
                  value={form.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  className="min-h-[180px] text-sm rounded-lg input-bg resize-y"
                  required
                />
                <p className="text-[11px] text-muted-foreground">
                  Markdown is not supported. Use plain text for best results.
                </p>
              </div>
            </div>

            {/* Tags Section */}
            <div className="rounded-xl border subtle-border surface p-5 sm:p-6 space-y-5">
              <h2 className="text-sm font-semibold text-foreground">Tags</h2>

              <div className="space-y-2">
                <Label htmlFor="tags" className="text-xs font-medium">
                  Skills &amp; Keywords
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="tags"
                    placeholder="e.g. React, Remote, AI"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    className="h-9 text-sm rounded-lg input-bg flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addTag}
                    disabled={!tagInput.trim() || tags.length >= 8}
                    className="h-9 text-xs rounded-lg shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="hover:text-foreground transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-[11px] text-muted-foreground">
                  Up to 8 tags. Press Enter or click + to add.
                </p>
              </div>
            </div>

            {/* Submit */}
            <div className="flex items-center justify-between pt-2 pb-8">
              <Link href="/jobs">
                <Button variant="ghost" size="sm" className="text-sm text-muted-foreground hover:text-foreground h-9 rounded-lg">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-orange-500 hover:bg-orange-600 text-white h-9 text-sm font-medium rounded-lg px-6"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                    Posting...
                  </>
                ) : (
                  'Post Job'
                )}
              </Button>
            </div>
          </motion.form>
        </section>
      </main>
      <Footer />
    </div>
  )
}
