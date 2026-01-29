'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Users, FileText, GitBranch, Sparkles, ArrowRight, Mic, BookOpen, Camera, MessageCircle, ChefHat, Heart } from 'lucide-react'
import { useWorkspace } from '@/components/providers/workspace-provider'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { QuickCapture } from '@/components/capture/quick-capture'
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton'
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
  { icon: Mic, text: "Record a story about a family gathering", color: "text-red-500" },
  { icon: BookOpen, text: "Write down a favorite saying or quote", color: "text-amber-500" },
  { icon: ChefHat, text: "Preserve a treasured family recipe", color: "text-green-500" },
  { icon: Camera, text: "Add photos to family members", color: "text-blue-500" },
  { icon: MessageCircle, text: "Ask an elder about their childhood", color: "text-purple-500" },
  { icon: Heart, text: "Describe a personality trait you loved", color: "text-pink-500" },
]

export default function DashboardPage() {
  const { currentWorkspace, workspaces, loading } = useWorkspace()
  const [stats, setStats] = useState<Stats>({ people: 0, sources: 0, suggestions: 0, memories: 0, recipes: 0, peopleWithoutPhotos: 0 })
  const [recentPeople, setRecentPeople] = useState<RecentPerson[]>([])
  const [todayPrompt, setTodayPrompt] = useState(dailyPrompts[0])

  useEffect(() => {
    // Pick a daily prompt based on the date
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
    setTodayPrompt(dailyPrompts[dayOfYear % dailyPrompts.length])
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
            <div key={i} className="rounded-xl border border-stone-200 dark:border-stone-800 p-4">
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
            <p className="text-sm text-stone-500 dark:text-stone-400">
              {workspaces.length === 0
                ? "Click the menu icon (☰) in the top-left corner, then select \"Create workspace\" to begin your family history."
                : "Click the menu icon (☰) in the top-left corner to see your family trees and select one."}
            </p>
            {workspaces.length > 0 && (
              <div className="rounded-lg bg-stone-50 dark:bg-stone-800/50 p-3">
                <p className="text-xs font-medium text-stone-600 dark:text-stone-400 mb-2">Your family trees:</p>
                <ul className="text-sm text-stone-700 dark:text-stone-300 space-y-1">
                  {workspaces.slice(0, 3).map((ws) => (
                    <li key={ws.id}>• {ws.name}</li>
                  ))}
                  {workspaces.length > 3 && (
                    <li className="text-stone-400">and {workspaces.length - 3} more...</li>
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
      className="p-6 md:p-8 max-w-6xl mx-auto"
    >
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
          {currentWorkspace.name}
        </h1>
        <p className="mt-1 text-stone-500 dark:text-stone-400">
          Your family knowledge base
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
            className="group rounded-xl border border-stone-200/60 bg-white p-4 shadow-sm shadow-stone-900/5 transition-all hover:shadow-md dark:border-stone-800/60 dark:bg-stone-900"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-stone-100 dark:bg-stone-800">
                <Users className="h-5 w-5 text-stone-600 dark:text-stone-400" />
              </div>
              <ArrowRight className="h-4 w-4 text-stone-300 opacity-0 transition-opacity group-hover:opacity-100 dark:text-stone-600" />
            </div>
            <div className="mt-3">
              <p className="text-2xl font-semibold text-stone-900 dark:text-stone-100">
                {stats.people}
              </p>
              <p className="text-sm text-stone-500 dark:text-stone-400">People</p>
            </div>
          </motion.div>
        </Link>

        <Link href="/sources">
          <motion.div
            whileHover={{ y: -2 }}
            className="group rounded-xl border border-stone-200/60 bg-white p-4 shadow-sm shadow-stone-900/5 transition-all hover:shadow-md dark:border-stone-800/60 dark:bg-stone-900"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-stone-100 dark:bg-stone-800">
                <FileText className="h-5 w-5 text-stone-600 dark:text-stone-400" />
              </div>
              <ArrowRight className="h-4 w-4 text-stone-300 opacity-0 transition-opacity group-hover:opacity-100 dark:text-stone-600" />
            </div>
            <div className="mt-3">
              <p className="text-2xl font-semibold text-stone-900 dark:text-stone-100">
                {stats.sources}
              </p>
              <p className="text-sm text-stone-500 dark:text-stone-400">Sources</p>
            </div>
          </motion.div>
        </Link>

        <Link href="/suggestions">
          <motion.div
            whileHover={{ y: -2 }}
            className={`group rounded-xl border p-4 shadow-sm transition-all hover:shadow-md ${
              stats.suggestions > 0
                ? 'border-amber-200/60 bg-amber-50/50 dark:border-amber-800/40 dark:bg-amber-950/20'
                : 'border-stone-200/60 bg-white dark:border-stone-800/60 dark:bg-stone-900'
            }`}
          >
            <div className="flex items-center justify-between">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  stats.suggestions > 0
                    ? 'bg-amber-100 dark:bg-amber-900/50'
                    : 'bg-stone-100 dark:bg-stone-800'
                }`}
              >
                <Sparkles
                  className={`h-5 w-5 ${
                    stats.suggestions > 0
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-stone-600 dark:text-stone-400'
                  }`}
                />
              </div>
              <ArrowRight className="h-4 w-4 text-stone-300 opacity-0 transition-opacity group-hover:opacity-100 dark:text-stone-600" />
            </div>
            <div className="mt-3">
              <p className="text-2xl font-semibold text-stone-900 dark:text-stone-100">
                {stats.suggestions}
              </p>
              <p className="text-sm text-stone-500 dark:text-stone-400">
                {stats.suggestions > 0 ? 'To review' : 'Suggestions'}
              </p>
            </div>
          </motion.div>
        </Link>

        <Link href="/tree">
          <motion.div
            whileHover={{ y: -2 }}
            className="group rounded-xl border border-stone-200/60 bg-white p-4 shadow-sm shadow-stone-900/5 transition-all hover:shadow-md dark:border-stone-800/60 dark:bg-stone-900"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-stone-100 dark:bg-stone-800">
                <GitBranch className="h-5 w-5 text-stone-600 dark:text-stone-400" />
              </div>
              <ArrowRight className="h-4 w-4 text-stone-300 opacity-0 transition-opacity group-hover:opacity-100 dark:text-stone-600" />
            </div>
            <div className="mt-3">
              <p className="font-medium text-stone-900 dark:text-stone-100">Family Tree</p>
              <p className="text-sm text-stone-500 dark:text-stone-400">View connections</p>
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
          className="mb-8 p-5 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-100 dark:border-indigo-900/50"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-stone-800 shadow-sm">
              <todayPrompt.icon className={`h-6 w-6 ${todayPrompt.color}`} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mb-1">
                Today&apos;s Suggestion
              </p>
              <p className="text-stone-700 dark:text-stone-300 font-medium">
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
              className="rounded-xl border border-stone-200/60 bg-white p-5 dark:border-stone-800/60 dark:bg-stone-900"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-stone-900 dark:text-stone-100">Recent People</h3>
                <Link href="/people" className="text-sm text-stone-500 hover:text-stone-700 dark:hover:text-stone-300">
                  View all
                </Link>
              </div>
              <div className="space-y-3">
                {recentPeople.slice(0, 4).map((person) => (
                  <Link key={person.id} href={`/people/${person.id}`}>
                    <div className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={person.photo_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {person.preferred_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-stone-900 dark:text-stone-100 truncate">
                          {person.preferred_name}
                        </p>
                        <p className="text-xs text-stone-500 truncate">
                          {!person.photo_url && 'Needs photo'}
                          {!person.photo_url && !person.bio && ' • '}
                          {!person.bio && 'Needs bio'}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-stone-300 dark:text-stone-600" />
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
            className="rounded-xl border border-stone-200/60 bg-white p-5 dark:border-stone-800/60 dark:bg-stone-900"
          >
            <h3 className="font-semibold text-stone-900 dark:text-stone-100 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/recipes">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-green-50 dark:bg-green-950/30 hover:bg-green-100 dark:hover:bg-green-950/50 transition-colors">
                  <ChefHat className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="text-sm font-medium text-stone-900 dark:text-stone-100">Recipes</p>
                    <p className="text-xs text-stone-500">{stats.recipes} saved</p>
                  </div>
                </div>
              </Link>
              <Link href="/people">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-colors">
                  <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="text-sm font-medium text-stone-900 dark:text-stone-100">Stories</p>
                    <p className="text-xs text-stone-500">{stats.memories} captured</p>
                  </div>
                </div>
              </Link>
              <Link href="/export/print">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-50 dark:bg-purple-950/30 hover:bg-purple-100 dark:hover:bg-purple-950/50 transition-colors">
                  <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <div>
                    <p className="text-sm font-medium text-stone-900 dark:text-stone-100">Print</p>
                    <p className="text-xs text-stone-500">Family book</p>
                  </div>
                </div>
              </Link>
              {stats.peopleWithoutPhotos > 0 && (
                <Link href="/people">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-950/50 transition-colors">
                    <Camera className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    <div>
                      <p className="text-sm font-medium text-stone-900 dark:text-stone-100">Add Photos</p>
                      <p className="text-xs text-stone-500">{stats.peopleWithoutPhotos} need photos</p>
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
          className="rounded-xl border border-stone-200/60 bg-gradient-to-br from-stone-50 to-stone-100/50 p-6 dark:border-stone-800/60 dark:from-stone-900 dark:to-stone-800/50"
        >
          <h3 className="font-medium text-stone-900 dark:text-stone-100 mb-3">
            Getting Started
          </h3>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-200 text-xs font-medium text-stone-600 dark:bg-stone-700 dark:text-stone-300">
                1
              </div>
              <div>
                <p className="text-sm font-medium text-stone-700 dark:text-stone-300">
                  Paste a document
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Use Quick Capture above to extract family data from any text
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-200 text-xs font-medium text-stone-600 dark:bg-stone-700 dark:text-stone-300">
                2
              </div>
              <div>
                <p className="text-sm font-medium text-stone-700 dark:text-stone-300">
                  Review suggestions
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  AI creates suggestions for you to approve or edit
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-200 text-xs font-medium text-stone-600 dark:bg-stone-700 dark:text-stone-300">
                3
              </div>
              <div>
                <p className="text-sm font-medium text-stone-700 dark:text-stone-300">
                  Build connections
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400">
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
