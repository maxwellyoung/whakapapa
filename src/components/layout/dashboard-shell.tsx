'use client'

import { useWorkspace } from '@/components/providers/workspace-provider'
import { Sidebar } from '@/components/layout/sidebar'
import { MobileNav } from '@/components/layout/mobile-nav'
import { CreateWorkspace } from '@/components/onboarding/create-workspace'

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { workspaces, loading } = useWorkspace()

  // Still loading
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-stone-50 dark:bg-stone-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-200 border-t-stone-600 dark:border-stone-700 dark:border-t-stone-300" />
          <span className="text-sm text-stone-400 dark:text-stone-500">Loading...</span>
        </div>
      </div>
    )
  }

  // No workspaces - show onboarding
  if (workspaces.length === 0) {
    return <CreateWorkspace />
  }

  // Has workspaces - show dashboard
  return (
    <div className="flex h-screen flex-col md:flex-row">
      {/* Mobile nav - visible on small screens */}
      <MobileNav />

      {/* Desktop sidebar - hidden on small screens */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      <main className="flex-1 overflow-auto bg-stone-50/50 dark:bg-stone-950/50">
        {children}
      </main>
    </div>
  )
}
