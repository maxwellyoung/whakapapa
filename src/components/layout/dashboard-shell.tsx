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
      <div className="flex h-screen items-center justify-center bg-background">
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
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex max-w-md flex-col items-center gap-4 rounded-xl border border-border bg-card p-8 text-center shadow-lg animate-scale-in">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 animate-breathe">
            <AlertCircle className="h-6 w-6 text-accent" />
          </div>
          <h2 className="text-lg font-serif font-medium text-foreground">
            Unable to load workspaces
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
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

      <main className="flex-1 overflow-auto bg-background">
        {children}
      </main>
    </div>
  )
}
