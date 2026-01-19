'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, FileText, Image, Mic, Video, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useWorkspace } from '@/components/providers/workspace-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { getErrorToast } from '@/lib/errors'
import type { SourceType } from '@/types'

interface SourceUploaderProps {
  onComplete: (source: { id: string; title: string }) => void
  onCancel: () => void
}

function getSourceType(mimeType: string): SourceType {
  if (mimeType.startsWith('image/')) return 'photo'
  if (mimeType.startsWith('audio/')) return 'audio'
  if (mimeType.startsWith('video/')) return 'video'
  return 'document'
}

function getFileIcon(type: SourceType) {
  switch (type) {
    case 'photo':
      return Image
    case 'audio':
      return Mic
    case 'video':
      return Video
    default:
      return FileText
  }
}

export function SourceUploader({ onComplete, onCancel }: SourceUploaderProps) {
  const { currentWorkspace } = useWorkspace()
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setFile(file)
      setTitle(file.name.replace(/\.[^/.]+$/, '')) // Remove extension
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'application/pdf': ['.pdf'],
      'audio/*': ['.mp3', '.wav', '.m4a'],
      'video/*': ['.mp4', '.mov', '.webm'],
      'text/*': ['.txt', '.md'],
    },
  })

  const handleUpload = async () => {
    if (!file || !currentWorkspace || !title.trim()) return

    setUploading(true)
    setProgress(10)

    const supabase = createClient()
    const sourceType = getSourceType(file.type)
    const fileExt = file.name.split('.').pop()
    const filePath = `${currentWorkspace.id}/${crypto.randomUUID()}.${fileExt}`

    try {
      // Upload file to storage
      setProgress(30)
      const { error: uploadError } = await supabase.storage
        .from('sources')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw uploadError

      setProgress(70)

      // Create source record
      const { data: source, error: dbError } = await supabase
        .from('sources')
        .insert({
          workspace_id: currentWorkspace.id,
          source_type: sourceType,
          title: title.trim(),
          file_path: filePath,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
        })
        .select()
        .single()

      if (dbError) throw dbError

      setProgress(100)
      toast.success(`"${title.trim()}" has been added to your sources`)
      onComplete({ id: source.id, title: source.title })
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(getErrorToast('upload_file'))
    } finally {
      setUploading(false)
    }
  }

  const sourceType = file ? getSourceType(file.type) : null
  const FileIcon = sourceType ? getFileIcon(sourceType) : FileText

  return (
    <div className="space-y-4">
      {!file ? (
        <div
          {...getRootProps()}
          className={`
            flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8
            transition-colors cursor-pointer
            ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
          `}
        >
          <input {...getInputProps()} />
          <Upload className="mb-4 h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground text-center">
            {isDragActive ? 'Drop file here' : 'Drag & drop a file, or click to browse'}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Images, PDFs, audio, video up to 50MB
          </p>
        </div>
      ) : (
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-muted p-2">
              <FileIcon className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            {!uploading && (
              <Button variant="ghost" size="icon" onClick={() => setFile(null)} aria-label="Remove file">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {uploading && (
            <div className="mt-3">
              <Progress value={progress} className="h-2" />
              <p className="mt-1 text-xs text-muted-foreground text-center">
                Uploading... {progress}%
              </p>
            </div>
          )}
        </div>
      )}

      {file && !uploading && (
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Source title"
          />
        </div>
      )}

      <div className="flex gap-3">
        <Button onClick={handleUpload} disabled={!file || !title.trim() || uploading}>
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            'Upload'
          )}
        </Button>
        <Button variant="outline" onClick={onCancel} disabled={uploading}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
