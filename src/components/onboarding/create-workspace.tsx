'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { TreePine, ArrowRight, Sparkles, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useWorkspace } from '@/components/providers/workspace-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { WelcomeDialog } from '@/components/onboarding/welcome-dialog'
import { toast } from 'sonner'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function CreateWorkspace() {
  const router = useRouter()
  const { refresh, setCurrentWorkspaceId } = useWorkspace()
  const [name, setName] = useState('')
  const [createdWorkspaceName, setCreatedWorkspaceName] = useState('')
  const [showWelcome, setShowWelcome] = useState(false)
  const [creating, setCreating] = useState(false)

  const slug = slugify(name)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setCreating(true)

    const supabase = createClient()
    const { data, error } = await supabase.rpc('create_workspace_with_owner', {
      workspace_name: name.trim(),
      workspace_slug: slug,
    })

    if (error) {
      // Provide friendly error messages
      let errorText = "We couldn't create your family tree. Please try again."
      let errorDescription = ''
      if (error.message.includes('duplicate')) {
        errorText = 'This name is already taken'
        errorDescription = 'A workspace with this URL already exists. If this is your workspace, try signing out and back in. Otherwise, try a different name.'
      } else if (error.message.includes('permission')) {
        errorText = "You don't have permission to create a workspace."
        errorDescription = 'Your session may have expired. Please sign in again.'
      }
      toast.error(errorText, { description: errorDescription || undefined })
      setCreating(false)
      return
    }

    if (data) {
      const workspaceName = name.trim()
      await refresh()
      setCurrentWorkspaceId(data)
      setCreatedWorkspaceName(workspaceName)
      setShowWelcome(true)
      toast.success('Archive created!')
    }

    setCreating(false)
  }

  return (
    <>
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--atlas-paper)] px-4">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#f8ecd6_0%,#efe3d0_58%,#e8d7bf_100%)]" />
      <div className="absolute inset-0 opacity-60 [background-image:linear-gradient(90deg,rgba(101,76,57,0.06)_1px,transparent_1px),linear-gradient(rgba(101,76,57,0.06)_1px,transparent_1px)] [background-size:32px_32px]" />

      {/* Decorative elements */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ duration: 2 }}
        className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-[rgba(203,153,79,0.18)] blur-3xl"
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ duration: 2, delay: 0.5 }}
        className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-[rgba(18,52,79,0.12)] blur-3xl"
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo and header */}
        <div className="mb-10 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            className="mb-8 inline-flex"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--atlas-line)] bg-[var(--atlas-ink)] shadow-xl shadow-[rgba(86,59,40,0.14)]">
              <TreePine className="h-8 w-8 text-[#fff8ec]" strokeWidth={1.5} aria-hidden="true" />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="font-serif text-5xl font-medium leading-none tracking-[-0.045em] text-[var(--atlas-ink)]"
          >
            Welcome to Whakapapa
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="mx-auto mt-4 max-w-sm text-base leading-7 text-[var(--atlas-copy)]"
          >
            Create the first archive for your family&apos;s story
          </motion.p>
        </div>

        {/* Form card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="archive-tool-panel p-8"
        >
          <form onSubmit={handleCreate} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[var(--atlas-ink)]">
                Name Your Family Archive
              </Label>
              <Input
                id="name"
                name="workspace-name"
                placeholder="e.g., Young Whānau…"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="organization"
                className="h-12 text-base"
              />
              {name && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="text-sm text-[var(--atlas-muted)]"
                >
                  whakapapa.app/<span className="text-[var(--atlas-ink)]">{slug}</span>
                </motion.p>
              )}
            </div>

            <Button
              type="submit"
              disabled={creating || !name.trim()}
              className="h-12 w-full rounded-xl text-base font-medium"
            >
              {creating ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles className="h-5 w-5" />
                </motion.div>
              ) : (
                <>
                  Create Archive
                  <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
                </>
              )}
            </Button>
          </form>
        </motion.div>

        {/* Trust message */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.4 }}
          className="mt-8 text-center text-sm leading-6 text-[var(--atlas-muted)]"
        >
          Your family&apos;s data is private by default.
          <br />
          Only people you invite can see it.
        </motion.p>

        {/* Sign out link - helps users who have an existing workspace but stale session */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.4 }}
          className="mt-6 text-center"
        >
          <button
            type="button"
            onClick={async () => {
              const supabase = createClient()
              await supabase.auth.signOut()
              router.push('/login')
            }}
            className="inline-flex items-center gap-1.5 text-sm text-[var(--atlas-muted)] transition-colors hover:text-[var(--atlas-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(203,153,79,0.24)]"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            Sign out and use a different account
          </button>
        </motion.div>
      </motion.div>
    </div>
      <WelcomeDialog
        open={showWelcome}
        onClose={() => {
          setShowWelcome(false)
          router.push('/people/new')
        }}
        workspaceName={createdWorkspaceName}
      />
    </>
  )
}
