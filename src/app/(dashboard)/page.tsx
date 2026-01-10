'use client'

import { useWorkspace } from '@/components/providers/workspace-provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, FileText, GitBranch } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const { currentWorkspace, workspaces, loading } = useWorkspace()

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!currentWorkspace) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Welcome to Whakapapa</CardTitle>
            <CardDescription>
              {workspaces.length === 0
                ? 'Create your first workspace to start building your family tree.'
                : 'Select a workspace to get started.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Use the workspace switcher in the sidebar to create or select a workspace.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{currentWorkspace.name}</h1>
        <p className="text-muted-foreground">Family knowledge base</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/people">
          <Card className="transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">People</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Add and manage family members
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/tree">
          <Card className="transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Family Tree</CardTitle>
              <GitBranch className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Visualize relationships
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/sources">
          <Card className="transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sources</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Documents, photos, and citations
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
