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
  { value: 'parent_child', label: 'Parent → Child', description: 'This person is the parent' },
  { value: 'spouse', label: 'Spouse', description: 'Married partners' },
  { value: 'partner', label: 'Partner', description: 'Unmarried partners' },
  { value: 'sibling', label: 'Sibling', description: 'Brothers/sisters' },
  { value: 'adoptive_parent', label: 'Adoptive Parent → Child', description: 'Adoption relationship' },
  { value: 'step_parent', label: 'Step-Parent → Child', description: 'Step-parent relationship' },
  { value: 'foster_parent', label: 'Foster Parent → Child', description: 'Foster relationship' },
  { value: 'guardian', label: 'Guardian → Ward', description: 'Legal guardian' },
  { value: 'other', label: 'Other', description: 'Custom relationship' },
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
        toast.error('This relationship already exists')
      } else {
        toast.error('Failed to create relationship')
      }
      return
    }

    toast.success('Relationship created')
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

  return (
    <div className="mx-auto max-w-2xl p-8">
      <h1 className="mb-6 text-2xl font-bold">Add Relationship</h1>
      <p className="mb-6 text-muted-foreground">
        Adding a relationship for <strong>{person.preferred_name}</strong>
      </p>

      <div className="space-y-6">
        {/* Relationship Type */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Relationship Type</CardTitle>
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
            <CardTitle className="text-lg">Related Person</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search people..."
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
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    {people.length === 0 ? 'No other people in workspace' : 'No results'}
                  </p>
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

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Optional notes about this relationship..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button onClick={handleCreate} disabled={creating || !selectedPerson}>
            {creating ? 'Creating...' : 'Add Relationship'}
          </Button>
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
