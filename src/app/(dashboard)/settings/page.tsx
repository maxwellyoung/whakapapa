'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Users, FolderTree, Trash2, ChevronRight, Settings2, Palette } from 'lucide-react'
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
    <div className="p-4 sm:p-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your workspace and preferences
          </p>
        </div>

        <div className="space-y-6">
          {/* Workspace settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                  <Settings2 className="h-5 w-5 text-stone-500" />
                </div>
                <div>
                  <CardTitle>Workspace</CardTitle>
                  <CardDescription>General workspace settings</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Workspace name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!isAdmin}
                  placeholder="My Family Tree"
                />
              </div>
              <div className="space-y-2">
                <Label>Workspace ID</Label>
                <Input value={currentWorkspace.slug} disabled className="font-mono text-sm" />
                <p className="text-xs text-muted-foreground">
                  Used in invite links and URLs. Cannot be changed.
                </p>
              </div>
              {isAdmin && (
                <Button onClick={handleSave} disabled={saving || !name.trim()}>
                  {saving ? 'Saving...' : 'Save changes'}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Management links */}
          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle>Manage</CardTitle>
                <CardDescription>Access controls and team management</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/settings/members" className="block">
                  <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                        <Users className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <p className="font-medium">Members</p>
                        <p className="text-sm text-muted-foreground">Invite and manage team access</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </Link>
                <Link href="/settings/groups" className="block">
                  <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                        <FolderTree className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="font-medium">Groups</p>
                        <p className="text-sm text-muted-foreground">Control visibility with groups</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Danger zone */}
          {isOwner && (
            <Card className="border-red-200 dark:border-red-900/50">
              <CardHeader>
                <CardTitle className="text-red-600 dark:text-red-400">Danger Zone</CardTitle>
                <CardDescription>
                  Irreversible and destructive actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20">
                  <div>
                    <p className="font-medium text-red-900 dark:text-red-100">Delete workspace</p>
                    <p className="text-sm text-red-600 dark:text-red-400">
                      Permanently delete this workspace and all its data
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => setDeleteDialogOpen(true)}
                    className="w-full sm:w-auto"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
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
