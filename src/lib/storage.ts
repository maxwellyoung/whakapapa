import type { SupabaseClient } from '@supabase/supabase-js'

const PUBLIC_SOURCE_SEGMENT = '/storage/v1/object/public/sources/'
const AUTH_SOURCE_SEGMENT = '/storage/v1/object/sign/sources/'
const DEFAULT_SIGNED_URL_TTL_SECONDS = 60 * 60

export function isPublicPhotoPath(path: string | null | undefined): boolean {
  if (!path) return false
  const [, secondSegment] = path.split('/')
  return secondSegment === 'photos'
}

export function extractStoragePath(value: string | null | undefined): string | null {
  if (!value) return null

  if (!value.startsWith('http://') && !value.startsWith('https://')) {
    return value
  }

  const segments = [PUBLIC_SOURCE_SEGMENT, AUTH_SOURCE_SEGMENT]
  for (const segment of segments) {
    const index = value.indexOf(segment)
    if (index >= 0) {
      const remainder = value.slice(index + segment.length)
      return remainder.split('?')[0] || null
    }
  }

  return null
}

export async function resolveStorageUrl(
  supabase: SupabaseClient,
  path: string | null | undefined,
  options?: { expiresIn?: number }
): Promise<string | null> {
  if (!path) return null

  if (isPublicPhotoPath(path)) {
    const { data } = supabase.storage.from('sources').getPublicUrl(path)
    return data.publicUrl
  }

  const { data, error } = await supabase.storage
    .from('sources')
    .createSignedUrl(path, options?.expiresIn ?? DEFAULT_SIGNED_URL_TTL_SECONDS)

  if (error || !data?.signedUrl) {
    return null
  }

  return data.signedUrl
}
