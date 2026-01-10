import { WorkspaceProvider } from '@/components/providers/workspace-provider'
import { DashboardShell } from '@/components/layout/dashboard-shell'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <WorkspaceProvider>
      <DashboardShell>{children}</DashboardShell>
    </WorkspaceProvider>
  )
}
