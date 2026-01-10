'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useWorkspace } from '@/components/providers/workspace-provider'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import type { ActivityLog, Profile } from '@/types'

interface ActivityWithProfile extends ActivityLog {
  profiles: Profile | null
}

function getActionLabel(action: string): string {
  switch (action) {
    case 'create':
      return 'created'
    case 'update':
      return 'updated'
    case 'delete':
      return 'deleted'
    default:
      return action
  }
}

function getActionColor(action: string): string {
  switch (action) {
    case 'create':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    case 'update':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
    case 'delete':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    default:
      return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-900 dark:text-neutral-300'
  }
}

export default function ActivityPage() {
  const { currentWorkspace } = useWorkspace()
  const [activities, setActivities] = useState<ActivityWithProfile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchActivity() {
      if (!currentWorkspace) return

      const supabase = createClient()
      const { data } = await supabase
        .from('activity_log')
        .select('*, profiles(*)')
        .eq('workspace_id', currentWorkspace.id)
        .order('created_at', { ascending: false })
        .limit(100)

      if (data) {
        setActivities(data as ActivityWithProfile[])
      }
      setLoading(false)
    }

    if (currentWorkspace) {
      fetchActivity()
    }
  }, [currentWorkspace])

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
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Activity</h1>
        <p className="text-muted-foreground">Recent changes to your family tree</p>
      </div>

      {activities.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">No activity yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => {
            const userName = activity.profiles?.full_name ?? 'Unknown user'
            const initials = userName
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)

            // Try to get entity name from after_data or before_data
            const entityData = activity.after_data ?? activity.before_data
            const entityName =
              (entityData as Record<string, unknown>)?.preferred_name ??
              (entityData as Record<string, unknown>)?.title ??
              activity.entity_id.slice(0, 8)

            return (
              <Card key={activity.id}>
                <CardContent className="flex items-center gap-4 py-4">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-medium">{userName}</span>{' '}
                      <Badge variant="outline" className={getActionColor(activity.action)}>
                        {getActionLabel(activity.action)}
                      </Badge>{' '}
                      <span className="text-muted-foreground">{activity.entity_type}</span>{' '}
                      <span className="font-medium">{String(entityName)}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.created_at).toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
