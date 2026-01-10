'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, User, FileText, Calendar, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useWorkspace } from '@/components/providers/workspace-provider'
import { Button } from '@/components/ui/button'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { formatFlexibleDate } from '@/lib/dates'
import type { Person, Source, Event } from '@/types'

interface SearchResult {
  type: 'person' | 'source' | 'event'
  id: string
  title: string
  subtitle?: string
}

export function SearchCommand() {
  const router = useRouter()
  const { currentWorkspace } = useWorkspace()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])

  // Keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const search = useCallback(async (searchQuery: string) => {
    if (!currentWorkspace || searchQuery.length < 2) {
      setResults([])
      return
    }

    setLoading(true)
    const supabase = createClient()
    const searchResults: SearchResult[] = []

    // Search people
    const { data: people } = await supabase
      .from('people')
      .select('id, preferred_name, given_names, family_name, birth_date, birth_date_precision')
      .eq('workspace_id', currentWorkspace.id)
      .or(`preferred_name.ilike.%${searchQuery}%,given_names.ilike.%${searchQuery}%,family_name.ilike.%${searchQuery}%`)
      .limit(5)

    if (people) {
      people.forEach((person) => {
        const birthDate = person.birth_date
          ? formatFlexibleDate({
              date: person.birth_date,
              precision: person.birth_date_precision,
            })
          : null
        searchResults.push({
          type: 'person',
          id: person.id,
          title: person.preferred_name,
          subtitle: [
            person.given_names,
            person.family_name,
            birthDate && birthDate !== 'Unknown' ? `b. ${birthDate}` : null,
          ]
            .filter(Boolean)
            .join(' · '),
        })
      })
    }

    // Search sources
    const { data: sources } = await supabase
      .from('sources')
      .select('id, title, source_type, description')
      .eq('workspace_id', currentWorkspace.id)
      .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
      .limit(5)

    if (sources) {
      sources.forEach((source) => {
        searchResults.push({
          type: 'source',
          id: source.id,
          title: source.title,
          subtitle: source.source_type,
        })
      })
    }

    // Search events
    const { data: events } = await supabase
      .from('events')
      .select('id, title, event_type, location')
      .eq('workspace_id', currentWorkspace.id)
      .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%`)
      .limit(5)

    if (events) {
      events.forEach((event) => {
        searchResults.push({
          type: 'event',
          id: event.id,
          title: event.title || event.event_type,
          subtitle: event.location,
        })
      })
    }

    setResults(searchResults)
    setLoading(false)
  }, [currentWorkspace])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      search(query)
    }, 300)
    return () => clearTimeout(timer)
  }, [query, search])

  const handleSelect = (result: SearchResult) => {
    setOpen(false)
    setQuery('')
    switch (result.type) {
      case 'person':
        router.push(`/people/${result.id}`)
        break
      case 'source':
        router.push(`/sources?id=${result.id}`)
        break
      case 'event':
        router.push(`/activity?event=${result.id}`)
        break
    }
  }

  const getIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'person':
        return <User className="mr-2 h-4 w-4" />
      case 'source':
        return <FileText className="mr-2 h-4 w-4" />
      case 'event':
        return <Calendar className="mr-2 h-4 w-4" />
    }
  }

  const people = results.filter((r) => r.type === 'person')
  const sources = results.filter((r) => r.type === 'source')
  const events = results.filter((r) => r.type === 'event')

  return (
    <>
      <Button
        variant="outline"
        className="relative w-full justify-start text-sm text-stone-400 dark:text-stone-500"
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" strokeWidth={1.5} />
        <span>Search...</span>
        <kbd className="pointer-events-none absolute right-2.5 hidden h-5 select-none items-center gap-1 rounded-md border border-stone-200 bg-stone-100/50 px-1.5 font-mono text-[10px] font-medium text-stone-500 sm:flex dark:border-stone-700 dark:bg-stone-800/50 dark:text-stone-400">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search people, sources, events..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {loading && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          )}

          {!loading && query.length >= 2 && results.length === 0 && (
            <CommandEmpty>No results found.</CommandEmpty>
          )}

          {!loading && query.length < 2 && (
            <CommandEmpty>Type at least 2 characters to search...</CommandEmpty>
          )}

          {people.length > 0 && (
            <CommandGroup heading="People">
              {people.map((result) => (
                <CommandItem
                  key={result.id}
                  onSelect={() => handleSelect(result)}
                >
                  {getIcon(result.type)}
                  <div>
                    <p>{result.title}</p>
                    {result.subtitle && (
                      <p className="text-xs text-stone-400 dark:text-stone-500">{result.subtitle}</p>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {sources.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Sources">
                {sources.map((result) => (
                  <CommandItem
                    key={result.id}
                    onSelect={() => handleSelect(result)}
                  >
                    {getIcon(result.type)}
                    <div>
                      <p>{result.title}</p>
                      {result.subtitle && (
                        <p className="text-xs text-stone-400 dark:text-stone-500">{result.subtitle}</p>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {events.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Events">
                {events.map((result) => (
                  <CommandItem
                    key={result.id}
                    onSelect={() => handleSelect(result)}
                  >
                    {getIcon(result.type)}
                    <div>
                      <p>{result.title}</p>
                      {result.subtitle && (
                        <p className="text-xs text-stone-400 dark:text-stone-500">{result.subtitle}</p>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
