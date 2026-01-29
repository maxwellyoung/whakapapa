'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Sparkles, ArrowLeft, Users, Clock, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useWorkspace } from '@/components/providers/workspace-provider'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Person } from '@/types'

interface PersonStoryProps {
  person: Person
}

interface StoryNavigation {
  linkedPeople: { name: string; id?: string }[]
  linkedPlaces: string[]
}

const springConfig = {
  type: 'spring',
  stiffness: 400,
  damping: 30
}

export function PersonStory({ person }: PersonStoryProps) {
  const [story, setStory] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [navigation, setNavigation] = useState<StoryNavigation>({ linkedPeople: [], linkedPlaces: [] })
  const { currentWorkspace } = useWorkspace()
  const router = useRouter()

  useEffect(() => {
    if (currentWorkspace) {
      generateStory()
    }
  }, [person.id, currentWorkspace])

  const generateStory = async (regenerate = false) => {
    if (!currentWorkspace) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/story', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspace_id: currentWorkspace.id,
          person_id: person.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate story')
      }

      setStory(data.story)
      await processStoryNavigation(data.story)
      
      if (regenerate) {
        toast.success('Story regenerated successfully')
      }

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to generate story'
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const processStoryNavigation = async (storyText: string) => {
    if (!currentWorkspace) return

    // Extract linked people [[Name]]
    const peopleMatches = storyText.match(/\[\[([^\]]+)\]\]/g)
    const linkedPeople: { name: string; id?: string }[] = []

    if (peopleMatches) {
      const supabase = createClient()
      
      for (const match of peopleMatches) {
        const name = match.replace(/\[\[|\]\]/g, '')
        
        // Skip if it's the current person
        if (name.toLowerCase() === person.preferred_name.toLowerCase()) continue
        
        // Try to find this person in the database
        const { data: matches } = await supabase
          .from('people')
          .select('id, preferred_name, given_names, family_name')
          .eq('workspace_id', currentWorkspace.id)
          .limit(10)

        let bestMatch = null
        let bestScore = 0

        if (matches) {
          for (const match of matches) {
            const fullName = `${match.given_names || ''} ${match.family_name || ''}`.trim()
            const names = [match.preferred_name, fullName, match.given_names, match.family_name].filter(Boolean)
            
            for (const candidateName of names) {
              const similarity = calculateSimilarity(name.toLowerCase(), candidateName.toLowerCase())
              if (similarity > bestScore && similarity > 0.7) {
                bestScore = similarity
                bestMatch = match
              }
            }
          }
        }

        linkedPeople.push({
          name,
          id: bestMatch?.id
        })
      }
    }

    // Extract linked places ((Place Name))
    const placeMatches = storyText.match(/\(\(([^)]+)\)\)/g)
    const linkedPlaces = placeMatches ? placeMatches.map(match => match.replace(/\(\(|\)\)/g, '')) : []

    setNavigation({ linkedPeople, linkedPlaces })
  }

  const calculateSimilarity = (str1: string, str2: string): number => {
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1
    const editDistance = levenshteinDistance(longer, shorter)
    return (longer.length - editDistance) / longer.length
  }

  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix = []
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }
    return matrix[str2.length][str1.length]
  }

  const renderStoryWithLinks = (text: string) => {
    let processedText = text

    // Process people links [[Name]]
    processedText = processedText.replace(/\[\[([^\]]+)\]\]/g, (match, name) => {
      const linkedPerson = navigation.linkedPeople.find(p => p.name === name)
      if (linkedPerson?.id) {
        return `<PersonLink data-person-id="${linkedPerson.id}" data-person-name="${name}">${name}</PersonLink>`
      }
      return `<span class="text-accent font-medium">${name}</span>`
    })

    // Process place links ((Place Name))
    processedText = processedText.replace(/\(\(([^)]+)\)\)/g, (match, place) => {
      return `<span class="text-blue-400 font-medium cursor-pointer hover:text-blue-300 transition-colors" title="Search for ${place}">${place}</span>`
    })

    return processedText
  }

  const handlePersonLinkClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement
    if (target.tagName === 'PERSONLINK') {
      const personId = target.getAttribute('data-person-id')
      const personName = target.getAttribute('data-person-name')
      
      if (personId) {
        router.push(`/people/${personId}?view=story`)
      } else {
        toast.info(`No profile found for ${personName}`)
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
            <BookOpen className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-serif">Story of {person.preferred_name}</h2>
            <p className="text-sm text-muted-foreground">
              Their life told as a narrative journey
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => generateStory(true)}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Regenerate
        </Button>
      </div>

      {/* Story Content */}
      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={springConfig}
            className="space-y-4"
          >
            <Card className="surface">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-accent animate-pulse" />
                    <span className="text-sm text-muted-foreground">
                      Crafting their story...
                    </span>
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/5" />
                  <div className="mt-6 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {error && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={springConfig}
          >
            <Card className="surface border-red-500/20">
              <CardContent className="pt-6">
                <div className="text-center space-y-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 mx-auto">
                    <BookOpen className="h-6 w-6 text-red-500" />
                  </div>
                  <div>
                    <h3 className="font-medium text-red-400">Unable to generate story</h3>
                    <p className="text-sm text-muted-foreground mt-1">{error}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => generateStory()}
                    className="mt-3"
                  >
                    Try again
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {story && !loading && (
          <motion.div
            key="story"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={springConfig}
            className="space-y-6"
          >
            {/* Main Story */}
            <Card className="surface">
              <CardContent className="pt-6">
                <div 
                  className="prose prose-stone dark:prose-invert max-w-none leading-relaxed"
                  style={{
                    fontFamily: 'var(--font-sans)',
                    lineHeight: '1.75',
                    fontSize: '1.0625rem'
                  }}
                  onClick={handlePersonLinkClick}
                  dangerouslySetInnerHTML={{
                    __html: renderStoryWithLinks(story)
                  }}
                />
              </CardContent>
            </Card>

            {/* Navigation Panel */}
            {(navigation.linkedPeople.length > 0 || navigation.linkedPlaces.length > 0) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springConfig, delay: 0.2 }}
              >
                <Card className="surface">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Navigate the Story
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {navigation.linkedPeople.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">
                          People mentioned
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {navigation.linkedPeople.map((linkedPerson, index) => (
                            <motion.div
                              key={linkedPerson.name}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ ...springConfig, delay: index * 0.05 }}
                            >
                              {linkedPerson.id ? (
                                <Link href={`/people/${linkedPerson.id}?view=story`}>
                                  <Badge 
                                    variant="secondary"
                                    className="cursor-pointer hover:bg-accent/20 transition-colors"
                                  >
                                    {linkedPerson.name}
                                  </Badge>
                                </Link>
                              ) : (
                                <Badge variant="outline">
                                  {linkedPerson.name}
                                  <span className="ml-1 text-xs opacity-50">(not found)</span>
                                </Badge>
                              )}
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    {navigation.linkedPlaces.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">
                          Places mentioned
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {navigation.linkedPlaces.map((place, index) => (
                            <motion.div
                              key={place}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ ...springConfig, delay: index * 0.05 }}
                            >
                              <Badge 
                                variant="outline"
                                className="cursor-pointer hover:bg-blue-500/10 transition-colors"
                                title={`Search for ${place}`}
                              >
                                {place}
                              </Badge>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom styles for story links */}
      <style jsx global>{`
        PersonLink {
          color: hsl(355, 78%, 58%);
          font-weight: 500;
          cursor: pointer;
          text-decoration: underline;
          text-decoration-color: transparent;
          transition: all 0.2s ease;
        }
        
        PersonLink:hover {
          text-decoration-color: hsl(355, 78%, 58%);
          color: hsl(355, 78%, 68%);
        }
        
        .prose PersonLink {
          color: hsl(355, 78%, 58%);
          text-decoration: underline;
          text-decoration-color: transparent;
        }
        
        .prose PersonLink:hover {
          text-decoration-color: hsl(355, 78%, 58%);
        }
      `}</style>
    </div>
  )
}