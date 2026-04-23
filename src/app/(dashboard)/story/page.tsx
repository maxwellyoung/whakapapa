'use client'

import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, BookOpen, Clock3, Network, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { StorySearch } from '@/components/search/story-search'
import { useWorkspace } from '@/components/providers/workspace-provider'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { Person } from '@/types'

interface PersonWithConnections extends Person {
  relationship_count: number
  memory_count: number
  has_story: boolean
}

const springConfig = {
  type: 'spring' as const,
  stiffness: 170,
  damping: 24,
  mass: 0.7,
}

const atlasPanelClass =
  'rounded-[2rem] border border-[rgba(101,76,57,0.16)] bg-[rgba(251,247,239,0.82)] shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_10px_30px_rgba(86,59,40,0.06)] backdrop-blur-[16px]'

const atlasPanelStrongClass =
  'rounded-[2rem] border border-[rgba(101,76,57,0.18)] bg-[rgba(255,252,247,0.94)] shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_16px_40px_rgba(86,59,40,0.08)]'

const atlasLabelClass =
  'text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-[#8c7c6e]'

export default function StoryModePage() {
  const [people, setPeople] = useState<PersonWithConnections[]>([])
  const [loading, setLoading] = useState(true)
  const { currentWorkspace } = useWorkspace()
  const router = useRouter()
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    async function fetchPeopleForStories() {
      if (!currentWorkspace) return

      const supabase = createClient()
      const { data: peopleData } = await supabase
        .from('people')
        .select(`
          *,
          relationships_as_a:relationships!relationships_person_a_id_fkey(id),
          relationships_as_b:relationships!relationships_person_b_id_fkey(id),
          memories(id)
        `)
        .eq('workspace_id', currentWorkspace.id)
        .order('created_at', { ascending: false })

      if (peopleData) {
        const enrichedPeople: PersonWithConnections[] = peopleData.map((person) => ({
          ...person,
          relationship_count:
            (person.relationships_as_a?.length || 0) + (person.relationships_as_b?.length || 0),
          memory_count: person.memories?.length || 0,
          has_story:
            !!person.bio ||
            (person.memories?.length || 0) > 0 ||
            (person.relationships_as_a?.length || 0) + (person.relationships_as_b?.length || 0) > 0,
        }))

        enrichedPeople.sort((a, b) => {
          const aScore = a.relationship_count + a.memory_count + (a.bio ? 2 : 0)
          const bScore = b.relationship_count + b.memory_count + (b.bio ? 2 : 0)
          return bScore - aScore
        })

        setPeople(enrichedPeople)
      }

      setLoading(false)
    }

    fetchPeopleForStories()
  }, [currentWorkspace])

  const handlePersonClick = (personId: string) => {
    router.push(`/people/${personId}?view=story`)
  }

  const getStoryRichness = (person: PersonWithConnections): 'rich' | 'moderate' | 'emerging' => {
    const score = person.relationship_count + person.memory_count + (person.bio ? 2 : 0)
    if (score >= 4) return 'rich'
    if (score >= 2) return 'moderate'
    return 'emerging'
  }

  const getLifeSpan = (person: PersonWithConnections) => {
    const born = person.birth_date?.split('-')[0]
    const died = person.death_date?.split('-')[0]
    if (!born && !died) return null
    return `${born || '?'} - ${died || 'Present'}`
  }

  const getRichnessTone = (richness: 'rich' | 'moderate' | 'emerging') => {
    switch (richness) {
      case 'rich':
        return 'bg-[rgba(62,92,70,0.12)] text-[#45634e] ring-1 ring-[rgba(62,92,70,0.14)]'
      case 'moderate':
        return 'bg-[rgba(165,113,62,0.12)] text-[#8b5d30] ring-1 ring-[rgba(165,113,62,0.16)]'
      case 'emerging':
        return 'bg-[rgba(203,153,79,0.12)] text-[var(--atlas-accent)] ring-1 ring-[rgba(203,153,79,0.16)]'
    }
  }

  const motionProps = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 18 },
        animate: { opacity: 1, y: 0 },
        transition: springConfig,
      }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-8 md:px-10 md:py-10">
        <div className="space-y-6">
          <div className="h-6 w-44 rounded-full bg-[rgba(203,153,79,0.1)]" />
          <div className="h-28 rounded-[2rem] bg-[rgba(255,252,247,0.72)]" />
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="h-64 rounded-[2rem] bg-[rgba(255,252,247,0.62)]" />
            <div className="h-64 rounded-[2rem] bg-[rgba(255,252,247,0.62)]" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 md:px-10 md:py-10">
      <motion.div {...motionProps} className="space-y-10">
        <div className="space-y-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--atlas-copy)] transition-colors hover:text-[var(--atlas-ink)]"
            style={{ color: '#655546' }}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>

          <div className={cn(atlasPanelClass, 'px-6 py-7 md:px-8 md:py-8')}>
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-end">
              <div className="space-y-5">
                <div className="space-y-3">
                  <p className={atlasLabelClass}>Narrative Atlas</p>
                  <h1
                    className="mb-0 max-w-3xl text-[clamp(2.6rem,5vw,4.8rem)] font-serif font-medium tracking-[-0.045em]"
                    style={{ color: '#241a14' }}
                  >
                    Follow lineage as a field of stories, echoes, and remembered lives.
                  </h1>
                </div>
                <p className="mb-0 max-w-2xl text-lg leading-8" style={{ color: '#655546' }}>
                  Story Mode turns your family tree into a readable landscape. Begin with a question,
                  enter through a person, and move outward through kinship, memory, and time.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                <div className={cn(atlasPanelStrongClass, 'rounded-[1.5rem] px-5 py-4')}>
                  <p className={cn(atlasLabelClass, 'mb-2')}>People</p>
                  <p className="mb-0 text-3xl font-serif" style={{ color: '#241a14' }}>{people.length}</p>
                </div>
                <div className={cn(atlasPanelStrongClass, 'rounded-[1.5rem] px-5 py-4')}>
                  <p className={cn(atlasLabelClass, 'mb-2')}>Stories ready</p>
                  <p className="mb-0 text-3xl font-serif" style={{ color: '#241a14' }}>
                    {people.filter((person) => person.has_story).length}
                  </p>
                </div>
                <div className={cn(atlasPanelStrongClass, 'rounded-[1.5rem] px-5 py-4')}>
                  <p className={cn(atlasLabelClass, 'mb-2')}>Memory paths</p>
                  <p className="mb-0 text-3xl font-serif" style={{ color: '#241a14' }}>
                    {people.reduce((sum, person) => sum + person.relationship_count, 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <motion.section
          {...(reduceMotion
            ? {}
            : {
                initial: { opacity: 0, y: 12 },
                animate: { opacity: 1, y: 0 },
                transition: { ...springConfig, delay: 0.05 },
              })}
          className="space-y-5"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <p className={atlasLabelClass}>Entry point</p>
              <h2 className="mb-0 text-[2rem] font-serif" style={{ color: '#241a14' }}>Ask for a path through the archive</h2>
            </div>
            <p className="mb-0 max-w-md text-sm leading-6" style={{ color: '#8c7c6e' }}>
              Search is the front door. Use names, places, kinship questions, or fragments of family lore.
            </p>
          </div>
          <StorySearch className="w-full" />
        </motion.section>

        <motion.section
          {...(reduceMotion
            ? {}
            : {
                initial: { opacity: 0, y: 12 },
                animate: { opacity: 1, y: 0 },
                transition: { ...springConfig, delay: 0.1 },
              })}
          className="space-y-6"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <p className={atlasLabelClass}>Family stories</p>
              <h2 className="mb-0 text-[2.35rem] font-serif" style={{ color: '#241a14' }}>Enter through a person, not a menu.</h2>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[rgba(255,252,247,0.72)] px-4 py-2 text-sm text-[#655546] ring-1 ring-[rgba(101,76,57,0.12)]">
              <Sparkles className="h-4 w-4 text-[var(--atlas-accent)]" />
              Choose a life to open a richer thread.
            </div>
          </div>

          {people.length === 0 ? (
            <div className={cn(atlasPanelStrongClass, 'px-8 py-12 text-center')}>
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--atlas-accent-soft)]">
                <BookOpen className="h-7 w-7 text-[var(--atlas-accent)]" />
              </div>
              <h3 className="mb-3 text-3xl font-serif" style={{ color: '#241a14' }}>The atlas is waiting for its first life.</h3>
              <p className="mx-auto mb-0 max-w-xl text-base leading-7" style={{ color: '#655546' }}>
                Add one person and Story Mode will begin to shape itself around names, kinship, and the
                first remembered fragments of your family history.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-12">
              {people.map((person, index) => {
                const richness = getStoryRichness(person)
                const lifeSpan = getLifeSpan(person)
                const initials = person.preferred_name
                  .split(' ')
                  .map((name) => name[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()

                return (
                  <motion.button
                    key={person.id}
                    type="button"
                    onClick={() => handlePersonClick(person.id)}
                    {...(reduceMotion
                      ? {}
                      : {
                          initial: { opacity: 0, y: 12 },
                          animate: { opacity: 1, y: 0 },
                          transition: { ...springConfig, delay: 0.13 + index * 0.04 },
                          whileHover: { y: -3 },
                        })}
                    className={cn(
                      atlasPanelStrongClass,
                      'group min-h-[19rem] p-6 text-left transition-shadow duration-200 hover:shadow-[0_18px_40px_rgba(86,59,40,0.1)] lg:col-span-5',
                      index % 3 === 0 ? 'lg:min-h-[22rem] lg:col-span-7' : ''
                    )}
                  >
                    <div className="flex h-full flex-col gap-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-14 w-14 ring-1 ring-[rgba(101,76,57,0.16)]">
                            <AvatarImage src={person.photo_url || undefined} />
                            <AvatarFallback className="bg-[rgba(203,153,79,0.12)] font-medium text-[var(--atlas-accent)]">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="space-y-1">
                            <h3
                              className="mb-0 text-[2rem] font-serif leading-none transition-colors group-hover:text-[var(--atlas-accent)]"
                              style={{ color: '#241a14' }}
                            >
                              {person.preferred_name}
                            </h3>
                            {(person.given_names || person.family_name) && (
                              <p className="mb-0 text-sm" style={{ color: '#8c7c6e' }}>
                                {[person.given_names, person.family_name].filter(Boolean).join(' ')}
                              </p>
                            )}
                          </div>
                        </div>
                        <span
                          className={cn(
                            'rounded-full px-3 py-1 text-xs font-medium capitalize',
                            getRichnessTone(richness)
                          )}
                        >
                          {richness} story
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-3 text-sm" style={{ color: '#655546' }}>
                        {lifeSpan && (
                          <span className="inline-flex items-center gap-2">
                            <Clock3 className="h-4 w-4 text-[var(--atlas-muted)]" />
                            {lifeSpan}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-2">
                          <Network className="h-4 w-4 text-[var(--atlas-muted)]" />
                          {person.relationship_count} connection{person.relationship_count !== 1 ? 's' : ''}
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-[var(--atlas-muted)]" />
                          {person.memory_count} memor{person.memory_count !== 1 ? 'ies' : 'y'}
                        </span>
                      </div>

                      <div className="space-y-3">
                        <p className={atlasLabelClass}>Story fragment</p>
                        <p className="mb-0 max-w-2xl text-base leading-8" style={{ color: '#655546' }}>
                          {person.bio
                            ? person.bio
                            : 'This life is only lightly sketched so far. Enter here to trace names, ties, and the first contours of a fuller family story.'}
                        </p>
                      </div>

                      <div className="mt-auto flex items-center justify-between border-t border-[rgba(101,76,57,0.12)] pt-5">
                        <span className="text-sm font-medium" style={{ color: '#241a14' }}>Enter this story</span>
                        <span className="text-sm transition-transform duration-200 group-hover:translate-x-1" style={{ color: '#8c7c6e' }}>
                          Follow thread
                        </span>
                      </div>
                    </div>
                  </motion.button>
                )
              })}
            </div>
          )}
        </motion.section>
      </motion.div>
    </div>
  )
}
