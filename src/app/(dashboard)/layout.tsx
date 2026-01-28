import { WorkspaceProvider } from '@/components/providers/workspace-provider'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { CommandMenuProvider } from '@/components/command-menu'
import { Mihimihi } from '@/components/mihimihi'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <WorkspaceProvider>
      <CommandMenuProvider>
        <DashboardShell>{children}</DashboardShell>
        <Mihimihi />
      </CommandMenuProvider>
    </WorkspaceProvider>
  )
}
