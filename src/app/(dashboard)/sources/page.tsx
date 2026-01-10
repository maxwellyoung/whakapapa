'use client'

import { useEffect, useState } from 'react'
import { Plus, FileText, Image, Link as LinkIcon, Mic, Video, StickyNote } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useWorkspace } from '@/components/providers/workspace-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { AIIngest } from '@/components/sources/ai-ingest'
import type { Source, SourceType } from '@/types'

const SOURCE_ICONS: Record<SourceType, React.ComponentType<{ className?: string }>> = {
  document: FileText,
  photo: Image,
  url: LinkIcon,
  audio: Mic,
  video: Video,
  note: StickyNote,
}

export default function SourcesPage() {
  const { currentWorkspace } = useWorkspace()
  const [sources, setSources] = useState<Source[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  // Form state
  const [sourceType, setSourceType] = useState<SourceType>('note')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [url, setUrl] = useState('')
  const [content, setContent] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    async function fetchSources() {
      if (!currentWorkspace) return

      const supabase = createClient()
      const { data } = await supabase
        .from('sources')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .order('created_at', { ascending: false })

      if (data) {
        setSources(data)
      }
      setLoading(false)
    }

    if (currentWorkspace) {
      fetchSources()
    }
  }, [currentWorkspace])

  const handleCreate = async () => {
    if (!currentWorkspace || !title.trim()) return

    setCreating(true)
    const supabase = createClient()

    const { data, error } = await supabase
      .from('sources')
      .insert({
        workspace_id: currentWorkspace.id,
        source_type: sourceType,
        title: title.trim(),
        description: description.trim() || null,
        url: sourceType === 'url' ? url.trim() : null,
        content: sourceType === 'note' ? content.trim() : null,
      })
      .select()
      .single()

    setCreating(false)

    if (error) {
      toast.error('Failed to create source')
      return
    }

    setSources((prev) => [data, ...prev])
    setDialogOpen(false)
    setTitle('')
    setDescription('')
    setUrl('')
    setContent('')
    toast.success('Source created')
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!currentWorkspace) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Select a workspace</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sources</h1>
          <p className="text-muted-foreground">Documents, photos, and citations</p>
        </div>
        <div className="flex gap-2">
          <AIIngest />
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add source
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add source</DialogTitle>
              <DialogDescription>
                Add a document, photo, URL, or note as a source.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={sourceType}
                  onValueChange={(v) => setSourceType(v as SourceType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="note">Note</SelectItem>
                    <SelectItem value="url">URL</SelectItem>
                    <SelectItem value="document">Document</SelectItem>
                    <SelectItem value="photo">Photo</SelectItem>
                    <SelectItem value="audio">Audio</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Source title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description"
                />
              </div>
              {sourceType === 'url' && (
                <div className="space-y-2">
                  <Label htmlFor="url">URL</Label>
                  <Input
                    id="url"
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              )}
              {sourceType === 'note' && (
                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Note content..."
                    rows={4}
                  />
                </div>
              )}
              {['document', 'photo', 'audio', 'video'].includes(sourceType) && (
                <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                  File upload coming soon. For now, add as URL or note.
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={creating || !title.trim()}>
                {creating ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      {sources.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground mb-4">No sources yet</p>
          <Button onClick={() => setDialogOpen(true)}>Add the first source</Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sources.map((source) => {
            const Icon = SOURCE_ICONS[source.source_type]
            return (
              <Card key={source.id}>
                <CardHeader className="flex flex-row items-center gap-3 pb-2">
                  <div className="rounded-md bg-muted p-2">
                    <Icon className="h-4 w-4" />
                  </div>
                  <CardTitle className="text-base">{source.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  {source.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {source.description}
                    </p>
                  )}
                  {source.url && (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {source.url}
                    </a>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    {new Date(source.created_at).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
