'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileText, Users, Heart, AlertCircle, CheckCircle2, ChevronRight, Loader2 } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { createClient } from '@/lib/supabase/client'
import { useWorkspace } from '@/components/providers/workspace-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { parseGedcom, gedcomToImportPreview, type ImportPreview } from '@/lib/gedcom-parser'

type ImportStep = 'upload' | 'preview' | 'importing' | 'complete'

export default function ImportPage() {
  const router = useRouter()
  const { currentWorkspace } = useWorkspace()
  const [step, setStep] = useState<ImportStep>('upload')
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [progress, setProgress] = useState(0)
  const [importedCount, setImportedCount] = useState({ people: 0, relationships: 0 })

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      if (!content) {
        toast.error('Could not read file')
        return
      }

      try {
        const parsed = parseGedcom(content)
        const previewData = gedcomToImportPreview(parsed)
        setPreview(previewData)
        setStep('preview')

        if (parsed.errors.length > 0) {
          toast.warning(`Found ${parsed.errors.length} parsing errors`)
        }
      } catch (error) {
        console.error('Parse error:', error)
        toast.error('Failed to parse GEDCOM file')
      }
    }
    reader.readAsText(file)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.ged', '.gedcom'],
    },
    maxFiles: 1,
  })

  const handleImport = async () => {
    if (!currentWorkspace || !preview) return

    setStep('importing')
    setProgress(0)

    const supabase = createClient()
    const gedcomIdToDbId = new Map<string, string>()
    let peopleImported = 0
    let relationshipsImported = 0

    try {
      // Import people
      const totalItems = preview.people.length + preview.relationships.length

      for (let i = 0; i < preview.people.length; i++) {
        const person = preview.people[i]

        const { data, error } = await supabase
          .from('people')
          .insert({
            workspace_id: currentWorkspace.id,
            preferred_name: person.data.preferred_name,
            given_names: person.data.given_names,
            family_name: person.data.family_name,
            birth_date: person.data.birth_date,
            birth_place: person.data.birth_place,
            death_date: person.data.death_date,
            death_place: person.data.death_place,
            gender: person.data.gender,
            bio: person.data.bio,
          })
          .select('id')
          .single()

        if (error) {
          console.error('Error importing person:', error)
          continue
        }

        gedcomIdToDbId.set(person.gedcomId, data.id)
        peopleImported++
        setProgress(Math.round(((i + 1) / totalItems) * 100))
      }

      // Import relationships
      for (let i = 0; i < preview.relationships.length; i++) {
        const rel = preview.relationships[i]
        const person1Id = gedcomIdToDbId.get(rel.person1GedcomId)
        const person2Id = gedcomIdToDbId.get(rel.person2GedcomId)

        if (!person1Id || !person2Id) continue

        const { error } = await supabase.from('relationships').insert({
          workspace_id: currentWorkspace.id,
          person_a_id: person1Id,
          person_b_id: person2Id,
          relationship_type: rel.type,
        })

        if (!error) {
          relationshipsImported++
        }

        setProgress(Math.round(((preview.people.length + i + 1) / totalItems) * 100))
      }

      setImportedCount({ people: peopleImported, relationships: relationshipsImported })
      setStep('complete')
      toast.success('Import complete!')
    } catch (error) {
      console.error('Import error:', error)
      toast.error('Import failed')
      setStep('preview')
    }
  }

  if (!currentWorkspace) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Select a workspace</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Import Family Tree</h1>
          <p className="text-muted-foreground">
            Import your existing family tree from a GEDCOM file
          </p>
        </div>

        {/* Progress steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {['Upload', 'Preview', 'Import', 'Complete'].map((label, index) => {
              const stepOrder: ImportStep[] = ['upload', 'preview', 'importing', 'complete']
              const currentIndex = stepOrder.indexOf(step)
              const isActive = index === currentIndex
              const isComplete = index < currentIndex

              return (
                <div key={label} className="flex items-center">
                  <div
                    className={`
                      flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                      ${isComplete ? 'bg-emerald-500 text-white' : ''}
                      ${isActive ? 'bg-indigo-500 text-white' : ''}
                      ${!isActive && !isComplete ? 'bg-stone-200 dark:bg-stone-700 text-stone-500' : ''}
                    `}
                  >
                    {isComplete ? <CheckCircle2 className="h-5 w-5" /> : index + 1}
                  </div>
                  <span
                    className={`ml-2 text-sm ${isActive ? 'font-medium' : 'text-stone-500'}`}
                  >
                    {label}
                  </span>
                  {index < 3 && (
                    <ChevronRight className="mx-4 h-4 w-4 text-stone-300 dark:text-stone-600" />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Upload GEDCOM File
                  </CardTitle>
                  <CardDescription>
                    GEDCOM is the standard format for genealogy data. Export from Ancestry,
                    FamilySearch, or other genealogy software.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    {...getRootProps()}
                    className={`
                      border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
                      transition-colors duration-200
                      ${isDragActive
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20'
                        : 'border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600'
                      }
                    `}
                  >
                    <input {...getInputProps()} />
                    <Upload className="mx-auto h-12 w-12 text-stone-400 mb-4" />
                    {isDragActive ? (
                      <p className="text-indigo-600 dark:text-indigo-400 font-medium">
                        Drop your GEDCOM file here...
                      </p>
                    ) : (
                      <>
                        <p className="font-medium text-stone-700 dark:text-stone-300 mb-1">
                          Drag & drop your GEDCOM file
                        </p>
                        <p className="text-sm text-stone-500">or click to browse</p>
                      </>
                    )}
                  </div>

                  <div className="mt-6 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50">
                    <div className="flex gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-amber-800 dark:text-amber-200">
                          Before you import
                        </p>
                        <ul className="mt-1 text-amber-700 dark:text-amber-300 space-y-1">
                          <li>• Duplicate detection is not yet implemented</li>
                          <li>• Large files may take some time to process</li>
                          <li>• Review the preview before confirming</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 'preview' && preview && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Import Preview</CardTitle>
                  <CardDescription>
                    Review what will be imported into your family tree
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                          <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                            {preview.stats.totalIndividuals}
                          </p>
                          <p className="text-sm text-indigo-700 dark:text-indigo-300">People</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-pink-50 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-800/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-900/50 flex items-center justify-center">
                          <Heart className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                            {preview.relationships.length}
                          </p>
                          <p className="text-sm text-pink-700 dark:text-pink-300">Relationships</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sample people */}
                  <div>
                    <h4 className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-3">
                      Sample of people to import:
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {preview.people.slice(0, 10).map((person) => (
                        <div
                          key={person.gedcomId}
                          className="flex items-center justify-between p-2 rounded-lg bg-stone-50 dark:bg-stone-800/50"
                        >
                          <span className="text-sm font-medium">{person.name}</span>
                          {person.birthYear && (
                            <span className="text-xs text-stone-500">{person.birthYear}</span>
                          )}
                        </div>
                      ))}
                      {preview.people.length > 10 && (
                        <p className="text-xs text-stone-500 text-center pt-2">
                          ...and {preview.people.length - 10} more
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" onClick={() => setStep('upload')} className="flex-1">
                      Back
                    </Button>
                    <Button onClick={handleImport} className="flex-1">
                      Import {preview.stats.totalIndividuals} people
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 'importing' && (
            <motion.div
              key="importing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Importing...
                  </CardTitle>
                  <CardDescription>
                    Please wait while we import your family tree
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Progress value={progress} className="h-2" />
                  <p className="text-center text-sm text-stone-500">{progress}% complete</p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 'complete' && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-5 w-5" />
                    Import Complete!
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center py-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-4">
                      <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <p className="text-lg font-medium text-stone-800 dark:text-stone-200">
                      Successfully imported:
                    </p>
                    <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
                      {importedCount.people} people
                    </p>
                    <p className="text-stone-500 mt-1">
                      and {importedCount.relationships} relationships
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => router.push('/people')} className="flex-1">
                      View People
                    </Button>
                    <Button onClick={() => router.push('/tree')} className="flex-1">
                      View Family Tree
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
