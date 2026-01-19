'use client'

import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Users, ArrowRight, Sparkles, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useWorkspace } from '@/components/providers/workspace-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  buildFamilyGraph,
  calculateRelationship,
  describeRelationship,
} from '@/lib/relationship-calculator'
import type { Person, Relationship } from '@/types'

interface RelationshipFinderProps {
  currentPerson?: Person
  trigger?: React.ReactNode
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function RelationshipFinder({ currentPerson, trigger }: RelationshipFinderProps) {
  const { currentWorkspace } = useWorkspace()
  const [open, setOpen] = useState(false)
  const [people, setPeople] = useState<Person[]>([])
  const [relationships, setRelationships] = useState<Relationship[]>([])
  const [loading, setLoading] = useState(true)

  const [person1, setPerson1] = useState<Person | null>(currentPerson || null)
  const [person2, setPerson2] = useState<Person | null>(null)
  const [search1, setSearch1] = useState('')
  const [search2, setSearch2] = useState('')
  const [showResults1, setShowResults1] = useState(false)
  const [showResults2, setShowResults2] = useState(false)

  useEffect(() => {
    if (currentPerson) {
      setPerson1(currentPerson)
    }
  }, [currentPerson])

  useEffect(() => {
    async function fetchData() {
      if (!currentWorkspace || !open) return

      const supabase = createClient()

      const [{ data: peopleData }, { data: relsData }] = await Promise.all([
        supabase.from('people').select('*').eq('workspace_id', currentWorkspace.id),
        supabase.from('relationships').select('*').eq('workspace_id', currentWorkspace.id),
      ])

      setPeople(peopleData || [])
      setRelationships(relsData || [])
      setLoading(false)
    }

    fetchData()
  }, [currentWorkspace, open])

  const filteredPeople1 = useMemo(() => {
    if (!search1) return []
    const lower = search1.toLowerCase()
    return people
      .filter(
        (p) =>
          p.id !== person2?.id &&
          (p.preferred_name.toLowerCase().includes(lower) ||
            p.given_names?.toLowerCase().includes(lower) ||
            p.family_name?.toLowerCase().includes(lower))
      )
      .slice(0, 5)
  }, [people, search1, person2])

  const filteredPeople2 = useMemo(() => {
    if (!search2) return []
    const lower = search2.toLowerCase()
    return people
      .filter(
        (p) =>
          p.id !== person1?.id &&
          (p.preferred_name.toLowerCase().includes(lower) ||
            p.given_names?.toLowerCase().includes(lower) ||
            p.family_name?.toLowerCase().includes(lower))
      )
      .slice(0, 5)
  }, [people, search2, person1])

  const relationshipResult = useMemo(() => {
    if (!person1 || !person2 || relationships.length === 0) return null

    const graph = buildFamilyGraph(relationships)
    const peopleMap = new Map(people.map((p) => [p.id, p]))

    return {
      result: calculateRelationship(person1.id, person2.id, graph, peopleMap),
      description: describeRelationship(
        person1,
        person2,
        calculateRelationship(person1.id, person2.id, graph, peopleMap)
      ),
    }
  }, [person1, person2, relationships, people])

  const handleSelectPerson1 = (person: Person) => {
    setPerson1(person)
    setSearch1('')
    setShowResults1(false)
  }

  const handleSelectPerson2 = (person: Person) => {
    setPerson2(person)
    setSearch2('')
    setShowResults2(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Users className="h-4 w-4" />
            Find relationship
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Relationship Calculator
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Person selectors */}
          <div className="flex items-center gap-4">
            {/* Person 1 */}
            <div className="flex-1 space-y-2">
              {person1 ? (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={person1.photo_url || undefined} />
                    <AvatarFallback>{getInitials(person1.preferred_name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{person1.preferred_name}</p>
                    {person1.birth_date && (
                      <p className="text-xs text-stone-500">{person1.birth_date.split('-')[0]}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setPerson1(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                  <Input
                    placeholder="Search first person..."
                    value={search1}
                    onChange={(e) => {
                      setSearch1(e.target.value)
                      setShowResults1(true)
                    }}
                    onFocus={() => setShowResults1(true)}
                    className="pl-9"
                  />
                  <AnimatePresence>
                    {showResults1 && filteredPeople1.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-700 shadow-lg z-10 overflow-hidden"
                      >
                        {filteredPeople1.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => handleSelectPerson1(p)}
                            className="w-full flex items-center gap-3 p-2 hover:bg-stone-50 dark:hover:bg-stone-800 text-left"
                          >
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={p.photo_url || undefined} />
                              <AvatarFallback className="text-xs">
                                {getInitials(p.preferred_name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{p.preferred_name}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Arrow */}
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                <ArrowRight className="h-5 w-5 text-stone-400" />
              </div>
            </div>

            {/* Person 2 */}
            <div className="flex-1 space-y-2">
              {person2 ? (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={person2.photo_url || undefined} />
                    <AvatarFallback>{getInitials(person2.preferred_name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{person2.preferred_name}</p>
                    {person2.birth_date && (
                      <p className="text-xs text-stone-500">{person2.birth_date.split('-')[0]}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setPerson2(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                  <Input
                    placeholder="Search second person..."
                    value={search2}
                    onChange={(e) => {
                      setSearch2(e.target.value)
                      setShowResults2(true)
                    }}
                    onFocus={() => setShowResults2(true)}
                    className="pl-9"
                  />
                  <AnimatePresence>
                    {showResults2 && filteredPeople2.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-700 shadow-lg z-10 overflow-hidden"
                      >
                        {filteredPeople2.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => handleSelectPerson2(p)}
                            className="w-full flex items-center gap-3 p-2 hover:bg-stone-50 dark:hover:bg-stone-800 text-left"
                          >
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={p.photo_url || undefined} />
                              <AvatarFallback className="text-xs">
                                {getInitials(p.preferred_name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{p.preferred_name}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>

          {/* Result */}
          <AnimatePresence mode="wait">
            {person1 && person2 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-6 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-200 dark:border-indigo-800/50 text-center"
              >
                {relationshipResult?.result ? (
                  <>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-stone-900 shadow-sm mb-3">
                      <Sparkles className="h-4 w-4 text-amber-500" />
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400 capitalize">
                        {relationshipResult.result.relationship}
                      </span>
                    </div>
                    <p className="text-stone-700 dark:text-stone-300">
                      {relationshipResult.description}
                    </p>
                    {relationshipResult.result.degree > 1 && (
                      <p className="text-xs text-stone-500 mt-2">
                        {relationshipResult.result.degree} degrees of separation
                      </p>
                    )}
                  </>
                ) : (
                  <div className="text-stone-500 dark:text-stone-400">
                    <p className="font-medium">No direct relationship found</p>
                    <p className="text-sm mt-1">
                      These two people are not connected in your family tree
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hint */}
          {(!person1 || !person2) && (
            <p className="text-center text-sm text-stone-500">
              Select two people to discover how they&apos;re related
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
