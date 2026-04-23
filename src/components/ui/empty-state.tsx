'use client'

import { motion } from 'framer-motion'
import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

// Jordan Singer-inspired: Product poetry, humane minimalism
// Empty states should feel like a gentle invitation, not a void

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      className={cn(
        'mx-auto flex max-w-2xl flex-col items-center justify-center px-4 py-16 text-center',
        className
      )}
    >
      {Icon && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="atlas-empty-mark mb-5 rounded-2xl border border-[var(--atlas-line)] p-5 shadow-[0_16px_34px_rgba(86,59,40,0.1)]"
        >
          <Icon className="h-7 w-7 text-[var(--atlas-accent)]" strokeWidth={1.5} />
        </motion.div>
      )}

      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        className="font-serif text-2xl font-medium tracking-[-0.025em] text-[var(--atlas-ink)]"
      >
        {title}
      </motion.h3>

      {description && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="mt-3 max-w-sm text-sm leading-relaxed text-[var(--atlas-copy)]"
        >
          {description}
        </motion.p>
      )}

      {action && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.3 }}
          className="mt-6"
        >
          {action}
        </motion.div>
      )}
    </motion.div>
  )
}

// Contextual empty states with personality
export const emptyStates = {
  people: {
    title: 'No one here yet',
    description: 'Every family tree starts with a single person. Add someone to begin.',
  },
  sources: {
    title: 'No sources yet',
    description: 'Sources are the foundation of trust. Add documents, photos, or notes.',
  },
  relationships: {
    title: 'No connections yet',
    description: 'People become family through relationships. Add the first one.',
  },
  suggestions: {
    title: 'Nothing to review',
    description: 'AI suggestions will appear here when you extract data from documents.',
  },
  activity: {
    title: 'No activity yet',
    description: 'Changes to your family tree will be recorded here.',
  },
  search: {
    title: 'No results',
    description: 'Try a different search term or check the spelling.',
  },
  workspace: {
    title: 'Create your first workspace',
    description: 'A workspace is where your family history lives. Start one to begin.',
  },
}
