'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageCircle,
  Mic,
  MicOff,
  Play,
  Pause,
  Square,
  Check,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Clock,
  User,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useWorkspace } from '@/components/providers/workspace-provider'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { canEdit } from '@/lib/permissions'
import { toast } from 'sonner'
import type { InterviewPrompt, InterviewResponse, InterviewCategory, Person } from '@/types'

interface InterviewPromptsProps {
  person: Person
}

const categoryConfig: Record<InterviewCategory, { label: string; description: string; color: string }> = {
  childhood: { label: 'Childhood', description: 'Early life and growing up', color: 'bg-green-500' },
  family: { label: 'Family', description: 'Marriage, children, traditions', color: 'bg-pink-500' },
  career: { label: 'Career & Life', description: 'Work and life journey', color: 'bg-blue-500' },
  memories: { label: 'Memories', description: 'Special moments and people', color: 'bg-purple-500' },
  traditions: { label: 'Traditions', description: 'Beliefs and customs', color: 'bg-amber-500' },
  advice: { label: 'Wisdom & Legacy', description: 'Lessons and legacy', color: 'bg-indigo-500' },
}

export function InterviewPrompts({ person }: InterviewPromptsProps) {
  const { currentWorkspace, userRole } = useWorkspace()
  const [prompts, setPrompts] = useState<InterviewPrompt[]>([])
  const [responses, setResponses] = useState<InterviewResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedCategory, setExpandedCategory] = useState<InterviewCategory | null>(null)
  const [activePrompt, setActivePrompt] = useState<InterviewPrompt | null>(null)
  const [responseText, setResponseText] = useState('')
  const [answeredBy, setAnsweredBy] = useState('')
  const [saving, setSaving] = useState(false)

  // Recording state
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const canUserEdit = userRole && canEdit(userRole)

  useEffect(() => {
    async function fetchData() {
      if (!currentWorkspace) return

      const supabase = createClient()

      // Fetch prompts (system + workspace custom)
      const { data: promptsData } = await supabase
        .from('interview_prompts')
        .select('*')
        .or(`is_system.eq.true,workspace_id.eq.${currentWorkspace.id}`)
        .order('sort_order')

      // Fetch existing responses for this person
      const { data: responsesData } = await supabase
        .from('interview_responses')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .eq('person_id', person.id)

      if (promptsData) setPrompts(promptsData as InterviewPrompt[])
      if (responsesData) setResponses(responsesData as InterviewResponse[])
      setLoading(false)
    }

    fetchData()
  }, [currentWorkspace, person.id])

  const getResponseForPrompt = (promptId: string) => {
    return responses.find((r) => r.prompt_id === promptId)
  }

  const getCompletedCount = (category: InterviewCategory) => {
    const categoryPrompts = prompts.filter((p) => p.category === category)
    const completed = categoryPrompts.filter((p) => getResponseForPrompt(p.id)).length
    return { completed, total: categoryPrompts.length }
  }

  const handleSaveResponse = async () => {
    if (!currentWorkspace || !activePrompt || !responseText.trim()) return

    setSaving(true)
    const supabase = createClient()

    const existingResponse = getResponseForPrompt(activePrompt.id)

    if (existingResponse) {
      // Update existing
      const { error } = await supabase
        .from('interview_responses')
        .update({
          response: responseText.trim(),
          answered_by_name: answeredBy.trim() || null,
          status: 'transcribed',
        })
        .eq('id', existingResponse.id)

      if (error) {
        toast.error('Failed to save response')
        setSaving(false)
        return
      }

      setResponses(responses.map((r) =>
        r.id === existingResponse.id
          ? { ...r, response: responseText.trim(), answered_by_name: answeredBy.trim() || null, status: 'transcribed' as const }
          : r
      ))
    } else {
      // Create new
      const { data, error } = await supabase
        .from('interview_responses')
        .insert({
          workspace_id: currentWorkspace.id,
          prompt_id: activePrompt.id,
          person_id: person.id,
          question: activePrompt.question,
          response: responseText.trim(),
          answered_by_name: answeredBy.trim() || null,
          status: 'transcribed',
        })
        .select()
        .single()

      if (error) {
        toast.error('Failed to save response')
        setSaving(false)
        return
      }

      setResponses([...responses, data as InterviewResponse])
    }

    setSaving(false)
    setActivePrompt(null)
    setResponseText('')
    setAnsweredBy('')
    toast.success('Response saved')
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data)
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      timerRef.current = setInterval(() => {
        setRecordingTime((t) => t + 1)
      }, 1000)
    } catch {
      toast.error('Could not access microphone')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop())
      setIsRecording(false)
      if (timerRef.current) clearInterval(timerRef.current)
      toast.success('Recording saved. Add a written response or transcribe later.')
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse rounded-xl border border-stone-200 dark:border-stone-700 p-4">
            <div className="h-5 w-32 bg-stone-200 dark:bg-stone-700 rounded mb-2" />
            <div className="h-3 w-48 bg-stone-100 dark:bg-stone-800 rounded" />
          </div>
        ))}
      </div>
    )
  }

  const totalCompleted = responses.length
  const totalPrompts = prompts.length
  const progressPercent = totalPrompts > 0 ? (totalCompleted / totalPrompts) * 100 : 0

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="font-semibold text-stone-900 dark:text-stone-100">Interview Questions</h3>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              Guided questions to ask {person.preferred_name} or family members about them
            </p>
          </div>
          <Badge variant="secondary" className="tabular-nums">
            {totalCompleted} / {totalPrompts}
          </Badge>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {/* Active prompt modal */}
      <AnimatePresence>
        {activePrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setActivePrompt(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-stone-900 rounded-2xl shadow-xl max-w-lg w-full p-6"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/50">
                  <MessageCircle className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-stone-900 dark:text-stone-100 text-lg">
                    {activePrompt.question}
                  </h4>
                  {activePrompt.description && (
                    <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
                      {activePrompt.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Recording controls */}
              <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-stone-50 dark:bg-stone-800">
                {isRecording ? (
                  <>
                    <Button variant="destructive" size="icon" onClick={stopRecording} aria-label="Stop recording">
                      <Square className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                      <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="font-mono text-sm">{formatTime(recordingTime)}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <Button variant="outline" size="icon" onClick={startRecording} aria-label="Start recording">
                      <Mic className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-stone-500 dark:text-stone-400">
                      Record their answer
                    </span>
                  </>
                )}
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Written Response</Label>
                  <Textarea
                    placeholder="Type or transcribe the answer..."
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    rows={5}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Who answered?</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                    <Input
                      placeholder={`e.g., ${person.preferred_name}, Aunt Mary`}
                      value={answeredBy}
                      onChange={(e) => setAnsweredBy(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={() => setActivePrompt(null)} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={handleSaveResponse} disabled={saving || !responseText.trim()} className="flex-1">
                    {saving ? 'Saving...' : 'Save Response'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Categories */}
      <div className="space-y-3">
        {(Object.keys(categoryConfig) as InterviewCategory[]).map((category) => {
          const config = categoryConfig[category]
          const categoryPrompts = prompts.filter((p) => p.category === category)
          const { completed, total } = getCompletedCount(category)
          const isExpanded = expandedCategory === category

          if (categoryPrompts.length === 0) return null

          return (
            <div key={category} className="rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden">
              {/* Category header */}
              <button
                onClick={() => setExpandedCategory(isExpanded ? null : category)}
                className="w-full flex items-center justify-between p-4 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`h-3 w-3 rounded-full ${config.color}`} />
                  <div className="text-left">
                    <h4 className="font-medium text-stone-900 dark:text-stone-100">{config.label}</h4>
                    <p className="text-sm text-stone-500 dark:text-stone-400">{config.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={completed === total ? 'default' : 'secondary'} className="tabular-nums">
                    {completed}/{total}
                  </Badge>
                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5 text-stone-400" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-stone-400" />
                  )}
                </div>
              </button>

              {/* Expanded prompts */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-stone-200 dark:border-stone-700"
                  >
                    <div className="p-2">
                      {categoryPrompts.map((prompt) => {
                        const response = getResponseForPrompt(prompt.id)
                        const hasResponse = !!response?.response

                        return (
                          <button
                            key={prompt.id}
                            onClick={() => {
                              setActivePrompt(prompt)
                              setResponseText(response?.response || '')
                              setAnsweredBy(response?.answered_by_name || '')
                            }}
                            disabled={!canUserEdit}
                            className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors text-left"
                          >
                            <div className={`mt-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                              hasResponse
                                ? 'border-green-500 bg-green-500'
                                : 'border-stone-300 dark:border-stone-600'
                            }`}>
                              {hasResponse && <Check className="h-3 w-3 text-white" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm ${
                                hasResponse
                                  ? 'text-stone-500 dark:text-stone-400'
                                  : 'text-stone-900 dark:text-stone-100'
                              }`}>
                                {prompt.question}
                              </p>
                              {hasResponse && response.answered_by_name && (
                                <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">
                                  Answered by {response.answered_by_name}
                                </p>
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </div>
  )
}
