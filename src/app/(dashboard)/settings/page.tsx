'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Users, FolderTree, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useWorkspace } from '@/components/providers/workspace-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { createClient } from '@/lib/supabase/client'
import { canManageMembers, canDelete } from '@/lib/permissions'
import { toast } from 'sonner'

export default function SettingsPage() {
  const router = useRouter()
  const { currentWorkspace, userRole, refresh } = useWorkspace()
  const [name, setName] = useState(currentWorkspace?.name ?? '')
  const [saving, setSaving] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)

  const isAdmin = userRole && canManageMembers(userRole)
  const isOwner = userRole === 'owner'

  const handleSave = async () => {
    if (!currentWorkspace || !name.trim()) return

    setSaving(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('workspaces')
      .update({ name: name.trim() })
      .eq('id', currentWorkspace.id)

    setSaving(false)

    if (error) {
      toast.error('Failed to update workspace')
      return
    }

    await refresh()
    toast.success('Workspace updated')
  }

  const handleDelete = async () => {
    if (!currentWorkspace || deleteConfirm !== currentWorkspace.name) return

    setDeleting(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('workspaces')
      .delete()
      .eq('id', currentWorkspace.id)

    setDeleting(false)

    if (error) {
      toast.error('Failed to delete workspace')
      return
    }

    await refresh()
    setDeleteDialogOpen(false)
    router.push('/')
    toast.success('Workspace deleted')
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
        <h1 className="mb-6 text-2xl font-bold">Settings</h1>

        <div className="space-y-6">
          {/* Workspace settings */}
          <Card>
            <CardHeader>
              <CardTitle>Workspace</CardTitle>
              <CardDescription>Manage your workspace settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!isAdmin}
                />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input value={currentWorkspace.slug} disabled />
                <p className="text-xs text-muted-foreground">
                  Used in invite links. Cannot be changed.
                </p>
              </div>
              {isAdmin && (
                <Button onClick={handleSave} disabled={saving || !name.trim()}>
                  {saving ? 'Saving...' : 'Save changes'}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Quick links */}
          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle>Manage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/settings/members">
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="mr-2 h-4 w-4" />
                    Members
                  </Button>
                </Link>
                <Link href="/settings/groups">
                  <Button variant="outline" className="w-full justify-start">
                    <FolderTree className="mr-2 h-4 w-4" />
                    Groups
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Danger zone */}
          {isOwner && (
            <Card className="border-red-200 dark:border-red-900">
              <CardHeader>
                <CardTitle className="text-red-600">Danger Zone</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete workspace
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete workspace</DialogTitle>
            <DialogDescription>
              This action cannot be undone. All data in this workspace will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm">
              Type <strong>{currentWorkspace.name}</strong> to confirm:
            </p>
            <Input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder={currentWorkspace.name}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting || deleteConfirm !== currentWorkspace.name}
            >
              {deleting ? 'Deleting...' : 'Delete workspace'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
