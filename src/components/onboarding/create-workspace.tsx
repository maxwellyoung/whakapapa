'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { TreePine, ArrowRight, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useWorkspace } from '@/components/providers/workspace-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
      toast.error(error.message)
      setCreating(false)
      return
    }

    if (data) {
      await refresh()
      setCurrentWorkspaceId(data)
      toast.success('Workspace created!')
      router.push('/people')
    }

    setCreating(false)
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-stone-50 dark:bg-stone-950">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-stone-100 via-stone-50 to-amber-50/30 dark:from-stone-950 dark:via-stone-900 dark:to-stone-950" />

      {/* Decorative elements */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ duration: 2 }}
        className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-gradient-to-br from-amber-200/20 to-orange-200/20 blur-3xl dark:from-amber-900/10 dark:to-orange-900/10"
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ duration: 2, delay: 0.5 }}
        className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-gradient-to-br from-stone-200/30 to-stone-300/20 blur-3xl dark:from-stone-800/20 dark:to-stone-700/10"
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        className="relative z-10 w-full max-w-md px-6"
      >
        {/* Logo and header */}
        <div className="mb-10 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            className="mb-8 inline-flex"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-900 shadow-xl shadow-stone-900/10 dark:bg-stone-100">
              <TreePine className="h-8 w-8 text-stone-50 dark:text-stone-900" strokeWidth={1.5} />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-100"
          >
            Welcome to Whakapapa
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="mt-3 text-lg text-stone-500 dark:text-stone-400"
          >
            Create a space for your family&apos;s story
          </motion.p>
        </div>

        {/* Form card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="rounded-2xl border border-stone-200/60 bg-white/80 p-8 shadow-xl shadow-stone-900/5 backdrop-blur-sm dark:border-stone-800/60 dark:bg-stone-900/80"
        >
          <form onSubmit={handleCreate} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-stone-700 dark:text-stone-300">
                Name your family tree
              </Label>
              <Input
                id="name"
                placeholder="e.g., Young Whānau"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                className="h-12 rounded-xl border-stone-200 bg-stone-50/50 text-base placeholder:text-stone-400 focus:border-stone-400 focus:ring-stone-400 dark:border-stone-700 dark:bg-stone-800/50 dark:placeholder:text-stone-500"
              />
              {name && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="text-sm text-stone-400"
                >
                  whakapapa.app/<span className="text-stone-600 dark:text-stone-300">{slug}</span>
                </motion.p>
              )}
            </div>

            <Button
              type="submit"
              disabled={creating || !name.trim()}
              className="h-12 w-full rounded-xl bg-stone-900 text-base font-medium text-stone-50 shadow-lg shadow-stone-900/20 transition-all hover:bg-stone-800 hover:shadow-xl hover:shadow-stone-900/25 disabled:opacity-50 dark:bg-stone-100 dark:text-stone-900 dark:shadow-stone-100/10 dark:hover:bg-stone-200"
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
                  Create workspace
                  <ArrowRight className="ml-2 h-5 w-5" />
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
          className="mt-8 text-center text-sm text-stone-400 dark:text-stone-500"
        >
          Your family&apos;s data is private by default.
          <br />
          Only people you invite can see it.
        </motion.p>
      </motion.div>
    </div>
  )
}
