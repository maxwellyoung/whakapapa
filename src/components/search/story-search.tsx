'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, Clock3, Heart, Search, Sparkles, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { useWorkspace } from '@/components/providers/workspace-provider'
import { cn } from '@/lib/utils'

interface SearchResult {
  type: 'person' | 'relationship' | 'story'
  id: string
  title: string
  snippet: string
  relevance: number
  person?: {
    id: string
    name: string
    birth_date?: string
    death_date?: string
  }
}

interface StorySearchProps {
  className?: string
}

const EXAMPLE_QUERIES = [
  'Who are my great-grandparents?',
  'How are we related to the Smiths?',
  'Tell me about ancestors from Ireland',
  'Who lived in Auckland in the 1920s?',
  'Show me family members who served in the war',
  'What do we know about our farming heritage?',
]

const springConfig = {
  type: 'spring' as const,
  stiffness: 180,
  damping: 24,
  mass: 0.75,
}

const atlasPanelClass =
  'rounded-[2rem] border border-[rgba(101,76,57,0.16)] bg-[rgba(251,247,239,0.82)] shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_10px_30px_rgba(86,59,40,0.06)] backdrop-blur-[16px]'

const atlasPanelStrongClass =
  'rounded-[2rem] border border-[rgba(101,76,57,0.18)] bg-[rgba(255,252,247,0.94)] shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_16px_40px_rgba(86,59,40,0.08)]'

const atlasLabelClass =
  'text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-[#8c7c6e]'

function formatDate(dateStr?: string) {
  if (!dateStr) return null
  try {
    return new Date(dateStr).getFullYear()
  } catch {
    return dateStr
  }
}

function getResultIcon(type: SearchResult['type']) {
  switch (type) {
    case 'person':
      return <Users className="h-4 w-4" strokeWidth={1.75} />
    case 'relationship':
      return <Heart className="h-4 w-4" strokeWidth={1.75} />
    case 'story':
      return <Clock3 className="h-4 w-4" strokeWidth={1.75} />
  }
}

function getResultLabel(type: SearchResult['type']) {
  switch (type) {
    case 'person':
      return 'Person'
    case 'relationship':
      return 'Connection'
    case 'story':
      return 'Story'
  }
}

export function StorySearch({ className }: StorySearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const { currentWorkspace } = useWorkspace()
  const router = useRouter()
  const reduceMotion = useReducedMotion()
  const containerRef = useRef<HTMLDivElement>(null)

  const handleSearch = async (searchQuery?: string) => {
    const searchText = searchQuery || query
    if (!searchText.trim() || !currentWorkspace) return

    setLoading(true)
    setShowSuggestions(false)

    try {
      const response = await fetch('/api/search/story', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspace_id: currentWorkspace.id,
          query: searchText,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Search failed')
      }

      setResults(data.results || [])
    } catch (error) {
      console.error('Search error:', error)
      toast.error('Search failed. Please try again.')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleExampleClick = (exampleQuery: string) => {
    setQuery(exampleQuery)
    handleSearch(exampleQuery)
  }

  const handleResultClick = (result: SearchResult) => {
    if (result.type === 'person' && result.person?.id) {
      router.push(`/people/${result.person.id}?view=story`)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSearch()
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={cn('space-y-4', className)}>
      <div
        ref={containerRef}
        className={cn(atlasPanelStrongClass, 'p-5 md:p-6')}
      >
        <div className="space-y-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <p className={atlasLabelClass}>Story search</p>
              <h3 className="mb-0 text-[1.85rem] font-serif text-[#241a14]">
                Begin with a question that someone in the family might actually ask.
              </h3>
            </div>
            <p className="mb-0 max-w-md text-sm leading-6 text-[#8c7c6e]">
              Ask by kinship, place, era, or remembered fragment. The archive should answer like a guide,
              not a filter panel.
            </p>
          </div>

          <div className="rounded-[1.75rem] bg-[rgba(255,251,246,0.92)] p-3 ring-1 ring-[rgba(101,76,57,0.12)] shadow-[0_18px_45px_rgba(105,76,56,0.08)]">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--atlas-muted)]" strokeWidth={1.75} />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => !query && setShowSuggestions(true)}
                  placeholder="Ask about a person, line, place, or remembered event"
                  className="h-14 rounded-[1.25rem] border-none bg-transparent pl-11 pr-4 text-[15px] text-[#241a14] shadow-none placeholder:text-[#8c7c6e] focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>

              <motion.button
                type="button"
                onClick={() => handleSearch()}
                disabled={loading || !query.trim()}
                whileTap={reduceMotion ? undefined : { scale: 0.985 }}
                className="inline-flex h-12 min-w-[9.5rem] items-center justify-center gap-2 rounded-full bg-[var(--atlas-accent)] px-5 text-sm font-medium text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-45"
              >
                {loading ? (
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="inline-flex"
                  >
                    <Sparkles className="h-4 w-4" strokeWidth={1.75} />
                  </motion.span>
                ) : (
                  <>
                    Follow thread
                    <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
                  </>
                )}
              </motion.button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {EXAMPLE_QUERIES.slice(0, 4).map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => handleExampleClick(example)}
                  className="rounded-full bg-[rgba(203,153,79,0.08)] px-3 py-1.5 text-left text-xs font-medium text-[var(--atlas-copy)] transition-colors hover:bg-[rgba(203,153,79,0.14)] hover:text-[var(--atlas-ink)]"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence>
            {showSuggestions && !query && (
              <motion.div
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
                animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
                transition={springConfig}
                className="rounded-[1.5rem] bg-[rgba(255,251,246,0.72)] px-4 py-4 ring-1 ring-[rgba(101,76,57,0.1)]"
              >
                <p className={cn(atlasLabelClass, 'mb-3 tracking-[0.18em]')}>
                  Possible openings
                </p>
                <div className="grid gap-2 md:grid-cols-2">
                  {EXAMPLE_QUERIES.map((example, index) => (
                    <motion.button
                      key={example}
                      type="button"
                      onClick={() => handleExampleClick(example)}
                      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
                      animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                      transition={{ ...springConfig, delay: reduceMotion ? 0 : index * 0.03 }}
                      className="rounded-[1.15rem] bg-white/55 px-4 py-3 text-left text-sm leading-6 text-[#655546] ring-1 ring-[rgba(101,76,57,0.08)] transition-colors hover:bg-white/85 hover:text-[#241a14]"
                    >
                      {example}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {results.length > 0 ? (
          <motion.div
            key="results"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={springConfig}
            className="space-y-3"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className={atlasLabelClass}>Results</p>
                <p className="mb-0 text-sm text-[#655546]">
                  {results.length} path{results.length === 1 ? '' : 's'} surfaced from your question.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[rgba(255,251,246,0.78)] px-3 py-1.5 text-xs font-medium text-[#8c7c6e] ring-1 ring-[rgba(101,76,57,0.1)]">
                <Sparkles className="h-3.5 w-3.5 text-[var(--atlas-accent)]" strokeWidth={1.75} />
                Interpreted through Story Search
              </div>
            </div>

            <div className="grid gap-3">
              {results.map((result, index) => (
                <motion.button
                  key={result.id}
                  type="button"
                  onClick={() => handleResultClick(result)}
                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
                  animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                  transition={{ ...springConfig, delay: reduceMotion ? 0 : index * 0.04 }}
                  className={cn(atlasPanelClass, 'group rounded-[1.65rem] px-5 py-4 text-left transition-shadow duration-200 hover:shadow-[0_18px_40px_rgba(99,72,54,0.08)]')}
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(203,153,79,0.1)] text-[var(--atlas-accent)]">
                          {getResultIcon(result.type)}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="mb-0 text-xs uppercase tracking-[0.18em] text-[#8c7c6e]">
                              {getResultLabel(result.type)}
                            </p>
                            <span className="h-1 w-1 rounded-full bg-[rgba(101,76,57,0.26)]" />
                            <p className="mb-0 text-xs text-[#8c7c6e]">
                              {Math.round(result.relevance * 100)}% match
                            </p>
                          </div>
                          <h4 className="mb-0 text-xl font-serif text-[#241a14]">
                            {result.title}
                          </h4>
                        </div>
                      </div>

                      <p className="mb-0 max-w-3xl text-sm leading-7 text-[#655546]">
                        {result.snippet}
                      </p>

                      {result.person && (
                        <div className="flex flex-wrap items-center gap-3 text-xs text-[#8c7c6e]">
                          {result.person.birth_date && (
                            <span>Born {formatDate(result.person.birth_date)}</span>
                          )}
                          {result.person.death_date && (
                            <span>Died {formatDate(result.person.death_date)}</span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="inline-flex items-center gap-2 text-sm font-medium text-[var(--atlas-accent)] transition-transform duration-200 group-hover:translate-x-0.5">
                      Open story
                      <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {query && results.length === 0 && !loading ? (
        <motion.div
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
          animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
          transition={springConfig}
          className={cn(atlasPanelClass, 'rounded-[1.75rem] px-6 py-8 text-center')}
        >
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(203,153,79,0.1)] text-[var(--atlas-accent)]">
            <Search className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <h4 className="mb-2 text-2xl font-serif text-[#241a14]">No clear path surfaced yet.</h4>
          <p className="mx-auto mb-0 max-w-xl text-sm leading-7 text-[#655546]">
            Try a person&apos;s name, a place, or a smaller fragment of family memory. Story Search works
            better as a thread than as a keyword dump.
          </p>
        </motion.div>
      ) : null}
    </div>
  )
}
