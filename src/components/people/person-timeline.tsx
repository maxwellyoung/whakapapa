'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Baby,
  Heart,
  GraduationCap,
  Briefcase,
  Home,
  Plane,
  Shield,
  Church,
  Users,
  Calendar,
  MapPin,
  Skull,
  Plus,
  Sparkles,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useWorkspace } from '@/components/providers/workspace-provider'
import { Button } from '@/components/ui/button'
import { canEdit } from '@/lib/permissions'
import { formatFlexibleDate } from '@/lib/dates'
import type { Event, EventType, Person, DatePrecision } from '@/types'
import Link from 'next/link'

interface TimelineEvent {
  id: string
  type: EventType | 'birth' | 'death'
  title: string
  date: string | null
  datePrecision: DatePrecision
  location: string | null
  description: string | null
  isLifeEvent?: boolean
  historicalContext?: string | null
}

interface PersonTimelineProps {
  person: Person
  showAddButton?: boolean
}

const eventIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  birth: Baby,
  death: Skull,
  marriage: Heart,
  divorce: Heart,
  baptism: Church,
  graduation: GraduationCap,
  immigration: Plane,
  emigration: Plane,
  military_service: Shield,
  occupation: Briefcase,
  residence: Home,
  census: Users,
  burial: Church,
  other: Calendar,
}

const eventColors: Record<string, string> = {
  birth: 'bg-emerald-500',
  death: 'bg-stone-500',
  marriage: 'bg-pink-500',
  divorce: 'bg-orange-500',
  baptism: 'bg-blue-500',
  graduation: 'bg-purple-500',
  immigration: 'bg-cyan-500',
  emigration: 'bg-cyan-500',
  military_service: 'bg-red-500',
  occupation: 'bg-amber-500',
  residence: 'bg-indigo-500',
  census: 'bg-teal-500',
  burial: 'bg-stone-600',
  other: 'bg-stone-400',
}

// Historical events for context
const historicalEvents: { year: number; event: string }[] = [
  { year: 1914, event: 'World War I begins' },
  { year: 1918, event: 'World War I ends' },
  { year: 1929, event: 'Great Depression begins' },
  { year: 1939, event: 'World War II begins' },
  { year: 1945, event: 'World War II ends' },
  { year: 1969, event: 'Moon landing' },
  { year: 1989, event: 'Berlin Wall falls' },
  { year: 2001, event: 'September 11 attacks' },
  { year: 2020, event: 'COVID-19 pandemic' },
]

function getHistoricalContext(dateStr: string | null): string | null {
  if (!dateStr) return null
  const year = parseInt(dateStr.split('-')[0])
  if (isNaN(year)) return null

  // Find nearby historical events (within 2 years)
  const nearbyEvent = historicalEvents.find(
    (e) => Math.abs(e.year - year) <= 2
  )

  if (nearbyEvent) {
    const diff = year - nearbyEvent.year
    if (diff === 0) return `Same year as ${nearbyEvent.event}`
    if (diff > 0) return `${diff} year${diff > 1 ? 's' : ''} after ${nearbyEvent.event}`
    return `${Math.abs(diff)} year${Math.abs(diff) > 1 ? 's' : ''} before ${nearbyEvent.event}`
  }

  return null
}

function getEventLabel(type: EventType | string): string {
  const labels: Record<string, string> = {
    birth: 'Born',
    death: 'Passed away',
    marriage: 'Married',
    divorce: 'Divorced',
    baptism: 'Baptised',
    graduation: 'Graduated',
    immigration: 'Immigrated',
    emigration: 'Emigrated',
    military_service: 'Military service',
    occupation: 'Employment',
    residence: 'Residence',
    census: 'Census record',
    burial: 'Burial',
    other: 'Event',
  }
  return labels[type] || 'Event'
}

export function PersonTimeline({ person, showAddButton = true }: PersonTimelineProps) {
  const { currentWorkspace, userRole } = useWorkspace()
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchEvents() {
      if (!currentWorkspace) return

      const supabase = createClient()

      // Fetch events for this person
      const { data: eventParticipants } = await supabase
        .from('event_participants')
        .select('event_id')
        .eq('person_id', person.id)

      const eventIds = eventParticipants?.map((ep) => ep.event_id) || []

      let dbEvents: Event[] = []
      if (eventIds.length > 0) {
        const { data } = await supabase
          .from('events')
          .select('*')
          .in('id', eventIds)
          .eq('workspace_id', currentWorkspace.id)

        dbEvents = data || []
      }

      // Build timeline with life events + database events
      const timelineEvents: TimelineEvent[] = []

      // Add birth
      if (person.birth_date) {
        timelineEvents.push({
          id: 'birth',
          type: 'birth',
          title: 'Born',
          date: person.birth_date,
          datePrecision: person.birth_date_precision,
          location: person.birth_place,
          description: null,
          isLifeEvent: true,
          historicalContext: getHistoricalContext(person.birth_date),
        })
      }

      // Add database events
      dbEvents.forEach((event) => {
        timelineEvents.push({
          id: event.id,
          type: event.event_type,
          title: event.title || getEventLabel(event.event_type),
          date: event.event_date,
          datePrecision: event.event_date_precision,
          location: event.location,
          description: event.description,
          isLifeEvent: false,
          historicalContext: getHistoricalContext(event.event_date),
        })
      })

      // Add death
      if (person.death_date) {
        timelineEvents.push({
          id: 'death',
          type: 'death',
          title: 'Passed away',
          date: person.death_date,
          datePrecision: person.death_date_precision,
          location: person.death_place,
          description: null,
          isLifeEvent: true,
          historicalContext: getHistoricalContext(person.death_date),
        })
      }

      // Sort by date
      timelineEvents.sort((a, b) => {
        if (!a.date && !b.date) return 0
        if (!a.date) return 1
        if (!b.date) return -1
        return a.date.localeCompare(b.date)
      })

      setEvents(timelineEvents)
      setLoading(false)
    }

    fetchEvents()
  }, [person, currentWorkspace])

  const canUserEdit = userRole && canEdit(userRole)

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-stone-200 dark:bg-stone-700" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 bg-stone-200 dark:bg-stone-700 rounded" />
              <div className="h-3 w-48 bg-stone-100 dark:bg-stone-800 rounded" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-stone-100 dark:bg-stone-800">
          <Calendar className="h-6 w-6 text-stone-400" />
        </div>
        <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">
          No life events recorded yet
        </p>
        {canUserEdit && showAddButton && (
          <Link href={`/people/${person.id}/events/new`}>
            <Button variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add first event
            </Button>
          </Link>
        )}
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-5 top-0 bottom-0 w-px bg-gradient-to-b from-stone-200 via-stone-300 to-stone-200 dark:from-stone-700 dark:via-stone-600 dark:to-stone-700" />

      <AnimatePresence>
        <div className="space-y-6">
          {events.map((event, index) => {
            const Icon = eventIcons[event.type] || Calendar
            const color = eventColors[event.type] || 'bg-stone-400'

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative flex gap-4 group"
              >
                {/* Icon */}
                <div
                  className={`
                    relative z-10 flex-shrink-0
                    w-10 h-10 rounded-full
                    ${color}
                    flex items-center justify-center
                    shadow-lg shadow-stone-900/10
                    ring-4 ring-white dark:ring-stone-900
                    group-hover:scale-110
                    transition-transform duration-200
                  `}
                >
                  <Icon className="h-5 w-5 text-white" />
                </div>

                {/* Content */}
                <div className="flex-1 pb-2">
                  <div className="bg-white dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700 p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-semibold text-stone-900 dark:text-stone-100">
                          {event.title}
                        </h4>
                        {event.date && (
                          <p className="text-sm text-stone-600 dark:text-stone-400 flex items-center gap-1.5 mt-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatFlexibleDate({
                              date: event.date,
                              precision: event.datePrecision,
                            })}
                          </p>
                        )}
                        {event.location && (
                          <p className="text-sm text-stone-500 dark:text-stone-400 flex items-center gap-1.5 mt-0.5">
                            <MapPin className="h-3.5 w-3.5" />
                            {event.location}
                          </p>
                        )}
                      </div>
                      {event.historicalContext && (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-xs">
                          <Sparkles className="h-3 w-3" />
                          {event.historicalContext}
                        </div>
                      )}
                    </div>
                    {event.description && (
                      <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
                        {event.description}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </AnimatePresence>

      {/* Add event button */}
      {canUserEdit && showAddButton && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: events.length * 0.1 }}
          className="relative flex gap-4 mt-6"
        >
          <div className="relative z-10 flex-shrink-0 w-10 h-10 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center border-2 border-dashed border-stone-300 dark:border-stone-600">
            <Plus className="h-5 w-5 text-stone-400" />
          </div>
          <div className="flex items-center">
            <Link href={`/people/${person.id}/events/new`}>
              <Button variant="ghost" size="sm" className="text-stone-500 hover:text-stone-700">
                Add life event
              </Button>
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  )
}
