'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, User, FileText, Calendar, Loader2, MapPin, Filter, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useWorkspace } from '@/components/providers/workspace-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { formatFlexibleDate } from '@/lib/dates'
import type { Person, Source, Event } from '@/types'

interface SearchResult {
  type: 'person' | 'source' | 'event'
  id: string
  title: string
  subtitle?: string
  location?: string
  year?: string
}

interface SearchFilters {
  location?: string
  yearFrom?: string
  yearTo?: string
}

export function SearchCommand() {
  const router = useRouter()
  const { currentWorkspace } = useWorkspace()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [filters, setFilters] = useState<SearchFilters>({})
  const [showFilters, setShowFilters] = useState(false)

  const hasActiveFilters = filters.location || filters.yearFrom || filters.yearTo
  const activeFilterCount = [filters.location, filters.yearFrom || filters.yearTo].filter(Boolean).length

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

  const clearFilters = () => {
    setFilters({})
  }

  const search = useCallback(async (searchQuery: string, searchFilters: SearchFilters) => {
    if (!currentWorkspace || (searchQuery.length < 2 && !searchFilters.location && !searchFilters.yearFrom)) {
      setResults([])
      return
    }

    setLoading(true)
    const supabase = createClient()
    const searchResults: SearchResult[] = []

    // Build people query
    let peopleQuery = supabase
      .from('people')
      .select('id, preferred_name, given_names, family_name, birth_date, birth_date_precision, birth_place, death_place')
      .eq('workspace_id', currentWorkspace.id)

    // Text search
    if (searchQuery.length >= 2) {
      peopleQuery = peopleQuery.or(
        `preferred_name.ilike.%${searchQuery}%,given_names.ilike.%${searchQuery}%,family_name.ilike.%${searchQuery}%,birth_place.ilike.%${searchQuery}%,death_place.ilike.%${searchQuery}%`
      )
    }

    // Location filter
    if (searchFilters.location) {
      peopleQuery = peopleQuery.or(
        `birth_place.ilike.%${searchFilters.location}%,death_place.ilike.%${searchFilters.location}%`
      )
    }

    // Year range filter
    if (searchFilters.yearFrom) {
      peopleQuery = peopleQuery.gte('birth_date', `${searchFilters.yearFrom}-01-01`)
    }
    if (searchFilters.yearTo) {
      peopleQuery = peopleQuery.lte('birth_date', `${searchFilters.yearTo}-12-31`)
    }

    const { data: people } = await peopleQuery.limit(8)

    if (people) {
      people.forEach((person) => {
        const birthYear = person.birth_date?.split('-')[0]
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
          location: person.birth_place || person.death_place || undefined,
          year: birthYear,
        })
      })
    }

    // Only search sources and events if we have a text query
    if (searchQuery.length >= 2) {
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
      let eventsQuery = supabase
        .from('events')
        .select('id, title, event_type, location, event_date')
        .eq('workspace_id', currentWorkspace.id)
        .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%`)

      if (searchFilters.location) {
        eventsQuery = eventsQuery.ilike('location', `%${searchFilters.location}%`)
      }

      const { data: events } = await eventsQuery.limit(5)

      if (events) {
        events.forEach((event) => {
          searchResults.push({
            type: 'event',
            id: event.id,
            title: event.title || event.event_type,
            subtitle: event.location,
            location: event.location || undefined,
            year: event.event_date?.split('-')[0],
          })
        })
      }
    }

    setResults(searchResults)
    setLoading(false)
  }, [currentWorkspace])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      search(query, filters)
    }, 300)
    return () => clearTimeout(timer)
  }, [query, filters, search])

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
        <div className="flex items-center border-b border-stone-200 dark:border-stone-800">
          <CommandInput
            placeholder="Search people, sources, events..."
            value={query}
            onValueChange={setQuery}
            className="flex-1"
          />
          <Popover open={showFilters} onOpenChange={setShowFilters}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="mr-2 relative"
              >
                <Filter className="h-4 w-4" />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-indigo-500 text-[10px] text-white flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Filters</h4>
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="h-auto py-1 px-2 text-xs">
                      Clear all
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-stone-500">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                    <Input
                      placeholder="e.g., Scotland, Auckland"
                      value={filters.location || ''}
                      onChange={(e) => setFilters({ ...filters, location: e.target.value || undefined })}
                      className="pl-8 h-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-stone-500">Birth Year Range</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="From"
                      value={filters.yearFrom || ''}
                      onChange={(e) => setFilters({ ...filters, yearFrom: e.target.value || undefined })}
                      className="h-9"
                      type="number"
                      min="1000"
                      max="2100"
                    />
                    <Input
                      placeholder="To"
                      value={filters.yearTo || ''}
                      onChange={(e) => setFilters({ ...filters, yearTo: e.target.value || undefined })}
                      className="h-9"
                      type="number"
                      min="1000"
                      max="2100"
                    />
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Active filters display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-1.5 px-3 py-2 border-b border-stone-200 dark:border-stone-800">
            {filters.location && (
              <Badge variant="secondary" className="gap-1 pr-1">
                <MapPin className="h-3 w-3" />
                {filters.location}
                <button
                  onClick={() => setFilters({ ...filters, location: undefined })}
                  className="ml-1 hover:bg-stone-300 dark:hover:bg-stone-600 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {(filters.yearFrom || filters.yearTo) && (
              <Badge variant="secondary" className="gap-1 pr-1">
                <Calendar className="h-3 w-3" />
                {filters.yearFrom || '?'} – {filters.yearTo || '?'}
                <button
                  onClick={() => setFilters({ ...filters, yearFrom: undefined, yearTo: undefined })}
                  className="ml-1 hover:bg-stone-300 dark:hover:bg-stone-600 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        )}

        <CommandList>
          {loading && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          )}

          {!loading && (query.length >= 2 || hasActiveFilters) && results.length === 0 && (
            <CommandEmpty>No results found.</CommandEmpty>
          )}

          {!loading && query.length < 2 && !hasActiveFilters && (
            <CommandEmpty>
              <div className="text-center py-4">
                <p className="text-sm text-stone-500">Type to search or use filters</p>
                <p className="text-xs text-stone-400 mt-1">
                  Try: &quot;born in Scotland&quot; or filter by year range
                </p>
              </div>
            </CommandEmpty>
          )}

          {people.length > 0 && (
            <CommandGroup heading="People">
              {people.map((result) => (
                <CommandItem
                  key={result.id}
                  onSelect={() => handleSelect(result)}
                  className="flex items-start gap-3"
                >
                  {getIcon(result.type)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{result.title}</p>
                    {result.subtitle && (
                      <p className="text-xs text-stone-400 dark:text-stone-500 truncate">{result.subtitle}</p>
                    )}
                    {result.location && (
                      <p className="text-xs text-stone-400 dark:text-stone-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3" />
                        {result.location}
                      </p>
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
