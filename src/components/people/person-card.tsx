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
          'atlas-panel group relative rounded-[1.35rem] p-4',
          'transition-[border-color,box-shadow,transform] duration-200',
          'hover:border-[var(--atlas-line-strong)] hover:shadow-[0_18px_44px_rgba(86,59,40,0.1)]',
          className
        )}
      >
        {/* Avatar + Name */}
        <div className="flex items-start gap-3">
          <Avatar className="h-11 w-11 shadow-sm ring-2 ring-[rgba(255,247,232,0.9)]">
            <AvatarImage
              src={person.photo_url ?? undefined}
              alt={person.preferred_name}
            />
            <AvatarFallback className="bg-[var(--atlas-accent-soft)] text-sm font-medium text-[var(--atlas-accent)]">
              {getInitials(person.preferred_name)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <h3 className="truncate font-medium text-[var(--atlas-ink)]">
              {person.preferred_name}
            </h3>

            {/* Full name if different */}
            {person.family_name && person.family_name !== person.preferred_name && (
              <p className="truncate text-sm text-[var(--atlas-muted)]">
                {person.given_names} {person.family_name}
              </p>
            )}
          </div>
        </div>

        {/* Metadata - subtle, secondary */}
        {(lifespan || person.birth_place) && (
          <div className="mt-3 space-y-1.5 border-t border-[var(--atlas-line)] pt-3">
            {lifespan && (
              <p className="text-sm tabular-nums text-[var(--atlas-copy)]">
                {lifespan}
              </p>
            )}
            {person.birth_place && (
              <p className="flex items-center gap-1.5 truncate text-sm text-[var(--atlas-muted)]">
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
          className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--atlas-muted)] opacity-0 transition-all duration-200 group-hover:opacity-100"
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
