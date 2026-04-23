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

function ShareUnavailable({ title, body }: { title: string; body: string }) {
  return (
    <div className="archive-public-shell flex min-h-screen items-center justify-center px-4">
      <div className="archive-artifact max-w-sm p-8 text-center">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-[var(--image-ochre)]">Shared Link</p>
        <h1 className="mb-3 font-serif text-4xl leading-none tracking-[-0.04em] text-[var(--archive-text)]">
          {title}
        </h1>
        <p className="text-sm leading-6 text-[rgba(238,220,184,0.66)]">
          {body}
        </p>
      </div>
    </div>
  )
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
      <ShareUnavailable
        title="Link Expired"
        body="This shared link has expired and is no longer available."
      />
    )
  }

  // Check max views
  if (access.status === 'max_views_reached') {
    return (
      <ShareUnavailable
        title="View Limit Reached"
        body="This shared link has reached its maximum number of views."
      />
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
        <ShareUnavailable
          title="View Limit Reached"
          body="This shared link has reached its maximum number of views."
        />
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
        <ShareUnavailable
          title="View Limit Reached"
          body="This shared link has reached its maximum number of views."
        />
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
