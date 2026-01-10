'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useWorkspace } from '@/components/providers/workspace-provider'
import { PersonForm } from '@/components/people/person-form'
import { canEdit } from '@/lib/permissions'
import type { Person, PersonFormData } from '@/types'

export default function EditPersonPage() {
  const params = useParams()
  const router = useRouter()
  const personId = params.id as string
  const { currentWorkspace, userRole } = useWorkspace()

  const [person, setPerson] = useState<Person | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPerson() {
      if (!currentWorkspace) return

      const supabase = createClient()
      const { data } = await supabase
        .from('people')
        .select('*')
        .eq('id', personId)
        .eq('workspace_id', currentWorkspace.id)
        .single()

      if (data) {
        setPerson(data)
      }
      setLoading(false)
    }

    fetchPerson()
  }, [personId, currentWorkspace])

  const handleSubmit = async (data: PersonFormData) => {
    if (!currentWorkspace || !person) return

    const supabase = createClient()
    const { error } = await supabase
      .from('people')
      .update({
        preferred_name: data.preferred_name,
        given_names: data.given_names || null,
        family_name: data.family_name || null,
        alternate_names: data.alternate_names || [],
        birth_date: data.birth_date || null,
        birth_date_precision: data.birth_date_precision || 'unknown',
        birth_date_end: data.birth_date_end || null,
        birth_place: data.birth_place || null,
        death_date: data.death_date || null,
        death_date_precision: data.death_date_precision || 'unknown',
        death_date_end: data.death_date_end || null,
        death_place: data.death_place || null,
        gender: data.gender || null,
        bio: data.bio || null,
      })
      .eq('id', personId)

    if (error) {
      toast.error('Failed to update person')
      return
    }

    toast.success('Person updated')
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

  if (!userRole || !canEdit(userRole)) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">You don&apos;t have permission to edit</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl p-8">
      <h1 className="mb-6 text-2xl font-bold">Edit {person.preferred_name}</h1>
      <PersonForm initialData={person} onSubmit={handleSubmit} />
    </div>
  )
}
