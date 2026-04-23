'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Users, FileText, GitBranch, Sparkles, ArrowRight, Mic, BookOpen, Camera, MessageCircle, ChefHat, Heart } from 'lucide-react'
import { useWorkspace } from '@/components/providers/workspace-provider'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { QuickCapture } from '@/components/capture/quick-capture'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { StorySearch } from '@/components/search/story-search'
import type { Person } from '@/types'

interface Stats {
  people: number
  sources: number
  suggestions: number
  memories: number
  recipes: number
  peopleWithoutPhotos: number
}

interface RecentPerson extends Person {
  memories_count: number
}

// Daily prompts to encourage capturing memories
const dailyPrompts = [
  { icon: Mic, text: "Record a story about a family gathering", color: "text-[var(--atlas-coral)]" },
  { icon: BookOpen, text: "Write down a favorite saying or quote", color: "text-[var(--atlas-ochre)]" },
  { icon: ChefHat, text: "Preserve a treasured family recipe", color: "text-[var(--atlas-jade)]" },
  { icon: Camera, text: "Add photos to family members", color: "text-[var(--atlas-teal)]" },
  { icon: MessageCircle, text: "Ask an elder about their childhood", color: "text-[var(--atlas-accent)]" },
  { icon: Heart, text: "Describe a personality trait you loved", color: "text-[var(--atlas-coral)]" },
]

const dashboardTileClass =
  "group atlas-panel relative overflow-hidden rounded-[1.35rem] p-4 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-[var(--atlas-line-strong)] hover:shadow-[0_18px_44px_rgba(86,59,40,0.1)]"

const dashboardIconClass =
  "flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--atlas-line)] bg-[rgba(255,246,228,0.74)] shadow-[inset_0_1px_0_rgba(255,255,255,0.58)]"

export default function DashboardPage() {
  const { currentWorkspace, workspaces, loading } = useWorkspace()
  const [stats, setStats] = useState<Stats>({ people: 0, sources: 0, suggestions: 0, memories: 0, recipes: 0, peopleWithoutPhotos: 0 })
  const [recentPeople, setRecentPeople] = useState<RecentPerson[]>([])
  const todayPrompt = useMemo(() => {
    const now = new Date()
    const start = new Date(now.getFullYear(), 0, 0)
    const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86400000)
    return dailyPrompts[dayOfYear % dailyPrompts.length]
  }, [])

  useEffect(() => {
    async function fetchStats() {
      if (!currentWorkspace) return

      const supabase = createClient()

      const [peopleRes, sourcesRes, suggestionsRes, memoriesRes, recipesRes, noPhotoRes, recentRes] = await Promise.all([
        supabase
          .from('people')
          .select('id', { count: 'exact', head: true })
          .eq('workspace_id', currentWorkspace.id),
        supabase
          .from('sources')
          .select('id', { count: 'exact', head: true })
          .eq('workspace_id', currentWorkspace.id),
        supabase
          .from('suggestions')
          .select('id', { count: 'exact', head: true })
          .eq('workspace_id', currentWorkspace.id)
          .eq('status', 'pending'),
        supabase
          .from('memories')
          .select('id', { count: 'exact', head: true })
          .eq('workspace_id', currentWorkspace.id),
        supabase
          .from('memories')
          .select('id', { count: 'exact', head: true })
          .eq('workspace_id', currentWorkspace.id)
          .eq('memory_type', 'recipe'),
        supabase
          .from('people')
          .select('id', { count: 'exact', head: true })
          .eq('workspace_id', currentWorkspace.id)
          .is('photo_url', null),
        supabase
          .from('people')
          .select('*')
          .eq('workspace_id', currentWorkspace.id)
          .order('created_at', { ascending: false })
          .limit(5),
      ])

      setStats({
        people: peopleRes.count || 0,
        sources: sourcesRes.count || 0,
        suggestions: suggestionsRes.count || 0,
        memories: memoriesRes.count || 0,
        recipes: recipesRes.count || 0,
        peopleWithoutPhotos: noPhotoRes.count || 0,
      })

      if (recentRes.data) {
        setRecentPeople(recentRes.data.map(p => ({ ...p, memories_count: 0 })))
      }
    }

    fetchStats()
  }, [currentWorkspace])

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-6xl mx-auto">
        {/* Skeleton header */}
        <div className="mb-8">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-5 w-36" />
        </div>
        {/* Skeleton quick capture */}
        <div className="mb-8">
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
        {/* Skeleton stats grid */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="atlas-panel rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
              </div>
              <Skeleton className="h-7 w-12 mb-1" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!currentWorkspace) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Welcome to Whakapapa</CardTitle>
            <CardDescription>
              {workspaces.length === 0
                ? 'Create your first family tree to get started.'
                : 'Choose a family tree to continue.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-[var(--atlas-copy)]">
              {workspaces.length === 0
                ? "Click the menu icon (☰) in the top-left corner, then select \"Create workspace\" to begin your family history."
                : "Click the menu icon (☰) in the top-left corner to see your family trees and select one."}
            </p>
            {workspaces.length > 0 && (
              <div className="rounded-xl border border-[var(--atlas-line)] bg-[rgba(255,249,238,0.58)] p-3">
                <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-[var(--atlas-muted)]">Your family trees:</p>
                <ul className="space-y-1 text-sm text-[var(--atlas-copy)]">
                  {workspaces.slice(0, 3).map((ws) => (
                    <li key={ws.id}>• {ws.name}</li>
                  ))}
                  {workspaces.length > 3 && (
                    <li className="text-[var(--atlas-muted)]">and {workspaces.length - 3} more...</li>
                  )}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mx-auto max-w-6xl p-6 md:p-8"
    >
      {/* Header */}
      <div className="mb-8">
        <div className="atlas-label mb-3">Current archive</div>
        <h1 className="font-serif text-4xl font-medium leading-none tracking-[-0.04em] text-[var(--atlas-ink)] md:text-5xl">
          {currentWorkspace.name}
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--atlas-copy)]">
          Your family knowledge base, held as sourced fragments, voice, people, and the lines between them.
        </p>
      </div>

      {/* Quick Capture - Hero placement */}
      <div className="mb-8">
        <QuickCapture />
      </div>

      {/* Story Search - Only show if there are people to search */}
      {stats.people > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-8"
        >
          <StorySearch />
        </motion.div>
      )}

      {/* Stats & Quick Links */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Link href="/people">
          <motion.div
            whileHover={{ y: -2 }}
            className={dashboardTileClass}
          >
            <div className="flex items-center justify-between">
              <div className={dashboardIconClass}>
                <Users className="h-5 w-5 text-[var(--atlas-accent)]" />
              </div>
              <ArrowRight className="h-4 w-4 text-[var(--atlas-muted)] opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
            <div className="mt-3">
              <p className="text-2xl font-semibold text-[var(--atlas-ink)]">
                {stats.people}
              </p>
              <p className="text-sm text-[var(--atlas-copy)]">People</p>
            </div>
          </motion.div>
        </Link>

        <Link href="/sources">
          <motion.div
            whileHover={{ y: -2 }}
            className={dashboardTileClass}
          >
            <div className="flex items-center justify-between">
              <div className={dashboardIconClass}>
                <FileText className="h-5 w-5 text-[var(--atlas-teal)]" />
              </div>
              <ArrowRight className="h-4 w-4 text-[var(--atlas-muted)] opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
            <div className="mt-3">
              <p className="text-2xl font-semibold text-[var(--atlas-ink)]">
                {stats.sources}
              </p>
              <p className="text-sm text-[var(--atlas-copy)]">Sources</p>
            </div>
          </motion.div>
        </Link>

        <Link href="/suggestions">
          <motion.div
            whileHover={{ y: -2 }}
            className={dashboardTileClass}
          >
            <div className="flex items-center justify-between">
              <div className={dashboardIconClass}>
                <Sparkles className="h-5 w-5 text-[var(--atlas-ochre)]" />
              </div>
              <ArrowRight className="h-4 w-4 text-[var(--atlas-muted)] opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
            <div className="mt-3">
              <p className="text-2xl font-semibold text-[var(--atlas-ink)]">
                {stats.suggestions}
              </p>
              <p className="text-sm text-[var(--atlas-copy)]">
                {stats.suggestions > 0 ? 'To review' : 'Suggestions'}
              </p>
            </div>
          </motion.div>
        </Link>

        <Link href="/tree">
          <motion.div
            whileHover={{ y: -2 }}
            className={dashboardTileClass}
          >
            <div className="flex items-center justify-between">
              <div className={dashboardIconClass}>
                <GitBranch className="h-5 w-5 text-[var(--atlas-jade)]" />
              </div>
              <ArrowRight className="h-4 w-4 text-[var(--atlas-muted)] opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
            <div className="mt-3">
              <p className="font-medium text-[var(--atlas-ink)]">Family Tree</p>
              <p className="text-sm text-[var(--atlas-copy)]">View connections</p>
            </div>
          </motion.div>
        </Link>
      </div>

      {/* Daily Prompt */}
      {stats.people > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="atlas-panel mb-8 rounded-[1.35rem] p-5"
        >
          <div className="flex items-center gap-4">
            <div className="atlas-brand-mark flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[var(--atlas-line)] shadow-sm">
              <todayPrompt.icon className={`h-6 w-6 ${todayPrompt.color}`} />
            </div>
            <div className="flex-1">
              <p className="atlas-label mb-1">
                Today&apos;s preservation prompt
              </p>
              <p className="font-medium text-[var(--atlas-ink)]">
                {todayPrompt.text}
              </p>
            </div>
            <Link href="/people">
              <Button size="sm" variant="outline">
                Get Started
              </Button>
            </Link>
          </div>
        </motion.div>
      )}

      {/* Two Column Layout for larger screens */}
      {stats.people > 0 && (
        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          {/* Recent People */}
          {recentPeople.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="atlas-panel rounded-[1.35rem] p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[var(--atlas-ink)]">Recent People</h3>
                <Link href="/people" className="text-sm text-[var(--atlas-copy)] hover:text-[var(--atlas-ink)]">
                  View all
                </Link>
              </div>
              <div className="space-y-3">
                {recentPeople.slice(0, 4).map((person) => (
                  <Link key={person.id} href={`/people/${person.id}`}>
                    <div className="-mx-2 flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-[rgba(203,153,79,0.08)]">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={person.photo_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {person.preferred_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium text-[var(--atlas-ink)]">
                          {person.preferred_name}
                        </p>
                        <p className="truncate text-xs text-[var(--atlas-muted)]">
                          {!person.photo_url && 'Needs photo'}
                          {!person.photo_url && !person.bio && ' • '}
                          {!person.bio && 'Needs bio'}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-[var(--atlas-muted)]" />
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="atlas-panel rounded-[1.35rem] p-5"
          >
            <h3 className="mb-4 font-semibold text-[var(--atlas-ink)]">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/recipes">
                <div className="flex items-center gap-3 rounded-xl border border-[var(--atlas-line)] bg-[rgba(111,147,131,0.13)] p-3 transition-colors hover:bg-[rgba(111,147,131,0.2)]">
                  <ChefHat className="h-5 w-5 text-[var(--atlas-jade)]" />
                  <div>
                    <p className="text-sm font-medium text-[var(--atlas-ink)]">Recipes</p>
                    <p className="text-xs text-[var(--atlas-muted)]">{stats.recipes} saved</p>
                  </div>
                </div>
              </Link>
              <Link href="/people">
                <div className="flex items-center gap-3 rounded-xl border border-[var(--atlas-line)] bg-[rgba(49,94,99,0.12)] p-3 transition-colors hover:bg-[rgba(49,94,99,0.18)]">
                  <BookOpen className="h-5 w-5 text-[var(--atlas-teal)]" />
                  <div>
                    <p className="text-sm font-medium text-[var(--atlas-ink)]">Stories</p>
                    <p className="text-xs text-[var(--atlas-muted)]">{stats.memories} captured</p>
                  </div>
                </div>
              </Link>
              <Link href="/export/print">
                <div className="flex items-center gap-3 rounded-xl border border-[var(--atlas-line)] bg-[rgba(203,153,79,0.12)] p-3 transition-colors hover:bg-[rgba(203,153,79,0.18)]">
                  <FileText className="h-5 w-5 text-[var(--atlas-accent)]" />
                  <div>
                    <p className="text-sm font-medium text-[var(--atlas-ink)]">Print</p>
                    <p className="text-xs text-[var(--atlas-muted)]">Family book</p>
                  </div>
                </div>
              </Link>
              {stats.peopleWithoutPhotos > 0 && (
                <Link href="/people">
                  <div className="flex items-center gap-3 rounded-xl border border-[var(--atlas-line)] bg-[rgba(199,138,76,0.13)] p-3 transition-colors hover:bg-[rgba(199,138,76,0.2)]">
                    <Camera className="h-5 w-5 text-[var(--atlas-ochre)]" />
                    <div>
                      <p className="text-sm font-medium text-[var(--atlas-ink)]">Add Photos</p>
                      <p className="text-xs text-[var(--atlas-muted)]">{stats.peopleWithoutPhotos} need photos</p>
                    </div>
                  </div>
                </Link>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Quick tips for empty state */}
      {stats.people === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="atlas-panel rounded-[1.35rem] p-6"
        >
          <h3 className="mb-3 font-serif text-2xl font-medium tracking-[-0.025em] text-[var(--atlas-ink)]">
            Getting Started
          </h3>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--atlas-accent-soft)] text-xs font-medium text-[var(--atlas-accent)]">
                1
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--atlas-ink)]">
                  Paste a document
                </p>
                <p className="text-xs text-[var(--atlas-copy)]">
                  Use Quick Capture above to extract family data from any text
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--atlas-accent-soft)] text-xs font-medium text-[var(--atlas-accent)]">
                2
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--atlas-ink)]">
                  Review suggestions
                </p>
                <p className="text-xs text-[var(--atlas-copy)]">
                  AI creates suggestions for you to approve or edit
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--atlas-accent-soft)] text-xs font-medium text-[var(--atlas-accent)]">
                3
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--atlas-ink)]">
                  Build connections
                </p>
                <p className="text-xs text-[var(--atlas-copy)]">
                  Link people together to create your family tree
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
