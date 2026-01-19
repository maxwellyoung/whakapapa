'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Download, FileJson, FileText, Printer } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useWorkspace } from '@/components/providers/workspace-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function ExportPage() {
  const { currentWorkspace } = useWorkspace()
  const [exporting, setExporting] = useState<'json' | 'gedcom' | null>(null)

  const handleExportJSON = async () => {
    if (!currentWorkspace) return

    setExporting('json')
    const supabase = createClient()

    try {
      // Fetch all data
      const [people, relationships, events, eventParticipants, sources, citations] =
        await Promise.all([
          supabase.from('people').select('*').eq('workspace_id', currentWorkspace.id),
          supabase.from('relationships').select('*').eq('workspace_id', currentWorkspace.id),
          supabase.from('events').select('*').eq('workspace_id', currentWorkspace.id),
          supabase.from('event_participants').select('*'),
          supabase.from('sources').select('*').eq('workspace_id', currentWorkspace.id),
          supabase.from('citations').select('*'),
        ])

      const exportData = {
        workspace: currentWorkspace,
        exported_at: new Date().toISOString(),
        people: people.data ?? [],
        relationships: relationships.data ?? [],
        events: events.data ?? [],
        event_participants: eventParticipants.data ?? [],
        sources: sources.data ?? [],
        citations: citations.data ?? [],
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${currentWorkspace.slug}-export-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)

      toast.success('Export complete')
    } catch (error) {
      toast.error('Export failed')
    } finally {
      setExporting(null)
    }
  }

  const handleExportGEDCOM = async () => {
    if (!currentWorkspace) return

    setExporting('gedcom')
    const supabase = createClient()

    try {
      const { data: people } = await supabase
        .from('people')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)

      const { data: relationships } = await supabase
        .from('relationships')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)

      if (!people) throw new Error('No data')

      // Build basic GEDCOM 5.5.1
      let gedcom = '0 HEAD\n'
      gedcom += '1 SOUR Whakapapa\n'
      gedcom += '1 GEDC\n'
      gedcom += '2 VERS 5.5.1\n'
      gedcom += '2 FORM LINEAGE-LINKED\n'
      gedcom += '1 CHAR UTF-8\n'

      // Add individuals
      people.forEach((person, index) => {
        gedcom += `0 @I${index + 1}@ INDI\n`
        gedcom += `1 NAME ${person.given_names ?? ''} /${person.family_name ?? ''}/\n`

        if (person.birth_date) {
          gedcom += '1 BIRT\n'
          gedcom += `2 DATE ${person.birth_date}\n`
          if (person.birth_place) {
            gedcom += `2 PLAC ${person.birth_place}\n`
          }
        }

        if (person.death_date) {
          gedcom += '1 DEAT\n'
          gedcom += `2 DATE ${person.death_date}\n`
          if (person.death_place) {
            gedcom += `2 PLAC ${person.death_place}\n`
          }
        }

        if (person.gender) {
          const sex = person.gender.toLowerCase().startsWith('m')
            ? 'M'
            : person.gender.toLowerCase().startsWith('f')
              ? 'F'
              : 'U'
          gedcom += `1 SEX ${sex}\n`
        }
      })

      // Create person ID map
      const personIdMap = new Map(people.map((p, i) => [p.id, i + 1]))

      // Add families from spouse relationships
      const spouseRels =
        relationships?.filter(
          (r) => r.relationship_type === 'spouse' || r.relationship_type === 'partner'
        ) ?? []

      spouseRels.forEach((rel, index) => {
        const husbId = personIdMap.get(rel.person_a_id)
        const wifeId = personIdMap.get(rel.person_b_id)

        if (husbId && wifeId) {
          gedcom += `0 @F${index + 1}@ FAM\n`
          gedcom += `1 HUSB @I${husbId}@\n`
          gedcom += `1 WIFE @I${wifeId}@\n`

          // Find children
          const childRels =
            relationships?.filter(
              (r) =>
                r.relationship_type === 'parent_child' &&
                (r.person_a_id === rel.person_a_id || r.person_a_id === rel.person_b_id)
            ) ?? []

          childRels.forEach((childRel) => {
            const childId = personIdMap.get(childRel.person_b_id)
            if (childId) {
              gedcom += `1 CHIL @I${childId}@\n`
            }
          })
        }
      })

      gedcom += '0 TRLR\n'

      const blob = new Blob([gedcom], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${currentWorkspace.slug}-export-${new Date().toISOString().split('T')[0]}.ged`
      a.click()
      URL.revokeObjectURL(url)

      toast.success('GEDCOM export complete')
    } catch (error) {
      toast.error('Export failed')
    } finally {
      setExporting(null)
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
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Export</h1>
          <p className="text-muted-foreground">Download your family data</p>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileJson className="h-5 w-5" />
                JSON Export
              </CardTitle>
              <CardDescription>
                Full export of all data in JSON format. Best for backups and re-importing.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleExportJSON}
                disabled={exporting !== null}
              >
                <Download className="mr-2 h-4 w-4" />
                {exporting === 'json' ? 'Exporting...' : 'Download JSON'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                GEDCOM Export
              </CardTitle>
              <CardDescription>
                Standard genealogy format compatible with most family tree software.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleExportGEDCOM}
                disabled={exporting !== null}
                variant="outline"
              >
                <Download className="mr-2 h-4 w-4" />
                {exporting === 'gedcom' ? 'Exporting...' : 'Download GEDCOM'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Printer className="h-5 w-5" />
                Print / PDF
              </CardTitle>
              <CardDescription>
                Create printable family books, tree posters, and profile pages for offline sharing.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/export/print">
                <Button variant="outline">
                  <Printer className="mr-2 h-4 w-4" />
                  Open Print Designer
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
