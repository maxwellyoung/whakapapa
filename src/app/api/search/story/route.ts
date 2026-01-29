import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

interface SearchResult {
  type: 'person' | 'relationship' | 'story'
  id: string
  title: string
  snippet: string
  relevance: number
  person?: {
    id: string
    name: string
    birth_date?: string
    death_date?: string
  }
}

const SEARCH_PROMPT = `You are a genealogy search expert helping users find family information based on natural language queries.

Given a family database and a user's question, identify the most relevant people, relationships, or stories that answer their query.

Your response should focus on:
1. Direct answers to relationship questions ("How are X and Y related?")
2. People matching descriptive criteria ("ancestors from Ireland", "who lived in Auckland")
3. Family connections and lineage ("great-grandparents", "descendants of...")
4. Historical context and time periods

Respond with a JSON array of results, each containing:
{
  "type": "person" | "relationship" | "story",
  "id": "database_id",
  "title": "Brief title describing the result",
  "snippet": "2-3 sentence explanation of relevance to the query",
  "relevance": 0.0-1.0,
  "person": {
    "id": "person_id",
    "name": "Full Name",
    "birth_date": "1880-01-01",
    "death_date": "1950-01-01"
  }
}

Prioritize results that most directly answer the user's question. Limit to 10 results.`

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Check auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { workspace_id, query } = body

    if (!workspace_id || !query) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if we have an API key
    if (!process.env.ANTHROPIC_API_KEY) {
      // Fall back to simple text search
      return await simpleSearch(supabase, workspace_id, query)
    }

    // Gather family data for context
    const familyContext = await gatherFamilyContext(supabase, workspace_id)

    // Use Claude for intelligent search
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `${SEARCH_PROMPT}\n\n---\n\nFAMILY DATABASE:\n${familyContext}\n\n---\n\nUSER QUERY: "${query}"\n\nPlease provide relevant search results.`
        }
      ]
    })

    // Parse the response
    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

    // Extract JSON from response
    const jsonMatch = responseText.match(/\[[\s\S]*\]/)
    let results: SearchResult[] = []
    
    if (jsonMatch) {
      try {
        results = JSON.parse(jsonMatch[0])
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError)
        // Fall back to simple search
        return await simpleSearch(supabase, workspace_id, query)
      }
    }

    return NextResponse.json({
      success: true,
      results: results,
      query: query,
      method: 'ai'
    })

  } catch (error) {
    console.error('Story search error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

async function gatherFamilyContext(supabase: any, workspace_id: string): Promise<string> {
  // Fetch all people in the workspace
  const { data: people } = await supabase
    .from('people')
    .select(`
      id,
      preferred_name,
      given_names,
      family_name,
      birth_date,
      birth_place,
      death_date,
      death_place,
      gender,
      bio
    `)
    .eq('workspace_id', workspace_id)
    .limit(100)

  // Fetch relationships
  const { data: relationships } = await supabase
    .from('relationships')
    .select(`
      *,
      person_a:people!relationships_person_a_id_fkey(id, preferred_name),
      person_b:people!relationships_person_b_id_fkey(id, preferred_name)
    `)
    .eq('workspace_id', workspace_id)
    .limit(200)

  // Fetch recent memories
  const { data: memories } = await supabase
    .from('memories')
    .select(`
      id,
      title,
      content,
      memory_type,
      person:people(preferred_name)
    `)
    .eq('workspace_id', workspace_id)
    .order('created_at', { ascending: false })
    .limit(50)

  // Build context string
  let context = "PEOPLE:\n"
  if (people) {
    for (const person of people.slice(0, 50)) { // Limit to avoid token issues
      context += `- ${person.preferred_name}`
      if (person.given_names || person.family_name) {
        context += ` (${person.given_names || ''} ${person.family_name || ''})`
      }
      if (person.birth_date) context += ` born ${person.birth_date}`
      if (person.birth_place) context += ` in ${person.birth_place}`
      if (person.death_date) context += ` died ${person.death_date}`
      if (person.death_place) context += ` in ${person.death_place}`
      if (person.bio) context += ` - ${person.bio.substring(0, 100)}`
      context += `\n`
    }
  }

  context += "\nRELATIONSHIPS:\n"
  if (relationships) {
    for (const rel of relationships.slice(0, 50)) {
      context += `- ${rel.person_a.preferred_name} is ${rel.relationship_type.replace('_', ' ')} of ${rel.person_b.preferred_name}\n`
    }
  }

  if (memories && memories.length > 0) {
    context += "\nMEMORIES/STORIES:\n"
    for (const memory of memories.slice(0, 20)) {
      context += `- ${memory.person.preferred_name}: ${memory.title || memory.memory_type} - ${memory.content.substring(0, 150)}\n`
    }
  }

  return context
}

// Fallback simple search when AI is not available
async function simpleSearch(supabase: any, workspace_id: string, query: string) {
  const queryLower = query.toLowerCase()
  const results: SearchResult[] = []

  // Simple text matching against people
  const { data: people } = await supabase
    .from('people')
    .select('*')
    .eq('workspace_id', workspace_id)
    .or(`preferred_name.ilike.%${queryLower}%,given_names.ilike.%${queryLower}%,family_name.ilike.%${queryLower}%,bio.ilike.%${queryLower}%,birth_place.ilike.%${queryLower}%,death_place.ilike.%${queryLower}%`)
    .limit(10)

  if (people) {
    people.forEach(person => {
      const fullName = `${person.given_names || ''} ${person.family_name || ''}`.trim()
      let snippet = `${person.preferred_name}`
      if (person.birth_date) snippet += ` (born ${person.birth_date})`
      if (person.bio) snippet += ` - ${person.bio.substring(0, 100)}...`

      results.push({
        type: 'person',
        id: person.id,
        title: person.preferred_name,
        snippet: snippet,
        relevance: calculateRelevance(queryLower, person),
        person: {
          id: person.id,
          name: person.preferred_name,
          birth_date: person.birth_date,
          death_date: person.death_date
        }
      })
    })
  }

  // Sort by relevance
  results.sort((a, b) => b.relevance - a.relevance)

  return NextResponse.json({
    success: true,
    results: results.slice(0, 10),
    query: query,
    method: 'simple'
  })
}

function calculateRelevance(query: string, person: any): number {
  const fields = [
    person.preferred_name,
    person.given_names,
    person.family_name,
    person.bio,
    person.birth_place,
    person.death_place
  ].filter(Boolean).join(' ').toLowerCase()

  const queryWords = query.split(/\s+/)
  let score = 0

  queryWords.forEach(word => {
    if (fields.includes(word)) {
      score += 1
    }
  })

  return score / queryWords.length
}