'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Calendar, TreePine } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface SharedPersonViewProps {
  person: {
    preferred_name: string
    given_names: string | null
    family_name: string | null
    photo_url: string | null
    bio?: string | null
    birth_date?: string | null
    death_date?: string | null
  }
  workspaceName?: string
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function formatLifeDates(birthDate?: string | null, deathDate?: string | null) {
  if (!birthDate && !deathDate) return null
  return `${birthDate?.split('-')[0] || '?'} - ${deathDate?.split('-')[0] || 'Present'}`
}

export function SharedPersonView({ person, workspaceName }: SharedPersonViewProps) {
  const lifeDates = formatLifeDates(person.birth_date, person.death_date)

  return (
    <div className="archive-public-shell">
      <header className="archive-public-header">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="archive-public-mark">
              <TreePine className="h-4 w-4" aria-hidden="true" />
            </div>
            <span className="font-serif text-xl text-[var(--archive-text)]" translate="no">Whakapapa</span>
          </div>
          {workspaceName && (
            <span className="text-sm text-[rgba(238,220,184,0.62)]">{workspaceName}</span>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="archive-artifact"
        >
          <div className="archive-artifact__band px-6 py-8">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 mb-4 ring-1 ring-[rgba(237,203,136,0.22)]">
                <AvatarImage src={person.photo_url || undefined} alt={person.preferred_name} />
                <AvatarFallback className="text-2xl">
                  {getInitials(person.preferred_name)}
                </AvatarFallback>
              </Avatar>
              <h1 className="font-serif text-4xl leading-none tracking-[-0.04em] text-[var(--archive-text)]">
                {person.preferred_name}
              </h1>
              {(person.given_names || person.family_name) && (
                <p className="mt-2 text-[rgba(238,220,184,0.6)]">
                  {person.given_names} {person.family_name}
                </p>
              )}
              {lifeDates && (
                <div className="archive-chip mt-4">
                  <Calendar className="h-4 w-4" aria-hidden="true" />
                  {lifeDates}
                </div>
              )}
            </div>
          </div>

          {person.bio && (
            <div className="p-6">
              <p className="whitespace-pre-wrap text-lg leading-relaxed text-[rgba(238,220,184,0.78)]">
                {person.bio}
              </p>
            </div>
          )}
        </motion.div>

        <div className="mt-8 text-center">
          <p className="text-sm text-[rgba(238,220,184,0.58)] mb-4">
            Preserving family stories with Whakapapa
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--image-paper)] hover:text-[var(--archive-text)]"
          >
            <TreePine className="h-4 w-4" aria-hidden="true" />
            Start your family tree
          </Link>
        </div>
      </main>
    </div>
  )
}
