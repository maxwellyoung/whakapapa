'use client'

import { useRef } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  BookOpen,
  Quote,
  Heart,
  Utensils,
  Sparkles,
  Calendar,
  TreePine,
  Play,
  Pause,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import type { MemoryType, Person } from '@/types'

interface SharedMemoryViewProps {
  memory: {
    id: string
    memory_type: string
    title: string | null
    content: string
    media_url: string | null
    media_path?: string | null
    media_type: string | null
    duration_seconds: number | null
    contributed_by_name: string | null
  }
  person: Pick<Person, 'id' | 'preferred_name' | 'photo_url' | 'given_names' | 'family_name'>
  workspaceName?: string
}

const memoryTypeConfig: Record<MemoryType, { icon: React.ComponentType<{ className?: string }>; label: string }> = {
  story: { icon: BookOpen, label: 'Story' },
  anecdote: { icon: Sparkles, label: 'Anecdote' },
  quote: { icon: Quote, label: 'Quote' },
  trait: { icon: Heart, label: 'Personality' },
  recipe: { icon: Utensils, label: 'Recipe' },
  tradition: { icon: Calendar, label: 'Tradition' },
}

export function SharedMemoryView({ memory, person, workspaceName }: SharedMemoryViewProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  const config = memoryTypeConfig[memory.memory_type as MemoryType] || memoryTypeConfig.story
  const Icon = config.icon

  const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const toggleAudio = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="archive-public-shell">
      <header className="archive-public-header">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="archive-public-mark">
              <TreePine className="h-4 w-4" aria-hidden="true" />
            </div>
            <span className="font-serif text-xl text-[var(--archive-text)]" translate="no">
              Whakapapa
            </span>
          </div>
          {workspaceName && (
            <span className="text-sm text-[rgba(238,220,184,0.62)]">
              {workspaceName}
            </span>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="archive-artifact"
        >
          <div className="archive-artifact__band p-6">
            <div className="flex items-center gap-3">
              <div className="archive-memory-badge">
                <Icon className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--image-ochre)]">
                  {config.label}
                </span>
                {memory.title && (
                  <h1 className="font-serif text-3xl leading-tight tracking-[-0.035em] text-[var(--archive-text)]">
                    {memory.title}
                  </h1>
                )}
              </div>
            </div>
          </div>

          <div className="archive-artifact__band px-6 py-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 ring-1 ring-[rgba(237,203,136,0.2)]">
                <AvatarImage src={person.photo_url || undefined} alt={person.preferred_name} />
                <AvatarFallback>{getInitials(person.preferred_name)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-[var(--archive-text)]">
                  {person.preferred_name}
                </p>
                {(person.given_names || person.family_name) && (
                  <p className="text-sm text-[rgba(238,220,184,0.58)]">
                    {person.given_names} {person.family_name}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Audio Player (if audio memory) */}
          {memory.media_url && memory.media_type === 'audio' && (
            <div className="archive-artifact__band px-6 py-4">
              <audio
                ref={audioRef}
                src={memory.media_url}
                onEnded={() => setIsPlaying(false)}
                className="hidden"
              />
              <div className="flex items-center gap-3 rounded-xl border border-[rgba(237,203,136,0.16)] bg-[rgba(237,203,136,0.06)] p-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleAudio}
                  className="shrink-0"
                  aria-label={isPlaying ? 'Pause Audio Recording' : 'Play Audio Recording'}
                >
                  {isPlaying ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
                </Button>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[var(--archive-text)]">
                    Audio Recording
                  </p>
                  {memory.duration_seconds && (
                    <p className="text-xs text-[rgba(238,220,184,0.58)]">
                      {formatDuration(memory.duration_seconds)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Memory Content */}
          <div className="p-6">
            <div className={memory.memory_type === 'quote' ? 'border-l-4 border-[var(--image-ochre)] pl-4' : ''}>
              <p className={`whitespace-pre-wrap text-lg leading-relaxed text-[rgba(238,220,184,0.78)] ${
                memory.memory_type === 'quote' ? 'italic' : ''
              }`}>
                {memory.memory_type === 'quote' && '“'}
                {memory.content}
                {memory.memory_type === 'quote' && '”'}
              </p>
            </div>
          </div>

          {memory.contributed_by_name && (
            <div className="px-6 pb-6">
              <p className="text-sm text-[rgba(238,220,184,0.48)]">
                Shared by {memory.contributed_by_name}
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
