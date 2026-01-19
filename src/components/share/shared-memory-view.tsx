'use client'

import { useRef } from 'react'
import { motion } from 'framer-motion'
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
import type { Memory, MemoryType, Person } from '@/types'

interface SharedMemoryViewProps {
  memory: Memory & { person: Person }
  person: Person
  workspaceName?: string
}

const memoryTypeConfig: Record<MemoryType, { icon: React.ComponentType<{ className?: string }>; label: string; color: string; bgColor: string }> = {
  story: { icon: BookOpen, label: 'Story', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/50' },
  anecdote: { icon: Sparkles, label: 'Anecdote', color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/50' },
  quote: { icon: Quote, label: 'Quote', color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900/50' },
  trait: { icon: Heart, label: 'Personality', color: 'text-pink-600', bgColor: 'bg-pink-100 dark:bg-pink-900/50' },
  recipe: { icon: Utensils, label: 'Recipe', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/50' },
  tradition: { icon: Calendar, label: 'Tradition', color: 'text-indigo-600', bgColor: 'bg-indigo-100 dark:bg-indigo-900/50' },
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
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-stone-100 dark:from-stone-950 dark:to-stone-900">
      {/* Header */}
      <header className="border-b border-stone-200 dark:border-stone-800 bg-white/80 dark:bg-stone-900/80 backdrop-blur-md">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-900 dark:bg-stone-100">
              <TreePine className="h-4 w-4 text-stone-50 dark:text-stone-900" />
            </div>
            <span className="font-semibold text-stone-900 dark:text-stone-100">
              Whakapapa
            </span>
          </div>
          {workspaceName && (
            <span className="text-sm text-stone-500 dark:text-stone-400">
              {workspaceName}
            </span>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-stone-800/50 rounded-2xl border border-stone-200 dark:border-stone-700 shadow-xl overflow-hidden"
        >
          {/* Memory Type Header */}
          <div className="p-6 border-b border-stone-100 dark:border-stone-700">
            <div className="flex items-center gap-3">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${config.bgColor}`}>
                <Icon className={`h-6 w-6 ${config.color}`} />
              </div>
              <div>
                <span className="text-sm font-medium text-stone-500 dark:text-stone-400">
                  {config.label}
                </span>
                {memory.title && (
                  <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
                    {memory.title}
                  </h1>
                )}
              </div>
            </div>
          </div>

          {/* Person Attribution */}
          <div className="px-6 py-4 bg-stone-50 dark:bg-stone-800/30 border-b border-stone-100 dark:border-stone-700">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={person.photo_url || undefined} />
                <AvatarFallback>{getInitials(person.preferred_name)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-stone-900 dark:text-stone-100">
                  {person.preferred_name}
                </p>
                {(person.given_names || person.family_name) && (
                  <p className="text-sm text-stone-500 dark:text-stone-400">
                    {person.given_names} {person.family_name}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Audio Player (if audio memory) */}
          {memory.media_url && memory.media_type === 'audio' && (
            <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-700">
              <audio
                ref={audioRef}
                src={memory.media_url}
                onEnded={() => setIsPlaying(false)}
                className="hidden"
              />
              <div className="flex items-center gap-3 p-3 rounded-xl bg-stone-100 dark:bg-stone-700/50">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleAudio}
                  className="shrink-0"
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <div className="flex-1">
                  <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
                    Audio Recording
                  </p>
                  {memory.duration_seconds && (
                    <p className="text-xs text-stone-500">
                      {formatDuration(memory.duration_seconds)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Memory Content */}
          <div className="p-6">
            <div className={memory.memory_type === 'quote' ? 'pl-4 border-l-4 border-amber-400' : ''}>
              <p className={`text-lg leading-relaxed text-stone-700 dark:text-stone-300 whitespace-pre-wrap ${
                memory.memory_type === 'quote' ? 'italic' : ''
              }`}>
                {memory.memory_type === 'quote' && '"'}
                {memory.content}
                {memory.memory_type === 'quote' && '"'}
              </p>
            </div>
          </div>

          {/* Footer */}
          {memory.contributed_by_name && (
            <div className="px-6 pb-6">
              <p className="text-sm text-stone-400 dark:text-stone-500">
                — Shared by {memory.contributed_by_name}
              </p>
            </div>
          )}
        </motion.div>

        {/* Call to Action */}
        <div className="mt-8 text-center">
          <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">
            Preserving family stories with Whakapapa
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100"
          >
            <TreePine className="h-4 w-4" />
            Start your family tree
          </a>
        </div>
      </main>
    </div>
  )
}
