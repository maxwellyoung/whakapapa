'use client'

import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Printer,
  Download,
  FileText,
  Users,
  GitBranch,
  ChevronDown,
  Check,
  Loader2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useWorkspace } from '@/components/providers/workspace-provider'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatFlexibleDate } from '@/lib/dates'
import type { Person, Relationship } from '@/types'

type ExportType = 'family-book' | 'tree-poster' | 'person-profile'
type PaperSize = 'a4' | 'letter' | 'a3'

export default function PrintExportPage() {
  const { currentWorkspace } = useWorkspace()
  const printRef = useRef<HTMLDivElement>(null)
  const [people, setPeople] = useState<Person[]>([])
  const [relationships, setRelationships] = useState<Relationship[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  // Options
  const [exportType, setExportType] = useState<ExportType>('family-book')
  const [paperSize, setPaperSize] = useState<PaperSize>('a4')
  const [includePhotos, setIncludePhotos] = useState(true)
  const [includeBios, setIncludeBios] = useState(true)
  const [includeDates, setIncludeDates] = useState(true)
  const [selectedPerson, setSelectedPerson] = useState<string>('')

  useEffect(() => {
    async function fetchData() {
      if (!currentWorkspace) return

      const supabase = createClient()

      const [peopleRes, relsRes] = await Promise.all([
        supabase
          .from('people')
          .select('*')
          .eq('workspace_id', currentWorkspace.id)
          .order('preferred_name'),
        supabase
          .from('relationships')
          .select('*')
          .eq('workspace_id', currentWorkspace.id),
      ])

      if (peopleRes.data) setPeople(peopleRes.data)
      if (relsRes.data) setRelationships(relsRes.data)
      setLoading(false)
    }

    fetchData()
  }, [currentWorkspace])

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = async () => {
    setGenerating(true)
    // In a real implementation, you'd use a library like html2pdf or call an API
    // For now, we'll just trigger print which can "Save as PDF"
    setTimeout(() => {
      window.print()
      setGenerating(false)
    }, 500)
  }

  const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const getRelationshipsForPerson = (personId: string) => {
    return relationships.filter(
      (r) => r.person_a_id === personId || r.person_b_id === personId
    )
  }

  const getRelatedPerson = (rel: Relationship, personId: string) => {
    const otherId = rel.person_a_id === personId ? rel.person_b_id : rel.person_a_id
    return people.find((p) => p.id === otherId)
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Controls - hidden when printing */}
      <div className="p-6 md:p-8 print:hidden">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
              Print & Export
            </h1>
            <p className="mt-1 text-stone-500 dark:text-stone-400">
              Create printable family books, tree posters, and more
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 mb-8">
            {/* Export type selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Export Type</CardTitle>
                <CardDescription>Choose what to create</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <button
                  onClick={() => setExportType('family-book')}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                    exportType === 'family-book'
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
                      : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800'
                  }`}
                >
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                    exportType === 'family-book' ? 'bg-indigo-500' : 'bg-stone-100 dark:bg-stone-800'
                  }`}>
                    <FileText className={`h-5 w-5 ${
                      exportType === 'family-book' ? 'text-white' : 'text-stone-500'
                    }`} />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-stone-900 dark:text-stone-100">Family Book</p>
                    <p className="text-sm text-stone-500">All people with photos and bios</p>
                  </div>
                  {exportType === 'family-book' && (
                    <Check className="h-5 w-5 text-indigo-500 ml-auto" />
                  )}
                </button>

                <button
                  onClick={() => setExportType('tree-poster')}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                    exportType === 'tree-poster'
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
                      : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800'
                  }`}
                >
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                    exportType === 'tree-poster' ? 'bg-indigo-500' : 'bg-stone-100 dark:bg-stone-800'
                  }`}>
                    <GitBranch className={`h-5 w-5 ${
                      exportType === 'tree-poster' ? 'text-white' : 'text-stone-500'
                    }`} />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-stone-900 dark:text-stone-100">Family Tree Poster</p>
                    <p className="text-sm text-stone-500">Visual tree for the wall</p>
                  </div>
                  {exportType === 'tree-poster' && (
                    <Check className="h-5 w-5 text-indigo-500 ml-auto" />
                  )}
                </button>

                <button
                  onClick={() => setExportType('person-profile')}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                    exportType === 'person-profile'
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
                      : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800'
                  }`}
                >
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                    exportType === 'person-profile' ? 'bg-indigo-500' : 'bg-stone-100 dark:bg-stone-800'
                  }`}>
                    <Users className={`h-5 w-5 ${
                      exportType === 'person-profile' ? 'text-white' : 'text-stone-500'
                    }`} />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-stone-900 dark:text-stone-100">Person Profile</p>
                    <p className="text-sm text-stone-500">Single person detail page</p>
                  </div>
                  {exportType === 'person-profile' && (
                    <Check className="h-5 w-5 text-indigo-500 ml-auto" />
                  )}
                </button>
              </CardContent>
            </Card>

            {/* Options */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Options</CardTitle>
                <CardDescription>Customize your export</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Paper Size</Label>
                  <Select value={paperSize} onValueChange={(v) => setPaperSize(v as PaperSize)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="a4">A4 (210 × 297mm)</SelectItem>
                      <SelectItem value="letter">Letter (8.5 × 11in)</SelectItem>
                      <SelectItem value="a3">A3 (297 × 420mm)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {exportType === 'person-profile' && (
                  <div className="space-y-2">
                    <Label>Person</Label>
                    <Select value={selectedPerson} onValueChange={setSelectedPerson}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a person" />
                      </SelectTrigger>
                      <SelectContent>
                        {people.map((person) => (
                          <SelectItem key={person.id} value={person.id}>
                            {person.preferred_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Label htmlFor="photos">Include photos</Label>
                  <Switch
                    id="photos"
                    checked={includePhotos}
                    onCheckedChange={setIncludePhotos}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="bios">Include biographies</Label>
                  <Switch
                    id="bios"
                    checked={includeBios}
                    onCheckedChange={setIncludeBios}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="dates">Include dates & places</Label>
                  <Switch
                    id="dates"
                    checked={includeDates}
                    onCheckedChange={setIncludeDates}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button onClick={handlePrint} size="lg">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button onClick={handleDownloadPDF} variant="outline" size="lg" disabled={generating}>
              {generating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Save as PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Print preview / actual print content */}
      <div ref={printRef} className="hidden print:block">
        <style jsx global>{`
          @media print {
            @page {
              size: ${paperSize === 'a4' ? 'A4' : paperSize === 'letter' ? 'letter' : 'A3'};
              margin: 1in;
            }
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
          }
        `}</style>

        {/* Family Book */}
        {exportType === 'family-book' && (
          <div>
            {/* Cover page */}
            <div className="h-screen flex flex-col items-center justify-center text-center">
              <h1 className="text-5xl font-serif font-bold mb-4">
                {currentWorkspace?.name || 'Family'} History
              </h1>
              <p className="text-xl text-stone-500">
                {people.length} family members
              </p>
              <p className="text-stone-400 mt-8">
                Created with Whakapapa
              </p>
            </div>

            {/* People pages */}
            {people.map((person) => {
              const birthDate = formatFlexibleDate({
                date: person.birth_date,
                precision: person.birth_date_precision,
              })
              const deathDate = formatFlexibleDate({
                date: person.death_date,
                precision: person.death_date_precision,
              })
              const personRels = getRelationshipsForPerson(person.id)

              return (
                <div key={person.id} className="page-break-before pt-8">
                  <div className="flex gap-6">
                    {includePhotos && (
                      <div className="flex-shrink-0">
                        {person.photo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={person.photo_url}
                            alt={person.preferred_name}
                            className="w-32 h-32 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-32 h-32 rounded-lg bg-stone-100 flex items-center justify-center text-3xl font-medium text-stone-400">
                            {getInitials(person.preferred_name)}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex-1">
                      <h2 className="text-2xl font-serif font-semibold mb-1">
                        {person.preferred_name}
                      </h2>
                      {person.given_names && person.family_name && (
                        <p className="text-stone-500 mb-2">
                          {person.given_names} {person.family_name}
                        </p>
                      )}
                      {includeDates && (
                        <p className="text-stone-600">
                          {birthDate !== 'Unknown' ? birthDate : '?'}
                          {' — '}
                          {deathDate !== 'Unknown' ? deathDate : (person.death_date ? '?' : 'Present')}
                        </p>
                      )}
                      {includeDates && (person.birth_place || person.death_place) && (
                        <p className="text-stone-500 text-sm">
                          {person.birth_place}
                          {person.birth_place && person.death_place && ' → '}
                          {person.death_place}
                        </p>
                      )}
                    </div>
                  </div>

                  {includeBios && person.bio && (
                    <div className="mt-4">
                      <p className="text-stone-700 leading-relaxed">{person.bio}</p>
                    </div>
                  )}

                  {personRels.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-2">
                        Family
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {personRels.map((rel) => {
                          const related = getRelatedPerson(rel, person.id)
                          if (!related) return null
                          return (
                            <span
                              key={rel.id}
                              className="text-sm text-stone-600"
                            >
                              {related.preferred_name}
                              {' '}
                              <span className="text-stone-400">
                                ({rel.relationship_type.replace('_', ' ')})
                              </span>
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Tree Poster - simplified for print */}
        {exportType === 'tree-poster' && (
          <div className="text-center">
            <h1 className="text-4xl font-serif font-bold mb-8">
              {currentWorkspace?.name || 'Family'} Tree
            </h1>
            <div className="flex flex-wrap justify-center gap-4">
              {people.map((person) => (
                <div
                  key={person.id}
                  className="p-4 border border-stone-200 rounded-lg text-center"
                  style={{ width: '150px' }}
                >
                  {includePhotos && person.photo_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={person.photo_url}
                      alt=""
                      className="w-16 h-16 rounded-full mx-auto mb-2 object-cover"
                    />
                  )}
                  <p className="font-medium text-sm">{person.preferred_name}</p>
                  {includeDates && person.birth_date && (
                    <p className="text-xs text-stone-500">
                      {person.birth_date.split('-')[0]}
                      {person.death_date && ` - ${person.death_date.split('-')[0]}`}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Single Person Profile */}
        {exportType === 'person-profile' && selectedPerson && (
          <div>
            {(() => {
              const person = people.find((p) => p.id === selectedPerson)
              if (!person) return null

              const birthDate = formatFlexibleDate({
                date: person.birth_date,
                precision: person.birth_date_precision,
              })
              const deathDate = formatFlexibleDate({
                date: person.death_date,
                precision: person.death_date_precision,
              })
              const personRels = getRelationshipsForPerson(person.id)

              return (
                <div className="max-w-2xl mx-auto">
                  <div className="text-center mb-8">
                    {includePhotos && person.photo_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={person.photo_url}
                        alt=""
                        className="w-40 h-40 rounded-full mx-auto mb-4 object-cover"
                      />
                    )}
                    <h1 className="text-4xl font-serif font-bold">
                      {person.preferred_name}
                    </h1>
                    {person.given_names && person.family_name && (
                      <p className="text-xl text-stone-500 mt-2">
                        {person.given_names} {person.family_name}
                      </p>
                    )}
                  </div>

                  {includeDates && (
                    <div className="text-center mb-8">
                      <p className="text-lg">
                        {birthDate !== 'Unknown' ? birthDate : '?'}
                        {' — '}
                        {deathDate !== 'Unknown' ? deathDate : 'Present'}
                      </p>
                      {(person.birth_place || person.death_place) && (
                        <p className="text-stone-500">
                          {person.birth_place}
                          {person.birth_place && person.death_place && ' → '}
                          {person.death_place}
                        </p>
                      )}
                    </div>
                  )}

                  {includeBios && person.bio && (
                    <div className="mb-8">
                      <h2 className="text-lg font-semibold mb-2">About</h2>
                      <p className="text-stone-700 leading-relaxed">{person.bio}</p>
                    </div>
                  )}

                  {personRels.length > 0 && (
                    <div>
                      <h2 className="text-lg font-semibold mb-2">Family</h2>
                      <ul className="space-y-1">
                        {personRels.map((rel) => {
                          const related = getRelatedPerson(rel, person.id)
                          if (!related) return null
                          return (
                            <li key={rel.id} className="text-stone-700">
                              {related.preferred_name}
                              {' '}
                              <span className="text-stone-400">
                                ({rel.relationship_type.replace('_', ' ')})
                              </span>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              )
            })()}
          </div>
        )}
      </div>

      {/* Preview on screen (visible, styled like print) */}
      <div className="print:hidden max-w-4xl mx-auto px-6 pb-12">
        <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-4">
          Preview
        </h2>
        <div className="bg-white rounded-xl shadow-lg p-8 border border-stone-200">
          {exportType === 'family-book' && (
            <div className="text-center py-12">
              <h3 className="text-3xl font-serif font-bold mb-2">
                {currentWorkspace?.name || 'Family'} History
              </h3>
              <p className="text-stone-500">{people.length} family members</p>
              <p className="text-sm text-stone-400 mt-4">
                Click Print to generate the full family book
              </p>
            </div>
          )}

          {exportType === 'tree-poster' && (
            <div className="text-center py-12">
              <h3 className="text-3xl font-serif font-bold mb-4">Family Tree</h3>
              <div className="flex flex-wrap justify-center gap-3 max-w-lg mx-auto">
                {people.slice(0, 8).map((person) => (
                  <div
                    key={person.id}
                    className="text-center"
                  >
                    <Avatar className="h-12 w-12 mx-auto">
                      <AvatarImage src={person.photo_url || undefined} />
                      <AvatarFallback className="text-sm">
                        {getInitials(person.preferred_name)}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-xs text-stone-600 mt-1 max-w-[60px] truncate">
                      {person.preferred_name}
                    </p>
                  </div>
                ))}
                {people.length > 8 && (
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-stone-100 text-stone-500 text-sm">
                    +{people.length - 8}
                  </div>
                )}
              </div>
            </div>
          )}

          {exportType === 'person-profile' && (
            <div className="text-center py-12">
              {selectedPerson ? (
                (() => {
                  const person = people.find((p) => p.id === selectedPerson)
                  if (!person) return null
                  return (
                    <>
                      <Avatar className="h-20 w-20 mx-auto mb-4">
                        <AvatarImage src={person.photo_url || undefined} />
                        <AvatarFallback className="text-2xl">
                          {getInitials(person.preferred_name)}
                        </AvatarFallback>
                      </Avatar>
                      <h3 className="text-2xl font-serif font-bold">
                        {person.preferred_name}
                      </h3>
                    </>
                  )
                })()
              ) : (
                <p className="text-stone-400">Select a person above</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
