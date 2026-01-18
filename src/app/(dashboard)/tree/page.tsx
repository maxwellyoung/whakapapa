'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
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
import { Button } from '@/components/ui/button'
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
            background: '#fafaf9',
            border: '1px solid #e7e5e4',
            borderRadius: '12px',
            padding: '12px 20px',
            fontSize: '14px',
            fontWeight: 500,
            color: '#1c1917',
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(28, 25, 23, 0.04)',
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
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-200 border-t-stone-600 dark:border-stone-700 dark:border-t-stone-300" />
          <span className="text-sm text-stone-400 dark:text-stone-500">Loading tree...</span>
        </div>
      </div>
    )
  }

  if (!currentWorkspace) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-stone-400 dark:text-stone-500">Select a workspace</p>
      </div>
    )
  }

  if (nodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-stone-100 dark:bg-stone-800">
            <svg className="h-6 w-6 text-stone-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2v6m0 0l4-4m-4 4l-4-4M12 22V12M20 12v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6M5 12l7-7 7 7" />
            </svg>
          </div>
          <p className="text-stone-600 dark:text-stone-400 mb-2 font-medium">Your family tree will appear here</p>
          <p className="text-sm text-stone-400 dark:text-stone-500 mb-6">
            Once you add people and connect them as family members, you&apos;ll see them displayed as an interactive tree.
          </p>
          <div className="flex flex-col gap-2">
            <Link href="/people/new">
              <Button className="w-full">Add someone to get started</Button>
            </Link>
            <Link href="/people">
              <Button variant="outline" className="w-full">View people list</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Controls />
        <Background />
      </ReactFlow>

      {/* Relationship Legend */}
      <div className="absolute bottom-4 right-4 bg-white/90 dark:bg-stone-900/90 backdrop-blur-sm rounded-lg border border-stone-200 dark:border-stone-700 p-3 text-xs">
        <p className="font-medium text-stone-700 dark:text-stone-300 mb-2">Relationship Lines</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-blue-500 rounded" />
            <span className="text-stone-600 dark:text-stone-400">Parent → Child</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-pink-500 rounded" />
            <span className="text-stone-600 dark:text-stone-400">Married / Partner</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-green-500 rounded" />
            <span className="text-stone-600 dark:text-stone-400">Siblings</span>
          </div>
        </div>
        <p className="text-stone-400 dark:text-stone-500 mt-2">Click a person to view details</p>
      </div>
    </div>
  )
}
