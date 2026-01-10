'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { createClient } from '@/lib/supabase/client'
import { useWorkspace } from '@/components/providers/workspace-provider'
import { useRouter } from 'next/navigation'
import type { Person, Relationship } from '@/types'

interface PersonNode extends Node {
  data: {
    label: string
    person: Person
  }
}

function getRelationshipColor(type: string): string {
  switch (type) {
    case 'parent_child':
    case 'adoptive_parent':
    case 'step_parent':
    case 'foster_parent':
      return '#3b82f6' // blue
    case 'spouse':
    case 'partner':
      return '#ec4899' // pink
    case 'sibling':
      return '#22c55e' // green
    default:
      return '#6b7280' // gray
  }
}

export default function TreePage() {
  const router = useRouter()
  const { currentWorkspace } = useWorkspace()
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      if (!currentWorkspace) return

      const supabase = createClient()

      const { data: people } = await supabase
        .from('people')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)

      const { data: relationships } = await supabase
        .from('relationships')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)

      if (people && relationships) {
        // Create nodes
        const personNodes: PersonNode[] = people.map((person, index) => ({
          id: person.id,
          position: {
            x: (index % 5) * 200,
            y: Math.floor(index / 5) * 150,
          },
          data: {
            label: person.preferred_name,
            person,
          },
          style: {
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '10px 20px',
            fontSize: '14px',
            cursor: 'pointer',
          },
        }))

        // Create edges from relationships
        const relationshipEdges: Edge[] = relationships.map((rel) => ({
          id: rel.id,
          source: rel.person_a_id,
          target: rel.person_b_id,
          type: 'smoothstep',
          style: {
            stroke: getRelationshipColor(rel.relationship_type),
            strokeWidth: 2,
          },
          markerEnd: rel.relationship_type.includes('parent')
            ? {
                type: MarkerType.ArrowClosed,
                color: getRelationshipColor(rel.relationship_type),
              }
            : undefined,
        }))

        setNodes(personNodes)
        setEdges(relationshipEdges)
      }

      setLoading(false)
    }

    fetchData()
  }, [currentWorkspace, setNodes, setEdges])

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      router.push(`/people/${node.id}`)
    },
    [router]
  )

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!currentWorkspace) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Select a workspace</p>
      </div>
    )
  }

  if (nodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            Add some people to see the family tree
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        fitView
        attributionPosition="bottom-left"
      >
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  )
}
