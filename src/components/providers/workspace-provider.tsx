'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Workspace, Membership, UserRole } from '@/types'

interface WorkspaceContextType {
  workspaces: Workspace[]
  currentWorkspace: Workspace | null
  currentMembership: Membership | null
  userRole: UserRole | null
  loading: boolean
  setCurrentWorkspaceId: (id: string) => void
  refresh: () => Promise<void>
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null)

const WORKSPACE_KEY = 'whakapapa_workspace_id'

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [currentWorkspaceId, setCurrentWorkspaceIdState] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchWorkspaces = useCallback(async () => {
    const supabase = createClient()

    const { data: membershipData } = await supabase
      .from('memberships')
      .select(`
        *,
        workspaces (*)
      `)

    if (membershipData) {
      const ws = membershipData
        .map((m) => m.workspaces as Workspace)
        .filter(Boolean)
      const ms = membershipData.map(({ workspaces: _, ...m }) => m as Membership)

      setWorkspaces(ws)
      setMemberships(ms)

      // Restore from localStorage or use first workspace
      const stored = localStorage.getItem(WORKSPACE_KEY)
      const validStored = stored && ws.some((w) => w.id === stored)

      if (validStored) {
        setCurrentWorkspaceIdState(stored)
      } else if (ws.length > 0) {
        setCurrentWorkspaceIdState(ws[0].id)
        localStorage.setItem(WORKSPACE_KEY, ws[0].id)
      }
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    fetchWorkspaces()
  }, [fetchWorkspaces])

  const setCurrentWorkspaceId = (id: string) => {
    setCurrentWorkspaceIdState(id)
    localStorage.setItem(WORKSPACE_KEY, id)
  }

  const currentWorkspace = workspaces.find((w) => w.id === currentWorkspaceId) ?? null
  const currentMembership = memberships.find((m) => m.workspace_id === currentWorkspaceId) ?? null
  const userRole = currentMembership?.role ?? null

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        currentWorkspace,
        currentMembership,
        userRole,
        loading,
        setCurrentWorkspaceId,
        refresh: fetchWorkspaces,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext)
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider')
  }
  return context
}
