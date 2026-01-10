import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

interface ExtractedPerson {
  name: string
  given_names?: string
  family_name?: string
  birth_date?: string
  birth_date_approximate?: boolean
  death_date?: string
  death_date_approximate?: boolean
  birth_place?: string
  death_place?: string
  gender?: string
  relationships?: {
    type: 'parent' | 'child' | 'spouse' | 'sibling'
    to_name: string
  }[]
  confidence: number
  source_excerpt?: string
}

interface ExtractionResult {
  people: ExtractedPerson[]
  events: {
    type: string
    date?: string
    location?: string
    participants: string[]
  }[]
  notes: string[]
}

const EXTRACTION_PROMPT = `You are an expert genealogist analyzing text to extract family history information.

Analyze the following text and extract:
1. **People**: Names, birth/death dates and places, gender
2. **Relationships**: Who is related to whom (parent, child, spouse, sibling)
3. **Events**: Marriages, baptisms, migrations, military service, etc.

For dates:
- Use ISO format (YYYY-MM-DD) when exact
- For approximate dates like "around 1880" or "c. 1880", use just the year and mark as approximate
- For ranges like "1880-1885", pick the midpoint

For names:
- Separate given names from family names when possible
- Include maiden names in parentheses if mentioned

Respond in JSON format:
{
  "people": [
    {
      "name": "Full Name",
      "given_names": "First Middle",
      "family_name": "Surname",
      "birth_date": "1880-03-15",
      "birth_date_approximate": false,
      "death_date": "1952",
      "death_date_approximate": true,
      "birth_place": "Auckland, New Zealand",
      "death_place": "Wellington, New Zealand",
      "gender": "male",
      "relationships": [
        { "type": "spouse", "to_name": "Mary Smith" },
        { "type": "parent", "to_name": "James Brown Jr" }
      ],
      "confidence": 0.9,
      "source_excerpt": "relevant text snippet"
    }
  ],
  "events": [
    {
      "type": "marriage",
      "date": "1905-03-15",
      "location": "St Mary's Church, Auckland",
      "participants": ["John Brown", "Mary Smith"]
    }
  ],
  "notes": ["Any important context or caveats about the extraction"]
}

Only include information explicitly stated or strongly implied in the text. Rate confidence from 0-1 based on clarity of information.`

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Check auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { workspace_id, text, source_id } = body

    if (!workspace_id || !text) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if we have an API key
    if (!process.env.ANTHROPIC_API_KEY) {
      // Fall back to simple extraction
      return NextResponse.json({
        success: true,
        extraction: simpleExtract(text),
        suggestions_created: 0,
        method: 'pattern_matching',
      })
    }

    // Use Claude for intelligent extraction
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `${EXTRACTION_PROMPT}\n\n---\n\nTEXT TO ANALYZE:\n${text}`,
        },
      ],
    })

    // Parse the response
    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response')
    }

    const extraction: ExtractionResult = JSON.parse(jsonMatch[0])

    // Create suggestions for each extracted person
    const suggestions = []

    for (const person of extraction.people) {
      // Check for existing matches
      const nameParts = person.name.toLowerCase().split(/\s+/)
      const { data: matches } = await supabase
        .from('people')
        .select('id, preferred_name, given_names, family_name, birth_date, death_date')
        .eq('workspace_id', workspace_id)
        .limit(10)

      let matchedPersonId: string | null = null
      let matchConfidence = 0

      if (matches) {
        for (const match of matches) {
          const existingParts = [
            match.preferred_name,
            match.given_names,
            match.family_name,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .split(/\s+/)

          const overlap = nameParts.filter((p) => existingParts.includes(p)).length
          const similarity = overlap / Math.max(nameParts.length, existingParts.length)

          if (similarity > matchConfidence && similarity > 0.5) {
            matchConfidence = similarity
            matchedPersonId = match.id
          }
        }
      }

      // Create suggestion
      const { data: suggestion, error } = await supabase
        .from('suggestions')
        .insert({
          workspace_id,
          suggestion_type: matchedPersonId ? 'update_person' : 'create_person',
          entity_type: 'person',
          entity_id: matchedPersonId,
          proposed_data: {
            preferred_name: person.name,
            given_names: person.given_names,
            family_name: person.family_name,
            birth_date: person.birth_date,
            birth_date_precision: person.birth_date_approximate ? 'circa' : 'exact',
            death_date: person.death_date,
            death_date_precision: person.death_date_approximate ? 'circa' : 'exact',
            birth_place: person.birth_place,
            death_place: person.death_place,
            gender: person.gender,
          },
          source_id,
          extracted_from: person.source_excerpt,
          confidence: person.confidence,
          ai_reasoning: `AI extracted with ${(person.confidence * 100).toFixed(0)}% confidence. ${
            matchedPersonId
              ? `Possible match with existing person (${(matchConfidence * 100).toFixed(0)}% name similarity).`
              : 'No existing match found - will create new person.'
          }`,
          matched_person_id: matchedPersonId,
          match_confidence: matchConfidence,
          created_by: user.id,
        })
        .select()
        .single()

      if (!error && suggestion) {
        suggestions.push(suggestion)
      }
    }

    // Store relationships for later processing
    const relationships = extraction.people
      .flatMap((p) =>
        (p.relationships || []).map((r) => ({
          from_name: p.name,
          to_name: r.to_name,
          type: r.type,
        }))
      )

    return NextResponse.json({
      success: true,
      extraction: {
        people: extraction.people,
        events: extraction.events,
        notes: extraction.notes,
        relationships,
      },
      suggestions_created: suggestions.length,
      suggestions,
      method: 'ai',
    })
  } catch (error) {
    console.error('Extract error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// Fallback simple extraction
function simpleExtract(text: string) {
  const people: ExtractedPerson[] = []

  // Name (year - year) pattern
  const yearPattern = /([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)+)\s*\((\d{4})\s*[-–]\s*(\d{4})?\)/g
  let match
  while ((match = yearPattern.exec(text)) !== null) {
    people.push({
      name: match[1].trim(),
      birth_date: match[2],
      death_date: match[3],
      confidence: 0.7,
      source_excerpt: match[0],
    })
  }

  return { people, events: [], notes: ['Used pattern matching (AI not available)'] }
}
