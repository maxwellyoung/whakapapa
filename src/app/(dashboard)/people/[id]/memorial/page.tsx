'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Heart,
  Calendar,
  MapPin,
  Flower2,
  Plus,
  Quote,
  Share2,
  Printer,
  User,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useWorkspace } from '@/components/providers/workspace-provider'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { formatFlexibleDate } from '@/lib/dates'
import { canEdit } from '@/lib/permissions'
import { toast } from 'sonner'
import type { Person, Memory, MemorialTribute } from '@/types'

export default function MemorialPage() {
  const params = useParams()
  const router = useRouter()
  const personId = params.id as string
  const { currentWorkspace, userRole } = useWorkspace()

  const [person, setPerson] = useState<Person | null>(null)
  const [memories, setMemories] = useState<Memory[]>([])
  const [tributes, setTributes] = useState<MemorialTribute[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // Tribute form
  const [tributeMessage, setTributeMessage] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [authorRelation, setAuthorRelation] = useState('')

  const canUserEdit = userRole && canEdit(userRole)

  useEffect(() => {
    async function fetchData() {
      if (!currentWorkspace) return

      const supabase = createClient()

      // Fetch person
      const { data: personData } = await supabase
        .from('people')
        .select('*')
        .eq('id', personId)
        .eq('workspace_id', currentWorkspace.id)
        .single()

      if (personData) {
        setPerson(personData)
      }

      // Fetch memories
      const { data: memoriesData } = await supabase
        .from('memories')
        .select('*')
        .eq('person_id', personId)
        .order('created_at', { ascending: false })
        .limit(6)

      if (memoriesData) {
        setMemories(memoriesData as Memory[])
      }

      // Fetch tributes
      const { data: tributesData } = await supabase
        .from('memorial_tributes')
        .select('*')
        .eq('person_id', personId)
        .eq('is_approved', true)
        .order('created_at', { ascending: false })

      if (tributesData) {
        setTributes(tributesData as MemorialTribute[])
      }

      setLoading(false)
    }

    fetchData()
  }, [currentWorkspace, personId])

  const handleSubmitTribute = async () => {
    if (!currentWorkspace || !tributeMessage.trim() || !authorName.trim()) return

    setSaving(true)
    const supabase = createClient()

    const { data, error } = await supabase
      .from('memorial_tributes')
      .insert({
        workspace_id: currentWorkspace.id,
        person_id: personId,
        message: tributeMessage.trim(),
        author_name: authorName.trim(),
        author_relation: authorRelation.trim() || null,
        is_approved: true,
      })
      .select()
      .single()

    setSaving(false)

    if (error) {
      toast.error('Failed to add tribute')
      return
    }

    setTributes([data as MemorialTribute, ...tributes])
    setDialogOpen(false)
    setTributeMessage('')
    setAuthorName('')
    setAuthorRelation('')
    toast.success('Tribute added')
  }

  const handlePrint = () => {
    window.print()
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `In Loving Memory of ${person?.preferred_name}`,
          url: window.location.href,
        })
      } catch {
        // User cancelled or error
      }
    } else {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied to clipboard')
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-stone-300 border-t-stone-600 rounded-full" />
      </div>
    )
  }

  if (!person) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-stone-400">Person not found</p>
      </div>
    )
  }

  const birthDate = formatFlexibleDate({
    date: person.birth_date,
    precision: person.birth_date_precision,
  })

  const deathDate = formatFlexibleDate({
    date: person.death_date,
    precision: person.death_date_precision,
  })

  const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-stone-100 dark:from-stone-950 dark:to-stone-900">
      {/* Header with back button */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-stone-900/80 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 print:hidden">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href={`/people/${personId}`}
            className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to profile
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-1.5" />
              Share
            </Button>
            <Button variant="ghost" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-1.5" />
              Print
            </Button>
          </div>
        </div>
      </div>

      {/* Memorial content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Hero section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          {/* Photo */}
          <div className="mx-auto mb-6">
            <Avatar className="h-40 w-40 ring-4 ring-white dark:ring-stone-800 shadow-xl mx-auto">
              <AvatarImage src={person.photo_url || undefined} />
              <AvatarFallback className="text-4xl bg-gradient-to-br from-stone-200 to-stone-300 dark:from-stone-700 dark:to-stone-600">
                {getInitials(person.preferred_name)}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Name */}
          <h1 className="text-4xl font-serif font-semibold text-stone-900 dark:text-stone-100 mb-2">
            {person.preferred_name}
          </h1>

          {/* Full name if different */}
          {person.given_names && person.family_name && (
            <p className="text-lg text-stone-500 dark:text-stone-400 mb-4">
              {person.given_names} {person.family_name}
            </p>
          )}

          {/* Dates */}
          <p className="text-lg text-stone-600 dark:text-stone-400 flex items-center justify-center gap-2">
            <Flower2 className="h-5 w-5 text-stone-400" />
            {birthDate !== 'Unknown' ? birthDate : '?'} — {deathDate !== 'Unknown' ? deathDate : '?'}
          </p>

          {/* Places */}
          {(person.birth_place || person.death_place) && (
            <p className="text-stone-500 dark:text-stone-400 mt-2 flex items-center justify-center gap-2">
              <MapPin className="h-4 w-4" />
              {person.birth_place && person.death_place
                ? `${person.birth_place} — ${person.death_place}`
                : person.birth_place || person.death_place}
            </p>
          )}

          {/* Memorial message */}
          {(person as Person & { memorial_message?: string }).memorial_message && (
            <blockquote className="mt-8 max-w-2xl mx-auto text-lg text-stone-600 dark:text-stone-400 italic">
              "{(person as Person & { memorial_message?: string }).memorial_message}"
            </blockquote>
          )}
        </motion.div>

        {/* Bio */}
        {person.bio && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-12"
          >
            <div className="prose prose-stone dark:prose-invert max-w-none">
              <p className="text-lg leading-relaxed">{person.bio}</p>
            </div>
          </motion.section>
        )}

        {/* Memories */}
        {memories.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-serif font-semibold text-stone-900 dark:text-stone-100 mb-6 flex items-center gap-2">
              <Heart className="h-6 w-6 text-pink-500" />
              Stories & Memories
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {memories.map((memory, index) => (
                <motion.div
                  key={memory.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="p-4 rounded-xl bg-white dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700"
                >
                  {memory.title && (
                    <h3 className="font-medium text-stone-900 dark:text-stone-100 mb-2">
                      {memory.title}
                    </h3>
                  )}
                  <p className={`text-stone-600 dark:text-stone-400 ${
                    memory.memory_type === 'quote' ? 'italic' : ''
                  }`}>
                    {memory.memory_type === 'quote' && '"'}
                    {memory.content}
                    {memory.memory_type === 'quote' && '"'}
                  </p>
                  {memory.contributed_by_name && (
                    <p className="mt-2 text-sm text-stone-400">
                      — {memory.contributed_by_name}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Tributes */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-12"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-serif font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Quote className="h-6 w-6 text-indigo-500" />
              Tributes
            </h2>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="print:hidden">
                  <Plus className="h-4 w-4 mr-1.5" />
                  Add Tribute
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Share a Tribute</DialogTitle>
                  <DialogDescription>
                    Share a memory, message, or tribute to {person.preferred_name}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Your Message</Label>
                    <Textarea
                      placeholder="Share your memory or tribute..."
                      value={tributeMessage}
                      onChange={(e) => setTributeMessage(e.target.value)}
                      rows={5}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Your Name</Label>
                      <Input
                        placeholder="Your name"
                        value={authorName}
                        onChange={(e) => setAuthorName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Relationship (optional)</Label>
                      <Input
                        placeholder="e.g., Grandson, Niece"
                        value={authorRelation}
                        onChange={(e) => setAuthorRelation(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSubmitTribute}
                      disabled={saving || !tributeMessage.trim() || !authorName.trim()}
                      className="flex-1"
                    >
                      {saving ? 'Saving...' : 'Submit Tribute'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {tributes.length === 0 ? (
            <div className="text-center py-12 rounded-xl border border-dashed border-stone-200 dark:border-stone-700">
              <Quote className="h-10 w-10 text-stone-300 dark:text-stone-600 mx-auto mb-3" />
              <p className="text-stone-500 dark:text-stone-400 mb-2">No tributes yet</p>
              <p className="text-sm text-stone-400 dark:text-stone-500">
                Be the first to share a memory or tribute
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {tributes.map((tribute, index) => (
                <motion.div
                  key={tribute.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index }}
                  className="p-6 rounded-xl bg-white dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700"
                >
                  <blockquote className="text-lg text-stone-700 dark:text-stone-300 mb-4 leading-relaxed">
                    "{tribute.message}"
                  </blockquote>
                  <footer className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-stone-100 dark:bg-stone-700 flex items-center justify-center">
                      <User className="h-5 w-5 text-stone-500 dark:text-stone-400" />
                    </div>
                    <div>
                      <p className="font-medium text-stone-900 dark:text-stone-100">
                        {tribute.author_name}
                      </p>
                      {tribute.author_relation && (
                        <p className="text-sm text-stone-500 dark:text-stone-400">
                          {tribute.author_relation}
                        </p>
                      )}
                    </div>
                  </footer>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>

        {/* Footer */}
        <div className="text-center text-stone-400 dark:text-stone-500 text-sm border-t border-stone-200 dark:border-stone-700 pt-8 print:hidden">
          <p>Created with love using Whakapapa</p>
        </div>
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  )
}
