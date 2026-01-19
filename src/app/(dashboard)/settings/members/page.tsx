'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Copy, Check, Trash2, ChevronLeft, Mail, Shield, UserCog } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useWorkspace } from '@/components/providers/workspace-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  getRoleLabel,
  getRoleDescription,
  canManageMembers,
  ASSIGNABLE_ROLES,
} from '@/lib/permissions'
import type { MembershipWithProfile, UserRole, Invite } from '@/types'

export default function MembersPage() {
  const { currentWorkspace, userRole } = useWorkspace()
  const [members, setMembers] = useState<MembershipWithProfile[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [inviteRole, setInviteRole] = useState<UserRole>('viewer')
  const [creating, setCreating] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const isAdmin = userRole && canManageMembers(userRole)

  useEffect(() => {
    async function fetchMembers() {
      if (!currentWorkspace) return

      const supabase = createClient()

      const { data: memberData } = await supabase
        .from('memberships')
        .select('*, profiles(*)')
        .eq('workspace_id', currentWorkspace.id)

      if (memberData) {
        setMembers(memberData as MembershipWithProfile[])
      }

      const { data: inviteData } = await supabase
        .from('invites')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .is('used_at', null)

      if (inviteData) {
        setInvites(inviteData)
      }

      setLoading(false)
    }

    if (currentWorkspace) {
      fetchMembers()
    }
  }, [currentWorkspace])

  const handleCreateInvite = async () => {
    if (!currentWorkspace) return

    setCreating(true)
    const supabase = createClient()

    // Generate random token
    const token = crypto.randomUUID()

    const { data, error } = await supabase
      .from('invites')
      .insert({
        workspace_id: currentWorkspace.id,
        token,
        role: inviteRole,
      })
      .select()
      .single()

    setCreating(false)

    if (error) {
      toast.error('Failed to create invite')
      return
    }

    setInvites((prev) => [...prev, data])
    setInviteDialogOpen(false)
    toast.success('Invite created')
  }

  const handleCopyInvite = async (token: string) => {
    const url = `${window.location.origin}/invite/${token}`
    await navigator.clipboard.writeText(url)
    setCopiedId(token)
    setTimeout(() => setCopiedId(null), 2000)
    toast.success('Copied to clipboard')
  }

  const handleDeleteInvite = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase.from('invites').delete().eq('id', id)

    if (error) {
      toast.error('Failed to delete invite')
      return
    }

    setInvites((prev) => prev.filter((i) => i.id !== id))
    toast.success('Invite deleted')
  }

  const handleRemoveMember = async (membershipId: string, memberId: string) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user?.id === memberId) {
      toast.error('Cannot remove yourself')
      return
    }

    const { error } = await supabase
      .from('memberships')
      .delete()
      .eq('id', membershipId)

    if (error) {
      toast.error('Failed to remove member')
      return
    }

    setMembers((prev) => prev.filter((m) => m.id !== membershipId))
    toast.success('Member removed')
  }

  const handleChangeRole = async (membershipId: string, memberId: string, newRole: UserRole) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user?.id === memberId) {
      toast.error('Cannot change your own role')
      return
    }

    const { error } = await supabase
      .from('memberships')
      .update({ role: newRole })
      .eq('id', membershipId)

    if (error) {
      toast.error('Failed to change role')
      return
    }

    setMembers((prev) =>
      prev.map((m) => (m.id === membershipId ? { ...m, role: newRole } : m))
    )
    toast.success(`Role changed to ${getRoleLabel(newRole)}`)
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
            <h1 className="text-2xl font-bold">Members</h1>
            <p className="text-muted-foreground">
              {members.length} {members.length === 1 ? 'member' : 'members'} in this workspace
            </p>
          </div>
          {isAdmin && (
            <Button onClick={() => setInviteDialogOpen(true)} className="w-full sm:w-auto">
              <Mail className="mr-2 h-4 w-4" />
              Invite member
            </Button>
          )}
        </div>

        {/* Pending invites */}
        {invites.length > 0 && isAdmin && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="h-5 w-5 text-amber-500" />
                Pending Invites
              </CardTitle>
              <CardDescription>
                Share these links with people you want to invite
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {invites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border bg-muted/30 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50">
                      <Mail className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <Badge variant="outline">{getRoleLabel(invite.role)}</Badge>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Created {new Date(invite.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 self-end sm:self-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyInvite(invite.token)}
                      className="gap-2"
                    >
                      {copiedId === invite.token ? (
                        <>
                          <Check className="h-4 w-4" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copy link
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteInvite(invite.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Members list */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-indigo-500" />
              Members
            </CardTitle>
            <CardDescription>
              People who have access to this workspace
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {members.map((member) => {
              const name = member.profiles?.full_name ?? 'Unknown'
              const initials = name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)

              return (
                <div
                  key={member.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gradient-to-br from-stone-100 to-stone-200 dark:from-stone-700 dark:to-stone-800 text-sm font-medium">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {isAdmin && member.role !== 'owner' ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="gap-2">
                            <UserCog className="h-4 w-4" />
                            {getRoleLabel(member.role)}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {ASSIGNABLE_ROLES.map((role) => (
                            <DropdownMenuItem
                              key={role}
                              onClick={() => handleChangeRole(member.id, member.user_id, role)}
                              className={member.role === role ? 'bg-muted' : ''}
                            >
                              <div>
                                <span className="font-medium">{getRoleLabel(role)}</span>
                                <p className="text-xs text-muted-foreground">
                                  {getRoleDescription(role)}
                                </p>
                              </div>
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleRemoveMember(member.id, member.user_id)}
                            className="text-red-600 dark:text-red-400"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove from workspace
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <Badge variant={member.role === 'owner' ? 'default' : 'secondary'}>
                        {getRoleLabel(member.role)}
                      </Badge>
                    )}
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite member</DialogTitle>
            <DialogDescription>
              Create an invite link to share with family members.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={inviteRole}
                onValueChange={(v) => setInviteRole(v as UserRole)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASSIGNABLE_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      <div>
                        <span className="font-medium">{getRoleLabel(role)}</span>
                        <p className="text-xs text-muted-foreground">
                          {getRoleDescription(role)}
                        </p>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateInvite} disabled={creating}>
              {creating ? 'Creating...' : 'Create invite'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
