'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, MapPin, FileText, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useWorkspace } from '@/components/providers/workspace-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
import type { Person, EventType, DatePrecision } from '@/types'

const eventTypes: { value: EventType; label: string; description: string }[] = [
  { value: 'marriage', label: 'Marriage', description: 'Wedding or civil union' },
  { value: 'divorce', label: 'Divorce', description: 'End of marriage' },
  { value: 'baptism', label: 'Baptism/Christening', description: 'Religious ceremony' },
  { value: 'graduation', label: 'Graduation', description: 'Educational achievement' },
  { value: 'immigration', label: 'Immigration', description: 'Moved to a new country' },
  { value: 'emigration', label: 'Emigration', description: 'Left a country' },
  { value: 'military_service', label: 'Military Service', description: 'Joined or served in military' },
  { value: 'occupation', label: 'Occupation/Career', description: 'Job or career change' },
  { value: 'residence', label: 'Residence', description: 'Moved to a new home' },
  { value: 'census', label: 'Census Record', description: 'Recorded in census' },
  { value: 'burial', label: 'Burial', description: 'Final resting place' },
  { value: 'other', label: 'Other Event', description: 'Any other significant event' },
]

const datePrecisions: { value: DatePrecision; label: string }[] = [
  { value: 'exact', label: 'Exact date' },
  { value: 'month', label: 'Month & year only' },
  { value: 'year', label: 'Year only' },
  { value: 'circa', label: 'Approximate' },
  { value: 'unknown', label: 'Unknown' },
]

export default function NewEventPage() {
  const params = useParams()
  const router = useRouter()
  const personId = params.id as string
  const { currentWorkspace } = useWorkspace()

  const [person, setPerson] = useState<Person | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [eventType, setEventType] = useState<EventType>('other')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [datePrecision, setDatePrecision] = useState<DatePrecision>('exact')
  const [location, setLocation] = useState('')

  useEffect(() => {
    async function fetchPerson() {
      if (!currentWorkspace) return

      const supabase = createClient()
      const { data } = await supabase
        .from('people')
        .select('*')
        .eq('id', personId)
        .eq('workspace_id', currentWorkspace.id)
        .single()

      if (data) {
        setPerson(data)
      }
      setLoading(false)
    }

    fetchPerson()
  }, [personId, currentWorkspace])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentWorkspace || !person) return

    setSaving(true)
    const supabase = createClient()

    try {
      // Create the event
      const { data: event, error: eventError } = await supabase
        .from('events')
        .insert({
          workspace_id: currentWorkspace.id,
          event_type: eventType,
          title: title || null,
          description: description || null,
          event_date: eventDate || null,
          event_date_precision: datePrecision,
          location: location || null,
        })
        .select('id')
        .single()

      if (eventError) throw eventError

      // Link event to person
      const { error: participantError } = await supabase
        .from('event_participants')
        .insert({
          event_id: event.id,
          person_id: personId,
          role: 'primary',
        })

      if (participantError) throw participantError

      toast.success('Event added to timeline')
      router.push(`/people/${personId}`)
    } catch (error) {
      console.error('Error creating event:', error)
      toast.error('Failed to create event')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-stone-400" />
      </div>
    )
  }

  if (!person) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Person not found</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/people/${personId}`}
            className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {person.preferred_name}
          </Link>
          <h1 className="text-2xl font-bold">Add Life Event</h1>
          <p className="text-muted-foreground">
            Record a significant event in {person.preferred_name}&apos;s life
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Event Details</CardTitle>
              <CardDescription>
                Choose an event type and provide as much detail as you have
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Event Type */}
              <div className="space-y-2">
                <Label>Event Type</Label>
                <Select value={eventType} onValueChange={(v) => setEventType(v as EventType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {eventTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div>
                          <p>{type.label}</p>
                          <p className="text-xs text-stone-500">{type.description}</p>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Title (optional) */}
              <div className="space-y-2">
                <Label htmlFor="title">Title (optional)</Label>
                <Input
                  id="title"
                  placeholder="e.g., Graduated from University of Auckland"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <p className="text-xs text-stone-500">
                  Leave blank to use the event type as the title
                </p>
              </div>

              {/* Date */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                    <Input
                      id="date"
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Date Precision</Label>
                  <Select value={datePrecision} onValueChange={(v) => setDatePrecision(v as DatePrecision)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {datePrecisions.map((precision) => (
                        <SelectItem key={precision.value} value={precision.value}>
                          {precision.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                  <Input
                    id="location"
                    placeholder="e.g., Auckland, New Zealand"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-4 w-4 text-stone-400" />
                  <Textarea
                    id="description"
                    placeholder="Add any additional details about this event..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="pl-9 min-h-[100px]"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving} className="flex-1">
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Add Event'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  )
}
