'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Panel,
  useReactFlow,
  ReactFlowProvider,
  Handle,
  Position,
  ConnectionLineType,
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
  User,
} from 'lucide-react'
import type { Person, Relationship } from '@/types'
import { motion, AnimatePresence } from 'framer-motion'

// Custom node component with photo and Apple-like styling
function PersonNode({
  data,
  selected
}: {
  data: {
    label: string
    person: Person
    birthYear?: string
    deathYear?: string
  }
  selected?: boolean
}) {
  const hasPhoto = data.person.photo_url

  return (
    <>
      {/* Top handle for incoming parent connections */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!w-3 !h-3 !bg-stone-300 !border-2 !border-white dark:!bg-stone-600 dark:!border-stone-800 !-top-1.5 !rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
      />
      {/* Left handle for spouse/sibling connections */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!w-2.5 !h-2.5 !bg-pink-300 !border-2 !border-white dark:!bg-pink-600 dark:!border-stone-800 !-left-1 !rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
      />
      {/* Right handle for spouse/sibling connections */}
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-2.5 !h-2.5 !bg-pink-300 !border-2 !border-white dark:!bg-pink-600 dark:!border-stone-800 !-right-1 !rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
      />
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={`
                group relative px-3 py-2.5
                bg-white/95 dark:bg-stone-900/95
                backdrop-blur-xl
                rounded-2xl
                border border-stone-200/80 dark:border-stone-700/80
                shadow-sm
                hover:shadow-lg hover:shadow-stone-200/50 dark:hover:shadow-stone-900/50
                hover:border-stone-300 dark:hover:border-stone-600
                hover:-translate-y-0.5
                transition-all duration-200 ease-out
                cursor-pointer
                min-w-[140px]
                ${selected ? 'ring-2 ring-blue-500/50 ring-offset-2 ring-offset-white dark:ring-offset-stone-900 shadow-lg shadow-blue-500/10' : ''}
              `}
            >
              <div className="flex items-center gap-3">
                {/* Profile photo or placeholder */}
                <div className="relative flex-shrink-0">
                  {hasPhoto ? (
                    <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white dark:ring-stone-800 shadow-sm">
                      <Image
                        src={data.person.photo_url!}
                        alt={data.label}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-stone-100 to-stone-200 dark:from-stone-700 dark:to-stone-800 flex items-center justify-center ring-2 ring-white dark:ring-stone-800 shadow-sm">
                      <User className="w-5 h-5 text-stone-400 dark:text-stone-500" />
                    </div>
                  )}
                  {/* Living indicator dot */}
                  {!data.person.death_date && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white dark:border-stone-900" />
                  )}
                </div>

                {/* Name and dates */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-stone-900 dark:text-stone-100 text-sm truncate">
                    {data.label}
                  </p>
                  {(data.birthYear || data.deathYear) && (
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">
                      {data.birthYear || '?'} – {data.deathYear || (data.person.death_date ? '?' : 'present')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="max-w-xs bg-white/95 dark:bg-stone-900/95 backdrop-blur-xl border-stone-200/80 dark:border-stone-700/80"
            sideOffset={8}
          >
            <div className="space-y-1.5 py-1">
              <p className="font-semibold text-stone-900 dark:text-stone-100">{data.person.preferred_name}</p>
              {data.person.given_names && (
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  {data.person.given_names} {data.person.family_name}
                </p>
              )}
              {data.person.birth_place && (
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Born in {data.person.birth_place}
                </p>
              )}
              {data.person.bio && (
                <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 pt-1 border-t border-stone-100 dark:border-stone-800">
                  {data.person.bio}
                </p>
              )}
              <p className="text-[10px] text-stone-400 dark:text-stone-500 pt-1">
                Double-click to view profile
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      {/* Bottom handle for outgoing child connections */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!w-3 !h-3 !bg-stone-300 !border-2 !border-white dark:!bg-stone-600 dark:!border-stone-800 !-bottom-1.5 !rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
      />
    </>
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
    case 'guardian':
      return '#6366f1' // indigo for family hierarchy
    case 'spouse':
    case 'partner':
      return '#ec4899' // pink for partnerships
    case 'sibling':
      return '#10b981' // emerald for siblings
    default:
      return '#94a3b8' // slate for other
  }
}

// Improved tree layout with spouse grouping
function layoutNodes(people: Person[], relationships: Relationship[]): { nodes: Node[], edges: Edge[] } {
  if (people.length === 0) {
    return { nodes: [], edges: [] }
  }

  // Build relationship maps
  const parentChildMap = new Map<string, string[]>() // parent -> children
  const childParentMap = new Map<string, string[]>() // child -> parents
  const spouseMap = new Map<string, string[]>() // person -> spouses
  const siblingMap = new Map<string, string[]>() // person -> siblings

  relationships.forEach(rel => {
    if (rel.relationship_type === 'parent_child' ||
        rel.relationship_type === 'adoptive_parent' ||
        rel.relationship_type === 'step_parent' ||
        rel.relationship_type === 'foster_parent' ||
        rel.relationship_type === 'guardian') {
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
    } else if (rel.relationship_type === 'sibling') {
      if (!siblingMap.has(rel.person_a_id)) siblingMap.set(rel.person_a_id, [])
      if (!siblingMap.has(rel.person_b_id)) siblingMap.set(rel.person_b_id, [])
      siblingMap.get(rel.person_a_id)!.push(rel.person_b_id)
      siblingMap.get(rel.person_b_id)!.push(rel.person_a_id)
    }
  })

  // Find root nodes (people with no parents)
  const roots = people.filter(p => !childParentMap.has(p.id) || childParentMap.get(p.id)!.length === 0)

  // Group spouses together
  const spouseGroups = new Map<string, Set<string>>() // canonical id -> all ids in group
  const personToGroup = new Map<string, string>() // person id -> canonical group id

  people.forEach(person => {
    if (personToGroup.has(person.id)) return

    const spouses = spouseMap.get(person.id) || []
    if (spouses.length > 0) {
      const group = new Set<string>([person.id, ...spouses])
      spouseGroups.set(person.id, group)
      group.forEach(id => personToGroup.set(id, person.id))
    } else {
      spouseGroups.set(person.id, new Set([person.id]))
      personToGroup.set(person.id, person.id)
    }
  })

  // Assign levels using BFS from roots
  const levels = new Map<string, number>()
  const visited = new Set<string>()
  const queue: { id: string; level: number }[] = []

  // Start from roots, but if no roots exist, start from first person
  if (roots.length > 0) {
    roots.forEach(root => queue.push({ id: root.id, level: 0 }))
  } else if (people.length > 0) {
    queue.push({ id: people[0].id, level: 0 })
  }

  while (queue.length > 0) {
    const { id, level } = queue.shift()!
    if (visited.has(id)) continue
    visited.add(id)
    levels.set(id, level)

    // Spouses get same level
    const spouses = spouseMap.get(id) || []
    spouses.forEach(spouseId => {
      if (!visited.has(spouseId)) {
        queue.unshift({ id: spouseId, level }) // Process spouse next at same level
      }
    })

    // Children get next level
    const children = parentChildMap.get(id) || []
    children.forEach(childId => {
      if (!visited.has(childId)) {
        queue.push({ id: childId, level: level + 1 })
      }
    })
  }

  // Handle disconnected nodes
  people.forEach(p => {
    if (!visited.has(p.id)) {
      levels.set(p.id, 0)
    }
  })

  // Group by level, keeping spouse groups together
  const levelGroups = new Map<number, { group: string[], isCouple: boolean }[]>()
  const processedGroups = new Set<string>()

  people.forEach(p => {
    const groupId = personToGroup.get(p.id)!
    if (processedGroups.has(groupId)) return
    processedGroups.add(groupId)

    const group = spouseGroups.get(groupId)!
    const groupArray = Array.from(group)
    const level = levels.get(p.id) ?? 0

    if (!levelGroups.has(level)) levelGroups.set(level, [])
    levelGroups.get(level)!.push({
      group: groupArray,
      isCouple: groupArray.length > 1
    })
  })

  // Create nodes with positions
  const NODE_WIDTH = 180
  const NODE_HEIGHT = 70
  const HORIZONTAL_GAP = 60
  const COUPLE_GAP = 16 // Small gap between spouses
  const VERTICAL_GAP = 120

  const nodes: Node[] = []
  const nodePositions = new Map<string, { x: number; y: number }>()
  const personMap = new Map(people.map(p => [p.id, p]))

  levelGroups.forEach((groups, level) => {
    // Calculate total width for this level
    let totalWidth = 0
    groups.forEach((group, idx) => {
      if (group.isCouple) {
        totalWidth += NODE_WIDTH * group.group.length + COUPLE_GAP * (group.group.length - 1)
      } else {
        totalWidth += NODE_WIDTH
      }
      if (idx < groups.length - 1) totalWidth += HORIZONTAL_GAP
    })

    let currentX = -totalWidth / 2
    const y = level * (NODE_HEIGHT + VERTICAL_GAP)

    groups.forEach((group, groupIdx) => {
      group.group.forEach((personId, personIdx) => {
        const person = personMap.get(personId)
        if (!person) return

        const birthYear = person.birth_date?.split('-')[0]
        const deathYear = person.death_date?.split('-')[0]

        const x = currentX
        nodePositions.set(personId, { x, y })

        nodes.push({
          id: personId,
          type: 'person',
          position: { x, y },
          data: {
            label: person.preferred_name,
            person,
            birthYear,
            deathYear,
          },
        })

        currentX += NODE_WIDTH + (group.isCouple ? COUPLE_GAP : 0)
      })

      if (groupIdx < groups.length - 1) {
        currentX += HORIZONTAL_GAP - (group.isCouple ? COUPLE_GAP : 0)
      }
    })
  })

  // Create edges with improved styling and proper handle connections
  const edges: Edge[] = relationships.map((rel) => {
    const isParentType = rel.relationship_type === 'parent_child' ||
      rel.relationship_type === 'adoptive_parent' ||
      rel.relationship_type === 'step_parent' ||
      rel.relationship_type === 'foster_parent' ||
      rel.relationship_type === 'guardian'

    const isSpouseType = rel.relationship_type === 'spouse' || rel.relationship_type === 'partner'
    const isSiblingType = rel.relationship_type === 'sibling'
    const color = getRelationshipColor(rel.relationship_type)

    // Determine handle connections based on relationship type
    // Spouse/partner: connect horizontally (right to left)
    // Parent/child: connect vertically (bottom to top)
    // Sibling: connect horizontally (right to left)
    const sourceHandle = isParentType ? 'bottom' : 'right'
    const targetHandle = isParentType ? 'top' : 'left'

    return {
      id: rel.id,
      source: rel.person_a_id,
      target: rel.person_b_id,
      sourceHandle,
      targetHandle,
      type: isSpouseType || isSiblingType ? 'straight' : 'smoothstep',
      animated: false,
      style: {
        stroke: color,
        strokeWidth: isSpouseType ? 3 : 2,
        strokeDasharray: isSpouseType ? '8,4' : isSiblingType ? '4,4' : undefined,
        opacity: 0.7,
      },
      markerEnd: isParentType
        ? {
            type: MarkerType.ArrowClosed,
            color,
            width: 20,
            height: 20,
          }
        : undefined,
    }
  })

  return { nodes, edges }
}

function TreeContent() {
  const router = useRouter()
  const { currentWorkspace } = useWorkspace()
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [loading, setLoading] = useState(true)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [relationshipCount, setRelationshipCount] = useState(0)
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

      if (people) {
        const { nodes: layoutedNodes, edges: layoutedEdges } = layoutNodes(
          people,
          relationships || []
        )
        setNodes(layoutedNodes)
        setEdges(layoutedEdges)
        setRelationshipCount(relationships?.length || 0)
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
      <div className="flex h-full items-center justify-center bg-gradient-to-br from-stone-50 to-stone-100 dark:from-stone-950 dark:to-stone-900">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-12 w-12 animate-spin rounded-full border-3 border-stone-200 border-t-indigo-500 dark:border-stone-700 dark:border-t-indigo-400" />
          </div>
          <span className="text-sm font-medium text-stone-500 dark:text-stone-400">Loading family tree...</span>
        </div>
      </div>
    )
  }

  if (!currentWorkspace) {
    return (
      <div className="flex h-full items-center justify-center bg-gradient-to-br from-stone-50 to-stone-100 dark:from-stone-950 dark:to-stone-900">
        <p className="text-stone-400 dark:text-stone-500">Select a workspace</p>
      </div>
    )
  }

  if (nodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-gradient-to-br from-stone-50 to-stone-100 dark:from-stone-950 dark:to-stone-900">
        <div className="text-center max-w-md px-6">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20">
            <Users className="h-8 w-8 text-indigo-500 dark:text-indigo-400" />
          </div>
          <h2 className="text-xl font-semibold text-stone-800 dark:text-stone-200 mb-2">
            Your family tree will appear here
          </h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 mb-8 leading-relaxed">
            Add family members and connect them with relationships to see your whakapapa come to life as an interactive tree.
          </p>
          <div className="flex flex-col gap-3">
            <Link href="/people/new">
              <Button className="w-full h-11 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 shadow-lg shadow-indigo-500/25">
                <UserPlus className="mr-2 h-4 w-4" />
                Add your first family member
              </Button>
            </Link>
            <Link href="/people">
              <Button variant="outline" className="w-full h-11">
                View people list
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Show hint if people exist but no relationships
  const showRelationshipHint = nodes.length > 1 && relationshipCount === 0

  return (
    <div className="h-full relative bg-gradient-to-br from-stone-50 to-stone-100 dark:from-stone-950 dark:to-stone-900">
      {/* Relationship hint banner */}
      <AnimatePresence>
        {showRelationshipHint && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-10"
          >
            <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/50 rounded-xl px-4 py-3 shadow-lg backdrop-blur-sm flex items-center gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                <LinkIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Connect your family members
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Click a person, then &quot;Add relationship&quot; to link them
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
              connectionLineType={ConnectionLineType.SmoothStep}
              fitView
              fitViewOptions={{ padding: 0.3 }}
              minZoom={0.1}
              maxZoom={2}
              proOptions={{ hideAttribution: true }}
              defaultEdgeOptions={{
                style: { strokeWidth: 2 },
              }}
            >
              <Background
                gap={24}
                size={1.5}
                color="#d6d3d1"
                className="dark:opacity-20"
              />
              <MiniMap
                nodeColor={() => '#a8a29e'}
                maskColor="rgba(0, 0, 0, 0.08)"
                className="!bg-white/90 dark:!bg-stone-900/90 !rounded-xl !border !border-stone-200/80 dark:!border-stone-700/80 !shadow-lg backdrop-blur-sm"
                style={{ width: 120, height: 80 }}
              />

              {/* Elegant Controls */}
              <Panel position="top-left" className="flex gap-1.5">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => zoomIn()}
                  className="h-9 w-9 bg-white/90 dark:bg-stone-900/90 backdrop-blur-sm shadow-sm border-stone-200/80 dark:border-stone-700/80 hover:bg-white dark:hover:bg-stone-800"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => zoomOut()}
                  className="h-9 w-9 bg-white/90 dark:bg-stone-900/90 backdrop-blur-sm shadow-sm border-stone-200/80 dark:border-stone-700/80 hover:bg-white dark:hover:bg-stone-800"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => fitView({ padding: 0.3 })}
                  className="h-9 w-9 bg-white/90 dark:bg-stone-900/90 backdrop-blur-sm shadow-sm border-stone-200/80 dark:border-stone-700/80 hover:bg-white dark:hover:bg-stone-800"
                >
                  <Maximize className="h-4 w-4" />
                </Button>
              </Panel>

              {/* Add Person Button - responsive positioning */}
              <Panel position="top-right" className="md:!top-[120px]">
                <Link href="/people/new">
                  <Button
                    size="sm"
                    className="gap-2 bg-white/90 dark:bg-stone-900/90 backdrop-blur-sm text-stone-700 dark:text-stone-200 border border-stone-200/80 dark:border-stone-700/80 shadow-sm hover:bg-white dark:hover:bg-stone-800"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span className="hidden sm:inline">Add person</span>
                  </Button>
                </Link>
              </Panel>
            </ReactFlow>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="min-w-[180px]">
          <ContextMenuItem onClick={() => router.push('/people/new')} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Add new person
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => fitView({ padding: 0.3 })} className="gap-2">
            <Maximize className="h-4 w-4" />
            Fit to view
          </ContextMenuItem>
          <ContextMenuItem onClick={() => zoomIn()} className="gap-2">
            <ZoomIn className="h-4 w-4" />
            Zoom in
          </ContextMenuItem>
          <ContextMenuItem onClick={() => zoomOut()} className="gap-2">
            <ZoomOut className="h-4 w-4" />
            Zoom out
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {/* Selected Person Actions - Floating pill */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20"
          >
            <div className="bg-white/95 dark:bg-stone-900/95 backdrop-blur-xl rounded-full border border-stone-200/80 dark:border-stone-700/80 shadow-xl shadow-stone-900/10 dark:shadow-stone-950/50 px-2 py-1.5 flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/people/${selectedNode.id}`)}
                className="rounded-full h-9 px-4 hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                <Eye className="mr-2 h-4 w-4" />
                View
              </Button>
              <div className="w-px h-5 bg-stone-200 dark:bg-stone-700" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/people/${selectedNode.id}/edit`)}
                className="rounded-full h-9 px-4 hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <div className="w-px h-5 bg-stone-200 dark:bg-stone-700" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/people/${selectedNode.id}/relationships/new`)}
                className="rounded-full h-9 px-4 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400"
              >
                <LinkIcon className="mr-2 h-4 w-4" />
                Add relationship
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Relationship Legend - Minimalist - hidden on mobile, shown on md+ */}
      <div className="hidden md:block absolute top-4 right-4 bg-white/90 dark:bg-stone-900/90 backdrop-blur-xl rounded-xl border border-stone-200/80 dark:border-stone-700/80 shadow-lg p-3 z-20">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-5 flex items-center justify-center">
              <svg width="20" height="8" viewBox="0 0 20 8">
                <line x1="0" y1="4" x2="14" y2="4" stroke="#6366f1" strokeWidth="2" />
                <polygon points="14,0 20,4 14,8" fill="#6366f1" />
              </svg>
            </div>
            <span className="text-xs text-stone-600 dark:text-stone-400">Parent</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-5 flex items-center justify-center">
              <svg width="20" height="8" viewBox="0 0 20 8">
                <line x1="0" y1="4" x2="20" y2="4" stroke="#ec4899" strokeWidth="3" strokeDasharray="6,3" />
              </svg>
            </div>
            <span className="text-xs text-stone-600 dark:text-stone-400">Partner</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-5 flex items-center justify-center">
              <svg width="20" height="8" viewBox="0 0 20 8">
                <line x1="0" y1="4" x2="20" y2="4" stroke="#10b981" strokeWidth="2" strokeDasharray="3,3" />
              </svg>
            </div>
            <span className="text-xs text-stone-600 dark:text-stone-400">Sibling</span>
          </div>
        </div>
      </div>

      {/* Mobile legend - compact horizontal version at bottom */}
      <div className="md:hidden absolute bottom-20 left-4 right-4 flex justify-center gap-4 bg-white/90 dark:bg-stone-900/90 backdrop-blur-xl rounded-full border border-stone-200/80 dark:border-stone-700/80 shadow-lg px-4 py-2 z-10">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 bg-indigo-500 rounded-full" />
          <span className="text-[10px] text-stone-500 dark:text-stone-400">Parent</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 bg-pink-500 rounded-full" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #ec4899, #ec4899 3px, transparent 3px, transparent 5px)' }} />
          <span className="text-[10px] text-stone-500 dark:text-stone-400">Partner</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 bg-emerald-500 rounded-full" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #10b981, #10b981 2px, transparent 2px, transparent 4px)' }} />
          <span className="text-[10px] text-stone-500 dark:text-stone-400">Sibling</span>
        </div>
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
