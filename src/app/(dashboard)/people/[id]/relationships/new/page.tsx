'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useWorkspace } from '@/components/providers/workspace-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

// Each relationship option includes direction: 'forward' means current person is person_a, 'reverse' means swap
interface RelationshipOption {
  value: string // e.g., 'parent_child:forward' or 'parent_child:reverse'
  type: RelationshipType
  direction: 'forward' | 'reverse'
  label: string
  description: string
  category: 'family' | 'partnership' | 'other'
}

const RELATIONSHIP_OPTIONS: RelationshipOption[] = [
  // Parent/Child (bidirectional)
  { value: 'parent_child:forward', type: 'parent_child', direction: 'forward', label: 'Parent of', description: 'This person is the parent', category: 'family' },
  { value: 'parent_child:reverse', type: 'parent_child', direction: 'reverse', label: 'Child of', description: 'This person is the child', category: 'family' },

  // Sibling (symmetric)
  { value: 'sibling:forward', type: 'sibling', direction: 'forward', label: 'Sibling of', description: 'Brother or sister', category: 'family' },

  // Adoptive parent/child (bidirectional)
  { value: 'adoptive_parent:forward', type: 'adoptive_parent', direction: 'forward', label: 'Adoptive parent of', description: 'Adopted this person', category: 'family' },
  { value: 'adoptive_parent:reverse', type: 'adoptive_parent', direction: 'reverse', label: 'Adopted by', description: 'Was adopted by this person', category: 'family' },

  // Step parent/child (bidirectional)
  { value: 'step_parent:forward', type: 'step_parent', direction: 'forward', label: 'Step-parent of', description: 'Through marriage to their parent', category: 'family' },
  { value: 'step_parent:reverse', type: 'step_parent', direction: 'reverse', label: 'Stepchild of', description: 'This person is their step-parent', category: 'family' },

  // Foster parent/child (bidirectional)
  { value: 'foster_parent:forward', type: 'foster_parent', direction: 'forward', label: 'Foster parent of', description: 'Fostered this person', category: 'family' },
  { value: 'foster_parent:reverse', type: 'foster_parent', direction: 'reverse', label: 'Fostered by', description: 'Was fostered by this person', category: 'family' },

  // Guardian/Ward (bidirectional)
  { value: 'guardian:forward', type: 'guardian', direction: 'forward', label: 'Guardian of', description: 'Legal guardian', category: 'family' },
  { value: 'guardian:reverse', type: 'guardian', direction: 'reverse', label: 'Ward of', description: 'Under their guardianship', category: 'family' },

  // Partnerships (symmetric)
  { value: 'spouse:forward', type: 'spouse', direction: 'forward', label: 'Married to', description: 'Husband and wife', category: 'partnership' },
  { value: 'partner:forward', type: 'partner', direction: 'forward', label: 'Partner of', description: 'Unmarried life partners', category: 'partnership' },

  // Other
  { value: 'other:forward', type: 'other', direction: 'forward', label: 'Other connection', description: 'Another type of relationship', category: 'other' },
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
  const [selectedRelationship, setSelectedRelationship] = useState<string>('parent_child:reverse') // Default to "Child of" - more common use case
  const [notes, setNotes] = useState('')

  // Get the selected relationship option
  const relationshipOption = RELATIONSHIP_OPTIONS.find((o) => o.value === selectedRelationship)

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

  const [relationshipsAdded, setRelationshipsAdded] = useState(0)
  const [justAdded, setJustAdded] = useState<string | null>(null)

  const resetForm = () => {
    setSelectedPerson(null)
    setNotes('')
    setSearch('')
    setJustAdded(null)
  }

  const handleCreate = async (addAnother = false) => {
    if (!currentWorkspace || !person || !selectedPerson || !relationshipOption) return

    setCreating(true)
    const supabase = createClient()

    // For 'reverse' direction, swap person_a and person_b
    // This ensures proper storage: parent is always person_a in parent_child relationships
    const isReverse = relationshipOption.direction === 'reverse'

    const { error } = await supabase.from('relationships').insert({
      workspace_id: currentWorkspace.id,
      person_a_id: isReverse ? selectedPerson.id : personId,
      person_b_id: isReverse ? personId : selectedPerson.id,
      relationship_type: relationshipOption.type,
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

    const addedName = selectedPerson.preferred_name
    setRelationshipsAdded(prev => prev + 1)

    // Remove the just-added person from the available list
    setPeople(prev => prev.filter(p => p.id !== selectedPerson.id))

    if (addAnother) {
      setJustAdded(addedName)
      resetForm()
      toast.success(`Connected to ${addedName}`, { description: 'Add another relationship below' })
    } else {
      toast.success(`Connected ${person.preferred_name} and ${addedName}`)
      router.push(`/people/${personId}`)
    }
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
    if (!relationshipOption || !selectedPerson) return null
    // The label includes "of" or "to" already, so format nicely
    const label = relationshipOption.label.toLowerCase()
    return `${person.preferred_name} is the ${label} ${selectedPerson.preferred_name}`
  }

  return (
    <div className="mx-auto max-w-2xl p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="mb-2 text-2xl font-bold">Connect Family Members</h1>
          <p className="text-muted-foreground">
            Add family connections for <strong>{person.preferred_name}</strong>.
          </p>
        </div>
        {relationshipsAdded > 0 && (
          <div className="text-right">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 dark:bg-green-900/50 px-3 py-1 text-sm font-medium text-green-700 dark:text-green-300">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {relationshipsAdded} added
            </span>
          </div>
        )}
      </div>

      {justAdded && (
        <div className="mb-6 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-4">
          <p className="text-sm text-green-800 dark:text-green-200">
            <strong>{justAdded}</strong> connected! Add another relationship below, or click Done when finished.
          </p>
        </div>
      )}

      <div className="space-y-6">
        {/* Relationship Type */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">How is {person.preferred_name} related?</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedRelationship}
              onValueChange={setSelectedRelationship}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select relationship type" />
              </SelectTrigger>
              <SelectContent>
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Family</div>
                {RELATIONSHIP_OPTIONS.filter((o) => o.category === 'family').map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{option.label}</span>
                      <span className="text-xs text-muted-foreground">{option.description}</span>
                    </div>
                  </SelectItem>
                ))}
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">Partnerships</div>
                {RELATIONSHIP_OPTIONS.filter((o) => o.category === 'partnership').map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{option.label}</span>
                      <span className="text-xs text-muted-foreground">{option.description}</span>
                    </div>
                  </SelectItem>
                ))}
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">Other</div>
                {RELATIONSHIP_OPTIONS.filter((o) => o.category === 'other').map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{option.label}</span>
                      <span className="text-xs text-muted-foreground">{option.description}</span>
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
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => handleCreate(true)}
            disabled={creating || !selectedPerson}
            size="lg"
            variant="outline"
          >
            {creating ? 'Saving...' : 'Save & add another'}
          </Button>
          <Button onClick={() => handleCreate(false)} disabled={creating || !selectedPerson} size="lg">
            {creating ? 'Saving...' : relationshipsAdded > 0 ? 'Save & done' : 'Save connection'}
          </Button>
          <Button
            variant="ghost"
            size="lg"
            onClick={() => router.push(`/people/${personId}`)}
          >
            {relationshipsAdded > 0 ? 'Done' : 'Cancel'}
          </Button>
        </div>
      </div>
    </div>
  )
}
