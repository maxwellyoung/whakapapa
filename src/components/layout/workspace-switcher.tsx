'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronsUpDown, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useWorkspace } from '@/components/providers/workspace-provider'
import { createClient } from '@/lib/supabase/client'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function WorkspaceSwitcher() {
  const { workspaces, currentWorkspace, setCurrentWorkspaceId, refresh } = useWorkspace()
  const router = useRouter()

  const [open, setOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleNameChange = (value: string) => {
    setName(value)
    setSlug(slugify(value))
  }

  const handleCreate = async () => {
    if (!name.trim() || !slug.trim()) return

    setCreating(true)
    setError(null)

    const supabase = createClient()
    const { data, error: createError } = await supabase.rpc('create_workspace_with_owner', {
      workspace_name: name.trim(),
      workspace_slug: slug.trim(),
    })

    setCreating(false)

    if (createError) {
      setError(createError.message)
      return
    }

    if (data) {
      await refresh()
      setCurrentWorkspaceId(data)
      setDialogOpen(false)
      setName('')
      setSlug('')
      router.push('/people')
    }
  }

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            aria-expanded={open}
            className="h-12 w-full justify-between rounded-2xl border-[rgba(101,76,57,0.12)] bg-[rgba(255,250,244,0.7)] px-4 text-[var(--atlas-copy)] shadow-none hover:bg-[rgba(255,248,239,0.95)] hover:text-[var(--atlas-ink)]"
          >
            <div className="min-w-0 text-left">
              <p className="mb-0 text-[10px] uppercase tracking-[0.18em] text-[var(--atlas-muted)]">
                Current workspace
              </p>
              <span className="block truncate text-sm font-medium">
                {currentWorkspace?.name ?? 'Select workspace'}
              </span>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-[var(--atlas-muted)]" strokeWidth={1.5} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-64 rounded-2xl border-[rgba(101,76,57,0.12)] bg-[rgba(255,251,246,0.98)] p-2 text-[var(--atlas-copy)] shadow-[0_24px_50px_rgba(101,76,57,0.12)]"
          align="start"
        >
          {workspaces.map((workspace) => (
            <DropdownMenuItem
              key={workspace.id}
              onClick={() => {
                setCurrentWorkspaceId(workspace.id)
                setOpen(false)
              }}
              className="rounded-xl px-3 py-3 text-sm text-[var(--atlas-copy)] focus:bg-[rgba(203,153,79,0.1)] focus:text-[var(--atlas-ink)]"
            >
              <Check
                className={cn(
                  'mr-2 h-4 w-4',
                  currentWorkspace?.id === workspace.id ? 'opacity-100' : 'opacity-0'
                )}
                strokeWidth={1.75}
              />
              {workspace.name}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator className="my-2 bg-[rgba(101,76,57,0.1)]" />
          <DropdownMenuItem
            onClick={() => {
              setOpen(false)
              setDialogOpen(true)
            }}
            className="rounded-xl px-3 py-3 text-sm text-[var(--atlas-copy)] focus:bg-[rgba(203,153,79,0.1)] focus:text-[var(--atlas-ink)]"
          >
            <Plus className="mr-2 h-4 w-4" strokeWidth={1.75} />
            Create workspace
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="border-[rgba(101,76,57,0.12)] bg-[rgba(252,247,241,0.98)] text-[var(--atlas-copy)] shadow-[0_30px_60px_rgba(101,76,57,0.16)]">
          <DialogHeader>
            <DialogTitle className="font-serif text-3xl text-[var(--atlas-ink)]">Create workspace</DialogTitle>
            <DialogDescription className="text-[var(--atlas-muted)]">
              Create a new workspace for your family tree.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[var(--atlas-copy)]">Name</Label>
              <Input
                id="name"
                placeholder="Young Family"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="h-11 rounded-xl border-[rgba(101,76,57,0.14)] bg-[rgba(255,252,248,0.92)] text-[var(--atlas-ink)] placeholder:text-[var(--atlas-muted)]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug" className="text-[var(--atlas-copy)]">URL slug</Label>
              <Input
                id="slug"
                placeholder="young-family"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="h-11 rounded-xl border-[rgba(101,76,57,0.14)] bg-[rgba(255,252,248,0.92)] text-[var(--atlas-ink)] placeholder:text-[var(--atlas-muted)]"
              />
              <p className="text-xs text-[var(--atlas-muted)]">
                Used in shareable links
              </p>
            </div>
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="rounded-full border-[rgba(101,76,57,0.16)] bg-transparent text-[var(--atlas-copy)] hover:bg-[rgba(203,153,79,0.08)]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={creating || !name.trim()}
              className="rounded-full bg-[var(--atlas-accent)] text-white hover:bg-[var(--atlas-accent)]/95"
            >
              {creating ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
