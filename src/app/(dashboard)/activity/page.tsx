'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useWorkspace } from '@/components/providers/workspace-provider'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton, SkeletonAvatar } from '@/components/ui/skeleton'
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
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    case 'update':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    case 'delete':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    default:
      return 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300'
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
      <div className="p-6 md:p-8">
        <div className="mb-8">
          <Skeleton className="h-8 w-28 mb-2" />
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="rounded-xl border border-stone-200 dark:border-stone-700 p-4 flex items-center gap-4">
              <SkeletonAvatar size="sm" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!currentWorkspace) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-stone-400 dark:text-stone-500">Select a workspace</p>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">Activity</h1>
        <p className="mt-1 text-stone-500 dark:text-stone-400">Recent changes to your family tree</p>
      </div>

      {activities.length === 0 ? (
        <div className="rounded-2xl border border-stone-200/60 bg-white p-8 text-center shadow-sm dark:border-stone-800/60 dark:bg-stone-900">
          <p className="text-stone-400 dark:text-stone-500">No activity yet</p>
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
                    <p className="text-sm text-stone-700 dark:text-stone-300">
                      <span className="font-medium text-stone-900 dark:text-stone-100">{userName}</span>{' '}
                      <Badge variant="outline" className={getActionColor(activity.action)}>
                        {getActionLabel(activity.action)}
                      </Badge>{' '}
                      <span className="text-stone-500 dark:text-stone-400">{activity.entity_type}</span>{' '}
                      <span className="font-medium text-stone-900 dark:text-stone-100">{String(entityName)}</span>
                    </p>
                    <p className="text-xs text-stone-400 dark:text-stone-500">
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
