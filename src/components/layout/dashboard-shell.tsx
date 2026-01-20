'use client'

import { useWorkspace } from '@/components/providers/workspace-provider'
import { Sidebar } from '@/components/layout/sidebar'
import { MobileNav } from '@/components/layout/mobile-nav'
import { CreateWorkspace } from '@/components/onboarding/create-workspace'
import { AlertCircle, RefreshCw, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { workspaces, loading, error, refresh } = useWorkspace()
  const router = useRouter()

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

  // Error loading workspaces
  if (error) {
    const handleSignOut = async () => {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/login')
    }

    return (
      <div className="flex h-screen items-center justify-center bg-stone-50 dark:bg-stone-950">
        <div className="flex max-w-md flex-col items-center gap-4 rounded-xl border border-stone-200 bg-white p-8 text-center shadow-sm dark:border-stone-800 dark:bg-stone-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
            <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
            Unable to load workspaces
          </h2>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            {error}
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => refresh()} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Try again
            </Button>
            <Button variant="outline" onClick={handleSignOut} className="gap-2">
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
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
