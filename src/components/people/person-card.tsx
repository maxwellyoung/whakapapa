'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { MapPin } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatFlexibleDate } from '@/lib/dates'
import { cn } from '@/lib/utils'
import type { Person } from '@/types'

// Susan Kare-inspired: symbolic, clear, iconic
// Every element has purpose

interface PersonCardProps {
  person: Person
  className?: string
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function PersonCard({ person, className }: PersonCardProps) {
  const birthDate = formatFlexibleDate({
    date: person.birth_date,
    precision: person.birth_date_precision,
    endDate: person.birth_date_end,
  })

  const deathDate = formatFlexibleDate({
    date: person.death_date,
    precision: person.death_date_precision,
    endDate: person.death_date_end,
  })

  // Clean lifespan display
  const hasLife = birthDate !== 'Unknown' || deathDate !== 'Unknown'
  const isDeceased = deathDate !== 'Unknown'
  const lifespan = hasLife
    ? isDeceased
      ? `${birthDate !== 'Unknown' ? birthDate : '?'} – ${deathDate}`
      : `b. ${birthDate}`
    : null

  return (
    <Link href={`/people/${person.id}`}>
      <motion.article
        whileHover={{ y: -2, scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
        className={cn(
          'group relative rounded-2xl p-4 backdrop-blur-sm',
          'border border-[var(--border)] bg-[var(--card)]',
          'shadow-sm',
          'transition-all duration-200',
          'hover:border-[var(--border-soft)] hover:shadow-md',
          className
        )}
      >
        {/* Avatar + Name */}
        <div className="flex items-start gap-3">
          <Avatar className="h-11 w-11 ring-2 ring-white/80 dark:ring-stone-900/80 shadow-sm shadow-stone-900/10">
            <AvatarImage
              src={person.photo_url ?? undefined}
              alt={person.preferred_name}
            />
            <AvatarFallback className="bg-gradient-to-br from-stone-100 to-stone-200 text-stone-600 dark:from-stone-800 dark:to-stone-700 dark:text-stone-300 text-sm font-medium">
              {getInitials(person.preferred_name)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-stone-900 dark:text-stone-100 truncate">
              {person.preferred_name}
            </h3>

            {/* Full name if different */}
            {person.family_name && person.family_name !== person.preferred_name && (
              <p className="text-sm text-stone-500 dark:text-stone-400 truncate">
                {person.given_names} {person.family_name}
              </p>
            )}
          </div>
        </div>

        {/* Metadata - subtle, secondary */}
        {(lifespan || person.birth_place) && (
          <div className="mt-3 space-y-1.5 pt-3 border-t border-stone-100 dark:border-stone-800">
            {lifespan && (
              <p className="text-sm text-stone-500 dark:text-stone-400 tabular-nums">
                {lifespan}
              </p>
            )}
            {person.birth_place && (
              <p className="flex items-center gap-1.5 text-sm text-stone-400 dark:text-stone-500 truncate">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={1.5} />
                <span className="truncate">{person.birth_place}</span>
              </p>
            )}
          </div>
        )}

        {/* Hover indicator - subtle right arrow */}
        <motion.div
          initial={{ opacity: 0, x: -4 }}
          whileHover={{ opacity: 1, x: 0 }}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-300 dark:text-stone-600 opacity-0 group-hover:opacity-100 transition-all duration-200"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 4l4 4-4 4" />
          </svg>
        </motion.div>
      </motion.article>
    </Link>
  )
}
