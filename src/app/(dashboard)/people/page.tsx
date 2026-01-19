'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Users, LayoutGrid, List, ArrowUpDown, MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useWorkspace } from '@/components/providers/workspace-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState, emptyStates } from '@/components/ui/empty-state'
import { PersonCard } from '@/components/people/person-card'
import { Skeleton, SkeletonPersonCard } from '@/components/ui/skeleton'
import { useAppShortcuts, ShortcutHint } from '@/hooks/use-keyboard-shortcuts'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatFlexibleDate } from '@/lib/dates'
import { cn } from '@/lib/utils'
import type { Person } from '@/types'

type ViewMode = 'grid' | 'list'
type SortOption = 'name-asc' | 'name-desc' | 'birth-asc' | 'birth-desc' | 'created-desc'

const sortLabels: Record<SortOption, string> = {
  'name-asc': 'Name (A–Z)',
  'name-desc': 'Name (Z–A)',
  'birth-asc': 'Birth (oldest)',
  'birth-desc': 'Birth (newest)',
  'created-desc': 'Recently added',
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function sortPeople(people: Person[], sortBy: SortOption): Person[] {
  const sorted = [...people]
  switch (sortBy) {
    case 'name-asc':
      return sorted.sort((a, b) => a.preferred_name.localeCompare(b.preferred_name))
    case 'name-desc':
      return sorted.sort((a, b) => b.preferred_name.localeCompare(a.preferred_name))
    case 'birth-asc':
      return sorted.sort((a, b) => {
        if (!a.birth_date && !b.birth_date) return 0
        if (!a.birth_date) return 1
        if (!b.birth_date) return -1
        return a.birth_date.localeCompare(b.birth_date)
      })
    case 'birth-desc':
      return sorted.sort((a, b) => {
        if (!a.birth_date && !b.birth_date) return 0
        if (!a.birth_date) return 1
        if (!b.birth_date) return -1
        return b.birth_date.localeCompare(a.birth_date)
      })
    case 'created-desc':
      return sorted.sort((a, b) => {
        if (!a.created_at && !b.created_at) return 0
        if (!a.created_at) return 1
        if (!b.created_at) return -1
        return b.created_at.localeCompare(a.created_at)
      })
    default:
      return sorted
  }
}

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
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [sortBy, setSortBy] = useState<SortOption>('name-asc')

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

  const filteredPeople = sortPeople(
    people.filter((person) =>
      person.preferred_name.toLowerCase().includes(search.toLowerCase()) ||
      person.given_names?.toLowerCase().includes(search.toLowerCase()) ||
      person.family_name?.toLowerCase().includes(search.toLowerCase())
    ),
    sortBy
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
        <div className="flex items-start justify-between gap-4">
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
              <ShortcutHint keys={['⌘', 'I']} />
            </Button>
          </Link>
        </div>

        {/* Search and controls - only show when there are people */}
        {people.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="mt-6 flex flex-col sm:flex-row gap-3"
          >
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400 dark:text-stone-500" strokeWidth={1.5} />
              <Input
                placeholder="Search by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* View controls */}
            <div className="flex items-center gap-2">
              {/* Sort dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <ArrowUpDown className="h-4 w-4" />
                    <span className="hidden sm:inline">{sortLabels[sortBy]}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {(Object.entries(sortLabels) as [SortOption, string][]).map(([value, label]) => (
                    <DropdownMenuItem
                      key={value}
                      onClick={() => setSortBy(value)}
                      className={cn(sortBy === value && 'bg-stone-100 dark:bg-stone-800')}
                    >
                      {label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* View mode toggle */}
              <div className="flex items-center rounded-lg border border-stone-200 dark:border-stone-700 p-0.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'h-8 w-8 p-0',
                    viewMode === 'grid' && 'bg-stone-100 dark:bg-stone-800'
                  )}
                  onClick={() => setViewMode('grid')}
                >
                  <LayoutGrid className="h-4 w-4" />
                  <span className="sr-only">Grid view</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'h-8 w-8 p-0',
                    viewMode === 'list' && 'bg-stone-100 dark:bg-stone-800'
                  )}
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                  <span className="sr-only">List view</span>
                </Button>
              </div>
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
        ) : viewMode === 'grid' ? (
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
        ) : (
          <motion.div
            key="list"
            variants={container}
            initial="hidden"
            animate="show"
            className="rounded-xl border border-stone-200/60 dark:border-stone-800/60 overflow-hidden bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm divide-y divide-stone-100 dark:divide-stone-800"
          >
            {filteredPeople.map((person) => {
              const birthDate = formatFlexibleDate({
                date: person.birth_date,
                precision: person.birth_date_precision,
                endDate: person.birth_date_end,
              })
              const deathDate = formatFlexibleDate({
                date: person.death_date,
                precision: person.death_date_precision,
                endDate: person.death_date_end,
              })
              const hasLife = birthDate !== 'Unknown' || deathDate !== 'Unknown'
              const isDeceased = deathDate !== 'Unknown'
              const lifespan = hasLife
                ? isDeceased
                  ? `${birthDate !== 'Unknown' ? birthDate : '?'} – ${deathDate}`
                  : `b. ${birthDate}`
                : null

              return (
                <motion.div key={person.id} variants={item}>
                  <Link
                    href={`/people/${person.id}`}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors group"
                  >
                    <Avatar className="h-10 w-10 ring-2 ring-white/80 dark:ring-stone-900/80 shadow-sm">
                      <AvatarImage
                        src={person.photo_url ?? undefined}
                        alt={person.preferred_name}
                      />
                      <AvatarFallback className="bg-gradient-to-br from-stone-100 to-stone-200 text-stone-600 dark:from-stone-800 dark:to-stone-700 dark:text-stone-300 text-sm font-medium">
                        {getInitials(person.preferred_name)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <h3 className="font-medium text-stone-900 dark:text-stone-100 truncate">
                          {person.preferred_name}
                        </h3>
                        {person.family_name && person.family_name !== person.preferred_name && (
                          <span className="text-sm text-stone-500 dark:text-stone-400 truncate hidden sm:inline">
                            ({person.given_names} {person.family_name})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-stone-500 dark:text-stone-400">
                        {lifespan && (
                          <span className="tabular-nums">{lifespan}</span>
                        )}
                        {person.birth_place && (
                          <span className="flex items-center gap-1 truncate hidden md:flex">
                            <MapPin className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={1.5} />
                            <span className="truncate">{person.birth_place}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-stone-300 dark:text-stone-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    >
                      <path d="M6 4l4 4-4 4" />
                    </svg>
                  </Link>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
