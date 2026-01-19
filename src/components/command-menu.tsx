'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users,
  UserPlus,
  FileText,
  FilePlus,
  GitBranch,
  Search,
  Settings,
  Home,
  Sparkles,
  History,
  Download,
  Plus,
  Link,
} from 'lucide-react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command'
import { useWorkspace } from '@/components/providers/workspace-provider'
import { createClient } from '@/lib/supabase/client'
interface PersonSearchResult {
  id: string
  preferred_name: string
  family_name: string | null
  birth_date: string | null
}

interface CommandMenuProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommandMenu({ open, onOpenChange }: CommandMenuProps) {
  const router = useRouter()
  const { currentWorkspace } = useWorkspace()
  const [people, setPeople] = useState<PersonSearchResult[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch people for search
  useEffect(() => {
    async function fetchPeople() {
      if (!currentWorkspace || !open) return

      const supabase = createClient()
      const { data } = await supabase
        .from('people')
        .select('id, preferred_name, family_name, birth_date')
        .eq('workspace_id', currentWorkspace.id)
        .order('preferred_name')
        .limit(100)

      if (data) {
        setPeople(data)
      }
    }

    fetchPeople()
  }, [currentWorkspace, open])

  const runCommand = useCallback((command: () => void) => {
    onOpenChange(false)
    command()
  }, [onOpenChange])

  // Filter people based on search
  const filteredPeople = people.filter((person) =>
    person.preferred_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    person.family_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search or type a command..."
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Quick Actions */}
        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={() => runCommand(() => router.push('/people/new'))}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add new person
            <CommandShortcut>⌘I</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/sources'))}>
            <FilePlus className="mr-2 h-4 w-4" />
            Add source / Upload file
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => {
            // Trigger quick capture - we'll dispatch a custom event
            window.dispatchEvent(new CustomEvent('open-quick-capture'))
            router.push('/')
          })}>
            <Sparkles className="mr-2 h-4 w-4" />
            Quick Capture (AI extract)
            <CommandShortcut>⌘E</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Navigation */}
        <CommandGroup heading="Navigate">
          <CommandItem onSelect={() => runCommand(() => router.push('/'))}>
            <Home className="mr-2 h-4 w-4" />
            Dashboard
            <CommandShortcut>⌘D</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/people'))}>
            <Users className="mr-2 h-4 w-4" />
            People
            <CommandShortcut>⌘P</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/tree'))}>
            <GitBranch className="mr-2 h-4 w-4" />
            Family Tree
            <CommandShortcut>⌘T</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/sources'))}>
            <FileText className="mr-2 h-4 w-4" />
            Sources
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/suggestions'))}>
            <Sparkles className="mr-2 h-4 w-4" />
            Suggestions
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/activity'))}>
            <History className="mr-2 h-4 w-4" />
            Activity
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/export'))}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/settings'))}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </CommandItem>
        </CommandGroup>

        {/* People Search */}
        {filteredPeople.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="People">
              {filteredPeople.slice(0, 8).map((person) => (
                <CommandItem
                  key={person.id}
                  onSelect={() => runCommand(() => router.push(`/people/${person.id}`))}
                >
                  <Users className="mr-2 h-4 w-4" />
                  <span>{person.preferred_name}</span>
                  {person.family_name && (
                    <span className="ml-1 text-muted-foreground">({person.family_name})</span>
                  )}
                  {person.birth_date && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      b. {person.birth_date.split('-')[0]}
                    </span>
                  )}
                </CommandItem>
              ))}
              {filteredPeople.length > 8 && (
                <CommandItem onSelect={() => runCommand(() => router.push('/people'))}>
                  <Search className="mr-2 h-4 w-4" />
                  View all {filteredPeople.length} people...
                </CommandItem>
              )}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  )
}

// Provider component to make command menu available globally
export function CommandMenuProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

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

  return (
    <>
      {children}
      <CommandMenu open={open} onOpenChange={setOpen} />
    </>
  )
}
