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
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-stone-100 dark:from-stone-950 dark:to-stone-900">
      <header className="border-b border-stone-200 dark:border-stone-800 bg-white/80 dark:bg-stone-900/80 backdrop-blur-md">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-900 dark:bg-stone-100">
              <TreePine className="h-4 w-4 text-stone-50 dark:text-stone-900" />
            </div>
            <span className="font-semibold text-stone-900 dark:text-stone-100">Whakapapa</span>
          </div>
          {workspaceName && (
            <span className="text-sm text-stone-500 dark:text-stone-400">{workspaceName}</span>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-stone-800/50 rounded-2xl border border-stone-200 dark:border-stone-700 shadow-xl overflow-hidden"
        >
          <div className="px-6 py-8 border-b border-stone-100 dark:border-stone-700">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={person.photo_url || undefined} alt={person.preferred_name} />
                <AvatarFallback className="text-2xl">
                  {getInitials(person.preferred_name)}
                </AvatarFallback>
              </Avatar>
              <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-100">
                {person.preferred_name}
              </h1>
              {(person.given_names || person.family_name) && (
                <p className="mt-1 text-stone-500 dark:text-stone-400">
                  {person.given_names} {person.family_name}
                </p>
              )}
              {lifeDates && (
                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-stone-100 dark:bg-stone-800 px-3 py-1 text-sm text-stone-600 dark:text-stone-300">
                  <Calendar className="h-4 w-4" />
                  {lifeDates}
                </div>
              )}
            </div>
          </div>

          {person.bio && (
            <div className="p-6">
              <p className="text-lg leading-relaxed text-stone-700 dark:text-stone-300 whitespace-pre-wrap">
                {person.bio}
              </p>
            </div>
          )}
        </motion.div>

        <div className="mt-8 text-center">
          <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">
            Preserving family stories with Whakapapa
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100"
          >
            <TreePine className="h-4 w-4" />
            Start your family tree
          </Link>
        </div>
      </main>
    </div>
  )
}
