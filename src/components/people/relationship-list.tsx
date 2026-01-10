'use client'

import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { Person, Relationship, RelationshipType } from '@/types'

interface RelationshipListProps {
  relationships: (Relationship & { person: Person })[]
  currentPersonId: string
}

function getRelationshipLabel(type: RelationshipType, isPersonA: boolean): string {
  switch (type) {
    case 'parent_child':
      return isPersonA ? 'Child' : 'Parent'
    case 'spouse':
      return 'Spouse'
    case 'sibling':
      return 'Sibling'
    case 'adoptive_parent':
      return isPersonA ? 'Adopted child' : 'Adoptive parent'
    case 'step_parent':
      return isPersonA ? 'Stepchild' : 'Step-parent'
    case 'foster_parent':
      return isPersonA ? 'Foster child' : 'Foster parent'
    case 'guardian':
      return isPersonA ? 'Ward' : 'Guardian'
    case 'partner':
      return 'Partner'
    case 'other':
    default:
      return 'Related'
  }
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function RelationshipList({ relationships, currentPersonId }: RelationshipListProps) {
  if (relationships.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No relationships recorded</p>
    )
  }

  // Group by relationship type
  const grouped = relationships.reduce(
    (acc, rel) => {
      const isPersonA = rel.person_a_id === currentPersonId
      const label = getRelationshipLabel(rel.relationship_type, isPersonA)

      if (!acc[label]) {
        acc[label] = []
      }
      acc[label].push(rel)
      return acc
    },
    {} as Record<string, (Relationship & { person: Person })[]>
  )

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([label, rels]) => (
        <div key={label}>
          <p className="mb-2 text-sm font-medium text-muted-foreground">{label}</p>
          <div className="space-y-2">
            {rels.map((rel) => (
              <Link
                key={rel.id}
                href={`/people/${rel.person.id}`}
                className="flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-muted"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={rel.person.photo_url ?? undefined}
                    alt={rel.person.preferred_name}
                  />
                  <AvatarFallback className="text-xs">
                    {getInitials(rel.person.preferred_name)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">{rel.person.preferred_name}</span>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
