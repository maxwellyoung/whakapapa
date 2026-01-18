'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useWorkspace } from '@/components/providers/workspace-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import type { Person, RelationshipType } from '@/types'

const RELATIONSHIP_TYPES: { value: RelationshipType; label: string; description: string }[] = [
  { value: 'parent_child', label: 'Parent of', description: 'This person is the parent of the other' },
  { value: 'spouse', label: 'Married to', description: 'Husband and wife' },
  { value: 'partner', label: 'Partner of', description: 'Unmarried life partners' },
  { value: 'sibling', label: 'Sibling of', description: 'Brother or sister' },
  { value: 'adoptive_parent', label: 'Adoptive parent of', description: 'Adopted this person' },
  { value: 'step_parent', label: 'Step-parent of', description: 'Through marriage to their parent' },
  { value: 'foster_parent', label: 'Foster parent of', description: 'Fostered this person' },
  { value: 'guardian', label: 'Guardian of', description: 'Legal guardian' },
  { value: 'other', label: 'Other connection', description: 'Another type of relationship' },
]

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

export default function NewRelationshipPage() {
  const params = useParams()
  const router = useRouter()
  const personId = params.id as string
  const { currentWorkspace } = useWorkspace()

  const [person, setPerson] = useState<Person | null>(null)
  const [people, setPeople] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  const [search, setSearch] = useState('')
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null)
  const [relationshipType, setRelationshipType] = useState<RelationshipType>('parent_child')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    async function fetchData() {
      if (!currentWorkspace) return

      const supabase = createClient()

      const [{ data: personData }, { data: peopleData }] = await Promise.all([
        supabase.from('people').select('*').eq('id', personId).single(),
        supabase.from('people').select('*').eq('workspace_id', currentWorkspace.id).order('preferred_name'),
      ])

      if (personData) setPerson(personData)
      if (peopleData) setPeople(peopleData.filter((p) => p.id !== personId))
      setLoading(false)
    }

    fetchData()
  }, [personId, currentWorkspace])

  const filteredPeople = people.filter(
    (p) =>
      p.preferred_name.toLowerCase().includes(search.toLowerCase()) ||
      p.given_names?.toLowerCase().includes(search.toLowerCase()) ||
      p.family_name?.toLowerCase().includes(search.toLowerCase())
  )

  const handleCreate = async () => {
    if (!currentWorkspace || !person || !selectedPerson) return

    setCreating(true)
    const supabase = createClient()

    // For directional relationships (parent_child, etc.), person_a is the "from" side
    // We're adding a relationship FROM the current person page
    const isDirectional = ['parent_child', 'adoptive_parent', 'step_parent', 'foster_parent', 'guardian'].includes(relationshipType)

    const { error } = await supabase.from('relationships').insert({
      workspace_id: currentWorkspace.id,
      person_a_id: personId,
      person_b_id: selectedPerson.id,
      relationship_type: relationshipType,
      notes: notes.trim() || null,
    })

    setCreating(false)

    if (error) {
      if (error.code === '23505') {
        toast.error('These two people are already connected. Check their profiles to see the existing relationship.')
      } else {
        toast.error("We couldn't save this relationship. Please try again.")
      }
      return
    }

    toast.success(`Connected ${person.preferred_name} and ${selectedPerson.preferred_name}`)
    router.push(`/people/${personId}`)
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!person) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Person not found</p>
      </div>
    )
  }

  // Get a friendly description of the relationship
  const getRelationshipSentence = () => {
    const type = RELATIONSHIP_TYPES.find((t) => t.value === relationshipType)
    if (!type || !selectedPerson) return null
    return `${person.preferred_name} is the ${type.label.toLowerCase()} ${selectedPerson.preferred_name}`
  }

  return (
    <div className="mx-auto max-w-2xl p-8">
      <h1 className="mb-2 text-2xl font-bold">Connect Family Members</h1>
      <p className="mb-6 text-muted-foreground">
        Add a family connection for <strong>{person.preferred_name}</strong>.
        This helps build your family tree.
      </p>

      <div className="space-y-6">
        {/* Relationship Type */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">How are they related?</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={relationshipType}
              onValueChange={(v) => setRelationshipType(v as RelationshipType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RELATIONSHIP_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div>
                      <span className="font-medium">{type.label}</span>
                      <p className="text-xs text-muted-foreground">{type.description}</p>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Select Person */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Who is {person.preferred_name} related to?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {selectedPerson && (
              <div className="flex items-center gap-3 rounded-md border bg-muted/50 p-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedPerson.photo_url ?? undefined} />
                  <AvatarFallback>{getInitials(selectedPerson.preferred_name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{selectedPerson.preferred_name}</p>
                  {selectedPerson.family_name && (
                    <p className="text-sm text-muted-foreground">{selectedPerson.family_name}</p>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedPerson(null)}>
                  Change
                </Button>
              </div>
            )}

            {!selectedPerson && (
              <div className="max-h-64 overflow-auto space-y-1">
                {filteredPeople.length === 0 ? (
                  <div className="py-6 text-center">
                    {people.length === 0 ? (
                      <>
                        <p className="text-sm font-medium text-stone-600 dark:text-stone-400 mb-2">
                          No one else to connect to yet
                        </p>
                        <p className="text-xs text-muted-foreground mb-4">
                          Add more people to your family tree first, then come back here to connect them.
                        </p>
                        <Button variant="outline" size="sm" onClick={() => router.push('/people/new')}>
                          Add another person
                        </Button>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No one matches &quot;{search}&quot;. Try a different name.
                      </p>
                    )}
                  </div>
                ) : (
                  filteredPeople.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPerson(p)}
                      className="flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors hover:bg-muted"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={p.photo_url ?? undefined} />
                        <AvatarFallback className="text-xs">{getInitials(p.preferred_name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{p.preferred_name}</p>
                        {p.family_name && (
                          <p className="text-xs text-muted-foreground">{p.family_name}</p>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Relationship Preview */}
        {selectedPerson && (
          <div className="rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-4">
            <p className="text-sm text-green-800 dark:text-green-200">
              <strong>Preview:</strong> {getRelationshipSentence()}
            </p>
          </div>
        )}

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Additional details (optional)</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Any notes about this relationship, like wedding date or how you know this..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button onClick={handleCreate} disabled={creating || !selectedPerson} size="lg">
            {creating ? 'Saving...' : 'Save connection'}
          </Button>
          <Button variant="outline" size="lg" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
