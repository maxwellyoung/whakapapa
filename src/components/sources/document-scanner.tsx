'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  Upload,
  Loader2,
  Copy,
  Check,
  X,
  Sparkles,
  ImageIcon,
  RotateCcw,
  ZoomIn,
} from 'lucide-react'
import Tesseract from 'tesseract.js'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'

interface DocumentScannerProps {
  onTextExtracted?: (text: string) => void
  onClose?: () => void
}

export function DocumentScanner({ onTextExtracted, onClose }: DocumentScannerProps) {
  const [image, setImage] = useState<string | null>(null)
  const [extractedText, setExtractedText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState('')
  const [copied, setCopied] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      setImage(e.target?.result as string)
      setExtractedText('')
    }
    reader.readAsDataURL(file)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (!file || !file.type.startsWith('image/')) {
      toast.error('Please drop an image file')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      setImage(e.target?.result as string)
      setExtractedText('')
    }
    reader.readAsDataURL(file)
  }, [])

  const processImage = async () => {
    if (!image) return

    setIsProcessing(true)
    setProgress(0)
    setProgressMessage('Initializing OCR...')

    try {
      const result = await Tesseract.recognize(image, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100))
            setProgressMessage('Reading text...')
          } else if (m.status === 'loading language traineddata') {
            setProgressMessage('Loading language data...')
          } else if (m.status === 'initializing tesseract') {
            setProgressMessage('Initializing...')
          }
        },
      })

      const text = result.data.text.trim()
      setExtractedText(text)

      if (text.length === 0) {
        toast.error('No text found in image. Try a clearer photo.')
      } else {
        toast.success(`Extracted ${text.split(/\s+/).length} words`)
      }
    } catch (error) {
      console.error('OCR error:', error)
      toast.error('Failed to process image')
    } finally {
      setIsProcessing(false)
      setProgress(0)
      setProgressMessage('')
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(extractedText)
    setCopied(true)
    toast.success('Copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleUseText = () => {
    onTextExtracted?.(extractedText)
    toast.success('Text sent to Quick Capture')
  }

  const reset = () => {
    setImage(null)
    setExtractedText('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/50">
            <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="font-semibold text-stone-900 dark:text-stone-100">Document Scanner</h3>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              Extract text from old letters and documents
            </p>
          </div>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Upload Area */}
      {!image ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="border-2 border-dashed border-stone-200 dark:border-stone-700 rounded-xl p-8 text-center hover:border-stone-300 dark:hover:border-stone-600 transition-colors"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-stone-100 dark:bg-stone-800">
              <ImageIcon className="h-7 w-7 text-stone-400" />
            </div>
            <div>
              <p className="font-medium text-stone-700 dark:text-stone-300">
                Drop an image here
              </p>
              <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
                or click to browse
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Choose File
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Image Preview */}
          <div className="relative rounded-xl overflow-hidden border border-stone-200 dark:border-stone-700">
            <img
              src={image}
              alt="Document to scan"
              className="w-full max-h-64 object-contain bg-stone-50 dark:bg-stone-800"
            />
            <Button
              variant="secondary"
              size="icon"
              onClick={reset}
              className="absolute top-2 right-2"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>

          {/* Processing Progress */}
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-stone-500 dark:text-stone-400">
                  {progressMessage}
                </span>
                <span className="font-mono text-stone-600 dark:text-stone-300">
                  {progress}%
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Action Button */}
          {!extractedText && !isProcessing && (
            <Button onClick={processImage} className="w-full" size="lg">
              <Sparkles className="h-4 w-4 mr-2" />
              Extract Text
            </Button>
          )}

          {/* Extracted Text */}
          {extractedText && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between">
                <Label>Extracted Text</Label>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={handleCopy}>
                    {copied ? (
                      <Check className="h-4 w-4 mr-1" />
                    ) : (
                      <Copy className="h-4 w-4 mr-1" />
                    )}
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                </div>
              </div>
              <Textarea
                value={extractedText}
                onChange={(e) => setExtractedText(e.target.value)}
                rows={8}
                className="font-mono text-sm"
              />
              <div className="flex gap-3">
                <Button variant="outline" onClick={reset} className="flex-1">
                  Scan Another
                </Button>
                {onTextExtracted && (
                  <Button onClick={handleUseText} className="flex-1">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Use for AI Extraction
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Tips */}
      <div className="p-3 rounded-lg bg-stone-50 dark:bg-stone-800/50 text-sm text-stone-500 dark:text-stone-400">
        <p className="font-medium text-stone-700 dark:text-stone-300 mb-1">Tips for best results:</p>
        <ul className="list-disc list-inside space-y-0.5 text-xs">
          <li>Use good lighting and avoid shadows</li>
          <li>Keep the document flat and in focus</li>
          <li>Crop to just the text area if possible</li>
          <li>Works best with typed text; handwriting may vary</li>
        </ul>
      </div>
    </div>
  )
}
