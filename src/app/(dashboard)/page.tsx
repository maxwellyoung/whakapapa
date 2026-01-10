'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Users, FileText, GitBranch, Sparkles, ArrowRight, History } from 'lucide-react'
import { useWorkspace } from '@/components/providers/workspace-provider'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { QuickCapture } from '@/components/capture/quick-capture'

interface Stats {
  people: number
  sources: number
  suggestions: number
}

export default function DashboardPage() {
  const { currentWorkspace, workspaces, loading } = useWorkspace()
  const [stats, setStats] = useState<Stats>({ people: 0, sources: 0, suggestions: 0 })

  useEffect(() => {
    async function fetchStats() {
      if (!currentWorkspace) return

      const supabase = createClient()

      const [peopleRes, sourcesRes, suggestionsRes] = await Promise.all([
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
      ])

      setStats({
        people: peopleRes.count || 0,
        sources: sourcesRes.count || 0,
        suggestions: suggestionsRes.count || 0,
      })
    }

    fetchStats()
  }, [currentWorkspace])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-200 border-t-stone-600 dark:border-stone-700 dark:border-t-stone-300" />
          <span className="text-sm text-stone-400 dark:text-stone-500">Loading...</span>
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
                ? 'Create your first workspace to start building your family tree.'
                : 'Select a workspace to get started.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              Use the workspace switcher in the sidebar to create or select a workspace.
            </p>
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
