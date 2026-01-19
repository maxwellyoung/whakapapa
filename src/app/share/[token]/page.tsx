import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SharedMemoryView } from '@/components/share/shared-memory-view'

interface SharePageProps {
  params: Promise<{ token: string }>
}

export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params
  const supabase = await createClient()

  // Fetch the shareable link
  const { data: link } = await supabase
    .from('shareable_links')
    .select('*')
    .eq('token', token)
    .single()

  if (!link) {
    notFound()
  }

  // Check if expired
  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950">
        <div className="text-center max-w-sm px-4">
          <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-100 mb-2">
            Link Expired
          </h1>
          <p className="text-stone-500 dark:text-stone-400">
            This shared link has expired and is no longer available.
          </p>
        </div>
      </div>
    )
  }

  // Check max views
  if (link.max_views && link.view_count >= link.max_views) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950">
        <div className="text-center max-w-sm px-4">
          <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-100 mb-2">
            View Limit Reached
          </h1>
          <p className="text-stone-500 dark:text-stone-400">
            This shared link has reached its maximum number of views.
          </p>
        </div>
      </div>
    )
  }

  // Increment view count
  await supabase.rpc('increment_share_view', { link_token: token })

  // Fetch the shared content based on entity type
  if (link.entity_type === 'memory') {
    const { data: memory } = await supabase
      .from('memories')
      .select('*, person:people(id, preferred_name, photo_url, given_names, family_name)')
      .eq('id', link.entity_id)
      .single()

    if (!memory) {
      notFound()
    }

    // Fetch workspace for branding
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('name')
      .eq('id', link.workspace_id)
      .single()

    return (
      <SharedMemoryView
        memory={memory}
        person={memory.person}
        workspaceName={workspace?.name}
      />
    )
  }

  notFound()
}

export async function generateMetadata({ params }: SharePageProps) {
  const { token } = await params
  const supabase = await createClient()

  const { data: link } = await supabase
    .from('shareable_links')
    .select('entity_type, entity_id')
    .eq('token', token)
    .single()

  if (!link) {
    return { title: 'Shared Memory | Whakapapa' }
  }

  if (link.entity_type === 'memory') {
    const { data: memory } = await supabase
      .from('memories')
      .select('title, person:people(preferred_name)')
      .eq('id', link.entity_id)
      .single()

    if (memory) {
      const personName = Array.isArray(memory.person)
        ? memory.person[0]?.preferred_name
        : (memory.person as { preferred_name: string } | null)?.preferred_name
      return {
        title: memory.title
          ? `${memory.title} | Whakapapa`
          : `Memory of ${personName || 'Unknown'} | Whakapapa`,
        description: `A shared family memory from Whakapapa`,
      }
    }
  }

  return { title: 'Shared Memory | Whakapapa' }
}
