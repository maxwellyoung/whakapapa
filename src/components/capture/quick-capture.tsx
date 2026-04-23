'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Upload,
  FileText,
  Image as ImageIcon,
  X,
  Loader2,
  CheckCircle,
  ArrowRight,
  Users,
  Calendar,
  MapPin,
} from 'lucide-react'
import { useWorkspace } from '@/components/providers/workspace-provider'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { getErrorToast } from '@/lib/errors'
import Link from 'next/link'

interface ExtractedPerson {
  name: string
  birth_date?: string
  death_date?: string
  birth_place?: string
  confidence: number
}

interface ExtractionResult {
  people: ExtractedPerson[]
  events: { type: string; date?: string; participants: string[] }[]
  notes: string[]
  relationships?: { from_name: string; to_name: string; type: string }[]
}

export function QuickCapture() {
  const { currentWorkspace } = useWorkspace()
  const [text, setText] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<ExtractionResult | null>(null)
  const [suggestionsCreated, setSuggestionsCreated] = useState(0)
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textAreaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const handler = () => {
      setResult(null)
      textAreaRef.current?.focus()
      textAreaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    window.addEventListener('open-quick-capture', handler)
    return () => window.removeEventListener('open-quick-capture', handler)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      handleFile(droppedFile)
    }
  }, [])

  const handleFile = async (file: File) => {
    setFile(file)

    // For text files, read content directly
    if (file.type === 'text/plain') {
      const text = await file.text()
      setText(text)
    }
    // For images, we'd do OCR (placeholder for now)
    else if (file.type.startsWith('image/')) {
      toast.info('Image uploaded. Reading text from images is coming soon - for now, please type or paste the text.')
    }
  }

  const handleExtract = async () => {
    if (!currentWorkspace || !text.trim()) return

    setIsProcessing(true)
    setResult(null)

    try {
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: currentWorkspace.id,
          text: text.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Extraction failed')
      }

      setResult(data.extraction)
      setSuggestionsCreated(data.suggestions_created)

      if (data.suggestions_created > 0) {
        toast.success(
          `Found ${data.extraction.people.length} people! Created ${data.suggestions_created} suggestions for review.`
        )
      } else {
        toast.info('No people found in the text. Try adding more detail.')
      }
    } catch (error) {
      // Log error details for development only
      if (process.env.NODE_ENV === 'development') {
        console.error('Extract error:', error)
      }
      toast.error(getErrorToast('process_text'))
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReset = () => {
    setText('')
    setFile(null)
    setResult(null)
    setSuggestionsCreated(0)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="atlas-panel rounded-[1.5rem] p-6"
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="atlas-brand-mark flex h-10 w-10 items-center justify-center rounded-xl">
          <Sparkles className="h-5 w-5 text-[var(--atlas-paper-strong)]" />
        </div>
        <div>
          <p className="atlas-label mb-1">Field notes</p>
          <h2 className="font-serif text-xl font-semibold text-[var(--atlas-ink)]">
            Quick Capture
          </h2>
          <p className="text-sm text-[var(--atlas-copy)]">
            Paste text or drop a document. The archive reads names, dates, and places from the source.
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!result ? (
          <motion.div
            key="input"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Drop zone / Text area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                'relative rounded-[1.35rem] border-2 border-dashed transition-[background-color,border-color,box-shadow] duration-200',
                isDragging
                  ? 'border-[var(--atlas-ochre)] bg-[rgba(194,139,63,0.1)] shadow-[0_18px_40px_rgba(194,139,63,0.12)]'
                  : 'border-[var(--atlas-line)] bg-[rgba(255,249,238,0.42)]'
              )}
            >
              {isDragging && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[1.2rem] bg-[rgba(255,244,217,0.86)]">
                  <div className="flex flex-col items-center gap-2 text-[var(--atlas-ochre)]">
                    <Upload className="h-8 w-8" />
                    <span className="font-medium">Drop into the archive</span>
                  </div>
                </div>
              )}

              <Textarea
                ref={textAreaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste text from a document, letter, birth certificate, obituary...

Example:
John Robert Smith (1880-1952) was born in Timaru, New Zealand to William Smith and Elizabeth Brown. He married Mary Jane Wilson on 15 March 1905 in Christchurch. They had three children: William (b. 1906), Margaret (b. 1908), and Thomas (b. 1912)."
                className="min-h-[210px] resize-none border-0 bg-transparent shadow-none focus:ring-0"
                disabled={isProcessing}
              />

              {/* File indicator */}
              {file && (
                <div className="flex items-center gap-2 border-t border-[var(--atlas-line)] px-3 py-2">
                  {file.type.startsWith('image/') ? (
                    <ImageIcon className="h-4 w-4 text-[var(--atlas-muted)]" />
                  ) : (
                    <FileText className="h-4 w-4 text-[var(--atlas-muted)]" />
                  )}
                  <span className="flex-1 truncate text-sm text-[var(--atlas-copy)]">
                    {file.name}
                  </span>
                  <button
                    onClick={() => setFile(null)}
                    className="rounded p-1 hover:bg-[var(--atlas-accent-soft)]"
                  >
                    <X className="h-3 w-3 text-[var(--atlas-muted)]" />
                  </button>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.pdf,image/*"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  className="hidden"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload file
                </Button>
              </div>

              <Button
                onClick={handleExtract}
                disabled={isProcessing || !text.trim()}
                className="gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Reading...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Find people &amp; dates
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Success header */}
            <div className="flex items-center gap-3 rounded-[1.2rem] border border-[rgba(91,119,83,0.18)] bg-[rgba(91,119,83,0.1)] p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(91,119,83,0.14)]">
                <CheckCircle className="h-5 w-5 text-[var(--atlas-jade)]" />
              </div>
              <div>
                <p className="font-medium text-[var(--atlas-ink)]">
                  Extraction Complete
                </p>
                <p className="text-sm text-[var(--atlas-copy)]">
                  {result.people.length} people found, {suggestionsCreated} suggestions created
                </p>
              </div>
            </div>

            {/* Extracted people preview */}
            {result.people.length > 0 && (
              <div className="space-y-2">
                <h3 className="flex items-center gap-2 text-sm font-medium text-[var(--atlas-copy)]">
                  <Users className="h-4 w-4" />
                  People Found
                </h3>
                <div className="grid gap-2">
                  {result.people.slice(0, 5).map((person, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-xl border border-[var(--atlas-line)] bg-[rgba(255,249,238,0.58)] p-3"
                    >
                      <div>
                        <p className="font-medium text-[var(--atlas-ink)]">
                          {person.name}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-[var(--atlas-muted)]">
                          {(person.birth_date || person.death_date) && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {person.birth_date || '?'} – {person.death_date || '?'}
                            </span>
                          )}
                          {person.birth_place && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {person.birth_place}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-[var(--atlas-muted)]">
                        {person.confidence >= 0.8
                          ? 'High'
                          : person.confidence >= 0.5
                          ? 'Medium'
                          : 'Low'}
                      </div>
                    </div>
                  ))}
                  {result.people.length > 5 && (
                    <p className="text-center text-sm text-[var(--atlas-muted)]">
                      +{result.people.length - 5} more
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Notes from AI */}
            {result.notes && result.notes.length > 0 && (
              <div className="rounded-xl border border-[rgba(194,139,63,0.2)] bg-[rgba(194,139,63,0.1)] p-3">
                <p className="text-sm text-[var(--atlas-ochre)]">
                  {result.notes[0]}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <Button variant="ghost" onClick={handleReset}>
                Extract more
              </Button>
              <Link href="/suggestions">
                <Button className="gap-2">
                  Review suggestions
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
