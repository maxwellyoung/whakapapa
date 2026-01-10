'use client'

import { useEffect, useState } from 'react'
import { Eye, EyeOff, Users, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useWorkspace } from '@/components/providers/workspace-provider'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { canEdit } from '@/lib/permissions'
import type { VisibilityLevel, Group, MembershipWithProfile } from '@/types'

interface VisibilityControlProps {
  entityType: 'person' | 'event' | 'relationship' | 'source'
  entityId: string
}

interface EntityVisibility {
  visibility: VisibilityLevel
  group_ids: string[]
  user_ids: string[]
}

export function VisibilityControl({ entityType, entityId }: VisibilityControlProps) {
  const { currentWorkspace, userRole } = useWorkspace()
  const [visibility, setVisibility] = useState<EntityVisibility | null>(null)
  const [groups, setGroups] = useState<Group[]>([])
  const [members, setMembers] = useState<MembershipWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state
  const [selectedLevel, setSelectedLevel] = useState<VisibilityLevel>('public')
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])

  const canModify = userRole && canEdit(userRole)

  useEffect(() => {
    async function fetchData() {
      if (!currentWorkspace) return

      const supabase = createClient()

      const [{ data: visData }, { data: groupData }, { data: memberData }] = await Promise.all([
        supabase
          .from('entity_visibility')
          .select('*')
          .eq('entity_type', entityType)
          .eq('entity_id', entityId)
          .single(),
        supabase.from('groups').select('*').eq('workspace_id', currentWorkspace.id),
        supabase.from('memberships').select('*, profiles(*)').eq('workspace_id', currentWorkspace.id),
      ])

      if (visData) {
        setVisibility(visData)
        setSelectedLevel(visData.visibility)
        setSelectedGroups(visData.group_ids || [])
        setSelectedUsers(visData.user_ids || [])
      } else {
        setSelectedLevel('public')
      }

      if (groupData) setGroups(groupData)
      if (memberData) setMembers(memberData as MembershipWithProfile[])
      setLoading(false)
    }

    fetchData()
  }, [entityType, entityId, currentWorkspace])

  const handleSave = async () => {
    if (!currentWorkspace) return

    setSaving(true)
    const supabase = createClient()

    const data = {
      workspace_id: currentWorkspace.id,
      entity_type: entityType,
      entity_id: entityId,
      visibility: selectedLevel,
      group_ids: selectedLevel === 'restricted' ? selectedGroups : [],
      user_ids: selectedLevel === 'private' ? selectedUsers : [],
    }

    let error
    if (visibility) {
      // Update existing
      const result = await supabase
        .from('entity_visibility')
        .update(data)
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
      error = result.error
    } else {
      // Insert new
      const result = await supabase.from('entity_visibility').insert(data)
      error = result.error
    }

    setSaving(false)

    if (error) {
      toast.error('Failed to update visibility')
      return
    }

    setVisibility(data)
    setDialogOpen(false)
    toast.success('Visibility updated')
  }

  const getVisibilityIcon = () => {
    switch (visibility?.visibility ?? 'public') {
      case 'private':
        return <Lock className="h-4 w-4" />
      case 'restricted':
        return <Users className="h-4 w-4" />
      default:
        return <Eye className="h-4 w-4" />
    }
  }

  const getVisibilityLabel = () => {
    switch (visibility?.visibility ?? 'public') {
      case 'private':
        return 'Private'
      case 'restricted':
        return 'Restricted'
      default:
        return 'Family'
    }
  }

  if (loading) {
    return null
  }

  if (!canModify) {
    return (
      <Badge variant="outline" className="gap-1">
        {getVisibilityIcon()}
        {getVisibilityLabel()}
      </Badge>
    )
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            {getVisibilityIcon()}
            {getVisibilityLabel()}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => {
              setSelectedLevel('public')
              setDialogOpen(true)
            }}
          >
            <Eye className="mr-2 h-4 w-4" />
            <div>
              <p className="font-medium">Family (Public)</p>
              <p className="text-xs text-muted-foreground">All workspace members can see</p>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setSelectedLevel('restricted')
              setDialogOpen(true)
            }}
          >
            <Users className="mr-2 h-4 w-4" />
            <div>
              <p className="font-medium">Restricted</p>
              <p className="text-xs text-muted-foreground">Only specific groups can see</p>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setSelectedLevel('private')
              setDialogOpen(true)
            }}
          >
            <Lock className="mr-2 h-4 w-4" />
            <div>
              <p className="font-medium">Private</p>
              <p className="text-xs text-muted-foreground">Only specific people can see</p>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Visibility</DialogTitle>
            <DialogDescription>
              Control who can see this {entityType}.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {selectedLevel === 'public' && (
              <p className="text-sm text-muted-foreground">
                All members of this workspace will be able to see this {entityType}.
              </p>
            )}

            {selectedLevel === 'restricted' && (
              <div className="space-y-3">
                <Label>Select groups that can see this:</Label>
                {groups.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No groups created yet. Go to Settings → Groups to create some.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {groups.map((group) => (
                      <div key={group.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={group.id}
                          checked={selectedGroups.includes(group.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedGroups([...selectedGroups, group.id])
                            } else {
                              setSelectedGroups(selectedGroups.filter((id) => id !== group.id))
                            }
                          }}
                        />
                        <Label htmlFor={group.id} className="font-normal">
                          {group.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedLevel === 'private' && (
              <div className="space-y-3">
                <Label>Select people that can see this:</Label>
                <div className="space-y-2 max-h-48 overflow-auto">
                  {members.map((member) => (
                    <div key={member.user_id} className="flex items-center space-x-2">
                      <Checkbox
                        id={member.user_id}
                        checked={selectedUsers.includes(member.user_id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedUsers([...selectedUsers, member.user_id])
                          } else {
                            setSelectedUsers(selectedUsers.filter((id) => id !== member.user_id))
                          }
                        }}
                      />
                      <Label htmlFor={member.user_id} className="font-normal">
                        {member.profiles?.full_name ?? 'Unknown'}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
