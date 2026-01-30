'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic,
  Square,
  X,
  Check,
  Pause,
  Play,
  Trash2,
  Loader2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useWorkspace } from '@/components/providers/workspace-provider'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { canEdit } from '@/lib/permissions'
import { toast } from 'sonner'
import type { Person } from '@/types'

interface QuickVoiceRecorderProps {
  person: Person
  onMemoryAdded?: () => void
}

export function QuickVoiceRecorder({ person, onMemoryAdded }: QuickVoiceRecorderProps) {
  const { currentWorkspace, userRole } = useWorkspace()
  const [isOpen, setIsOpen] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [transcription, setTranscription] = useState('')
  const [contributedBy, setContributedBy] = useState('')

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const canUserEdit = userRole && canEdit(userRole)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (audioUrl) URL.revokeObjectURL(audioUrl)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [audioUrl])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
      }

      mediaRecorder.start(1000) // Collect data every second
      setIsRecording(true)
      setIsPaused(false)
      setRecordingTime(0)

      timerRef.current = setInterval(() => {
        setRecordingTime((t) => t + 1)
      }, 1000)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Microphone error:', error)
      toast.error('Could not access microphone. Please check permissions.')
    }
  }

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.pause()
      setIsPaused(true)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isPaused) {
      mediaRecorderRef.current.resume()
      setIsPaused(false)
      timerRef.current = setInterval(() => {
        setRecordingTime((t) => t + 1)
      }, 1000)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      streamRef.current?.getTracks().forEach(track => track.stop())
      setIsRecording(false)
      setIsPaused(false)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }

  const discardRecording = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioBlob(null)
    setAudioUrl(null)
    setRecordingTime(0)
    setTitle('')
    setTranscription('')
    setContributedBy('')
  }

  const togglePlayback = () => {
    if (!audioRef.current || !audioUrl) return

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleSave = async () => {
    if (!currentWorkspace || !audioBlob) return

    setSaving(true)
    const supabase = createClient()

    try {
      // Upload audio file
      const fileName = `${currentWorkspace.id}/${person.id}/${Date.now()}.webm`
      const { error: uploadError } = await supabase.storage
        .from('sources')
        .upload(fileName, audioBlob, {
          contentType: 'audio/webm',
          cacheControl: '3600',
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage.from('sources').getPublicUrl(fileName)

      // Create memory record
      const { error: memoryError } = await supabase
        .from('memories')
        .insert({
          workspace_id: currentWorkspace.id,
          person_id: person.id,
          title: title.trim() || `Voice recording - ${new Date().toLocaleDateString()}`,
          content: transcription.trim() || '[Audio recording - transcription pending]',
          memory_type: 'story',
          media_url: urlData.publicUrl,
          media_type: 'audio',
          duration_seconds: recordingTime,
          contributed_by_name: contributedBy.trim() || null,
        })

      if (memoryError) throw memoryError

      toast.success('Voice memory saved!')
      discardRecording()
      setIsOpen(false)
      onMemoryAdded?.()
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Save error:', error)
      toast.error('Failed to save recording')
    } finally {
      setSaving(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!canUserEdit) return null

  return (
    <>
      {/* Floating Record Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white shadow-lg hover:bg-red-600 transition-colors print:hidden"
        aria-label="Record voice memory"
      >
        <Mic className="h-6 w-6" />
      </motion.button>

      {/* Recording Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => !isRecording && !audioBlob && setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-stone-900 rounded-2xl shadow-xl max-w-md w-full p-6"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
                  Record a Memory
                </h3>
                <button
                  onClick={() => {
                    if (isRecording) stopRecording()
                    discardRecording()
                    setIsOpen(false)
                  }}
                  className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <p className="text-sm text-stone-500 dark:text-stone-400 mb-6">
                Record a story, memory, or anything about {person.preferred_name}
              </p>

              {/* Recording Interface */}
              {!audioBlob ? (
                <div className="text-center py-8">
                  {/* Waveform Animation */}
                  <div className="flex items-center justify-center gap-1 h-16 mb-4">
                    {isRecording ? (
                      [...Array(5)].map((_, i) => (
                        <motion.div
                          key={i}
                          animate={{
                            height: isPaused ? 16 : [16, 40, 24, 48, 16],
                          }}
                          transition={{
                            duration: 0.5,
                            repeat: Infinity,
                            delay: i * 0.1,
                          }}
                          className="w-2 bg-red-500 rounded-full"
                        />
                      ))
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                        <Mic className="h-8 w-8 text-red-500" />
                      </div>
                    )}
                  </div>

                  {/* Timer */}
                  {isRecording && (
                    <p className="text-2xl font-mono font-semibold text-stone-900 dark:text-stone-100 mb-4">
                      {formatTime(recordingTime)}
                    </p>
                  )}

                  {/* Controls */}
                  <div className="flex items-center justify-center gap-3">
                    {!isRecording ? (
                      <Button onClick={startRecording} size="lg" className="gap-2">
                        <Mic className="h-5 w-5" />
                        Start Recording
                      </Button>
                    ) : (
                      <>
                        {isPaused ? (
                          <Button onClick={resumeRecording} variant="outline" size="icon">
                            <Play className="h-5 w-5" />
                          </Button>
                        ) : (
                          <Button onClick={pauseRecording} variant="outline" size="icon">
                            <Pause className="h-5 w-5" />
                          </Button>
                        )}
                        <Button onClick={stopRecording} variant="destructive" size="lg" className="gap-2">
                          <Square className="h-4 w-4" />
                          Stop
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                /* Review & Save Interface */
                <div className="space-y-4">
                  {/* Audio Player */}
                  <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800">
                    <audio
                      ref={audioRef}
                      src={audioUrl || undefined}
                      onEnded={() => setIsPlaying(false)}
                      className="hidden"
                    />
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={togglePlayback}
                      >
                        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
                          Recording ({formatTime(recordingTime)})
                        </p>
                        <p className="text-xs text-stone-500">Click play to review</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={discardRecording}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Title */}
                  <div className="space-y-2">
                    <Label htmlFor="title">Title (optional)</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Story about the farm"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  {/* Transcription */}
                  <div className="space-y-2">
                    <Label htmlFor="transcription">
                      Transcription / Notes (optional)
                    </Label>
                    <Textarea
                      id="transcription"
                      placeholder="Add a written version or notes about this recording..."
                      value={transcription}
                      onChange={(e) => setTranscription(e.target.value)}
                      rows={3}
                    />
                  </div>

                  {/* Contributed By */}
                  <div className="space-y-2">
                    <Label htmlFor="contributedBy">Who recorded this?</Label>
                    <Input
                      id="contributedBy"
                      placeholder="e.g., Dad, Aunt Mary"
                      value={contributedBy}
                      onChange={(e) => setContributedBy(e.target.value)}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        discardRecording()
                        setIsOpen(false)
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex-1"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Save Memory
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
