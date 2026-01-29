import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

interface StoryGenerationContext {
  person: any
  relationships: any[]
  events: any[]
  memories: any[]
  sources: any[]
}

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
    const { workspace_id, person_id } = body

    if (!workspace_id || !person_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

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

async function gatherPersonContext(supabase: any, workspace_id: string, person_id: string): Promise<StoryGenerationContext> {
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
  const relationships = [
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
    events: (events || []).map(e => e.event).filter(Boolean),
    memories: memories || [],
    sources: (sources || []).map(s => s.source).filter(Boolean)
  }
}

async function generateStory(context: StoryGenerationContext): Promise<string> {
  const { person, relationships, events, memories, sources } = context

  // Build context for Claude
  let contextText = `PERSON DATA:\n`
  contextText += `Name: ${person.preferred_name}\n`
  if (person.given_names) contextText += `Given names: ${person.given_names}\n`
  if (person.family_name) contextText += `Family name: ${person.family_name}\n`
  if (person.birth_date) {
    const precision = person.birth_date_precision === 'exact' ? '' : ' (approximate)'
    contextText += `Birth: ${person.birth_date}${precision}`
    if (person.birth_place) contextText += ` in ${person.birth_place}`
    contextText += `\n`
  }
  if (person.death_date) {
    const precision = person.death_date_precision === 'exact' ? '' : ' (approximate)'
    contextText += `Death: ${person.death_date}${precision}`
    if (person.death_place) contextText += ` in ${person.death_place}`
    contextText += `\n`
  }
  if (person.gender) contextText += `Gender: ${person.gender}\n`
  if (person.bio) contextText += `Bio notes: ${person.bio}\n`

  // Add relationships
  if (relationships.length > 0) {
    contextText += `\nRELATIONSHIPS:\n`
    relationships.forEach(rel => {
      const relatedPerson = rel.related_person
      const name = relatedPerson.preferred_name || `${relatedPerson.given_names || ''} ${relatedPerson.family_name || ''}`.trim()
      
      let relationshipType = rel.relationship_type
      if (rel.direction === 'incoming') {
        // Flip the relationship perspective
        if (relationshipType === 'parent_child') relationshipType = 'child_parent'
      }
      
      contextText += `- ${relationshipType.replace('_', ' ')} of ${name}`
      if (relatedPerson.birth_date) contextText += ` (born ${relatedPerson.birth_date})`
      if (relatedPerson.death_date) contextText += ` (died ${relatedPerson.death_date})`
      contextText += `\n`
    })
  }

  // Add events
  if (events.length > 0) {
    contextText += `\nLIFE EVENTS:\n`
    events.forEach(event => {
      contextText += `- ${event.event_type}: ${event.title || 'Event'}`
      if (event.event_date) contextText += ` (${event.event_date})`
      if (event.location) contextText += ` in ${event.location}`
      if (event.description) contextText += ` - ${event.description}`
      contextText += `\n`
    })
  }

  // Add memories/stories
  if (memories.length > 0) {
    contextText += `\nMEMORIES AND STORIES:\n`
    memories.slice(0, 5).forEach(memory => { // Limit to avoid token limit
      contextText += `- ${memory.title || memory.memory_type}: ${memory.content}\n`
    })
  }

  // Add source excerpts
  if (sources.length > 0) {
    contextText += `\nSOURCE MATERIAL:\n`
    sources.slice(0, 3).forEach(source => {
      contextText += `- From "${source.title}": ${source.description || ''}\n`
      if (source.extracted_text) {
        contextText += `  Content: ${source.extracted_text.substring(0, 200)}...\n`
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