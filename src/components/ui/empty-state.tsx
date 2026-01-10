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
        'flex flex-col items-center justify-center py-16 px-4 text-center',
        className
      )}
    >
      {Icon && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="mb-5 rounded-2xl bg-gradient-to-br from-stone-100 to-stone-200/50 p-5 shadow-sm shadow-stone-900/5 dark:from-stone-800 dark:to-stone-800/50"
        >
          <Icon className="h-7 w-7 text-stone-400 dark:text-stone-500" strokeWidth={1.5} />
        </motion.div>
      )}

      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        className="text-lg font-medium text-stone-900 dark:text-stone-100"
      >
        {title}
      </motion.h3>

      {description && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="mt-2 max-w-sm text-sm text-stone-500 dark:text-stone-400 leading-relaxed"
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
