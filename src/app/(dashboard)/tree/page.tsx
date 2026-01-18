'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Panel,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { createClient } from '@/lib/supabase/client'
import { useWorkspace } from '@/components/providers/workspace-provider'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from '@/components/ui/context-menu'
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  UserPlus,
  Link as LinkIcon,
  Eye,
  Pencil,
  Users,
} from 'lucide-react'
import type { Person, Relationship } from '@/types'

// Custom node component with tooltip
function PersonNode({ data }: { data: { label: string; person: Person; birthYear?: string; deathYear?: string } }) {
  const router = useRouter()

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="px-4 py-3 bg-white dark:bg-stone-800 rounded-xl border-2 border-stone-200 dark:border-stone-700 shadow-sm hover:shadow-md hover:border-stone-300 dark:hover:border-stone-600 transition-all cursor-pointer min-w-[120px] text-center">
            <p className="font-medium text-stone-900 dark:text-stone-100 text-sm">
              {data.label}
            </p>
            {(data.birthYear || data.deathYear) && (
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                {data.birthYear || '?'} – {data.deathYear || (data.person.death_date ? '?' : 'living')}
              </p>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium">{data.person.preferred_name}</p>
            {data.person.given_names && (
              <p className="text-xs text-muted-foreground">
                Full name: {data.person.given_names} {data.person.family_name}
              </p>
            )}
            {data.person.birth_place && (
              <p className="text-xs text-muted-foreground">Born in {data.person.birth_place}</p>
            )}
            {data.person.bio && (
              <p className="text-xs text-muted-foreground line-clamp-2">{data.person.bio}</p>
            )}
            <p className="text-xs text-stone-400 mt-1">Click to view • Right-click for options</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

const nodeTypes = {
  person: PersonNode,
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

function getRelationshipLabel(type: string): string {
  switch (type) {
    case 'parent_child': return 'Parent'
    case 'spouse': return 'Married'
    case 'partner': return 'Partner'
    case 'sibling': return 'Sibling'
    case 'adoptive_parent': return 'Adoptive'
    case 'step_parent': return 'Step-parent'
    default: return ''
  }
}

// Simple tree layout algorithm
function layoutNodes(people: Person[], relationships: Relationship[]): Node[] {
  // Build adjacency map
  const parentChildMap = new Map<string, string[]>()
  const childParentMap = new Map<string, string[]>()
  const spouseMap = new Map<string, string[]>()

  relationships.forEach(rel => {
    if (rel.relationship_type === 'parent_child' || rel.relationship_type.includes('parent')) {
      // person_a is parent, person_b is child
      if (!parentChildMap.has(rel.person_a_id)) parentChildMap.set(rel.person_a_id, [])
      parentChildMap.get(rel.person_a_id)!.push(rel.person_b_id)

      if (!childParentMap.has(rel.person_b_id)) childParentMap.set(rel.person_b_id, [])
      childParentMap.get(rel.person_b_id)!.push(rel.person_a_id)
    } else if (rel.relationship_type === 'spouse' || rel.relationship_type === 'partner') {
      if (!spouseMap.has(rel.person_a_id)) spouseMap.set(rel.person_a_id, [])
      if (!spouseMap.has(rel.person_b_id)) spouseMap.set(rel.person_b_id, [])
      spouseMap.get(rel.person_a_id)!.push(rel.person_b_id)
      spouseMap.get(rel.person_b_id)!.push(rel.person_a_id)
    }
  })

  // Find root nodes (people with no parents)
  const roots = people.filter(p => !childParentMap.has(p.id) || childParentMap.get(p.id)!.length === 0)

  // Assign levels using BFS
  const levels = new Map<string, number>()
  const visited = new Set<string>()
  const queue: { id: string; level: number }[] = []

  // Start from roots
  roots.forEach(root => {
    queue.push({ id: root.id, level: 0 })
  })

  // Also handle disconnected nodes
  people.forEach(p => {
    if (!roots.find(r => r.id === p.id)) {
      queue.push({ id: p.id, level: 1 })
    }
  })

  while (queue.length > 0) {
    const { id, level } = queue.shift()!
    if (visited.has(id)) continue
    visited.add(id)
    levels.set(id, level)

    // Add children at next level
    const children = parentChildMap.get(id) || []
    children.forEach(childId => {
      if (!visited.has(childId)) {
        queue.push({ id: childId, level: level + 1 })
      }
    })
  }

  // Group by level
  const levelGroups = new Map<number, Person[]>()
  people.forEach(p => {
    const level = levels.get(p.id) ?? 0
    if (!levelGroups.has(level)) levelGroups.set(level, [])
    levelGroups.get(level)!.push(p)
  })

  // Create nodes with positions
  const NODE_WIDTH = 160
  const NODE_HEIGHT = 80
  const HORIZONTAL_GAP = 40
  const VERTICAL_GAP = 100

  const nodes: Node[] = []

  levelGroups.forEach((peopleInLevel, level) => {
    const totalWidth = peopleInLevel.length * NODE_WIDTH + (peopleInLevel.length - 1) * HORIZONTAL_GAP
    const startX = -totalWidth / 2

    peopleInLevel.forEach((person, index) => {
      const birthYear = person.birth_date?.split('-')[0]
      const deathYear = person.death_date?.split('-')[0]

      nodes.push({
        id: person.id,
        type: 'person',
        position: {
          x: startX + index * (NODE_WIDTH + HORIZONTAL_GAP),
          y: level * (NODE_HEIGHT + VERTICAL_GAP),
        },
        data: {
          label: person.preferred_name,
          person,
          birthYear,
          deathYear,
        },
      })
    })
  })

  return nodes
}

function TreeContent() {
  const router = useRouter()
  const { currentWorkspace } = useWorkspace()
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [loading, setLoading] = useState(true)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const { fitView, zoomIn, zoomOut } = useReactFlow()

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
        // Layout nodes
        const layoutedNodes = layoutNodes(people, relationships)
        setNodes(layoutedNodes)

        // Create edges from relationships
        const relationshipEdges: Edge[] = relationships.map((rel) => ({
          id: rel.id,
          source: rel.person_a_id,
          target: rel.person_b_id,
          type: 'smoothstep',
          animated: rel.relationship_type === 'spouse' || rel.relationship_type === 'partner',
          label: getRelationshipLabel(rel.relationship_type),
          labelStyle: { fontSize: 10, fill: '#78716c' },
          labelBgStyle: { fill: 'white', fillOpacity: 0.8 },
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

        setEdges(relationshipEdges)
      }

      setLoading(false)
    }

    fetchData()
  }, [currentWorkspace, setNodes, setEdges])

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNode(node)
    },
    []
  )

  const onNodeDoubleClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      router.push(`/people/${node.id}`)
    },
    [router]
  )

  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
  }, [])

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
            <Users className="h-6 w-6 text-stone-400" />
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
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div className="h-full">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={onNodeClick}
              onNodeDoubleClick={onNodeDoubleClick}
              onPaneClick={onPaneClick}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              minZoom={0.1}
              maxZoom={2}
              proOptions={{ hideAttribution: true }}
            >
              <Background gap={20} size={1} />
              <MiniMap
                nodeColor={() => '#e7e5e4'}
                maskColor="rgba(0, 0, 0, 0.1)"
                className="bg-white/80 dark:bg-stone-900/80 rounded-lg border border-stone-200 dark:border-stone-700"
              />

              {/* Custom Controls Panel */}
              <Panel position="top-left" className="flex gap-1">
                <Button variant="outline" size="icon" onClick={() => zoomIn()}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => zoomOut()}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => fitView({ padding: 0.2 })}>
                  <Maximize className="h-4 w-4" />
                </Button>
              </Panel>

              {/* Add Person Button */}
              <Panel position="top-right">
                <Link href="/people/new">
                  <Button size="sm" className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Add person
                  </Button>
                </Link>
              </Panel>
            </ReactFlow>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={() => router.push('/people/new')}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add new person
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => fitView({ padding: 0.2 })}>
            <Maximize className="mr-2 h-4 w-4" />
            Fit to view
          </ContextMenuItem>
          <ContextMenuItem onClick={() => zoomIn()}>
            <ZoomIn className="mr-2 h-4 w-4" />
            Zoom in
          </ContextMenuItem>
          <ContextMenuItem onClick={() => zoomOut()}>
            <ZoomOut className="mr-2 h-4 w-4" />
            Zoom out
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {/* Selected Person Actions */}
      {selectedNode && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-700 shadow-lg p-2 flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/people/${selectedNode.id}`)}
          >
            <Eye className="mr-2 h-4 w-4" />
            View
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/people/${selectedNode.id}/edit`)}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/people/${selectedNode.id}/relationships/new`)}
          >
            <LinkIcon className="mr-2 h-4 w-4" />
            Add relationship
          </Button>
        </div>
      )}

      {/* Relationship Legend */}
      <div className="absolute bottom-4 right-4 bg-white/90 dark:bg-stone-900/90 backdrop-blur-sm rounded-lg border border-stone-200 dark:border-stone-700 p-3 text-xs">
        <p className="font-medium text-stone-700 dark:text-stone-300 mb-2">Relationships</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-blue-500 rounded" />
            <span className="text-stone-600 dark:text-stone-400">Parent → Child</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-pink-500 rounded" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #ec4899 0, #ec4899 4px, transparent 4px, transparent 8px)' }} />
            <span className="text-stone-600 dark:text-stone-400">Married / Partner</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-green-500 rounded" />
            <span className="text-stone-600 dark:text-stone-400">Siblings</span>
          </div>
        </div>
        <p className="text-stone-400 dark:text-stone-500 mt-2">
          Click to select • Double-click to view
        </p>
      </div>
    </div>
  )
}

export default function TreePage() {
  return (
    <ReactFlowProvider>
      <TreeContent />
    </ReactFlowProvider>
  )
}
