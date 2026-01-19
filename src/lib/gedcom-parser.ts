/**
 * GEDCOM 5.5.1 Parser
 * Parses GEDCOM files and converts them to our internal format
 */

import type { PersonFormData, RelationshipType, DatePrecision } from '@/types'

interface GedcomLine {
  level: number
  tag: string
  xref?: string
  value?: string
}

interface GedcomIndividual {
  id: string
  name?: string
  givenName?: string
  surname?: string
  sex?: string
  birthDate?: string
  birthPlace?: string
  deathDate?: string
  deathPlace?: string
  occupation?: string
  notes?: string[]
}

interface GedcomFamily {
  id: string
  husbandId?: string
  wifeId?: string
  childIds: string[]
  marriageDate?: string
  marriagePlace?: string
  divorceDate?: string
}

export interface GedcomParseResult {
  individuals: GedcomIndividual[]
  families: GedcomFamily[]
  errors: string[]
  warnings: string[]
}

export interface ImportPreview {
  people: {
    gedcomId: string
    name: string
    birthYear?: string
    data: PersonFormData
  }[]
  relationships: {
    type: RelationshipType
    person1GedcomId: string
    person2GedcomId: string
    description: string
  }[]
  stats: {
    totalIndividuals: number
    totalFamilies: number
    errors: number
    warnings: number
  }
}

/**
 * Parse a single GEDCOM line
 */
function parseLine(line: string): GedcomLine | null {
  const trimmed = line.trim()
  if (!trimmed) return null

  // Match: level [xref] tag [value]
  // Examples: "0 @I1@ INDI", "1 NAME John /Smith/", "2 DATE 1 JAN 1900"
  const match = trimmed.match(/^(\d+)\s+(?:(@\w+@)\s+)?(\w+)(?:\s+(.*))?$/)

  if (!match) return null

  return {
    level: parseInt(match[1], 10),
    xref: match[2],
    tag: match[3],
    value: match[4],
  }
}

/**
 * Parse GEDCOM name format "Given /Surname/"
 */
function parseName(nameStr: string): { given?: string; surname?: string; full: string } {
  const match = nameStr.match(/^([^/]*)\s*\/([^/]*)\/?(.*)$/)

  if (match) {
    const given = match[1].trim() || undefined
    const surname = match[2].trim() || undefined
    const suffix = match[3].trim()

    return {
      given,
      surname,
      full: [given, surname, suffix].filter(Boolean).join(' '),
    }
  }

  return { full: nameStr.trim() }
}

/**
 * Parse GEDCOM date format to ISO date
 */
function parseDate(dateStr: string): { date: string | null; precision: DatePrecision } {
  if (!dateStr) return { date: null, precision: 'unknown' }

  const upper = dateStr.toUpperCase().trim()

  // Handle modifiers
  let precision: DatePrecision = 'exact'
  let cleanDate = upper

  if (upper.startsWith('ABT') || upper.startsWith('ABOUT')) {
    precision = 'circa'
    cleanDate = upper.replace(/^ABT\.?\s*|^ABOUT\s*/i, '')
  } else if (upper.startsWith('BEF') || upper.startsWith('BEFORE')) {
    precision = 'circa'
    cleanDate = upper.replace(/^BEF\.?\s*|^BEFORE\s*/i, '')
  } else if (upper.startsWith('AFT') || upper.startsWith('AFTER')) {
    precision = 'circa'
    cleanDate = upper.replace(/^AFT\.?\s*|^AFTER\s*/i, '')
  } else if (upper.startsWith('EST')) {
    precision = 'circa'
    cleanDate = upper.replace(/^EST\.?\s*/i, '')
  } else if (upper.startsWith('CAL')) {
    precision = 'circa'
    cleanDate = upper.replace(/^CAL\.?\s*/i, '')
  }

  const months: Record<string, string> = {
    JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06',
    JUL: '07', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12',
  }

  // Try: "1 JAN 1900" or "JAN 1900" or "1900"
  const fullMatch = cleanDate.match(/^(\d{1,2})\s+([A-Z]{3})\s+(\d{4})$/)
  if (fullMatch) {
    const day = fullMatch[1].padStart(2, '0')
    const month = months[fullMatch[2]]
    const year = fullMatch[3]
    if (month) {
      return { date: `${year}-${month}-${day}`, precision }
    }
  }

  const monthYearMatch = cleanDate.match(/^([A-Z]{3})\s+(\d{4})$/)
  if (monthYearMatch) {
    const month = months[monthYearMatch[1]]
    const year = monthYearMatch[2]
    if (month) {
      return { date: `${year}-${month}-01`, precision: precision === 'exact' ? 'month' : precision }
    }
  }

  const yearMatch = cleanDate.match(/^(\d{4})$/)
  if (yearMatch) {
    return { date: `${yearMatch[1]}-01-01`, precision: precision === 'exact' ? 'year' : precision }
  }

  // Try ISO format
  const isoMatch = cleanDate.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (isoMatch) {
    return { date: cleanDate, precision }
  }

  return { date: null, precision: 'unknown' }
}

/**
 * Parse GEDCOM content into structured data
 */
export function parseGedcom(content: string): GedcomParseResult {
  const lines = content.split(/\r?\n/)
  const individuals: GedcomIndividual[] = []
  const families: GedcomFamily[] = []
  const errors: string[] = []
  const warnings: string[] = []

  let currentIndividual: GedcomIndividual | null = null
  let currentFamily: GedcomFamily | null = null
  let currentContext: string[] = []

  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const parsed = parseLine(lines[lineNum])
    if (!parsed) continue

    const { level, tag, xref, value } = parsed

    // Track context stack
    while (currentContext.length > level) {
      currentContext.pop()
    }

    if (level === 0) {
      // Save previous records
      if (currentIndividual) individuals.push(currentIndividual)
      if (currentFamily) families.push(currentFamily)
      currentIndividual = null
      currentFamily = null
      currentContext = []

      if (tag === 'INDI' && xref) {
        currentIndividual = { id: xref, notes: [] }
      } else if (tag === 'FAM' && xref) {
        currentFamily = { id: xref, childIds: [] }
      }
    } else if (currentIndividual) {
      currentContext[level] = tag

      switch (tag) {
        case 'NAME':
          if (value) {
            const { given, surname, full } = parseName(value)
            currentIndividual.name = full
            currentIndividual.givenName = given
            currentIndividual.surname = surname
          }
          break
        case 'SEX':
          currentIndividual.sex = value
          break
        case 'BIRT':
          currentContext[level] = 'BIRT'
          break
        case 'DEAT':
          currentContext[level] = 'DEAT'
          break
        case 'DATE':
          if (currentContext[level - 1] === 'BIRT') {
            const { date } = parseDate(value || '')
            currentIndividual.birthDate = date || undefined
          } else if (currentContext[level - 1] === 'DEAT') {
            const { date } = parseDate(value || '')
            currentIndividual.deathDate = date || undefined
          }
          break
        case 'PLAC':
          if (currentContext[level - 1] === 'BIRT') {
            currentIndividual.birthPlace = value
          } else if (currentContext[level - 1] === 'DEAT') {
            currentIndividual.deathPlace = value
          }
          break
        case 'OCCU':
          currentIndividual.occupation = value
          break
        case 'NOTE':
          if (value) currentIndividual.notes?.push(value)
          break
      }
    } else if (currentFamily) {
      currentContext[level] = tag

      switch (tag) {
        case 'HUSB':
          currentFamily.husbandId = value
          break
        case 'WIFE':
          currentFamily.wifeId = value
          break
        case 'CHIL':
          if (value) currentFamily.childIds.push(value)
          break
        case 'MARR':
          currentContext[level] = 'MARR'
          break
        case 'DIV':
          currentContext[level] = 'DIV'
          break
        case 'DATE':
          if (currentContext[level - 1] === 'MARR') {
            const { date } = parseDate(value || '')
            currentFamily.marriageDate = date || undefined
          } else if (currentContext[level - 1] === 'DIV') {
            const { date } = parseDate(value || '')
            currentFamily.divorceDate = date || undefined
          }
          break
        case 'PLAC':
          if (currentContext[level - 1] === 'MARR') {
            currentFamily.marriagePlace = value
          }
          break
      }
    }
  }

  // Save last records
  if (currentIndividual) individuals.push(currentIndividual)
  if (currentFamily) families.push(currentFamily)

  return { individuals, families, errors, warnings }
}

/**
 * Convert parsed GEDCOM to import preview
 */
export function gedcomToImportPreview(result: GedcomParseResult): ImportPreview {
  const people: ImportPreview['people'] = []
  const relationships: ImportPreview['relationships'] = []

  // Convert individuals
  for (const ind of result.individuals) {
    const birthYear = ind.birthDate?.split('-')[0]

    people.push({
      gedcomId: ind.id,
      name: ind.name || 'Unknown',
      birthYear,
      data: {
        preferred_name: ind.name || 'Unknown',
        given_names: ind.givenName,
        family_name: ind.surname,
        birth_date: ind.birthDate,
        birth_place: ind.birthPlace,
        death_date: ind.deathDate,
        death_place: ind.deathPlace,
        gender: ind.sex === 'M' ? 'Male' : ind.sex === 'F' ? 'Female' : undefined,
        bio: ind.notes?.join('\n'),
      },
    })
  }

  // Convert families to relationships
  for (const fam of result.families) {
    // Spouse relationship
    if (fam.husbandId && fam.wifeId) {
      const husband = result.individuals.find((i) => i.id === fam.husbandId)
      const wife = result.individuals.find((i) => i.id === fam.wifeId)

      relationships.push({
        type: 'spouse',
        person1GedcomId: fam.husbandId,
        person2GedcomId: fam.wifeId,
        description: `${husband?.name || 'Unknown'} married ${wife?.name || 'Unknown'}`,
      })
    }

    // Parent-child relationships
    for (const childId of fam.childIds) {
      const child = result.individuals.find((i) => i.id === childId)

      if (fam.husbandId) {
        const parent = result.individuals.find((i) => i.id === fam.husbandId)
        relationships.push({
          type: 'parent_child',
          person1GedcomId: fam.husbandId,
          person2GedcomId: childId,
          description: `${parent?.name || 'Unknown'} is parent of ${child?.name || 'Unknown'}`,
        })
      }

      if (fam.wifeId) {
        const parent = result.individuals.find((i) => i.id === fam.wifeId)
        relationships.push({
          type: 'parent_child',
          person1GedcomId: fam.wifeId,
          person2GedcomId: childId,
          description: `${parent?.name || 'Unknown'} is parent of ${child?.name || 'Unknown'}`,
        })
      }
    }

    // Sibling relationships (children of same family)
    if (fam.childIds.length > 1) {
      for (let i = 0; i < fam.childIds.length; i++) {
        for (let j = i + 1; j < fam.childIds.length; j++) {
          const sib1 = result.individuals.find((ind) => ind.id === fam.childIds[i])
          const sib2 = result.individuals.find((ind) => ind.id === fam.childIds[j])

          relationships.push({
            type: 'sibling',
            person1GedcomId: fam.childIds[i],
            person2GedcomId: fam.childIds[j],
            description: `${sib1?.name || 'Unknown'} and ${sib2?.name || 'Unknown'} are siblings`,
          })
        }
      }
    }
  }

  return {
    people,
    relationships,
    stats: {
      totalIndividuals: people.length,
      totalFamilies: result.families.length,
      errors: result.errors.length,
      warnings: result.warnings.length,
    },
  }
}
