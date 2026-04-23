'use client'

import { useWorkspace } from '@/components/providers/workspace-provider'
import { Sidebar } from '@/components/layout/sidebar'
import { MobileNav } from '@/components/layout/mobile-nav'
import { CreateWorkspace } from '@/components/onboarding/create-workspace'
import { AlertCircle, RefreshCw, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TreeLoader } from '@/components/ui/loading-spinner'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { workspaces, loading, error, refresh } = useWorkspace()
  const router = useRouter()

  // Still loading
  if (loading) {
    return (
      <div className="atlas-shell flex h-screen items-center justify-center">
        <TreeLoader />
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
      <div className="atlas-shell flex h-screen items-center justify-center p-6">
        <div className="atlas-panel flex max-w-md animate-scale-in flex-col items-center gap-4 rounded-[1.5rem] p-8 text-center">
          <div className="flex h-12 w-12 animate-breathe items-center justify-center rounded-full bg-[var(--atlas-accent-soft)]">
            <AlertCircle className="h-6 w-6 text-[var(--atlas-accent)]" />
          </div>
          <h2 className="font-serif text-lg font-medium text-[var(--atlas-ink)]">
            Unable to load workspaces
          </h2>
          <p className="text-sm leading-relaxed text-[var(--atlas-copy)]">
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
    <div className="atlas-shell flex h-screen flex-col text-[var(--atlas-ink)] md:flex-row">
      {/* Mobile nav - visible on small screens */}
      <MobileNav />

      {/* Desktop sidebar - hidden on small screens */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      <main className="atlas-main relative flex-1 overflow-auto">
        <div className="relative z-10">{children}</div>
      </main>
    </div>
  )
}
