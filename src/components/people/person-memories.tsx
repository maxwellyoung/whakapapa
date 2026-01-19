'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen,
  Quote,
  Heart,
  Utensils,
  Sparkles,
  Plus,
  Mic,
  Play,
  Pause,
  User,
  Calendar,
  MoreHorizontal,
  Pencil,
  Trash2,
  Share2,
  Link,
  Check,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useWorkspace } from '@/components/providers/workspace-provider'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { canEdit } from '@/lib/permissions'
import { toast } from 'sonner'
import type { Memory, MemoryType, Person } from '@/types'

interface PersonMemoriesProps {
  person: Person
}

const memoryTypeConfig: Record<MemoryType, { icon: React.ComponentType<{ className?: string }>; label: string; color: string }> = {
  story: { icon: BookOpen, label: 'Story', color: 'bg-blue-500' },
  anecdote: { icon: Sparkles, label: 'Anecdote', color: 'bg-purple-500' },
  quote: { icon: Quote, label: 'Quote', color: 'bg-amber-500' },
  trait: { icon: Heart, label: 'Personality', color: 'bg-pink-500' },
  recipe: { icon: Utensils, label: 'Recipe', color: 'bg-green-500' },
  tradition: { icon: Calendar, label: 'Tradition', color: 'bg-indigo-500' },
}

export function PersonMemories({ person }: PersonMemoriesProps) {
  const { currentWorkspace, userRole } = useWorkspace()
  const [memories, setMemories] = useState<Memory[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state
  const [memoryType, setMemoryType] = useState<MemoryType>('story')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [contributedBy, setContributedBy] = useState('')

  const canUserEdit = userRole && canEdit(userRole)

  useEffect(() => {
    async function fetchMemories() {
      if (!currentWorkspace) return

      const supabase = createClient()
      const { data } = await supabase
        .from('memories')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .eq('person_id', person.id)
        .order('created_at', { ascending: false })

      if (data) {
        setMemories(data as Memory[])
      }
      setLoading(false)
    }

    fetchMemories()
  }, [currentWorkspace, person.id])

  const handleSubmit = async () => {
    if (!currentWorkspace || !content.trim()) return

    setSaving(true)
    const supabase = createClient()

    const { data, error } = await supabase
      .from('memories')
      .insert({
        workspace_id: currentWorkspace.id,
        person_id: person.id,
        memory_type: memoryType,
        title: title.trim() || null,
        content: content.trim(),
        contributed_by_name: contributedBy.trim() || null,
      })
      .select()
      .single()

    setSaving(false)

    if (error) {
      toast.error('Failed to save memory')
      return
    }

    setMemories([data as Memory, ...memories])
    setDialogOpen(false)
    setTitle('')
    setContent('')
    setContributedBy('')
    toast.success('Memory added')
  }

  const handleDelete = async (memoryId: string) => {
    const supabase = createClient()
    const { error } = await supabase.from('memories').delete().eq('id', memoryId)

    if (error) {
      toast.error('Failed to delete memory')
      return
    }

    setMemories(memories.filter((m) => m.id !== memoryId))
    toast.success('Memory removed')
  }

  const handleShare = async (memoryId: string) => {
    if (!currentWorkspace) return

    const supabase = createClient()

    // Create a shareable link
    const { data, error } = await supabase
      .from('shareable_links')
      .insert({
        workspace_id: currentWorkspace.id,
        entity_type: 'memory',
        entity_id: memoryId,
      })
      .select('token')
      .single()

    if (error) {
      toast.error('Failed to create share link')
      return
    }

    // Copy link to clipboard
    const shareUrl = `${window.location.origin}/share/${data.token}`
    await navigator.clipboard.writeText(shareUrl)
    toast.success('Share link copied to clipboard!')
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="animate-pulse rounded-xl border border-stone-200 dark:border-stone-700 p-4">
            <div className="h-4 w-1/4 bg-stone-200 dark:bg-stone-700 rounded mb-3" />
            <div className="h-3 w-full bg-stone-100 dark:bg-stone-800 rounded mb-2" />
            <div className="h-3 w-3/4 bg-stone-100 dark:bg-stone-800 rounded" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      {/* Header with add button */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-stone-900 dark:text-stone-100">Stories & Memories</h3>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Preserve the stories that made {person.preferred_name} who they were
          </p>
        </div>
        {canUserEdit && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1.5" />
                Add Memory
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Add a Memory</DialogTitle>
                <DialogDescription>
                  Share a story, quote, or something special about {person.preferred_name}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Type of Memory</Label>
                  <Select value={memoryType} onValueChange={(v) => setMemoryType(v as MemoryType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(memoryTypeConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <config.icon className="h-4 w-4" />
                            {config.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Title (optional)</Label>
                  <Input
                    id="title"
                    placeholder={memoryType === 'quote' ? '"Always said..."' : 'Give this memory a title'}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">
                    {memoryType === 'quote' ? 'The Quote' : memoryType === 'recipe' ? 'The Recipe' : 'The Story'}
                  </Label>
                  <Textarea
                    id="content"
                    placeholder={
                      memoryType === 'quote'
                        ? 'What did they always say?'
                        : memoryType === 'recipe'
                        ? 'Ingredients and instructions...'
                        : memoryType === 'trait'
                        ? 'What made them special...'
                        : 'Tell the story...'
                    }
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contributed">Who shared this?</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                    <Input
                      id="contributed"
                      placeholder="e.g., Aunt Mary, Dad"
                      value={contributedBy}
                      onChange={(e) => setContributedBy(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} disabled={saving || !content.trim()} className="flex-1">
                    {saving ? 'Saving...' : 'Save Memory'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Empty state */}
      {memories.length === 0 ? (
        <div className="text-center py-12 rounded-xl border border-dashed border-stone-200 dark:border-stone-700">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-stone-100 dark:bg-stone-800">
            <BookOpen className="h-6 w-6 text-stone-400" />
          </div>
          <p className="text-stone-600 dark:text-stone-400 mb-2">No memories yet</p>
          <p className="text-sm text-stone-400 dark:text-stone-500 max-w-sm mx-auto">
            Add stories, quotes, recipes, or personality traits that capture who {person.preferred_name} was.
          </p>
          {canUserEdit && (
            <Button variant="outline" size="sm" className="mt-4" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              Add the first memory
            </Button>
          )}
        </div>
      ) : (
        <AnimatePresence>
          <div className="space-y-4">
            {memories.map((memory, index) => {
              const config = memoryTypeConfig[memory.memory_type as MemoryType] || memoryTypeConfig.story
              const Icon = config.icon

              return (
                <motion.div
                  key={memory.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative rounded-xl border border-stone-200 dark:border-stone-700 p-4 hover:shadow-md transition-shadow bg-white dark:bg-stone-800/50"
                >
                  {/* Type badge */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${config.color}`}>
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
                          {config.label}
                        </span>
                        {memory.title && (
                          <h4 className="font-medium text-stone-900 dark:text-stone-100">{memory.title}</h4>
                        )}
                      </div>
                    </div>

                    {canUserEdit && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label="Memory options"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleShare(memory.id)}>
                            <Share2 className="h-4 w-4 mr-2" />
                            Share
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(memory.id)} className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>

                  {/* Content */}
                  <div className={memory.memory_type === 'quote' ? 'pl-4 border-l-2 border-amber-400' : ''}>
                    <p className={`text-stone-700 dark:text-stone-300 whitespace-pre-wrap ${
                      memory.memory_type === 'quote' ? 'italic' : ''
                    }`}>
                      {memory.memory_type === 'quote' && '"'}
                      {memory.content}
                      {memory.memory_type === 'quote' && '"'}
                    </p>
                  </div>

                  {/* Attribution */}
                  {memory.contributed_by_name && (
                    <p className="mt-3 text-sm text-stone-400 dark:text-stone-500">
                      — Shared by {memory.contributed_by_name}
                    </p>
                  )}
                </motion.div>
              )
            })}
          </div>
        </AnimatePresence>
      )}
    </div>
  )
}
