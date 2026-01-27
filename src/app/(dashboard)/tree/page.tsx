'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
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
import dagre from '@dagrejs/dagre'
import 'reactflow/dist/style.css'
import { createClient } from '@/lib/supabase/client'
import { useWorkspace } from '@/components/providers/workspace-provider'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  Search,
  X,
  MousePointer,
  Unlink,
} from 'lucide-react'
import type { Person, Relationship, RelationshipType } from '@/types'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// Relationship options for quick connect
const QUICK_RELATIONSHIP_OPTIONS = [
  { value: 'parent_child', label: 'Parent → Child', description: 'First person is parent' },
  { value: 'spouse', label: 'Spouse / Partner', description: 'Marriage or partnership' },
  { value: 'sibling', label: 'Sibling', description: 'Brothers or sisters' },
] as const

// Gender-based accent colors for node borders
function getNodeAccent(gender: string | null): {
  border: string
  gradient: string
  ring: string
} {
  switch (gender?.toLowerCase()) {
    case 'male':
    case 'm':
      return {
        border: 'border-sky-200/80 dark:border-sky-800/60',
        gradient: 'from-sky-50 to-sky-100 dark:from-sky-950/30 dark:to-sky-900/20',
        ring: 'ring-sky-500/50',
      }
    case 'female':
    case 'f':
      return {
        border: 'border-rose-200/80 dark:border-rose-800/60',
        gradient: 'from-rose-50 to-rose-100 dark:from-rose-950/30 dark:to-rose-900/20',
        ring: 'ring-rose-500/50',
      }
    default:
      return {
        border: 'border-stone-200/80 dark:border-stone-700/80',
        gradient: 'from-stone-100 to-stone-200 dark:from-stone-700 dark:to-stone-800',
        ring: 'ring-violet-500/50',
      }
  }
}

// Custom node component with photo and Apple-like styling
function PersonNode({
  data,
  selected,
}: {
  data: {
    label: string
    person: Person
    birthYear?: string
    deathYear?: string
    highlighted?: boolean
    dimmed?: boolean
  }
  selected?: boolean
}) {
  const hasPhoto = data.person.photo_url
  const accent = getNodeAccent(data.person.gender)
  const isDeceased = !!data.person.death_date

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
              className={cn(
                'group relative px-3 py-2.5',
                'bg-white/95 dark:bg-stone-900/95',
                'backdrop-blur-xl',
                'rounded-2xl',
                'border-2',
                accent.border,
                'shadow-sm',
                'hover:shadow-lg hover:shadow-stone-200/50 dark:hover:shadow-stone-900/50',
                'hover:-translate-y-0.5',
                'transition-all duration-200 ease-out',
                'cursor-pointer',
                'min-w-[150px] max-w-[200px]',
                'touch-manipulation',
                selected && `ring-2 ${accent.ring} ring-offset-2 ring-offset-white dark:ring-offset-stone-900 shadow-lg`,
                data.highlighted && 'ring-2 ring-amber-500 ring-offset-2 ring-offset-white dark:ring-offset-stone-900 shadow-lg shadow-amber-500/20',
                data.dimmed && 'opacity-30',
                isDeceased && 'bg-stone-50/90 dark:bg-stone-950/90'
              )}
            >
              <div className="flex items-center gap-3">
                {/* Profile photo or placeholder */}
                <div className="relative flex-shrink-0">
                  {hasPhoto ? (
                    <div className={cn(
                      'w-11 h-11 rounded-full overflow-hidden ring-2 shadow-sm',
                      isDeceased
                        ? 'ring-stone-300 dark:ring-stone-600 grayscale-[30%]'
                        : 'ring-white dark:ring-stone-800'
                    )}>
                      <Image
                        src={data.person.photo_url!}
                        alt={data.label}
                        width={44}
                        height={44}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className={cn(
                      'w-11 h-11 rounded-full bg-gradient-to-br flex items-center justify-center ring-2 shadow-sm',
                      accent.gradient,
                      isDeceased
                        ? 'ring-stone-300 dark:ring-stone-600'
                        : 'ring-white dark:ring-stone-800'
                    )}>
                      <User className="w-5 h-5 text-stone-400 dark:text-stone-500" />
                    </div>
                  )}
                  {/* Living indicator dot */}
                  {!isDeceased && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white dark:border-stone-900 shadow-sm" />
                  )}
                </div>

                {/* Name and dates */}
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'font-semibold text-sm truncate',
                    isDeceased
                      ? 'text-stone-600 dark:text-stone-400'
                      : 'text-stone-900 dark:text-stone-100'
                  )}>
                    {data.label}
                  </p>
                  {(data.birthYear || data.deathYear) && (
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 font-medium tabular-nums">
                      {data.birthYear || '?'} – {data.deathYear || (isDeceased ? '?' : 'present')}
                    </p>
                  )}
                  {data.person.birth_place && (
                    <p className="text-[10px] text-stone-400 dark:text-stone-500 truncate mt-0.5">
                      📍 {data.person.birth_place}
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
                {isDeceased ? '🕊️ ' : ''}Double-click to view profile
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

// Use dagre for better hierarchical layout
function layoutNodesWithDagre(
  people: Person[],
  relationships: Relationship[]
): { nodes: Node[]; edges: Edge[] } {
  if (people.length === 0) {
    return { nodes: [], edges: [] }
  }

  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))
  dagreGraph.setGraph({
    rankdir: 'TB', // Top to bottom
    nodesep: 100,  // Horizontal spacing — more room between siblings
    ranksep: 140,  // Vertical spacing — clearer generations
    marginx: 60,
    marginy: 60,
  })

  const NODE_WIDTH = 200
  const NODE_HEIGHT = 75

  // Build relationship maps for spouse grouping
  const spouseMap = new Map<string, string[]>()
  relationships.forEach(rel => {
    if (rel.relationship_type === 'spouse' || rel.relationship_type === 'partner') {
      if (!spouseMap.has(rel.person_a_id)) spouseMap.set(rel.person_a_id, [])
      if (!spouseMap.has(rel.person_b_id)) spouseMap.set(rel.person_b_id, [])
      spouseMap.get(rel.person_a_id)!.push(rel.person_b_id)
      spouseMap.get(rel.person_b_id)!.push(rel.person_a_id)
    }
  })

  // Add nodes to dagre
  people.forEach((person) => {
    dagreGraph.setNode(person.id, { width: NODE_WIDTH, height: NODE_HEIGHT })
  })

  // Add edges to dagre (only parent-child for hierarchy)
  relationships.forEach((rel) => {
    if (
      rel.relationship_type === 'parent_child' ||
      rel.relationship_type === 'adoptive_parent' ||
      rel.relationship_type === 'step_parent' ||
      rel.relationship_type === 'foster_parent' ||
      rel.relationship_type === 'guardian'
    ) {
      dagreGraph.setEdge(rel.person_a_id, rel.person_b_id)
    }
  })

  // Run the layout
  dagre.layout(dagreGraph)

  // Create nodes with dagre positions
  const personMap = new Map(people.map((p) => [p.id, p]))
  const nodes: Node[] = people.map((person) => {
    const nodeWithPosition = dagreGraph.node(person.id)
    const birthYear = person.birth_date?.split('-')[0]
    const deathYear = person.death_date?.split('-')[0]

    return {
      id: person.id,
      type: 'person',
      position: {
        x: nodeWithPosition.x - NODE_WIDTH / 2,
        y: nodeWithPosition.y - NODE_HEIGHT / 2,
      },
      data: {
        label: person.preferred_name,
        person,
        birthYear,
        deathYear,
      },
    }
  })

  // Create edges with proper styling
  const edges: Edge[] = relationships.map((rel) => {
    const isParentType =
      rel.relationship_type === 'parent_child' ||
      rel.relationship_type === 'adoptive_parent' ||
      rel.relationship_type === 'step_parent' ||
      rel.relationship_type === 'foster_parent' ||
      rel.relationship_type === 'guardian'

    const isSpouseType = rel.relationship_type === 'spouse' || rel.relationship_type === 'partner'
    const isSiblingType = rel.relationship_type === 'sibling'
    const color = getRelationshipColor(rel.relationship_type)

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
        strokeWidth: isSpouseType ? 2.5 : isSiblingType ? 1.5 : 2,
        strokeDasharray: isSpouseType ? '8,4' : isSiblingType ? '4,4' : undefined,
        opacity: 0.65,
        strokeLinecap: 'round' as const,
      },
      markerEnd: isParentType
        ? {
            type: MarkerType.ArrowClosed,
            color,
            width: 16,
            height: 16,
          }
        : undefined,
      label: isSpouseType ? '❤️' : undefined,
      labelStyle: isSpouseType ? { fontSize: 10 } : undefined,
      labelBgStyle: isSpouseType ? { fill: 'transparent' } : undefined,
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
  const [people, setPeople] = useState<Person[]>([])
  const [relationships, setRelationships] = useState<Relationship[]>([])
  const { fitView, zoomIn, zoomOut, setCenter } = useReactFlow()

  // Connect mode state
  const [connectMode, setConnectMode] = useState(false)
  const [connectSource, setConnectSource] = useState<Node | null>(null)
  const [connectDialogOpen, setConnectDialogOpen] = useState(false)
  const [connectTarget, setConnectTarget] = useState<Node | null>(null)
  const [selectedRelationType, setSelectedRelationType] = useState<string>('parent_child')
  const [creating, setCreating] = useState(false)

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Keyboard navigation
  const [focusedNodeIndex, setFocusedNodeIndex] = useState(-1)

  // Filter nodes based on search
  const filteredNodeIds = useMemo(() => {
    if (!searchQuery.trim()) return null
    const query = searchQuery.toLowerCase()
    return new Set(
      people
        .filter(
          (p) =>
            p.preferred_name.toLowerCase().includes(query) ||
            p.given_names?.toLowerCase().includes(query) ||
            p.family_name?.toLowerCase().includes(query)
        )
        .map((p) => p.id)
    )
  }, [searchQuery, people])

  // Update node highlighting based on search
  useEffect(() => {
    if (filteredNodeIds === null) {
      // No search, clear all highlighting
      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          data: { ...n.data, highlighted: false, dimmed: false },
        }))
      )
    } else {
      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          data: {
            ...n.data,
            highlighted: filteredNodeIds.has(n.id),
            dimmed: !filteredNodeIds.has(n.id),
          },
        }))
      )

      // Focus on first result
      if (filteredNodeIds.size > 0) {
        const firstId = Array.from(filteredNodeIds)[0]
        const node = nodes.find((n) => n.id === firstId)
        if (node) {
          setCenter(node.position.x + 90, node.position.y + 35, { zoom: 1, duration: 500 })
        }
      }
    }
  }, [filteredNodeIds, setNodes, setCenter])

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      if (!currentWorkspace) return

      const supabase = createClient()

      const [{ data: peopleData }, { data: relationshipsData }] = await Promise.all([
        supabase.from('people').select('*').eq('workspace_id', currentWorkspace.id),
        supabase.from('relationships').select('*').eq('workspace_id', currentWorkspace.id),
      ])

      if (peopleData) {
        setPeople(peopleData)
        const rels = relationshipsData || []
        setRelationships(rels)
        const { nodes: layoutedNodes, edges: layoutedEdges } = layoutNodesWithDagre(
          peopleData,
          rels
        )
        setNodes(layoutedNodes)
        setEdges(layoutedEdges)
        setRelationshipCount(rels.length)
      }

      setLoading(false)
    }

    fetchData()
  }, [currentWorkspace, setNodes, setEdges])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Search shortcut
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault()
        setSearchOpen(true)
        setTimeout(() => searchInputRef.current?.focus(), 100)
      }

      // Escape to cancel connect mode or close search
      if (e.key === 'Escape') {
        if (connectMode) {
          setConnectMode(false)
          setConnectSource(null)
          toast.info('Connection cancelled')
        }
        if (searchOpen) {
          setSearchOpen(false)
          setSearchQuery('')
        }
      }

      // Arrow keys for navigation when not in input
      if (
        !searchOpen &&
        !connectDialogOpen &&
        (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'ArrowDown')
      ) {
        e.preventDefault()
        const sortedNodes = [...nodes].sort((a, b) => {
          if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
            return a.position.x - b.position.x
          }
          return a.position.y - b.position.y
        })

        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          sortedNodes.reverse()
        }

        const currentIndex = focusedNodeIndex >= 0 ? focusedNodeIndex : -1
        const nextIndex = (currentIndex + 1) % sortedNodes.length
        setFocusedNodeIndex(nextIndex)

        const node = sortedNodes[nextIndex]
        if (node) {
          setSelectedNode(node)
          setCenter(node.position.x + 90, node.position.y + 35, { zoom: 1, duration: 300 })
        }
      }

      // Enter to view selected node
      if (e.key === 'Enter' && selectedNode && !searchOpen && !connectDialogOpen) {
        router.push(`/people/${selectedNode.id}`)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [connectMode, searchOpen, connectDialogOpen, nodes, focusedNodeIndex, selectedNode, router, setCenter])

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (connectMode) {
        if (!connectSource) {
          // First click - set source
          setConnectSource(node)
          toast.info(`Selected ${node.data.label}. Now click who to connect them to.`)
        } else if (node.id !== connectSource.id) {
          // Second click - open dialog to choose relationship type
          setConnectTarget(node)
          setConnectDialogOpen(true)
        }
      } else {
        setSelectedNode(node)
      }
    },
    [connectMode, connectSource]
  )

  const onNodeDoubleClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (!connectMode) {
        router.push(`/people/${node.id}`)
      }
    },
    [router, connectMode]
  )

  const onPaneClick = useCallback(() => {
    if (!connectMode) {
      setSelectedNode(null)
    }
  }, [connectMode])

  // Create connection
  const handleCreateConnection = async () => {
    if (!currentWorkspace || !connectSource || !connectTarget) return

    setCreating(true)
    const supabase = createClient()

    const { data, error } = await supabase
      .from('relationships')
      .insert({
        workspace_id: currentWorkspace.id,
        person_a_id: connectSource.id,
        person_b_id: connectTarget.id,
        relationship_type: selectedRelationType,
      })
      .select()
      .single()

    setCreating(false)

    if (error) {
      if (error.code === '23505') {
        toast.error('These people are already connected')
      } else {
        toast.error('Failed to create connection')
      }
      return
    }

    // Add the new relationship and re-layout
    const newRelationships = [...relationships, data]
    setRelationships(newRelationships)
    const { nodes: layoutedNodes, edges: layoutedEdges } = layoutNodesWithDagre(
      people,
      newRelationships
    )
    setNodes(layoutedNodes)
    setEdges(layoutedEdges)
    setRelationshipCount(newRelationships.length)

    toast.success(`Connected ${connectSource.data.label} and ${connectTarget.data.label}`)

    // Reset connect state
    setConnectDialogOpen(false)
    setConnectSource(null)
    setConnectTarget(null)
    setConnectMode(false)
    setSelectedRelationType('parent_child')
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-gradient-to-br from-stone-50 to-stone-100 dark:from-stone-950 dark:to-stone-900">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-12 w-12 animate-spin rounded-full border-3 border-stone-200 border-t-indigo-500 dark:border-stone-700 dark:border-t-indigo-400" />
          </div>
          <span className="text-sm font-medium text-stone-500 dark:text-stone-400">
            Loading family tree...
          </span>
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
      <div className="flex h-full items-center justify-center bg-gradient-to-br from-stone-50 to-stone-100 dark:from-stone-950 dark:to-stone-900 px-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          className="text-center max-w-md"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4, type: 'spring', stiffness: 200 }}
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 dark:from-indigo-500/20 dark:via-purple-500/15 dark:to-pink-500/20 shadow-inner"
          >
            <span className="text-4xl">🌿</span>
          </motion.div>
          <h2 className="text-2xl font-semibold text-stone-800 dark:text-stone-200 mb-3">
            Start building your family tree
          </h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 mb-4 leading-relaxed">
            Every family story begins with a single person. Add your first family member
            and watch your whakapapa come to life.
          </p>
          <p className="text-xs text-stone-400 dark:text-stone-500 mb-8 leading-relaxed">
            You can add relationships, stories, photos, and documents as you go.
            There&apos;s no wrong way to start — begin with whoever comes to mind first.
          </p>
          <div className="flex flex-col gap-3">
            <Link href="/people/new">
              <Button className="w-full h-12 text-base bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 shadow-lg shadow-indigo-500/25 rounded-xl">
                <UserPlus className="mr-2 h-5 w-5" />
                Add your first person
              </Button>
            </Link>
            <Link href="/import">
              <Button variant="outline" className="w-full h-11 rounded-xl">
                📥 Import from GEDCOM
              </Button>
            </Link>
            <Link href="/people">
              <Button variant="ghost" className="w-full h-10 text-stone-500 dark:text-stone-400">
                View people list →
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  // Show hint if people exist but no relationships
  const showRelationshipHint = nodes.length > 1 && relationshipCount === 0

  return (
    <div className="h-full relative bg-gradient-to-br from-stone-50 to-stone-100 dark:from-stone-950 dark:to-stone-900">
      {/* Connect mode banner */}
      <AnimatePresence>
        {connectMode && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-30"
          >
            <div className="bg-indigo-600 text-white rounded-xl px-4 py-3 shadow-lg flex items-center gap-3">
              <LinkIcon className="w-5 h-5" />
              <div>
                <p className="font-medium">
                  {connectSource
                    ? `Click who to connect "${connectSource.data.label}" to`
                    : 'Click the first person to connect'}
                </p>
                <p className="text-xs text-indigo-200">Press Escape to cancel</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setConnectMode(false)
                  setConnectSource(null)
                }}
                className="text-white hover:bg-indigo-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Relationship hint banner */}
      <AnimatePresence>
        {showRelationshipHint && !connectMode && (
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
                  Click &quot;Connect&quot; below to start linking people
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search bar */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-4 left-4 z-30"
          >
            <div className="flex items-center gap-2 bg-white/95 dark:bg-stone-900/95 backdrop-blur-xl rounded-xl border border-stone-200/80 dark:border-stone-700/80 shadow-lg px-3 py-2">
              <Search className="h-4 w-4 text-stone-400" />
              <Input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search people..."
                className="border-0 bg-transparent focus-visible:ring-0 h-8 w-48"
              />
              {searchQuery && (
                <span className="text-xs text-stone-400">
                  {filteredNodeIds?.size || 0} found
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchOpen(false)
                  setSearchQuery('')
                }}
                className="h-7 w-7 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
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
              fitViewOptions={{ padding: 0.4, maxZoom: 1.2 }}
              minZoom={0.05}
              maxZoom={2.5}
              proOptions={{ hideAttribution: true }}
              defaultEdgeOptions={{
                style: { strokeWidth: 2 },
              }}
              nodesDraggable={true}
              panOnScroll={true}
              zoomOnPinch={true}
              preventScrolling={true}
              selectNodesOnDrag={false}
            >
              <Background gap={24} size={1.5} color="#d6d3d1" className="dark:opacity-20" />
              <MiniMap
                nodeColor={() => '#a8a29e'}
                maskColor="rgba(0, 0, 0, 0.08)"
                className="!bg-white/90 dark:!bg-stone-900/90 !rounded-xl !border !border-stone-200/80 dark:!border-stone-700/80 !shadow-lg backdrop-blur-sm"
                style={{ width: 120, height: 80 }}
              />

              {/* Controls */}
              <Panel position="top-left" className="flex flex-col gap-1.5">
                <div className="flex gap-1.5">
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
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setSearchOpen(true)
                      setTimeout(() => searchInputRef.current?.focus(), 100)
                    }}
                    className="h-9 w-9 bg-white/90 dark:bg-stone-900/90 backdrop-blur-sm shadow-sm border-stone-200/80 dark:border-stone-700/80 hover:bg-white dark:hover:bg-stone-800"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>

                {/* Connect mode toggle */}
                <Button
                  variant={connectMode ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    if (connectMode) {
                      setConnectMode(false)
                      setConnectSource(null)
                    } else {
                      setConnectMode(true)
                      setSelectedNode(null)
                      toast.info('Click two people to connect them')
                    }
                  }}
                  className={cn(
                    'gap-2',
                    connectMode
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      : 'bg-white/90 dark:bg-stone-900/90 backdrop-blur-sm shadow-sm border-stone-200/80 dark:border-stone-700/80 hover:bg-white dark:hover:bg-stone-800'
                  )}
                >
                  {connectMode ? <Unlink className="h-4 w-4" /> : <LinkIcon className="h-4 w-4" />}
                  {connectMode ? 'Cancel' : 'Connect'}
                </Button>
              </Panel>

              {/* Add Person Button */}
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
          <ContextMenuItem
            onClick={() => {
              setConnectMode(true)
              toast.info('Click two people to connect them')
            }}
            className="gap-2"
          >
            <LinkIcon className="h-4 w-4" />
            Connect people
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => fitView({ padding: 0.3 })} className="gap-2">
            <Maximize className="h-4 w-4" />
            Fit to view
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => {
              setSearchOpen(true)
              setTimeout(() => searchInputRef.current?.focus(), 100)
            }}
            className="gap-2"
          >
            <Search className="h-4 w-4" />
            Search people
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {/* Selected Person Actions - Floating pill */}
      <AnimatePresence>
        {selectedNode && !connectMode && (
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
                onClick={() => {
                  setConnectMode(true)
                  setConnectSource(selectedNode)
                  toast.info(`Now click who to connect "${selectedNode.data.label}" to`)
                }}
                className="rounded-full h-9 px-4 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400"
              >
                <LinkIcon className="mr-2 h-4 w-4" />
                Connect
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Relationship Legend - hidden on mobile */}
      <div className="hidden md:block absolute top-4 right-4 bg-white/90 dark:bg-stone-900/90 backdrop-blur-xl rounded-xl border border-stone-200/80 dark:border-stone-700/80 shadow-lg p-3 z-20 min-w-[160px]">
        {/* Stats */}
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-stone-200/80 dark:border-stone-700/80">
          <Users className="h-3.5 w-3.5 text-stone-400" />
          <span className="text-xs font-medium text-stone-600 dark:text-stone-300">
            {people.length} {people.length === 1 ? 'person' : 'people'}
          </span>
          {relationshipCount > 0 && (
            <>
              <span className="text-stone-300 dark:text-stone-600">·</span>
              <span className="text-xs text-stone-500 dark:text-stone-400">
                {relationshipCount} {relationshipCount === 1 ? 'link' : 'links'}
              </span>
            </>
          )}
        </div>
        {/* Relationship lines */}
        <p className="text-[10px] font-medium uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-2">
          Relationships
        </p>
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-5 flex items-center justify-center">
              <svg width="20" height="8" viewBox="0 0 20 8">
                <line x1="0" y1="4" x2="14" y2="4" stroke="#6366f1" strokeWidth="2" />
                <polygon points="14,0 20,4 14,8" fill="#6366f1" />
              </svg>
            </div>
            <span className="text-xs text-stone-600 dark:text-stone-400">Parent → Child</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-5 flex items-center justify-center">
              <svg width="20" height="8" viewBox="0 0 20 8">
                <line
                  x1="0"
                  y1="4"
                  x2="20"
                  y2="4"
                  stroke="#ec4899"
                  strokeWidth="3"
                  strokeDasharray="6,3"
                />
              </svg>
            </div>
            <span className="text-xs text-stone-600 dark:text-stone-400">Partner / Spouse</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-5 flex items-center justify-center">
              <svg width="20" height="8" viewBox="0 0 20 8">
                <line
                  x1="0"
                  y1="4"
                  x2="20"
                  y2="4"
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeDasharray="3,3"
                />
              </svg>
            </div>
            <span className="text-xs text-stone-600 dark:text-stone-400">Sibling</span>
          </div>
        </div>
        {/* Status indicators */}
        <p className="text-[10px] font-medium uppercase tracking-wider text-stone-400 dark:text-stone-500 mt-3 mb-2">
          Status
        </p>
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-5 flex items-center justify-center">
              <div className="w-3 h-3 bg-emerald-400 rounded-full border-2 border-white dark:border-stone-800 shadow-sm" />
            </div>
            <span className="text-xs text-stone-600 dark:text-stone-400">Living</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-5 flex items-center justify-center">
              <div className="w-3 h-3 bg-stone-200 dark:bg-stone-700 rounded-full border-2 border-white dark:border-stone-800" />
            </div>
            <span className="text-xs text-stone-600 dark:text-stone-400">Deceased</span>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-stone-200 dark:border-stone-700">
          <p className="text-[10px] text-stone-400 dark:text-stone-500 leading-relaxed">
            ⌘F search · Arrow keys navigate<br />
            Double-click to view · Right-click for menu
          </p>
        </div>
      </div>

      {/* Mobile legend */}
      <div className="md:hidden absolute bottom-20 left-4 right-4 z-10">
        <div className="flex flex-col gap-2 items-center">
          {/* Stats pill */}
          <div className="bg-white/90 dark:bg-stone-900/90 backdrop-blur-xl rounded-full border border-stone-200/80 dark:border-stone-700/80 shadow-lg px-4 py-1.5">
            <span className="text-[11px] font-medium text-stone-600 dark:text-stone-300">
              {people.length} {people.length === 1 ? 'person' : 'people'}
              {relationshipCount > 0 && ` · ${relationshipCount} ${relationshipCount === 1 ? 'link' : 'links'}`}
            </span>
          </div>
          {/* Legend row */}
          <div className="flex justify-center gap-3 bg-white/90 dark:bg-stone-900/90 backdrop-blur-xl rounded-full border border-stone-200/80 dark:border-stone-700/80 shadow-lg px-4 py-2">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-0.5 bg-indigo-500 rounded-full" />
              <span className="text-[10px] text-stone-500 dark:text-stone-400">Parent</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div
                className="w-4 h-0.5"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(90deg, #ec4899, #ec4899 3px, transparent 3px, transparent 5px)',
                }}
              />
              <span className="text-[10px] text-stone-500 dark:text-stone-400">Partner</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div
                className="w-4 h-0.5"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(90deg, #10b981, #10b981 2px, transparent 2px, transparent 4px)',
                }}
              />
              <span className="text-[10px] text-stone-500 dark:text-stone-400">Sibling</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full border border-white dark:border-stone-800" />
              <span className="text-[10px] text-stone-500 dark:text-stone-400">Living</span>
            </div>
          </div>
        </div>
      </div>

      {/* Connect dialog */}
      <Dialog open={connectDialogOpen} onOpenChange={setConnectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect family members</DialogTitle>
            <DialogDescription>
              How are {connectSource?.data.label} and {connectTarget?.data.label} related?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedRelationType} onValueChange={setSelectedRelationType}>
              <SelectTrigger>
                <SelectValue placeholder="Select relationship" />
              </SelectTrigger>
              <SelectContent>
                {QUICK_RELATIONSHIP_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{option.label}</span>
                      <span className="text-xs text-muted-foreground">{option.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setConnectDialogOpen(false)
                setConnectSource(null)
                setConnectTarget(null)
                setConnectMode(false)
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateConnection} disabled={creating}>
              {creating ? 'Connecting...' : 'Connect'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
