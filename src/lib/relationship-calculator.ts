/**
 * Relationship Calculator
 * Calculates how two people in a family tree are related to each other.
 */

import type { Person, Relationship, RelationshipType } from '@/types'

interface RelationshipPath {
  path: string[]
  relationship: string
  degree: number
}

interface FamilyGraph {
  parents: Map<string, string[]>
  children: Map<string, string[]>
  spouses: Map<string, string[]>
  siblings: Map<string, string[]>
}

/**
 * Build a family graph from relationships
 */
export function buildFamilyGraph(relationships: Relationship[]): FamilyGraph {
  const parents = new Map<string, string[]>()
  const children = new Map<string, string[]>()
  const spouses = new Map<string, string[]>()
  const siblings = new Map<string, string[]>()

  for (const rel of relationships) {
    const parentTypes: RelationshipType[] = [
      'parent_child',
      'adoptive_parent',
      'step_parent',
      'foster_parent',
      'guardian',
    ]

    if (parentTypes.includes(rel.relationship_type)) {
      // person_a is parent, person_b is child
      if (!children.has(rel.person_a_id)) children.set(rel.person_a_id, [])
      children.get(rel.person_a_id)!.push(rel.person_b_id)

      if (!parents.has(rel.person_b_id)) parents.set(rel.person_b_id, [])
      parents.get(rel.person_b_id)!.push(rel.person_a_id)
    } else if (rel.relationship_type === 'spouse' || rel.relationship_type === 'partner') {
      if (!spouses.has(rel.person_a_id)) spouses.set(rel.person_a_id, [])
      if (!spouses.has(rel.person_b_id)) spouses.set(rel.person_b_id, [])
      spouses.get(rel.person_a_id)!.push(rel.person_b_id)
      spouses.get(rel.person_b_id)!.push(rel.person_a_id)
    } else if (rel.relationship_type === 'sibling') {
      if (!siblings.has(rel.person_a_id)) siblings.set(rel.person_a_id, [])
      if (!siblings.has(rel.person_b_id)) siblings.set(rel.person_b_id, [])
      siblings.get(rel.person_a_id)!.push(rel.person_b_id)
      siblings.get(rel.person_b_id)!.push(rel.person_a_id)
    }
  }

  return { parents, children, spouses, siblings }
}

/**
 * Find all ancestors of a person with their generation distance
 */
function findAncestors(
  personId: string,
  graph: FamilyGraph,
  visited: Set<string> = new Set()
): Map<string, number> {
  const ancestors = new Map<string, number>()
  const queue: { id: string; generation: number }[] = [{ id: personId, generation: 0 }]

  while (queue.length > 0) {
    const { id, generation } = queue.shift()!

    if (visited.has(id)) continue
    visited.add(id)

    if (generation > 0) {
      ancestors.set(id, generation)
    }

    const personParents = graph.parents.get(id) || []
    for (const parentId of personParents) {
      if (!visited.has(parentId)) {
        queue.push({ id: parentId, generation: generation + 1 })
      }
    }
  }

  return ancestors
}

/**
 * Calculate cousin degree and removal
 */
function getCousinRelationship(gen1: number, gen2: number): string {
  const minGen = Math.min(gen1, gen2)
  const maxGen = Math.max(gen1, gen2)
  const removal = maxGen - minGen

  if (minGen === 1) {
    // Direct ancestor/descendant through sibling
    if (removal === 0) return 'siblings'
    if (removal === 1) return gen1 < gen2 ? 'aunt/uncle' : 'niece/nephew'
    if (removal === 2) return gen1 < gen2 ? 'great-aunt/uncle' : 'great-niece/nephew'
    const greats = removal - 1
    return gen1 < gen2
      ? `${'great-'.repeat(greats)}aunt/uncle`
      : `${'great-'.repeat(greats)}niece/nephew`
  }

  const cousinDegree = minGen - 1
  const cousinOrdinal = getOrdinal(cousinDegree)

  if (removal === 0) {
    return `${cousinOrdinal} cousin`
  }

  return `${cousinOrdinal} cousin ${removal}× removed`
}

function getOrdinal(n: number): string {
  const ordinals = ['', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth']
  if (n <= 10) return ordinals[n]
  return `${n}th`
}

/**
 * Get direct relationship name
 */
function getDirectRelationship(generations: number, isAncestor: boolean): string {
  if (generations === 1) return isAncestor ? 'parent' : 'child'
  if (generations === 2) return isAncestor ? 'grandparent' : 'grandchild'
  if (generations === 3) return isAncestor ? 'great-grandparent' : 'great-grandchild'

  const greats = generations - 2
  return isAncestor
    ? `${'great-'.repeat(greats)}grandparent`
    : `${'great-'.repeat(greats)}grandchild`
}

/**
 * Calculate the relationship between two people
 */
export function calculateRelationship(
  person1Id: string,
  person2Id: string,
  graph: FamilyGraph,
  people: Map<string, Person>
): RelationshipPath | null {
  // Same person
  if (person1Id === person2Id) {
    return { path: [person1Id], relationship: 'self', degree: 0 }
  }

  // Check direct spouse
  const spouses1 = graph.spouses.get(person1Id) || []
  if (spouses1.includes(person2Id)) {
    return { path: [person1Id, person2Id], relationship: 'spouse', degree: 1 }
  }

  // Check direct sibling
  const siblings1 = graph.siblings.get(person1Id) || []
  if (siblings1.includes(person2Id)) {
    return { path: [person1Id, person2Id], relationship: 'sibling', degree: 1 }
  }

  // Check direct parent/child
  const parents1 = graph.parents.get(person1Id) || []
  if (parents1.includes(person2Id)) {
    return { path: [person1Id, person2Id], relationship: 'parent', degree: 1 }
  }

  const children1 = graph.children.get(person1Id) || []
  if (children1.includes(person2Id)) {
    return { path: [person1Id, person2Id], relationship: 'child', degree: 1 }
  }

  // Find ancestors of both
  const ancestors1 = findAncestors(person1Id, graph)
  const ancestors2 = findAncestors(person2Id, graph)

  // Check if person2 is an ancestor of person1
  if (ancestors1.has(person2Id)) {
    const generations = ancestors1.get(person2Id)!
    return {
      path: [person1Id, person2Id],
      relationship: getDirectRelationship(generations, true),
      degree: generations,
    }
  }

  // Check if person1 is an ancestor of person2
  if (ancestors2.has(person1Id)) {
    const generations = ancestors2.get(person1Id)!
    return {
      path: [person1Id, person2Id],
      relationship: getDirectRelationship(generations, false),
      degree: generations,
    }
  }

  // Find common ancestors
  let closestCommonAncestor: string | null = null
  let gen1 = Infinity
  let gen2 = Infinity

  for (const [ancestorId, genFrom1] of ancestors1) {
    if (ancestors2.has(ancestorId)) {
      const genFrom2 = ancestors2.get(ancestorId)!
      const totalGen = genFrom1 + genFrom2

      if (totalGen < gen1 + gen2) {
        closestCommonAncestor = ancestorId
        gen1 = genFrom1
        gen2 = genFrom2
      }
    }
  }

  if (closestCommonAncestor) {
    const relationship = getCousinRelationship(gen1, gen2)
    const ancestorName = people.get(closestCommonAncestor)?.preferred_name || 'unknown'

    return {
      path: [person1Id, closestCommonAncestor, person2Id],
      relationship,
      degree: gen1 + gen2,
    }
  }

  // Check in-law relationships (spouse's family)
  for (const spouseId of spouses1) {
    const spouseResult = calculateRelationship(spouseId, person2Id, graph, people)
    if (spouseResult && spouseResult.relationship !== 'self') {
      return {
        path: [person1Id, spouseId, ...spouseResult.path.slice(1)],
        relationship: `${spouseResult.relationship}-in-law`,
        degree: spouseResult.degree + 1,
      }
    }
  }

  return null
}

/**
 * Get a human-readable relationship description
 */
export function describeRelationship(
  person1: Person,
  person2: Person,
  result: RelationshipPath | null
): string {
  if (!result) {
    return `${person1.preferred_name} and ${person2.preferred_name} are not directly related`
  }

  if (result.relationship === 'self') {
    return 'Same person'
  }

  return `${person1.preferred_name} is the ${result.relationship} of ${person2.preferred_name}`
}

/**
 * Calculate all relationships from one person to everyone else
 */
export function calculateAllRelationships(
  personId: string,
  graph: FamilyGraph,
  people: Map<string, Person>
): Map<string, RelationshipPath> {
  const results = new Map<string, RelationshipPath>()

  for (const [otherId] of people) {
    if (otherId !== personId) {
      const result = calculateRelationship(personId, otherId, graph, people)
      if (result) {
        results.set(otherId, result)
      }
    }
  }

  return results
}
