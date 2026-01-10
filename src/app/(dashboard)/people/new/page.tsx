'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useWorkspace } from '@/components/providers/workspace-provider'
import { PersonForm } from '@/components/people/person-form'
import type { PersonFormData } from '@/types'

export default function NewPersonPage() {
  const router = useRouter()
  const { currentWorkspace } = useWorkspace()

  const handleSubmit = async (data: PersonFormData) => {
    if (!currentWorkspace) return

    const supabase = createClient()
    const { data: person, error } = await supabase
      .from('people')
      .insert({
        workspace_id: currentWorkspace.id,
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
      .select()
      .single()

    if (error) {
      toast.error('Failed to create person')
      return
    }

    toast.success('Person created')
    router.push(`/people/${person.id}`)
  }

  if (!currentWorkspace) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Select a workspace first</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl p-8">
      <h1 className="mb-6 text-2xl font-bold">Add person</h1>
      <PersonForm onSubmit={handleSubmit} />
    </div>
  )
}
