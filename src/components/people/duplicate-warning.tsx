'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, Check, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useWorkspace } from '@/components/providers/workspace-provider'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { findDuplicates, type DuplicateMatch } from '@/lib/duplicate-detection'
import type { Person } from '@/types'

interface DuplicateWarningProps {
  personData: Partial<Person>
  onSelectExisting?: (person: Person) => void
  onDismiss?: () => void
}

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

export function DuplicateWarning({ personData, onSelectExisting, onDismiss }: DuplicateWarningProps) {
  const { currentWorkspace } = useWorkspace()
  const [matches, setMatches] = useState<DuplicateMatch[]>([])
  const [loading, setLoading] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    async function checkDuplicates() {
      if (!currentWorkspace || !personData.preferred_name || personData.preferred_name.length < 3) {
        setMatches([])
        return
      }

      setLoading(true)
      const supabase = createClient()

      const { data: people } = await supabase
        .from('people')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)

      if (people) {
        const duplicates = findDuplicates(personData, people)
        setMatches(duplicates.slice(0, 3)) // Show top 3
      }

      setLoading(false)
    }

    // Debounce the check
    const timer = setTimeout(checkDuplicates, 500)
    return () => clearTimeout(timer)
  }, [personData, currentWorkspace])

  if (dismissed || matches.length === 0) return null

  const likelyMatches = matches.filter((m) => m.verdict === 'likely')
  const maybeMatches = matches.filter((m) => m.verdict !== 'likely')

  return (
    <Alert variant="destructive" className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
      <AlertTriangle className="h-4 w-4 text-yellow-600" />
      <AlertTitle className="text-yellow-800 dark:text-yellow-200">
        Possible duplicate detected
      </AlertTitle>
      <AlertDescription className="mt-3">
        <div className="space-y-3">
          {likelyMatches.map((match) => (
            <div
              key={match.person.id}
              className="flex items-center gap-3 rounded-md border border-yellow-300 bg-white p-3 dark:bg-neutral-900"
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={match.person.photo_url ?? undefined} />
                <AvatarFallback>{getInitials(match.person.preferred_name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{match.person.preferred_name}</span>
                  <Badge variant="destructive">Likely match</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {match.reasons.join(' · ')}
                </p>
              </div>
              <div className="flex gap-2">
                <Link href={`/people/${match.person.id}`}>
                  <Button variant="outline" size="sm">View</Button>
                </Link>
                {onSelectExisting && (
                  <Button size="sm" onClick={() => onSelectExisting(match.person)}>
                    Use this
                  </Button>
                )}
              </div>
            </div>
          ))}

          {maybeMatches.length > 0 && (
            <div className="text-sm text-yellow-700 dark:text-yellow-300">
              Also possibly: {maybeMatches.map((m) => m.person.preferred_name).join(', ')}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDismissed(true)
                onDismiss?.()
              }}
            >
              <X className="mr-1 h-3 w-3" />
              Not a duplicate
            </Button>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  )
}
