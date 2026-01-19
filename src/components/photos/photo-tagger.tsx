'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User,
  UserPlus,
  Check,
  X,
  HelpCircle,
  Tag,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useWorkspace } from '@/components/providers/workspace-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { canEdit } from '@/lib/permissions'
import { toast } from 'sonner'
import type { Source, Person, PhotoTag } from '@/types'

interface PhotoTaggerProps {
  source: Source
  onClose?: () => void
}

interface TagPosition {
  x: number
  y: number
}

export function PhotoTagger({ source, onClose }: PhotoTaggerProps) {
  const { currentWorkspace, userRole } = useWorkspace()
  const imageRef = useRef<HTMLDivElement>(null)
  const [people, setPeople] = useState<Person[]>([])
  const [tags, setTags] = useState<PhotoTag[]>([])
  const [loading, setLoading] = useState(true)

  // Tagging state
  const [isTagging, setIsTagging] = useState(false)
  const [newTagPosition, setNewTagPosition] = useState<TagPosition | null>(null)
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null)
  const [unknownLabel, setUnknownLabel] = useState('')
  const [personSearchOpen, setPersonSearchOpen] = useState(false)
  const [zoom, setZoom] = useState(1)

  const canUserEdit = userRole && canEdit(userRole)
  const imageUrl = source.file_path
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/sources/${source.file_path}`
    : source.url

  useEffect(() => {
    async function fetchData() {
      if (!currentWorkspace) return

      const supabase = createClient()

      // Fetch people for tagging
      const { data: peopleData } = await supabase
        .from('people')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .order('preferred_name')

      // Fetch existing tags
      const { data: tagsData } = await supabase
        .from('photo_tags')
        .select('*')
        .eq('source_id', source.id)

      if (peopleData) setPeople(peopleData)
      if (tagsData) setTags(tagsData as PhotoTag[])
      setLoading(false)
    }

    fetchData()
  }, [currentWorkspace, source.id])

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canUserEdit || !isTagging) return

    const rect = imageRef.current?.getBoundingClientRect()
    if (!rect) return

    // Calculate percentage position
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    setNewTagPosition({ x, y })
    setPersonSearchOpen(true)
  }

  const handleSaveTag = async () => {
    if (!currentWorkspace || !newTagPosition) return
    if (!selectedPerson && !unknownLabel.trim()) {
      toast.error('Select a person or add a description')
      return
    }

    const supabase = createClient()

    const { data, error } = await supabase
      .from('photo_tags')
      .insert({
        source_id: source.id,
        person_id: selectedPerson?.id || null,
        x_position: newTagPosition.x,
        y_position: newTagPosition.y,
        unknown_label: unknownLabel.trim() || null,
        is_confirmed: true,
        suggested_by: 'user',
      })
      .select()
      .single()

    if (error) {
      toast.error('Failed to save tag')
      return
    }

    setTags([...tags, data as PhotoTag])
    setNewTagPosition(null)
    setSelectedPerson(null)
    setUnknownLabel('')
    setPersonSearchOpen(false)
    toast.success('Person tagged')
  }

  const handleDeleteTag = async (tagId: string) => {
    const supabase = createClient()
    const { error } = await supabase.from('photo_tags').delete().eq('id', tagId)

    if (error) {
      toast.error('Failed to remove tag')
      return
    }

    setTags(tags.filter((t) => t.id !== tagId))
    toast.success('Tag removed')
  }

  const getPersonForTag = (tag: PhotoTag) => {
    return people.find((p) => p.id === tag.person_id)
  }

  const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-stone-300 border-t-stone-600 rounded-full" />
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 p-3 rounded-xl bg-stone-100 dark:bg-stone-800">
        <div className="flex items-center gap-2">
          <Button
            variant={isTagging ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsTagging(!isTagging)}
            disabled={!canUserEdit}
          >
            <Tag className="h-4 w-4 mr-1.5" />
            {isTagging ? 'Done Tagging' : 'Tag People'}
          </Button>
          <span className="text-sm text-stone-500 dark:text-stone-400">
            {tags.length} {tags.length === 1 ? 'person' : 'people'} tagged
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
            aria-label="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm text-stone-500 w-12 text-center">{Math.round(zoom * 100)}%</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setZoom(Math.min(3, zoom + 0.25))}
            aria-label="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Image container */}
      <div className="relative overflow-auto max-h-[70vh] rounded-xl border border-stone-200 dark:border-stone-700">
        <div
          ref={imageRef}
          onClick={handleImageClick}
          className={`relative inline-block ${isTagging ? 'cursor-crosshair' : ''}`}
          style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl || ''}
            alt={source.title}
            className="max-w-full"
          />

          {/* Existing tags */}
          {tags.map((tag) => {
            const person = getPersonForTag(tag)
            const label = person?.preferred_name || tag.unknown_label || 'Unknown'

            return (
              <div
                key={tag.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                style={{ left: `${tag.x_position}%`, top: `${tag.y_position}%` }}
              >
                <div className="relative">
                  {/* Tag marker */}
                  <div className={`
                    h-8 w-8 rounded-full border-2 flex items-center justify-center
                    ${person ? 'border-white bg-indigo-500' : 'border-white bg-amber-500'}
                    shadow-lg cursor-pointer
                    group-hover:scale-110 transition-transform
                  `}>
                    {person ? (
                      <User className="h-4 w-4 text-white" />
                    ) : (
                      <HelpCircle className="h-4 w-4 text-white" />
                    )}
                  </div>

                  {/* Label popup on hover */}
                  <div className="
                    absolute left-1/2 -translate-x-1/2 top-full mt-2
                    opacity-0 group-hover:opacity-100 transition-opacity
                    pointer-events-none group-hover:pointer-events-auto
                    z-10
                  ">
                    <div className="bg-white dark:bg-stone-800 rounded-lg shadow-lg border border-stone-200 dark:border-stone-700 p-2 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {person && (
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={person.photo_url || undefined} />
                            <AvatarFallback className="text-xs">
                              {getInitials(person.preferred_name)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <span className="text-sm font-medium text-stone-900 dark:text-stone-100">
                          {label}
                        </span>
                        {canUserEdit && isTagging && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteTag(tag.id)
                            }}
                            className="ml-1 text-stone-400 hover:text-red-500"
                            aria-label="Remove tag"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          {/* New tag being placed */}
          {newTagPosition && (
            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${newTagPosition.x}%`, top: `${newTagPosition.y}%` }}
            >
              <div className="h-10 w-10 rounded-full border-4 border-white bg-green-500 flex items-center justify-center shadow-xl animate-pulse">
                <UserPlus className="h-5 w-5 text-white" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Person selection popover */}
      <AnimatePresence>
        {personSearchOpen && newTagPosition && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => {
              setPersonSearchOpen(false)
              setNewTagPosition(null)
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-stone-900 rounded-xl shadow-xl max-w-sm w-full p-4"
            >
              <h4 className="font-semibold text-stone-900 dark:text-stone-100 mb-4">
                Who is this?
              </h4>

              {/* Person search */}
              <Command className="border border-stone-200 dark:border-stone-700 rounded-lg mb-4">
                <CommandInput placeholder="Search people..." />
                <CommandList className="max-h-48">
                  <CommandEmpty>No one found</CommandEmpty>
                  <CommandGroup>
                    {people.map((person) => (
                      <CommandItem
                        key={person.id}
                        onSelect={() => {
                          setSelectedPerson(person)
                          setUnknownLabel('')
                        }}
                        className="flex items-center gap-2"
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={person.photo_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {getInitials(person.preferred_name)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{person.preferred_name}</span>
                        {selectedPerson?.id === person.id && (
                          <Check className="h-4 w-4 ml-auto text-green-500" />
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>

              {/* Or unknown person */}
              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-stone-200 dark:border-stone-700" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-stone-900 px-2 text-stone-400">
                    or describe unknown person
                  </span>
                </div>
              </div>

              <Input
                placeholder="e.g., Unknown woman, possibly aunt"
                value={unknownLabel}
                onChange={(e) => {
                  setUnknownLabel(e.target.value)
                  setSelectedPerson(null)
                }}
                className="mb-4"
              />

              {/* Selected preview */}
              {(selectedPerson || unknownLabel) && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-stone-50 dark:bg-stone-800 mb-4">
                  {selectedPerson ? (
                    <>
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={selectedPerson.photo_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {getInitials(selectedPerson.preferred_name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-stone-900 dark:text-stone-100">
                        {selectedPerson.preferred_name}
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                        <HelpCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      <span className="text-stone-700 dark:text-stone-300">{unknownLabel}</span>
                    </>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setPersonSearchOpen(false)
                    setNewTagPosition(null)
                    setSelectedPerson(null)
                    setUnknownLabel('')
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveTag}
                  disabled={!selectedPerson && !unknownLabel.trim()}
                  className="flex-1"
                >
                  Save Tag
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instructions when tagging mode is active */}
      {isTagging && !newTagPosition && (
        <div className="mt-4 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800">
          <p className="text-sm text-indigo-700 dark:text-indigo-300">
            Click on a face in the photo to tag them. You can identify known family members or describe unknown people.
          </p>
        </div>
      )}

      {/* Tagged people list */}
      {tags.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
            People in this photo
          </h4>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => {
              const person = getPersonForTag(tag)
              return (
                <div
                  key={tag.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-100 dark:bg-stone-800"
                >
                  {person ? (
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={person.photo_url || undefined} />
                      <AvatarFallback className="text-[10px]">
                        {getInitials(person.preferred_name)}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <HelpCircle className="h-4 w-4 text-amber-500" />
                  )}
                  <span className="text-sm text-stone-700 dark:text-stone-300">
                    {person?.preferred_name || tag.unknown_label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
