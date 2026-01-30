'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Sparkles, Users, Clock, MapPin, Heart, ArrowRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useWorkspace } from '@/components/providers/workspace-provider'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

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
  "Who are my great-grandparents?",
  "How are we related to the Smiths?",
  "Tell me about ancestors from Ireland",
  "Who lived in Auckland in the 1920s?",
  "Show me family members who served in the war",
  "What do we know about our farming heritage?"
]

const springConfig = {
  type: 'spring',
  stiffness: 400,
  damping: 30
}

export function StorySearch({ className }: StorySearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const { currentWorkspace } = useWorkspace()
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null
    try {
      return new Date(dateStr).getFullYear()
    } catch {
      return dateStr
    }
  }

  return (
    <div className={`relative ${className}`}>
      <Card className="surface">
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10">
                  <Sparkles className="h-4 w-4 text-accent" />
                </div>
                <h2 className="text-lg font-bold font-serif">Story Search</h2>
              </div>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Ask natural questions about your family history and discover connections
              </p>
            </div>

            {/* Search Input */}
            <div className="relative" ref={inputRef}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  onFocus={() => !query && setShowSuggestions(true)}
                  placeholder="How are we related to..."
                  className="pl-10 pr-12 h-12 text-base"
                />
                <Button
                  onClick={() => handleSearch()}
                  disabled={loading || !query.trim()}
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8"
                >
                  {loading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Sparkles className="h-4 w-4" />
                    </motion.div>
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Example Queries */}
              <AnimatePresence>
                {showSuggestions && !query && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={springConfig}
                    className="absolute top-full left-0 right-0 mt-2 p-4 bg-card border rounded-lg shadow-lg z-50"
                  >
                    <p className="text-xs text-muted-foreground mb-3">Try asking:</p>
                    <div className="space-y-2">
                      {EXAMPLE_QUERIES.slice(0, 4).map((example, index) => (
                        <motion.button
                          key={example}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ ...springConfig, delay: index * 0.05 }}
                          onClick={() => handleExampleClick(example)}
                          className="block w-full text-left text-sm p-2 rounded hover:bg-muted transition-colors"
                        >
                          "{example}"
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* More Examples */}
            {!showSuggestions && !results.length && !loading && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground text-center">
                  Popular questions
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {EXAMPLE_QUERIES.slice(0, 3).map((example) => (
                    <Badge
                      key={example}
                      variant="outline"
                      className="cursor-pointer hover:bg-accent/10 transition-colors"
                      onClick={() => handleExampleClick(example)}
                    >
                      {example}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={springConfig}
            className="mt-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">
                Found {results.length} result{results.length !== 1 ? 's' : ''}
              </h3>
              <Badge variant="secondary">
                AI-powered
              </Badge>
            </div>

            <div className="space-y-2">
              {results.map((result, index) => (
                <motion.div
                  key={result.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...springConfig, delay: index * 0.1 }}
                >
                  <Card 
                    className="surface cursor-pointer hover:shadow-md transition-all duration-200"
                    onClick={() => handleResultClick(result)}
                  >
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              {result.type === 'person' && <Users className="h-4 w-4 text-accent" />}
                              {result.type === 'relationship' && <Heart className="h-4 w-4 text-pink-500" />}
                              {result.type === 'story' && <Clock className="h-4 w-4 text-blue-500" />}
                              <h4 className="font-medium">{result.title}</h4>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {result.snippet}
                            </p>
                            {result.person && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                {result.person.birth_date && (
                                  <span>Born {formatDate(result.person.birth_date)}</span>
                                )}
                                {result.person.death_date && (
                                  <span>• Died {formatDate(result.person.death_date)}</span>
                                )}
                              </div>
                            )}
                          </div>
                          <Badge 
                            variant="outline" 
                            className="ml-2 text-xs"
                          >
                            {Math.round(result.relevance * 100)}% match
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {query && results.length === 0 && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springConfig}
          className="mt-4"
        >
          <Card className="surface">
            <CardContent className="pt-6">
              <div className="text-center space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mx-auto">
                  <Search className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-medium">No results found</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Try rephrasing your question or adding more details
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}