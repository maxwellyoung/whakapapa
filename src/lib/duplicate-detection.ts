import type { Person } from '@/types'

export interface DuplicateMatch {
  person: Person
  score: number
  reasons: string[]
  verdict: 'likely' | 'maybe' | 'unlikely'
}

// Levenshtein distance for fuzzy string matching
function levenshtein(a: string, b: string): number {
  const matrix: number[][] = []

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }

  return matrix[b.length][a.length]
}

// Soundex algorithm for phonetic matching
function soundex(str: string): string {
  const a = str.toLowerCase().split('')
  const firstLetter = a.shift()
  const codes: Record<string, string> = {
    a: '', e: '', i: '', o: '', u: '', h: '', w: '', y: '',
    b: '1', f: '1', p: '1', v: '1',
    c: '2', g: '2', j: '2', k: '2', q: '2', s: '2', x: '2', z: '2',
    d: '3', t: '3',
    l: '4',
    m: '5', n: '5',
    r: '6',
  }

  const result = a
    .map((c) => codes[c] || '')
    .filter((c, i, arr) => i === 0 || c !== arr[i - 1])
    .join('')

  return (firstLetter + result + '000').slice(0, 4).toUpperCase()
}

// Calculate name similarity score (0-1)
function calculateNameSimilarity(name1: string, name2: string): number {
  const n1 = name1.toLowerCase().trim()
  const n2 = name2.toLowerCase().trim()

  // Exact match
  if (n1 === n2) return 1

  // Soundex match
  const soundexMatch = soundex(n1) === soundex(n2)

  // Levenshtein distance normalized
  const maxLen = Math.max(n1.length, n2.length)
  const distance = levenshtein(n1, n2)
  const levenshteinScore = 1 - distance / maxLen

  // Token overlap (for multi-word names)
  const tokens1 = n1.split(/\s+/)
  const tokens2 = n2.split(/\s+/)
  let tokenMatches = 0
  for (const t1 of tokens1) {
    for (const t2 of tokens2) {
      if (t1 === t2 || soundex(t1) === soundex(t2)) {
        tokenMatches++
        break
      }
    }
  }
  const tokenScore = tokenMatches / Math.max(tokens1.length, tokens2.length)

  // Weighted combination
  let score = levenshteinScore * 0.4 + tokenScore * 0.4
  if (soundexMatch) score += 0.2

  return Math.min(1, score)
}

// Check if dates overlap or are close
function calculateDateSimilarity(
  date1: string | null,
  date2: string | null,
  precision1: string,
  precision2: string
): { score: number; reason?: string } {
  if (!date1 || !date2) return { score: 0 }

  const d1 = new Date(date1)
  const d2 = new Date(date2)

  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return { score: 0 }

  const yearDiff = Math.abs(d1.getFullYear() - d2.getFullYear())

  // Account for precision
  const tolerance =
    precision1 === 'circa' || precision2 === 'circa' ? 10 :
    precision1 === 'range' || precision2 === 'range' ? 5 :
    precision1 === 'year' || precision2 === 'year' ? 2 : 0

  if (yearDiff <= tolerance) {
    const score = 1 - yearDiff / 20 // Max 20 year diff for any score
    return {
      score: Math.max(0, score),
      reason: yearDiff === 0 ? 'Same year' : `Within ${yearDiff} year${yearDiff !== 1 ? 's' : ''}`,
    }
  }

  return { score: 0 }
}

// Calculate place similarity
function calculatePlaceSimilarity(place1: string | null, place2: string | null): number {
  if (!place1 || !place2) return 0

  const p1 = place1.toLowerCase().trim()
  const p2 = place2.toLowerCase().trim()

  if (p1 === p2) return 1

  // Check if one contains the other
  if (p1.includes(p2) || p2.includes(p1)) return 0.8

  // Token overlap for places like "Timaru, New Zealand"
  const tokens1 = p1.split(/[,\s]+/).filter(Boolean)
  const tokens2 = p2.split(/[,\s]+/).filter(Boolean)

  let matches = 0
  for (const t1 of tokens1) {
    if (tokens2.some((t2) => t1 === t2 || levenshtein(t1, t2) <= 1)) {
      matches++
    }
  }

  return matches / Math.max(tokens1.length, tokens2.length)
}

export function findDuplicates(
  newPerson: Partial<Person>,
  existingPeople: Person[]
): DuplicateMatch[] {
  const matches: DuplicateMatch[] = []

  for (const existing of existingPeople) {
    const reasons: string[] = []
    let totalScore = 0
    let factors = 0

    // Name similarity (most important)
    const preferredNameScore = calculateNameSimilarity(
      newPerson.preferred_name || '',
      existing.preferred_name
    )
    if (preferredNameScore > 0.5) {
      totalScore += preferredNameScore * 3 // Weight names heavily
      factors += 3
      if (preferredNameScore > 0.8) {
        reasons.push('Very similar name')
      } else if (preferredNameScore > 0.6) {
        reasons.push('Similar name')
      }
    } else {
      // Low name similarity means unlikely match
      continue
    }

    // Also check full name combinations
    const fullName1 = `${newPerson.given_names || ''} ${newPerson.family_name || ''}`.trim()
    const fullName2 = `${existing.given_names || ''} ${existing.family_name || ''}`.trim()
    if (fullName1 && fullName2) {
      const fullNameScore = calculateNameSimilarity(fullName1, fullName2)
      if (fullNameScore > 0.6) {
        totalScore += fullNameScore
        factors += 1
      }
    }

    // Birth date
    const birthDateSim = calculateDateSimilarity(
      newPerson.birth_date || null,
      existing.birth_date,
      newPerson.birth_date_precision || 'unknown',
      existing.birth_date_precision
    )
    if (birthDateSim.score > 0) {
      totalScore += birthDateSim.score * 2
      factors += 2
      if (birthDateSim.reason) {
        reasons.push(`Birth: ${birthDateSim.reason}`)
      }
    }

    // Death date
    const deathDateSim = calculateDateSimilarity(
      newPerson.death_date || null,
      existing.death_date,
      newPerson.death_date_precision || 'unknown',
      existing.death_date_precision
    )
    if (deathDateSim.score > 0) {
      totalScore += deathDateSim.score * 2
      factors += 2
      if (deathDateSim.reason) {
        reasons.push(`Death: ${deathDateSim.reason}`)
      }
    }

    // Birth place
    const birthPlaceScore = calculatePlaceSimilarity(
      newPerson.birth_place || null,
      existing.birth_place
    )
    if (birthPlaceScore > 0.5) {
      totalScore += birthPlaceScore
      factors += 1
      reasons.push('Similar birth location')
    }

    // Calculate final score
    const finalScore = factors > 0 ? totalScore / factors : 0

    if (finalScore > 0.4) {
      matches.push({
        person: existing,
        score: finalScore,
        reasons,
        verdict:
          finalScore > 0.75 ? 'likely' :
          finalScore > 0.55 ? 'maybe' : 'unlikely',
      })
    }
  }

  // Sort by score descending
  return matches.sort((a, b) => b.score - a.score)
}

export function getDuplicateWarning(matches: DuplicateMatch[]): string | null {
  if (matches.length === 0) return null

  const likely = matches.filter((m) => m.verdict === 'likely')
  const maybe = matches.filter((m) => m.verdict === 'maybe')

  if (likely.length > 0) {
    return `Likely duplicate of ${likely[0].person.preferred_name}`
  }

  if (maybe.length > 0) {
    return `Possible duplicate of ${maybe[0].person.preferred_name}`
  }

  return null
}
