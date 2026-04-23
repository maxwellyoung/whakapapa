import { notFound } from 'next/navigation'
import { SharedMemoryView } from '@/components/share/shared-memory-view'
import { SharedPersonView } from '@/components/share/shared-person-view'
import { SharePasswordGate } from '@/components/share/share-password-gate'
import { isShareVerified, resolveShareAccess } from '@/lib/share-access'
import { createAdminClient } from '@/lib/supabase/admin'
import { resolveStorageUrl } from '@/lib/storage'

interface SharePageProps {
  params: Promise<{ token: string }>
}

export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params
  const verified = await isShareVerified(token)
  const access = await resolveShareAccess(token, {
    passwordVerified: verified,
    incrementView: false,
  })

  if (access.status === 'not_found') {
    notFound()
  }

  if (access.status === 'password_required' || access.status === 'invalid_password') {
    return (
      <SharePasswordGate
        token={token}
        initialError={access.status === 'invalid_password' ? 'Incorrect password. Please try again.' : undefined}
      />
    )
  }

  // Check if expired
  if (access.status === 'expired') {
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
  if (access.status === 'max_views_reached') {
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

  // Fetch the shared content based on entity type
  if (access.status === 'ok' && access.entity_type === 'memory' && access.memory && access.person) {
    const workspaceName = access.workspace?.name
    if (!workspaceName) {
      notFound()
    }

    const adminClient = createAdminClient()
    const mediaUrl =
      access.memory.media_path && adminClient
        ? await resolveStorageUrl(adminClient, access.memory.media_path)
        : access.memory.media_url

    const incremented = await resolveShareAccess(token, {
      passwordVerified: verified,
      incrementView: true,
    })
    if (incremented.status === 'max_views_reached') {
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

    return (
      <SharedMemoryView
        memory={{ ...access.memory, media_url: mediaUrl }}
        person={access.person}
        workspaceName={workspaceName}
      />
    )
  }

  if (access.status === 'ok' && access.entity_type === 'person' && access.person) {
    const workspaceName = access.workspace?.name
    if (!workspaceName) {
      notFound()
    }

    const incremented = await resolveShareAccess(token, {
      passwordVerified: verified,
      incrementView: true,
    })
    if (incremented.status === 'max_views_reached') {
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

    return <SharedPersonView person={access.person} workspaceName={workspaceName} />
  }

  notFound()
}

export async function generateMetadata({ params }: SharePageProps) {
  const { token } = await params
  const verified = await isShareVerified(token)
  const access = await resolveShareAccess(token, {
    passwordVerified: verified,
    incrementView: false,
  })

  if (access.status !== 'ok') {
    return { title: 'Shared Memory | Whakapapa' }
  }

  if (access.entity_type === 'memory' && access.memory) {
    const personName = access.person?.preferred_name
    return {
      title: access.memory.title
        ? `${access.memory.title} | Whakapapa`
        : `Memory of ${personName || 'Unknown'} | Whakapapa`,
      description: `A shared family memory from Whakapapa`,
    }
  }

  if (access.entity_type === 'person' && access.person) {
    return {
      title: `${access.person.preferred_name} | Whakapapa`,
      description: 'A shared family profile from Whakapapa',
    }
  }

  return { title: 'Shared Memory | Whakapapa' }
}
