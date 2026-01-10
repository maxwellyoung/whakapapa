import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Simple extraction patterns for common genealogical data
const DATE_PATTERNS = [
  /\b(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})\b/gi,
  /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})\b/gi,
  /\b(\d{4})\b/g,
]

const NAME_PATTERNS = [
  /(?:born|birth|b\.)\s*:?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
  /(?:died|death|d\.)\s*:?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
  /(?:married|spouse|wife|husband)\s*:?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
]

interface ExtractedPerson {
  name: string
  birth_date?: string
  death_date?: string
  birth_place?: string
  death_place?: string
  confidence: number
  source_excerpt?: string
}

interface ExtractionResult {
  people: ExtractedPerson[]
  dates: string[]
  places: string[]
  raw_text: string
}

function extractDates(text: string): string[] {
  const dates: string[] = []
  for (const pattern of DATE_PATTERNS) {
    const matches = text.matchAll(pattern)
    for (const match of matches) {
      dates.push(match[0])
    }
  }
  return [...new Set(dates)]
}

function extractPlaces(text: string): string[] {
  // Common NZ/AU/UK place patterns
  const places: string[] = []
  const patterns = [
    /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*(?:New Zealand|NZ|Australia|AU|England|UK|Scotland|Ireland|Wales)\b/gi,
    /\b(?:in|at|from|to)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:,\s*[A-Z][a-z]+)*)\b/gi,
  ]

  for (const pattern of patterns) {
    const matches = text.matchAll(pattern)
    for (const match of matches) {
      if (match[1] && match[1].length > 2) {
        places.push(match[1])
      }
    }
  }
  return [...new Set(places)]
}

function extractPeopleFromText(text: string): ExtractedPerson[] {
  const people: ExtractedPerson[] = []

  // Look for birth/death records pattern
  const recordPattern = /([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)+)[,\s]+(?:born|b\.)?\s*(\d{1,2}\s+\w+\s+\d{4}|\d{4})?[,\s]*(?:died|d\.)?\s*(\d{1,2}\s+\w+\s+\d{4}|\d{4})?/gi

  const matches = text.matchAll(recordPattern)
  for (const match of matches) {
    const name = match[1]?.trim()
    if (name && name.split(' ').length >= 2) {
      people.push({
        name,
        birth_date: match[2],
        death_date: match[3],
        confidence: 0.7,
        source_excerpt: match[0].substring(0, 200),
      })
    }
  }

  // Look for "Name (year - year)" pattern
  const yearPattern = /([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)+)\s*\((\d{4})\s*[-–]\s*(\d{4})?\)/gi
  const yearMatches = text.matchAll(yearPattern)
  for (const match of yearMatches) {
    const name = match[1]?.trim()
    if (name && name.split(' ').length >= 2) {
      // Check if we already have this person
      const existing = people.find(p => p.name.toLowerCase() === name.toLowerCase())
      if (!existing) {
        people.push({
          name,
          birth_date: match[2],
          death_date: match[3],
          confidence: 0.8,
          source_excerpt: match[0],
        })
      }
    }
  }

  return people
}

function simpleExtract(text: string): ExtractionResult {
  return {
    people: extractPeopleFromText(text),
    dates: extractDates(text),
    places: extractPlaces(text),
    raw_text: text,
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Check auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { source_id, workspace_id, text } = body

    if (!workspace_id || !text) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Extract data using pattern matching
    const extraction = simpleExtract(text)

    // Create suggestions for each extracted person
    const suggestions = []

    for (const person of extraction.people) {
      // Try to find matching existing person
      const { data: matches } = await supabase
        .from('people')
        .select('id, preferred_name, birth_date, death_date')
        .eq('workspace_id', workspace_id)
        .or(`preferred_name.ilike.%${person.name.split(' ')[0]}%,family_name.ilike.%${person.name.split(' ').pop()}%`)
        .limit(5)

      let matchedPersonId = null
      let matchConfidence = 0

      if (matches && matches.length > 0) {
        // Simple name matching
        for (const match of matches) {
          const nameSimilarity = calculateNameSimilarity(person.name, match.preferred_name)
          if (nameSimilarity > matchConfidence) {
            matchConfidence = nameSimilarity
            matchedPersonId = match.id
          }
        }
      }

      const { data: suggestion, error } = await supabase
        .from('suggestions')
        .insert({
          workspace_id,
          suggestion_type: matchedPersonId ? 'update_person' : 'create_person',
          entity_type: 'person',
          entity_id: matchedPersonId,
          proposed_data: {
            preferred_name: person.name,
            birth_date: person.birth_date,
            death_date: person.death_date,
            birth_place: person.birth_place,
            death_place: person.death_place,
          },
          source_id,
          extracted_from: person.source_excerpt,
          confidence: person.confidence,
          ai_reasoning: `Extracted from document text. ${matchedPersonId ? `Possible match with existing person (${(matchConfidence * 100).toFixed(0)}% confidence).` : 'No existing match found.'}`,
          matched_person_id: matchConfidence > 0.6 ? matchedPersonId : null,
          match_confidence: matchConfidence,
          created_by: user.id,
        })
        .select()
        .single()

      if (!error && suggestion) {
        suggestions.push(suggestion)
      }
    }

    // Update source with extracted text
    if (source_id) {
      await supabase
        .from('sources')
        .update({ extracted_text: text })
        .eq('id', source_id)
    }

    return NextResponse.json({
      success: true,
      extraction: {
        people_found: extraction.people.length,
        dates_found: extraction.dates.length,
        places_found: extraction.places.length,
      },
      suggestions_created: suggestions.length,
      suggestions,
    })
  } catch (error) {
    console.error('Ingest error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function calculateNameSimilarity(name1: string, name2: string): number {
  const n1 = name1.toLowerCase().split(/\s+/)
  const n2 = name2.toLowerCase().split(/\s+/)

  let matches = 0
  for (const part of n1) {
    if (n2.some(p => p === part || p.startsWith(part) || part.startsWith(p))) {
      matches++
    }
  }

  return matches / Math.max(n1.length, n2.length)
}
