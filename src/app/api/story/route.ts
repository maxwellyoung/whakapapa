import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

interface StoryGenerationContext {
  person: Record<string, unknown> | null
  relationships: Array<Record<string, unknown>>
  events: Array<Record<string, unknown>>
  memories: Array<Record<string, unknown>>
  sources: Array<Record<string, unknown>>
}

const requestSchema = z.object({
  workspace_id: z.string().min(1),
  person_id: z.string().min(1),
})

const STORY_GENERATION_PROMPT = `You are a master storyteller crafting family history narratives. Your task is to weave the provided genealogical data into a compelling, natural language story about a person's life.

WRITING STYLE:
- Write in third person narrative prose
- Use flowing, editorial storytelling style - think New Yorker profile meets family memoir
- Generous, breathing sentences with natural rhythm
- NO em dashes. Use commas or full stops only.
- Create emotional connection while staying factual
- Connect personal details to broader historical context when relevant

NARRATIVE STRUCTURE:
- Begin with a compelling opening that captures who they were as a person
- Weave in biographical details naturally (don't just list dates)
- Include relationships and family connections as part of their story
- Reference meaningful events and memories if available
- End with their legacy or impact on the family

LINKING INSTRUCTIONS:
- Wrap every mention of a person's name in [[Name]] brackets for clickable navigation
- Wrap place names mentioned prominently in ((Place Name)) brackets
- These will become clickable links in the story interface

FACTUAL ACCURACY:
- Only include information provided in the data
- If dates are approximate, use language like "around" or "in the early 1920s"
- Don't invent details, but do interpret and contextualize what's given
- If limited data exists, craft a shorter but still engaging narrative

Remember: This isn't just data presentation, it's storytelling that honors the person's memory and creates connections across generations.`

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Check auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = requestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    const { workspace_id, person_id } = parsed.data

    // Check if we have an API key
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'AI service not available' }, { status: 503 })
    }

    // Gather comprehensive data about the person
    const context = await gatherPersonContext(supabase, workspace_id, person_id)

    if (!context.person) {
      return NextResponse.json({ error: 'Person not found' }, { status: 404 })
    }

    // Generate the story using Claude
    const story = await generateStory(context)

    return NextResponse.json({
      success: true,
      story: story,
      generated_at: new Date().toISOString(),
    })

  } catch (error) {
    console.error('Story generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

async function gatherPersonContext(
  supabase: SupabaseClient,
  workspace_id: string,
  person_id: string
): Promise<StoryGenerationContext> {
  // Fetch person data
  const { data: person } = await supabase
    .from('people')
    .select('*')
    .eq('id', person_id)
    .eq('workspace_id', workspace_id)
    .single()

  // Fetch relationships with connected people
  const { data: relationshipsA } = await supabase
    .from('relationships')
    .select(`
      *,
      person_b:people!relationships_person_b_id_fkey(id, preferred_name, given_names, family_name, birth_date, death_date)
    `)
    .eq('person_a_id', person_id)
    .eq('workspace_id', workspace_id)

  const { data: relationshipsB } = await supabase
    .from('relationships')
    .select(`
      *,
      person_a:people!relationships_person_a_id_fkey(id, preferred_name, given_names, family_name, birth_date, death_date)
    `)
    .eq('person_b_id', person_id)
    .eq('workspace_id', workspace_id)

  // Combine relationships
  const relationships: Array<Record<string, unknown>> = [
    ...(relationshipsA || []).map(r => ({ ...r, related_person: r.person_b, direction: 'outgoing' })),
    ...(relationshipsB || []).map(r => ({ ...r, related_person: r.person_a, direction: 'incoming' }))
  ]

  // Fetch events this person participated in
  const { data: events } = await supabase
    .from('event_participants')
    .select(`
      *,
      event:events(*)
    `)
    .eq('person_id', person_id)

  // Fetch memories/stories
  const { data: memories } = await supabase
    .from('memories')
    .select('*')
    .eq('person_id', person_id)
    .eq('workspace_id', workspace_id)
    .order('created_at', { ascending: false })

  // Fetch sources/documents
  const { data: sources } = await supabase
    .from('citations')
    .select(`
      *,
      source:sources(*)
    `)
    .eq('entity_type', 'person')
    .eq('entity_id', person_id)

  return {
    person: person || null,
    relationships: relationships || [],
    events: (events || []).map(e => e.event as Record<string, unknown>).filter(Boolean),
    memories: (memories as Array<Record<string, unknown>>) || [],
    sources: (sources || []).map(s => s.source as Record<string, unknown>).filter(Boolean)
  }
}

async function generateStory(context: StoryGenerationContext): Promise<string> {
  const { person, relationships, events, memories, sources } = context
  if (!person) return ''

  const personData = person as Record<string, unknown>

  // Build context for Claude
  let contextText = `PERSON DATA:\n`
  contextText += `Name: ${String(personData.preferred_name || 'Unknown')}\n`
  if (personData.given_names) contextText += `Given names: ${String(personData.given_names)}\n`
  if (personData.family_name) contextText += `Family name: ${String(personData.family_name)}\n`
  if (personData.birth_date) {
    const precision = personData.birth_date_precision === 'exact' ? '' : ' (approximate)'
    contextText += `Birth: ${String(personData.birth_date)}${precision}`
    if (personData.birth_place) contextText += ` in ${String(personData.birth_place)}`
    contextText += `\n`
  }
  if (personData.death_date) {
    const precision = personData.death_date_precision === 'exact' ? '' : ' (approximate)'
    contextText += `Death: ${String(personData.death_date)}${precision}`
    if (personData.death_place) contextText += ` in ${String(personData.death_place)}`
    contextText += `\n`
  }
  if (personData.gender) contextText += `Gender: ${String(personData.gender)}\n`
  if (personData.bio) contextText += `Bio notes: ${String(personData.bio)}\n`

  // Add relationships
  if (relationships.length > 0) {
    contextText += `\nRELATIONSHIPS:\n`
    relationships.forEach((rel) => {
      const relationship = rel as Record<string, unknown>
      const relatedPerson = (relationship.related_person || {}) as Record<string, unknown>
      const name = String(
        relatedPerson.preferred_name ||
          `${String(relatedPerson.given_names || '')} ${String(relatedPerson.family_name || '')}`.trim()
      )
      
      let relationshipType = String(relationship.relationship_type || 'related')
      if (relationship.direction === 'incoming') {
        // Flip the relationship perspective
        if (relationshipType === 'parent_child') relationshipType = 'child_parent'
      }
      
      contextText += `- ${relationshipType.replace('_', ' ')} of ${name}`
      if (relatedPerson.birth_date) contextText += ` (born ${String(relatedPerson.birth_date)})`
      if (relatedPerson.death_date) contextText += ` (died ${String(relatedPerson.death_date)})`
      contextText += `\n`
    })
  }

  // Add events
  if (events.length > 0) {
    contextText += `\nLIFE EVENTS:\n`
    events.forEach((event) => {
      const eventData = event as Record<string, unknown>
      contextText += `- ${String(eventData.event_type || 'event')}: ${String(eventData.title || 'Event')}`
      if (eventData.event_date) contextText += ` (${String(eventData.event_date)})`
      if (eventData.location) contextText += ` in ${String(eventData.location)}`
      if (eventData.description) contextText += ` - ${String(eventData.description)}`
      contextText += `\n`
    })
  }

  // Add memories/stories
  if (memories.length > 0) {
    contextText += `\nMEMORIES AND STORIES:\n`
    memories.slice(0, 5).forEach((memory) => {
      const memoryData = memory as Record<string, unknown>
      contextText += `- ${String(memoryData.title || memoryData.memory_type || 'Memory')}: ${String(memoryData.content || '')}\n`
    })
  }

  // Add source excerpts
  if (sources.length > 0) {
    contextText += `\nSOURCE MATERIAL:\n`
    sources.slice(0, 3).forEach((source) => {
      const sourceData = source as Record<string, unknown>
      contextText += `- From "${String(sourceData.title || 'Source')}": ${String(sourceData.description || '')}\n`
      if (typeof sourceData.extracted_text === 'string') {
        contextText += `  Content: ${sourceData.extracted_text.substring(0, 200)}...\n`
      }
    })
  }

  // Generate story with Claude
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `${STORY_GENERATION_PROMPT}\n\n---\n\nPERSON CONTEXT:\n${contextText}\n\n---\n\nPlease generate a compelling narrative story about this person's life.`
      }
    ]
  })

  const storyText = message.content[0].type === 'text' ? message.content[0].text : ''
  
  return storyText.trim()
}
