'use client'

import { useEffect, useState } from 'react'
import { Plus, FileText, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useWorkspace } from '@/components/providers/workspace-provider'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import type { Citation, Source } from '@/types'

interface CitationManagerProps {
  entityType: 'person' | 'event' | 'relationship'
  entityId: string
  field?: string
  compact?: boolean
}

interface CitationWithSource extends Citation {
  sources: Source
}

const CONFIDENCE_LEVELS = [
  { value: 'primary', label: 'Primary', description: 'Direct source (birth cert, etc.)' },
  { value: 'secondary', label: 'Secondary', description: 'Derived from primary sources' },
  { value: 'speculative', label: 'Speculative', description: 'Family lore, unverified' },
]

export function CitationManager({ entityType, entityId, field, compact = false }: CitationManagerProps) {
  const { currentWorkspace } = useWorkspace()
  const [citations, setCitations] = useState<CitationWithSource[]>([])
  const [sources, setSources] = useState<Source[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  // Form state
  const [selectedSourceId, setSelectedSourceId] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [pageNumber, setPageNumber] = useState('')
  const [confidence, setConfidence] = useState('secondary')
  const [notes, setNotes] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    async function fetchData() {
      if (!currentWorkspace) return

      const supabase = createClient()

      const [{ data: citationData }, { data: sourceData }] = await Promise.all([
        supabase
          .from('citations')
          .select('*, sources(*)')
          .eq('entity_type', entityType)
          .eq('entity_id', entityId),
        supabase
          .from('sources')
          .select('*')
          .eq('workspace_id', currentWorkspace.id)
          .order('title'),
      ])

      if (citationData) setCitations(citationData as CitationWithSource[])
      if (sourceData) setSources(sourceData)
      setLoading(false)
    }

    fetchData()
  }, [entityType, entityId, currentWorkspace])

  const handleCreate = async () => {
    if (!selectedSourceId) return

    setCreating(true)
    const supabase = createClient()

    const { data, error } = await supabase
      .from('citations')
      .insert({
        source_id: selectedSourceId,
        entity_type: entityType,
        entity_id: entityId,
        field: field || null,
        excerpt: excerpt.trim() || null,
        page_number: pageNumber.trim() || null,
        confidence,
        notes: notes.trim() || null,
      })
      .select('*, sources(*)')
      .single()

    setCreating(false)

    if (error) {
      toast.error('Failed to add citation')
      return
    }

    setCitations((prev) => [...prev, data as CitationWithSource])
    setDialogOpen(false)
    resetForm()
    toast.success('Citation added')
  }

  const handleDelete = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase.from('citations').delete().eq('id', id)

    if (error) {
      toast.error('Failed to remove citation')
      return
    }

    setCitations((prev) => prev.filter((c) => c.id !== id))
    toast.success('Citation removed')
  }

  const resetForm = () => {
    setSelectedSourceId('')
    setExcerpt('')
    setPageNumber('')
    setConfidence('secondary')
    setNotes('')
  }

  if (loading) {
    return <p className="text-xs text-muted-foreground">Loading citations...</p>
  }

  const fieldCitations = field
    ? citations.filter((c) => c.field === field || c.field === null)
    : citations

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {fieldCitations.length > 0 && (
          <Badge variant="outline" className="text-xs">
            <FileText className="mr-1 h-3 w-3" />
            {fieldCitations.length} source{fieldCitations.length !== 1 ? 's' : ''}
          </Badge>
        )}
        <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => setDialogOpen(true)}>
          <Plus className="h-3 w-3" />
        </Button>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Citation</DialogTitle>
              <DialogDescription>
                Link a source to support this information.
              </DialogDescription>
            </DialogHeader>
            <CitationForm
              sources={sources}
              selectedSourceId={selectedSourceId}
              setSelectedSourceId={setSelectedSourceId}
              excerpt={excerpt}
              setExcerpt={setExcerpt}
              pageNumber={pageNumber}
              setPageNumber={setPageNumber}
              confidence={confidence}
              setConfidence={setConfidence}
              notes={notes}
              setNotes={setNotes}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={creating || !selectedSourceId}>
                {creating ? 'Adding...' : 'Add Citation'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Sources & Citations</h4>
        <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="mr-1 h-3 w-3" />
          Add
        </Button>
      </div>

      {fieldCitations.length === 0 ? (
        <p className="text-sm text-muted-foreground">No citations yet</p>
      ) : (
        <div className="space-y-2">
          {fieldCitations.map((citation) => (
            <div key={citation.id} className="flex items-start gap-2 rounded-md border p-2">
              <FileText className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{citation.sources.title}</p>
                {citation.excerpt && (
                  <p className="text-xs text-muted-foreground line-clamp-2">&ldquo;{citation.excerpt}&rdquo;</p>
                )}
                <div className="flex gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {citation.confidence}
                  </Badge>
                  {citation.page_number && (
                    <span className="text-xs text-muted-foreground">p. {citation.page_number}</span>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDelete(citation.id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Citation</DialogTitle>
            <DialogDescription>
              Link a source to support this information.
            </DialogDescription>
          </DialogHeader>
          <CitationForm
            sources={sources}
            selectedSourceId={selectedSourceId}
            setSelectedSourceId={setSelectedSourceId}
            excerpt={excerpt}
            setExcerpt={setExcerpt}
            pageNumber={pageNumber}
            setPageNumber={setPageNumber}
            confidence={confidence}
            setConfidence={setConfidence}
            notes={notes}
            setNotes={setNotes}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={creating || !selectedSourceId}>
              {creating ? 'Adding...' : 'Add Citation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function CitationForm({
  sources,
  selectedSourceId,
  setSelectedSourceId,
  excerpt,
  setExcerpt,
  pageNumber,
  setPageNumber,
  confidence,
  setConfidence,
  notes,
  setNotes,
}: {
  sources: Source[]
  selectedSourceId: string
  setSelectedSourceId: (v: string) => void
  excerpt: string
  setExcerpt: (v: string) => void
  pageNumber: string
  setPageNumber: (v: string) => void
  confidence: string
  setConfidence: (v: string) => void
  notes: string
  setNotes: (v: string) => void
}) {
  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label>Source *</Label>
        <Select value={selectedSourceId} onValueChange={setSelectedSourceId}>
          <SelectTrigger>
            <SelectValue placeholder="Select a source" />
          </SelectTrigger>
          <SelectContent>
            {sources.length === 0 ? (
              <p className="p-2 text-sm text-muted-foreground">No sources yet. Add one first.</p>
            ) : (
              sources.map((source) => (
                <SelectItem key={source.id} value={source.id}>
                  {source.title}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Confidence Level</Label>
        <Select value={confidence} onValueChange={setConfidence}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CONFIDENCE_LEVELS.map((level) => (
              <SelectItem key={level.value} value={level.value}>
                <div>
                  <span className="font-medium">{level.label}</span>
                  <p className="text-xs text-muted-foreground">{level.description}</p>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Excerpt</Label>
        <Textarea
          placeholder="Relevant quote or section from the source..."
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          rows={2}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Page Number</Label>
          <Input
            placeholder="e.g., 42"
            value={pageNumber}
            onChange={(e) => setPageNumber(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea
          placeholder="Additional context..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
        />
      </div>
    </div>
  )
}
