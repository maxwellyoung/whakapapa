'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Loader2, Camera } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useWorkspace } from '@/components/providers/workspace-provider'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import Image from 'next/image'

interface PhotoUploaderProps {
  currentPhotoUrl?: string | null
  onPhotoChange: (url: string | null) => void
  personId?: string
}

export function PhotoUploader({ currentPhotoUrl, onPhotoChange, personId }: PhotoUploaderProps) {
  const { currentWorkspace } = useWorkspace()
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentPhotoUrl || null)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file || !currentWorkspace) return

    // Create preview
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)

    setUploading(true)
    const supabase = createClient()

    const fileExt = file.name.split('.').pop()
    const fileName = personId
      ? `photos/${personId}.${fileExt}`
      : `photos/${crypto.randomUUID()}.${fileExt}`
    const filePath = `${currentWorkspace.id}/${fileName}`

    try {
      // Delete old photo if exists and we have a personId
      if (currentPhotoUrl && personId) {
        const oldPath = currentPhotoUrl.split('/sources/')[1]
        if (oldPath) {
          await supabase.storage.from('sources').remove([oldPath])
        }
      }

      // Upload new photo
      const { error: uploadError } = await supabase.storage
        .from('sources')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('sources')
        .getPublicUrl(filePath)

      onPhotoChange(publicUrl)
      toast.success('Photo uploaded')
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload photo')
      setPreviewUrl(currentPhotoUrl || null)
    } finally {
      setUploading(false)
      URL.revokeObjectURL(objectUrl)
    }
  }, [currentWorkspace, currentPhotoUrl, personId, onPhotoChange])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    },
    maxSize: 5 * 1024 * 1024, // 5MB
  })

  const handleRemove = async () => {
    if (!currentPhotoUrl || !currentWorkspace) return

    setUploading(true)
    const supabase = createClient()

    try {
      const filePath = currentPhotoUrl.split('/sources/')[1]
      if (filePath) {
        await supabase.storage.from('sources').remove([filePath])
      }
      onPhotoChange(null)
      setPreviewUrl(null)
      toast.success('Photo removed')
    } catch (error) {
      console.error('Remove error:', error)
      toast.error('Failed to remove photo')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-3">
      {previewUrl ? (
        <div className="relative inline-block">
          <div className="relative h-24 w-24 overflow-hidden rounded-xl border-2 border-stone-200 dark:border-stone-700">
            <Image
              src={previewUrl}
              alt="Profile photo"
              fill
              className="object-cover"
              unoptimized
            />
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Loader2 className="h-6 w-6 animate-spin text-white" />
              </div>
            )}
          </div>
          {!uploading && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
              onClick={handleRemove}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`
            flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed
            transition-colors
            ${isDragActive
              ? 'border-primary bg-primary/5'
              : 'border-stone-300 hover:border-stone-400 dark:border-stone-600 dark:hover:border-stone-500'}
            ${uploading ? 'pointer-events-none opacity-50' : ''}
          `}
        >
          <input {...getInputProps()} />
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-stone-400" />
          ) : (
            <>
              <Camera className="h-6 w-6 text-stone-400" />
              <span className="mt-1 text-xs text-stone-400">Add photo</span>
            </>
          )}
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Click or drag to upload. Max 5MB.
      </p>
    </div>
  )
}
