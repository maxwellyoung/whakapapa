'use client'

import { useState } from 'react'
import { Sparkles, Loader2, FileText, CheckCircle } from 'lucide-react'
import { useWorkspace } from '@/components/providers/workspace-provider'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

interface AIIngestProps {
  sourceId?: string
  initialText?: string
  onComplete?: (result: IngestResult) => void
}

interface IngestResult {
  people_found: number
  dates_found: number
  places_found: number
  suggestions_created: number
}

export function AIIngest({ sourceId, initialText = '', onComplete }: AIIngestProps) {
  const { currentWorkspace } = useWorkspace()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState(initialText)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<IngestResult | null>(null)

  const handleIngest = async () => {
    if (!currentWorkspace || !text.trim()) return

    setProcessing(true)
    setResult(null)

    try {
      const response = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: currentWorkspace.id,
          source_id: sourceId,
          text: text.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ingest failed')
      }

      setResult(data.extraction)
      onComplete?.(data.extraction)

      if (data.suggestions_created > 0) {
        toast.success(`Created ${data.suggestions_created} suggestion${data.suggestions_created !== 1 ? 's' : ''} for review`)
      } else {
        toast.info('No people found in the text')
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Ingest error:', error)
      toast.error('Failed to process text')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Sparkles className="mr-2 h-4 w-4" />
          Extract Data
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>AI Data Extraction</DialogTitle>
          <DialogDescription>
            Paste text from a document, letter, or record. The system will extract names, dates,
            and places, creating suggestions for you to review.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="text">Document Text</Label>
            <Textarea
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste the text content here...

Example:
John Robert Smith (1880-1952) was born in Timaru, New Zealand. He married Mary Jane Brown on 15 March 1905. They had three children: William (b. 1906), Margaret (b. 1908), and Thomas (b. 1912)."
              rows={10}
              disabled={processing}
            />
          </div>

          {result && (
            <div className="rounded-md bg-green-50 dark:bg-green-950 p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800 dark:text-green-200">
                  Extraction Complete
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm text-green-700 dark:text-green-300">
                <div>
                  <span className="font-medium">{result.people_found}</span> people found
                </div>
                <div>
                  <span className="font-medium">{result.dates_found}</span> dates found
                </div>
                <div>
                  <span className="font-medium">{result.places_found}</span> places found
                </div>
              </div>
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            <p className="font-medium mb-1">Tips for best results:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Include full names with both given and family names</li>
              <li>Use clear date formats (e.g., &ldquo;15 March 1905&rdquo; or &ldquo;1905&rdquo;)</li>
              <li>Include relationships (married, son of, daughter of)</li>
              <li>Mention locations with country or region</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={processing}>
            {result ? 'Close' : 'Cancel'}
          </Button>
          {!result && (
            <Button onClick={handleIngest} disabled={processing || !text.trim()}>
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Extract Data
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
