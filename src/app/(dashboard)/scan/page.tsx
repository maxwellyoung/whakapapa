'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { FileText, ArrowRight, Sparkles } from 'lucide-react'
import { useWorkspace } from '@/components/providers/workspace-provider'
import { DocumentScanner } from '@/components/sources/document-scanner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

export default function ScanPage() {
  const { currentWorkspace, loading } = useWorkspace()
  const router = useRouter()
  const [extractedText, setExtractedText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const handleTextExtracted = (text: string) => {
    setExtractedText(text)
  }

  const handleProcessWithAI = async () => {
    if (!currentWorkspace || !extractedText.trim()) return

    setIsProcessing(true)

    try {
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: currentWorkspace.id,
          text: extractedText,
        }),
      })

      if (!response.ok) {
        throw new Error('Extraction failed')
      }

      const data = await response.json()
      toast.success(`Created ${data.suggestions_created} suggestions for review`)
      router.push('/suggestions')
    } catch (error) {
      console.error('AI extraction error:', error)
      toast.error('Failed to process text with AI')
    } finally {
      setIsProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="mx-auto max-w-2xl">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64 mb-8" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!currentWorkspace) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Select a workspace</p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-8"
    >
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
            Scan Documents
          </h1>
          <p className="text-stone-500 dark:text-stone-400 mt-1">
            Extract text from old letters, documents, and photos
          </p>
        </div>

        <div className="space-y-6">
          {/* Document Scanner */}
          <Card>
            <CardContent className="pt-6">
              <DocumentScanner onTextExtracted={handleTextExtracted} />
            </CardContent>
          </Card>

          {/* Extracted Text & AI Processing */}
          {extractedText && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-amber-500" />
                    Process with AI
                  </CardTitle>
                  <CardDescription>
                    Let AI extract names, dates, and relationships from the text
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Extracted Text</Label>
                    <Textarea
                      value={extractedText}
                      onChange={(e) => setExtractedText(e.target.value)}
                      rows={6}
                      placeholder="Text from document will appear here..."
                    />
                  </div>
                  <Button
                    onClick={handleProcessWithAI}
                    disabled={isProcessing || !extractedText.trim()}
                    className="w-full"
                  >
                    {isProcessing ? (
                      <>Processing...</>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Extract with AI
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Tips */}
          <Card className="bg-stone-50 dark:bg-stone-800/50 border-stone-200 dark:border-stone-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">What can you scan?</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-stone-600 dark:text-stone-400">
                <li className="flex items-start gap-2">
                  <FileText className="h-4 w-4 mt-0.5 shrink-0 text-stone-400" />
                  <span>Old letters and correspondence</span>
                </li>
                <li className="flex items-start gap-2">
                  <FileText className="h-4 w-4 mt-0.5 shrink-0 text-stone-400" />
                  <span>Birth, death, and marriage certificates</span>
                </li>
                <li className="flex items-start gap-2">
                  <FileText className="h-4 w-4 mt-0.5 shrink-0 text-stone-400" />
                  <span>Newspaper clippings and obituaries</span>
                </li>
                <li className="flex items-start gap-2">
                  <FileText className="h-4 w-4 mt-0.5 shrink-0 text-stone-400" />
                  <span>Family bibles and records</span>
                </li>
                <li className="flex items-start gap-2">
                  <FileText className="h-4 w-4 mt-0.5 shrink-0 text-stone-400" />
                  <span>Handwritten notes (results may vary)</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  )
}
