'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useWorkspace } from '@/components/providers/workspace-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { canManageMembers } from '@/lib/permissions'
import type { Group } from '@/types'

export default function GroupsPage() {
  const { currentWorkspace, userRole } = useWorkspace()
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [creating, setCreating] = useState(false)

  const isAdmin = userRole && canManageMembers(userRole)

  useEffect(() => {
    async function fetchGroups() {
      if (!currentWorkspace) return

      const supabase = createClient()
      const { data } = await supabase
        .from('groups')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .order('name')

      if (data) {
        setGroups(data)
      }
      setLoading(false)
    }

    if (currentWorkspace) {
      fetchGroups()
    }
  }, [currentWorkspace])

  const handleCreate = async () => {
    if (!currentWorkspace || !name.trim()) return

    setCreating(true)
    const supabase = createClient()

    const { data, error } = await supabase
      .from('groups')
      .insert({
        workspace_id: currentWorkspace.id,
        name: name.trim(),
        description: description.trim() || null,
      })
      .select()
      .single()

    setCreating(false)

    if (error) {
      toast.error('Failed to create group')
      return
    }

    setGroups((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
    setDialogOpen(false)
    setName('')
    setDescription('')
    toast.success('Group created')
  }

  const handleDelete = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase.from('groups').delete().eq('id', id)

    if (error) {
      toast.error('Failed to delete group')
      return
    }

    setGroups((prev) => prev.filter((g) => g.id !== id))
    toast.success('Group deleted')
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
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Groups</h1>
            <p className="text-muted-foreground">
              Organize members into groups for privacy controls
            </p>
          </div>
          {isAdmin && (
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add group
            </Button>
          )}
        </div>

        {groups.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground mb-4">
                No groups yet. Create groups like &quot;Dad&apos;s side&quot; or &quot;Mum&apos;s side&quot;
                to control who can see sensitive information.
              </p>
              {isAdmin && (
                <Button onClick={() => setDialogOpen(true)}>Create first group</Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => (
              <Card key={group.id}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{group.name}</CardTitle>
                    {group.description && (
                      <CardDescription>{group.description}</CardDescription>
                    )}
                  </div>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(group.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create group</DialogTitle>
            <DialogDescription>
              Groups help you control who can see sensitive information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="e.g., Dad's side"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="What is this group for?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={creating || !name.trim()}>
              {creating ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
