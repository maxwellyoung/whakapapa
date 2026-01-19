'use client'

import { useCallback, useEffect, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Camera, FileText, Image, Upload, X, Download, ExternalLink, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useWorkspace } from '@/components/providers/workspace-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { canEdit } from '@/lib/permissions'
import type { Source } from '@/types'

interface PersonAttachmentsProps {
  personId: string
  personName: string
  currentPhotoUrl: string | null
  onPhotoChange: (url: string | null) => void
}

interface AttachmentWithSource {
  citation_id: string
  source: Source
}

export function PersonAttachments({
  personId,
  personName,
  currentPhotoUrl,
  onPhotoChange,
}: PersonAttachmentsProps) {
  const { currentWorkspace, userRole } = useWorkspace()
  const [attachments, setAttachments] = useState<AttachmentWithSource[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [fileTitle, setFileTitle] = useState('')

  const canUserEdit = userRole && canEdit(userRole)

  // Fetch attachments (sources linked to this person via citations)
  useEffect(() => {
    async function fetchAttachments() {
      if (!currentWorkspace) return

      const supabase = createClient()
      const { data } = await supabase
        .from('citations')
        .select('id, sources(*)')
        .eq('entity_type', 'person')
        .eq('entity_id', personId)

      if (data) {
        const attachmentsData = data
          .filter((c) => c.sources)
          .map((c) => ({
            citation_id: c.id,
            source: c.sources as unknown as Source,
          }))
        setAttachments(attachmentsData)
      }

      setLoading(false)
    }

    fetchAttachments()
  }, [personId, currentWorkspace])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]
      setPendingFile(file)
      setFileTitle(file.name.replace(/\.[^/.]+$/, '')) // Remove extension for title
      setDialogOpen(true)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    disabled: !canUserEdit,
  })

  const handleUpload = async (setAsPhoto: boolean = false) => {
    if (!pendingFile || !currentWorkspace || !fileTitle.trim()) return

    setUploading(true)
    setUploadProgress(10)

    try {
      const supabase = createClient()
      const fileExt = pendingFile.name.split('.').pop()?.toLowerCase() || 'file'
      const filePath = `${currentWorkspace.id}/${crypto.randomUUID()}.${fileExt}`

      setUploadProgress(30)

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('sources')
        .upload(filePath, pendingFile, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw uploadError

      setUploadProgress(60)

      // Get public URL
      const { data: urlData } = supabase.storage.from('sources').getPublicUrl(filePath)

      // Determine source type
      const isImage = pendingFile.type.startsWith('image/')
      const sourceType = isImage ? 'photo' : 'document'

      // Create source record
      const { data: source, error: sourceError } = await supabase
        .from('sources')
        .insert({
          workspace_id: currentWorkspace.id,
          source_type: sourceType,
          title: fileTitle.trim(),
          file_path: filePath,
          file_name: pendingFile.name,
          file_size: pendingFile.size,
          mime_type: pendingFile.type,
        })
        .select()
        .single()

      if (sourceError) throw sourceError

      setUploadProgress(80)

      // Create citation to link source to person
      const { error: citationError } = await supabase.from('citations').insert({
        workspace_id: currentWorkspace.id,
        source_id: source.id,
        entity_type: 'person',
        entity_id: personId,
      })

      if (citationError) throw citationError

      // If this is a photo and user wants it as profile photo
      if (setAsPhoto && isImage) {
        const { error: updateError } = await supabase
          .from('people')
          .update({ photo_url: urlData.publicUrl })
          .eq('id', personId)

        if (updateError) throw updateError
        onPhotoChange(urlData.publicUrl)
      }

      setUploadProgress(100)

      // Add to local state
      setAttachments((prev) => [
        ...prev,
        { citation_id: source.id, source: { ...source, url: urlData.publicUrl } },
      ])

      toast.success(`"${fileTitle.trim()}" has been attached to ${personName}`)
      setDialogOpen(false)
      setPendingFile(null)
      setFileTitle('')
    } catch (error) {
      console.error('Upload error:', error)
      toast.error("Couldn't upload the file. Please try again.")
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleSetAsPhoto = async (source: Source) => {
    if (!source.file_path) return

    const supabase = createClient()
    const { data: urlData } = supabase.storage.from('sources').getPublicUrl(source.file_path)

    const { error } = await supabase
      .from('people')
      .update({ photo_url: urlData.publicUrl })
      .eq('id', personId)

    if (error) {
      toast.error("Couldn't set profile photo. Please try again.")
      return
    }

    onPhotoChange(urlData.publicUrl)
    toast.success('Profile photo updated')
  }

  const handleRemoveAttachment = async (citationId: string, sourceTitle: string) => {
    const supabase = createClient()
    const { error } = await supabase.from('citations').delete().eq('id', citationId)

    if (error) {
      toast.error("Couldn't remove attachment. Please try again.")
      return
    }

    setAttachments((prev) => prev.filter((a) => a.citation_id !== citationId))
    toast.success(`"${sourceTitle}" removed from ${personName}`)
  }

  const getFileIcon = (mimeType: string | null) => {
    if (mimeType?.startsWith('image/')) return Image
    return FileText
  }

  const getDownloadUrl = (source: Source) => {
    if (!source.file_path) return null
    const supabase = createClient()
    const { data } = supabase.storage.from('sources').getPublicUrl(source.file_path)
    return data.publicUrl
  }

  const photos = attachments.filter((a) => a.source.source_type === 'photo')
  const documents = attachments.filter((a) => a.source.source_type !== 'photo')

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Photos & Documents</CardTitle>
          {canUserEdit && (
            <div {...getRootProps()}>
              <input {...getInputProps()} />
              <Button variant="outline" size="sm" className="gap-2">
                <Upload className="h-4 w-4" />
                Upload
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : attachments.length === 0 ? (
            <div
              {...(canUserEdit ? getRootProps() : {})}
              className={`rounded-lg border-2 border-dashed p-8 text-center ${
                isDragActive
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                  : 'border-stone-200 dark:border-stone-700'
              } ${canUserEdit ? 'cursor-pointer hover:border-stone-300 dark:hover:border-stone-600' : ''}`}
            >
              {canUserEdit && <input {...getInputProps()} />}
              <Upload className="mx-auto h-8 w-8 text-stone-400 mb-2" />
              <p className="text-sm text-stone-600 dark:text-stone-400 mb-1">
                {isDragActive ? 'Drop file here...' : 'No photos or documents yet'}
              </p>
              {canUserEdit && (
                <p className="text-xs text-stone-400">
                  Drag & drop or click to upload photos, PDFs, and documents
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Photos Grid */}
              {photos.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Photos</p>
                  <div className="grid grid-cols-3 gap-2">
                    {photos.map(({ citation_id, source }) => {
                      const url = getDownloadUrl(source)
                      return (
                        <div
                          key={citation_id}
                          className="group relative aspect-square rounded-lg overflow-hidden bg-stone-100 dark:bg-stone-800"
                        >
                          {url && (
                            <img
                              src={url}
                              alt={source.title}
                              className="h-full w-full object-cover"
                            />
                          )}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                            {canUserEdit && source.source_type === 'photo' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-white hover:bg-white/20"
                                onClick={() => handleSetAsPhoto(source)}
                                title="Set as profile photo"
                              >
                                <Camera className="h-4 w-4" />
                              </Button>
                            )}
                            {url && (
                              <a href={url} target="_blank" rel="noopener noreferrer">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-white hover:bg-white/20"
                                  title="View full size"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              </a>
                            )}
                            {canUserEdit && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-white hover:bg-red-500/50"
                                onClick={() => handleRemoveAttachment(citation_id, source.title)}
                                title="Remove"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Documents List */}
              {documents.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Documents</p>
                  <div className="space-y-2">
                    {documents.map(({ citation_id, source }) => {
                      const Icon = getFileIcon(source.mime_type)
                      const url = getDownloadUrl(source)
                      return (
                        <div
                          key={citation_id}
                          className="flex items-center gap-3 rounded-lg border p-3 hover:bg-stone-50 dark:hover:bg-stone-800/50"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-stone-100 dark:bg-stone-800">
                            <Icon className="h-5 w-5 text-stone-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{source.title}</p>
                            {source.file_name && (
                              <p className="text-xs text-muted-foreground truncate">
                                {source.file_name}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            {url && (
                              <a href={url} target="_blank" rel="noopener noreferrer">
                                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Download file">
                                  <Download className="h-4 w-4" />
                                </Button>
                              </a>
                            )}
                            {canUserEdit && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                                onClick={() => handleRemoveAttachment(citation_id, source.title)}
                                aria-label="Remove attachment"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Upload drop zone when there are attachments */}
              {canUserEdit && (
                <div
                  {...getRootProps()}
                  className={`rounded-lg border-2 border-dashed p-4 text-center cursor-pointer ${
                    isDragActive
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                      : 'border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600'
                  }`}
                >
                  <input {...getInputProps()} />
                  <p className="text-xs text-stone-400">
                    {isDragActive ? 'Drop file here...' : 'Drag & drop to add more files'}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload to {personName}</DialogTitle>
            <DialogDescription>
              This file will be attached to {personName}&apos;s profile.
            </DialogDescription>
          </DialogHeader>

          {pendingFile && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg bg-stone-50 dark:bg-stone-800/50 p-3">
                {pendingFile.type.startsWith('image/') ? (
                  <Image className="h-8 w-8 text-stone-500" />
                ) : (
                  <FileText className="h-8 w-8 text-stone-500" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{pendingFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(pendingFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={fileTitle}
                  onChange={(e) => setFileTitle(e.target.value)}
                  placeholder="Give this file a name..."
                />
              </div>

              {uploading && (
                <div className="h-2 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={uploading}>
              Cancel
            </Button>
            {pendingFile?.type.startsWith('image/') && (
              <Button
                variant="outline"
                onClick={() => handleUpload(true)}
                disabled={uploading || !fileTitle.trim()}
              >
                {uploading ? 'Uploading...' : 'Upload & set as profile photo'}
              </Button>
            )}
            <Button onClick={() => handleUpload(false)} disabled={uploading || !fileTitle.trim()}>
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
