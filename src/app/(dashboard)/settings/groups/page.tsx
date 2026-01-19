'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Trash2, ChevronLeft, Users, Lock, Info, UserPlus, X, ChevronDown, ChevronUp } from 'lucide-react'
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { canManageMembers } from '@/lib/permissions'
import type { Group, MembershipWithProfile } from '@/types'

interface GroupWithMembers extends Group {
  members: MembershipWithProfile[]
}

export default function GroupsPage() {
  const { currentWorkspace, userRole } = useWorkspace()
  const [groups, setGroups] = useState<Group[]>([])
  const [members, setMembers] = useState<MembershipWithProfile[]>([])
  const [groupMembers, setGroupMembers] = useState<Record<string, string[]>>({}) // group_id -> user_ids
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false)
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const isAdmin = userRole && canManageMembers(userRole)

  const toggleGroupExpanded = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(groupId)) {
        next.delete(groupId)
      } else {
        next.add(groupId)
      }
      return next
    })
  }

  const getGroupMembers = (groupId: string) => {
    const memberIds = groupMembers[groupId] || []
    return members.filter(m => memberIds.includes(m.user_id))
  }

  const getNonGroupMembers = (groupId: string) => {
    const memberIds = groupMembers[groupId] || []
    return members.filter(m => !memberIds.includes(m.user_id))
  }

  useEffect(() => {
    async function fetchData() {
      if (!currentWorkspace) return

      const supabase = createClient()

      // Fetch groups, members, and group_members in parallel
      const [{ data: groupsData }, { data: membersData }, { data: groupMembersData }] = await Promise.all([
        supabase
          .from('groups')
          .select('*')
          .eq('workspace_id', currentWorkspace.id)
          .order('name'),
        supabase
          .from('memberships')
          .select('*, profiles(*)')
          .eq('workspace_id', currentWorkspace.id),
        supabase
          .from('group_members')
          .select('*')
      ])

      if (groupsData) {
        setGroups(groupsData)
      }
      if (membersData) {
        setMembers(membersData as MembershipWithProfile[])
      }
      if (groupMembersData) {
        // Build group_id -> user_ids map
        const map: Record<string, string[]> = {}
        groupMembersData.forEach((gm: { group_id: string; user_id: string }) => {
          if (!map[gm.group_id]) map[gm.group_id] = []
          map[gm.group_id].push(gm.user_id)
        })
        setGroupMembers(map)
      }
      setLoading(false)
    }

    if (currentWorkspace) {
      fetchData()
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

  const handleAddMember = async (userId: string) => {
    if (!selectedGroup) return

    const supabase = createClient()
    const { error } = await supabase
      .from('group_members')
      .insert({ group_id: selectedGroup.id, user_id: userId })

    if (error) {
      toast.error('Failed to add member')
      return
    }

    setGroupMembers(prev => ({
      ...prev,
      [selectedGroup.id]: [...(prev[selectedGroup.id] || []), userId]
    }))
    toast.success('Member added to group')
  }

  const handleRemoveMember = async (groupId: string, userId: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId)

    if (error) {
      toast.error('Failed to remove member')
      return
    }

    setGroupMembers(prev => ({
      ...prev,
      [groupId]: (prev[groupId] || []).filter(id => id !== userId)
    }))
    toast.success('Member removed from group')
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
            {groups.map((group) => {
              const isExpanded = expandedGroups.has(group.id)
              const groupMemberList = getGroupMembers(group.id)

              return (
                <Card key={group.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                          <Lock className="h-5 w-5 text-stone-500" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">{group.name}</CardTitle>
                            <Badge variant="secondary" className="text-xs">
                              {groupMemberList.length} {groupMemberList.length === 1 ? 'member' : 'members'}
                            </Badge>
                          </div>
                          {group.description && (
                            <CardDescription className="mt-1">{group.description}</CardDescription>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleGroupExpanded(group.id)}
                          className="gap-1"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="h-4 w-4" />
                              Hide
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4" />
                              Manage
                            </>
                          )}
                        </Button>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => confirmDelete(group)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  {isExpanded && (
                    <CardContent className="pt-2 border-t border-stone-100 dark:border-stone-800">
                      {/* Current members */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-stone-700 dark:text-stone-300">Members</h4>
                          {isAdmin && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedGroup(group)
                                setAddMemberDialogOpen(true)
                              }}
                              className="gap-1"
                            >
                              <UserPlus className="h-4 w-4" />
                              Add
                            </Button>
                          )}
                        </div>

                        {groupMemberList.length === 0 ? (
                          <p className="text-sm text-muted-foreground py-4 text-center">
                            No members yet. Add members to control who can see restricted content.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {groupMemberList.map((member) => {
                              const name = member.profiles?.full_name ?? 'Unknown'
                              const initials = name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .toUpperCase()
                                .slice(0, 2)

                              return (
                                <div
                                  key={member.user_id}
                                  className="flex items-center justify-between p-2 rounded-lg bg-stone-50 dark:bg-stone-800/50"
                                >
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8">
                                      <AvatarFallback className="text-xs bg-stone-200 dark:bg-stone-700">
                                        {initials}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm font-medium">{name}</span>
                                  </div>
                                  {isAdmin && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRemoveMember(group.id, member.user_id)}
                                      className="h-7 w-7 p-0 text-stone-400 hover:text-red-600"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>
              )
            })}
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

      {/* Add member dialog */}
      <Dialog open={addMemberDialogOpen} onOpenChange={setAddMemberDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add member to {selectedGroup?.name}</DialogTitle>
            <DialogDescription>
              Select workspace members to add to this group.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 max-h-64 overflow-auto">
            {selectedGroup && getNonGroupMembers(selectedGroup.id).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                All workspace members are already in this group.
              </p>
            ) : (
              <div className="space-y-2">
                {selectedGroup && getNonGroupMembers(selectedGroup.id).map((member) => {
                  const name = member.profiles?.full_name ?? 'Unknown'
                  const initials = name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)

                  return (
                    <div
                      key={member.user_id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="text-sm bg-stone-200 dark:bg-stone-700">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{name}</span>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddMember(member.user_id)}
                      >
                        Add
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddMemberDialogOpen(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
