'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, ArrowLeft, Users, Search, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { StorySearch } from '@/components/search/story-search'
import { useWorkspace } from '@/components/providers/workspace-provider'
import { createClient } from '@/lib/supabase/client'
import type { Person } from '@/types'

interface PersonWithConnections extends Person {
  relationship_count: number
  memory_count: number
  has_story: boolean
}

const springConfig = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 30
}

export default function StoryModePage() {
  const [people, setPeople] = useState<PersonWithConnections[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null)
  const { currentWorkspace } = useWorkspace()
  const router = useRouter()

  useEffect(() => {
    async function fetchPeopleForStories() {
      if (!currentWorkspace) return

      const supabase = createClient()

      // Fetch people with their connection counts and memory counts
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
        const enrichedPeople: PersonWithConnections[] = peopleData.map(person => ({
          ...person,
          relationship_count: (person.relationships_as_a?.length || 0) + (person.relationships_as_b?.length || 0),
          memory_count: person.memories?.length || 0,
          has_story: !!(person.bio || person.memories?.length > 0 || 
                       ((person.relationships_as_a?.length || 0) + (person.relationships_as_b?.length || 0)) > 0)
        }))

        // Sort by story potential (people with more data first)
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

  const getStoryRichness = (person: PersonWithConnections): 'rich' | 'moderate' | 'minimal' => {
    const score = person.relationship_count + person.memory_count + (person.bio ? 2 : 0)
    if (score >= 4) return 'rich'
    if (score >= 2) return 'moderate'
    return 'minimal'
  }

  const getStoryRichnessColor = (richness: 'rich' | 'moderate' | 'minimal') => {
    switch (richness) {
      case 'rich': return 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400'
      case 'moderate': return 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
      case 'minimal': return 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-400'
    }
  }

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-muted rounded-full animate-pulse" />
            <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          </div>
          <div className="h-32 bg-muted rounded-xl animate-pulse" />
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-8 max-w-4xl mx-auto"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springConfig}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
        
        <div className="flex items-center gap-4 mb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
            <BookOpen className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-serif">Story Mode</h1>
            <p className="text-muted-foreground">
              Navigate your family history as interconnected stories
            </p>
          </div>
        </div>
      </motion.div>

      {/* Story Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springConfig, delay: 0.1 }}
        className="mb-8"
      >
        <StorySearch />
      </motion.div>

      {/* People Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springConfig, delay: 0.2 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Family Stories</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            Click any person to enter their story
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {people.map((person, index) => {
            const richness = getStoryRichness(person)
            const richnessColor = getStoryRichnessColor(richness)
            
            return (
              <motion.div
                key={person.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springConfig, delay: 0.1 + index * 0.05 }}
              >
                <Card 
                  className="surface cursor-pointer hover:shadow-md transition-all duration-200 group"
                  onClick={() => handlePersonClick(person.id)}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={person.photo_url || undefined} />
                          <AvatarFallback className="font-medium">
                            {person.preferred_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium text-lg group-hover:text-accent transition-colors">
                            {person.preferred_name}
                          </h3>
                          {(person.given_names || person.family_name) && (
                            <p className="text-sm text-muted-foreground">
                              {person.given_names} {person.family_name}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${richnessColor}`}
                      >
                        {richness} story
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      {person.bio && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {person.bio}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {person.relationship_count > 0 && (
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {person.relationship_count} connection{person.relationship_count !== 1 ? 's' : ''}
                          </div>
                        )}
                        {person.memory_count > 0 && (
                          <div className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            {person.memory_count} memor{person.memory_count !== 1 ? 'ies' : 'y'}
                          </div>
                        )}
                        {person.birth_date && (
                          <span>
                            Born {new Date(person.birth_date).getFullYear()}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {people.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springConfig}
            className="text-center py-12"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mx-auto mb-4">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No people found</h3>
            <p className="text-muted-foreground mb-6">
              Add some family members to start exploring their stories
            </p>
            <Link href="/people/new">
              <Button>
                Add a person
              </Button>
            </Link>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  )
}