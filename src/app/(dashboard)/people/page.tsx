'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useWorkspace } from '@/components/providers/workspace-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState, emptyStates } from '@/components/ui/empty-state'
import { PersonCard } from '@/components/people/person-card'
import { Skeleton, SkeletonPersonCard } from '@/components/ui/skeleton'
import { useAppShortcuts, ShortcutHint } from '@/hooks/use-keyboard-shortcuts'
import type { Person } from '@/types'

// Stagger children for list animation
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
}

const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
}

export default function PeoplePage() {
  const { currentWorkspace, loading: workspaceLoading } = useWorkspace()
  const [people, setPeople] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Register global keyboard shortcuts
  useAppShortcuts()

  useEffect(() => {
    async function fetchPeople() {
      if (!currentWorkspace) return

      const supabase = createClient()
      const { data } = await supabase
        .from('people')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .order('preferred_name')

      if (data) {
        setPeople(data)
      }
      setLoading(false)
    }

    if (currentWorkspace) {
      fetchPeople()
    }
  }, [currentWorkspace])

  if (workspaceLoading || loading) {
    return (
      <div className="p-6 md:p-8">
        {/* Skeleton header */}
        <header className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <Skeleton className="h-8 w-24 mb-2" />
              <Skeleton className="h-5 w-32" />
            </div>
            <Skeleton className="h-10 w-28 rounded-xl" />
          </div>
          <div className="mt-6 max-w-md">
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </header>
        {/* Skeleton grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <SkeletonPersonCard key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (!currentWorkspace) {
    return (
      <EmptyState
        icon={Users}
        {...emptyStates.workspace}
        action={<Button>Create workspace</Button>}
      />
    )
  }

  const filteredPeople = people.filter((person) =>
    person.preferred_name.toLowerCase().includes(search.toLowerCase()) ||
    person.given_names?.toLowerCase().includes(search.toLowerCase()) ||
    person.family_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="p-6 md:p-8"
    >
      {/* Header - Rams-inspired clarity */}
      <header className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
              People
            </h1>
            <p className="mt-1.5 text-sm text-stone-500 dark:text-stone-400">
              {people.length === 0
                ? 'Start building your family tree'
                : `${people.length} ${people.length === 1 ? 'person' : 'people'}`}
            </p>
          </div>
          <Link href="/people/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add person</span>
              <ShortcutHint keys={['⌘', 'N']} />
            </Button>
          </Link>
        </div>

        {/* Search - only show when there are people */}
        {people.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="mt-6 max-w-md"
          >
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400 dark:text-stone-500" strokeWidth={1.5} />
              <Input
                placeholder="Search by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </motion.div>
        )}
      </header>

      {/* Content */}
      <AnimatePresence mode="wait">
        {people.length === 0 ? (
          <EmptyState
            key="empty"
            icon={Users}
            {...emptyStates.people}
            action={
              <Link href="/people/new">
                <Button>Add the first person</Button>
              </Link>
            }
          />
        ) : filteredPeople.length === 0 ? (
          <EmptyState
            key="no-results"
            {...emptyStates.search}
          />
        ) : (
          <motion.div
            key="grid"
            variants={container}
            initial="hidden"
            animate="show"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {filteredPeople.map((person) => (
              <motion.div key={person.id} variants={item}>
                <PersonCard person={person} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
