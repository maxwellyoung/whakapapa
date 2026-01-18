'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Pencil, Plus, Trash2, Camera } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useWorkspace } from '@/components/providers/workspace-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { formatFlexibleDate } from '@/lib/dates'
import { canEdit, canDelete } from '@/lib/permissions'
import { RelationshipList } from '@/components/people/relationship-list'
import { PersonAttachments } from '@/components/people/person-attachments'
import { VisibilityControl } from '@/components/people/visibility-control'
import { toast } from 'sonner'
import type { Person, Relationship } from '@/types'

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default function PersonDetailPage() {
  const params = useParams()
  const personId = params.id as string
  const { currentWorkspace, userRole } = useWorkspace()

  const [person, setPerson] = useState<Person | null>(null)
  const [relationships, setRelationships] = useState<(Relationship & { person: Person })[]>([])
  const [loading, setLoading] = useState(true)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function fetchPerson() {
      if (!currentWorkspace) return

      const supabase = createClient()

      // Fetch person
      const { data: personData } = await supabase
        .from('people')
        .select('*')
        .eq('id', personId)
        .eq('workspace_id', currentWorkspace.id)
        .single()

      if (personData) {
        setPerson(personData)
        setPhotoUrl(personData.photo_url)

        // Fetch relationships where this person is either person_a or person_b
        const { data: relA } = await supabase
          .from('relationships')
          .select('*, person:people!relationships_person_b_id_fkey(*)')
          .eq('person_a_id', personId)

        const { data: relB } = await supabase
          .from('relationships')
          .select('*, person:people!relationships_person_a_id_fkey(*)')
          .eq('person_b_id', personId)

        const allRels = [
          ...(relA || []).map((r) => ({ ...r, person: r.person as Person })),
          ...(relB || []).map((r) => ({ ...r, person: r.person as Person })),
        ]
        setRelationships(allRels)
      }

      setLoading(false)
    }

    fetchPerson()
  }, [personId, currentWorkspace])

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
        <div className="text-center max-w-sm">
          <p className="text-lg font-medium text-stone-700 dark:text-stone-300 mb-2">
            We couldn&apos;t find this person
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            They may have been removed, or you might not have permission to view them.
          </p>
          <Link href="/people">
            <Button variant="outline">Go back to people list</Button>
          </Link>
        </div>
      </div>
    )
  }

  const birthDate = formatFlexibleDate({
    date: person.birth_date,
    precision: person.birth_date_precision,
    endDate: person.birth_date_end,
  })

  const deathDate = formatFlexibleDate({
    date: person.death_date,
    precision: person.death_date_precision,
    endDate: person.death_date_end,
  })

  const canUserEdit = userRole && canEdit(userRole)
  const canUserDelete = userRole && canDelete(userRole)

  const handleQuickPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !currentWorkspace) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    try {
      const supabase = createClient()
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const filePath = `${currentWorkspace.id}/${crypto.randomUUID()}.${fileExt}`

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('sources')
        .upload(filePath, file, { cacheControl: '3600' })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage.from('sources').getPublicUrl(filePath)

      // Update person's photo_url
      const { error: updateError } = await supabase
        .from('people')
        .update({ photo_url: urlData.publicUrl })
        .eq('id', personId)

      if (updateError) throw updateError

      setPhotoUrl(urlData.publicUrl)
      toast.success('Profile photo updated')
    } catch (error) {
      console.error('Upload error:', error)
      toast.error("Couldn't upload photo. Please try again.")
    }

    // Reset input
    if (photoInputRef.current) {
      photoInputRef.current.value = ''
    }
  }

  return (
    <div className="p-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Avatar className="h-20 w-20">
                <AvatarImage src={photoUrl ?? undefined} alt={person.preferred_name} />
                <AvatarFallback className="text-2xl">
                  {getInitials(person.preferred_name)}
                </AvatarFallback>
              </Avatar>
              {canUserEdit && (
                <>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleQuickPhotoUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => photoInputRef.current?.click()}
                    className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Camera className="h-6 w-6 text-white" />
                  </button>
                </>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{person.preferred_name}</h1>
              {(person.given_names || person.family_name) && (
                <p className="text-muted-foreground">
                  {person.given_names} {person.family_name}
                </p>
              )}
              {person.alternate_names && person.alternate_names.length > 0 && (
                <div className="mt-1 flex gap-1">
                  {person.alternate_names.map((name, i) => (
                    <Badge key={i} variant="secondary">
                      {name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <VisibilityControl entityType="person" entityId={person.id} />
            {canUserEdit && (
              <Link href={`/people/${person.id}/edit`}>
                <Button variant="outline" size="sm">
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </Link>
            )}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Life details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Life Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Birth</p>
                <p>{birthDate !== 'Unknown' ? birthDate : '—'}</p>
                {person.birth_place && (
                  <p className="text-sm text-muted-foreground">{person.birth_place}</p>
                )}
              </div>
              {(deathDate !== 'Unknown' || person.death_place) && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Death</p>
                  <p>{deathDate !== 'Unknown' ? deathDate : '—'}</p>
                  {person.death_place && (
                    <p className="text-sm text-muted-foreground">{person.death_place}</p>
                  )}
                </div>
              )}
              {person.gender && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Gender</p>
                  <p>{person.gender}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Relationships */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Relationships</CardTitle>
              {canUserEdit && (
                <Link href={`/people/${person.id}/relationships/new`}>
                  <Button variant="ghost" size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </Link>
              )}
            </CardHeader>
            <CardContent>
              <RelationshipList
                relationships={relationships}
                currentPersonId={person.id}
              />
            </CardContent>
          </Card>
        </div>

        {/* Biography */}
        {person.bio && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Biography</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{person.bio}</p>
            </CardContent>
          </Card>
        )}

        {/* Photos & Documents */}
        <div className="mt-6">
          <PersonAttachments
            personId={person.id}
            personName={person.preferred_name}
            currentPhotoUrl={photoUrl}
            onPhotoChange={setPhotoUrl}
          />
        </div>

        {/* Metadata */}
        <div className="mt-6 text-xs text-muted-foreground">
          <p>
            Created {new Date(person.created_at).toLocaleDateString()} ·
            Last updated {new Date(person.updated_at).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  )
}
