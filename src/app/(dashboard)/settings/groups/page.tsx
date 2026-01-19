'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Trash2, ChevronLeft, Users, Lock, Info } from 'lucide-react'
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState(false)

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

  const confirmDelete = (group: Group) => {
    setGroupToDelete(group)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!groupToDelete) return

    setDeleting(true)
    const supabase = createClient()
    const { error } = await supabase.from('groups').delete().eq('id', groupToDelete.id)

    setDeleting(false)

    if (error) {
      toast.error('Failed to delete group')
      return
    }

    setGroups((prev) => prev.filter((g) => g.id !== groupToDelete.id))
    setDeleteDialogOpen(false)
    setGroupToDelete(null)
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
    <div className="p-4 sm:p-8">
      <div className="mx-auto max-w-2xl">
        {/* Back navigation */}
        <Link
          href="/settings"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Settings
        </Link>

        <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div>
            <h1 className="text-2xl font-bold">Groups</h1>
            <p className="text-muted-foreground">
              Control who can see sensitive information
            </p>
          </div>
          {isAdmin && (
            <Button onClick={() => setDialogOpen(true)} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Create group
            </Button>
          )}
        </div>

        {/* Explanation card */}
        <Card className="mb-6 bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                  <Info className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium text-indigo-900 dark:text-indigo-100">What are groups?</h3>
                <p className="text-sm text-indigo-700 dark:text-indigo-300">
                  Groups let you control who can see certain people or information in your family tree.
                  For example, create groups like &quot;Dad&apos;s side&quot; or &quot;Close family&quot; to share
                  sensitive details only with specific family members.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {groups.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                <Users className="h-6 w-6 text-stone-400" />
              </div>
              <h3 className="font-medium text-stone-900 dark:text-stone-100 mb-2">
                No groups yet
              </h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                Create your first group to start organizing who can see what in your family tree.
              </p>
              {isAdmin && (
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create first group
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {groups.map((group) => (
              <Card key={group.id} className="overflow-hidden">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between pb-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                      <Lock className="h-5 w-5 text-stone-500" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{group.name}</CardTitle>
                      {group.description && (
                        <CardDescription className="mt-1">{group.description}</CardDescription>
                      )}
                    </div>
                  </div>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => confirmDelete(group)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  )}
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create group dialog */}
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

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete group?</DialogTitle>
            <DialogDescription>
              This will remove the &quot;{groupToDelete?.name}&quot; group. Any visibility settings using
              this group will need to be updated.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete group'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
