'use client'

import { useEffect, useState } from 'react'
import { Check, X, User, Users, Calendar, HelpCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useWorkspace } from '@/components/providers/workspace-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { canEdit } from '@/lib/permissions'
import { getErrorToast } from '@/lib/errors'
import type { Source } from '@/types'

interface Suggestion {
  id: string
  workspace_id: string
  suggestion_type: string
  status: string
  entity_type: string | null
  entity_id: string | null
  proposed_data: Record<string, unknown>
  source_id: string | null
  extracted_from: string | null
  confidence: number | null
  ai_reasoning: string | null
  matched_person_id: string | null
  match_confidence: number | null
  created_at: string
  sources: Source | null
}

export default function SuggestionsPage() {
  const { currentWorkspace, userRole } = useWorkspace()
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  const canReview = userRole && canEdit(userRole)

  useEffect(() => {
    async function fetchSuggestions() {
      if (!currentWorkspace) return

      const supabase = createClient()
      const { data } = await supabase
        .from('suggestions')
        .select('*, sources(*)')
        .eq('workspace_id', currentWorkspace.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (data) {
        setSuggestions(data as Suggestion[])
      }
      setLoading(false)
    }

    if (currentWorkspace) {
      fetchSuggestions()
    }
  }, [currentWorkspace])

  const handleApprove = async (suggestion: Suggestion) => {
    if (!currentWorkspace) return

    setProcessing(suggestion.id)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    try {
      // Create the entity based on suggestion type
      if (suggestion.suggestion_type === 'create_person') {
        const proposed = suggestion.proposed_data as Record<string, string>
        const { error } = await supabase.from('people').insert({
          workspace_id: currentWorkspace.id,
          preferred_name: proposed.preferred_name,
          given_names: proposed.given_names,
          family_name: proposed.family_name,
          birth_date: proposed.birth_date,
          death_date: proposed.death_date,
          birth_place: proposed.birth_place,
          death_place: proposed.death_place,
        })

        if (error) throw error
      } else if (suggestion.suggestion_type === 'update_person' && suggestion.entity_id) {
        const proposed = suggestion.proposed_data as Record<string, string>
        const { error } = await supabase
          .from('people')
          .update({
            preferred_name: proposed.preferred_name,
            birth_date: proposed.birth_date || undefined,
            death_date: proposed.death_date || undefined,
            birth_place: proposed.birth_place || undefined,
            death_place: proposed.death_place || undefined,
          })
          .eq('id', suggestion.entity_id)

        if (error) throw error
      }

      // Mark suggestion as approved
      await supabase
        .from('suggestions')
        .update({
          status: 'approved',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', suggestion.id)

      const name = (suggestion.proposed_data as Record<string, string>).preferred_name || 'Person'
      setSuggestions((prev) => prev.filter((s) => s.id !== suggestion.id))
      toast.success(`${name} has been added to your family tree`)
    } catch (error) {
      console.error('Error approving:', error)
      toast.error(getErrorToast('approve_suggestion'))
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (suggestion: Suggestion) => {
    setProcessing(suggestion.id)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase
      .from('suggestions')
      .update({
        status: 'rejected',
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', suggestion.id)

    setProcessing(null)

    if (error) {
      toast.error(getErrorToast('reject_suggestion'))
      return
    }

    setSuggestions((prev) => prev.filter((s) => s.id !== suggestion.id))
    toast.success('Suggestion rejected')
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-200 border-t-stone-600 dark:border-stone-700 dark:border-t-stone-300" />
          <span className="text-sm text-stone-400 dark:text-stone-500">Loading...</span>
        </div>
      </div>
    )
  }

  if (!currentWorkspace) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-stone-400 dark:text-stone-500">Select a workspace</p>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
            Suggestions
          </h1>
          <p className="mt-1 text-stone-500 dark:text-stone-400">
            Review AI-extracted and user-proposed changes
          </p>
        </div>

        {suggestions.length === 0 ? (
          <div className="rounded-2xl border border-stone-200/60 bg-white p-8 text-center shadow-sm dark:border-stone-800/60 dark:bg-stone-900">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-stone-100 dark:bg-stone-800">
              <HelpCircle className="h-6 w-6 text-stone-400 dark:text-stone-500" />
            </div>
            <p className="text-stone-600 dark:text-stone-400 mb-4">
              No pending suggestions
            </p>
            <p className="text-sm text-stone-400 dark:text-stone-500">
              Use Quick Capture on the dashboard to extract family data from documents automatically.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {suggestions.map((suggestion) => {
              const proposed = suggestion.proposed_data as Record<string, string>
              const isProcessing = processing === suggestion.id

              return (
                <Card key={suggestion.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {suggestion.suggestion_type === 'create_person' ? (
                          <Badge variant="default">New Person</Badge>
                        ) : (
                          <Badge variant="secondary">Update</Badge>
                        )}
                        {suggestion.confidence && (
                          <Badge variant="outline">
                            {suggestion.confidence >= 0.8
                              ? 'High certainty'
                              : suggestion.confidence >= 0.5
                              ? 'Medium certainty'
                              : 'Low certainty'}
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(suggestion.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <CardTitle className="text-lg">
                      {proposed.preferred_name || 'Unknown'}
                    </CardTitle>
                    {suggestion.ai_reasoning && (
                      <CardDescription>{suggestion.ai_reasoning}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-3 text-sm">
                      {proposed.birth_date && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Born: {proposed.birth_date}</span>
                          {proposed.birth_place && (
                            <span className="text-muted-foreground">in {proposed.birth_place}</span>
                          )}
                        </div>
                      )}
                      {proposed.death_date && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Died: {proposed.death_date}</span>
                          {proposed.death_place && (
                            <span className="text-muted-foreground">in {proposed.death_place}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {suggestion.extracted_from && (
                      <div className="rounded-md bg-muted p-3">
                        <p className="text-xs text-muted-foreground mb-1">Extracted from:</p>
                        <p className="text-sm italic">&ldquo;{suggestion.extracted_from}&rdquo;</p>
                      </div>
                    )}

                    {suggestion.sources && (
                      <p className="text-xs text-muted-foreground">
                        Source: {suggestion.sources.title}
                      </p>
                    )}

                    {canReview && (
                      <>
                        <Separator />
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleApprove(suggestion)}
                            disabled={isProcessing}
                            className="flex-1"
                          >
                            <Check className="mr-2 h-4 w-4" />
                            {isProcessing ? 'Processing...' : 'Approve'}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleReject(suggestion)}
                            disabled={isProcessing}
                            className="flex-1"
                          >
                            <X className="mr-2 h-4 w-4" />
                            Reject
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
