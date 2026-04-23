import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import {
  canSignShareVerification as canSignShareVerificationWithSecret,
  createShareVerificationCookieValue as createCookieValue,
  getShareCookieMaxAge as getCookieMaxAge,
  verifyShareCookieValue,
} from '@/lib/share-verification'

export type ShareAccessStatus =
  | 'ok'
  | 'not_found'
  | 'expired'
  | 'max_views_reached'
  | 'password_required'
  | 'invalid_password'

export interface SharePersonPayload {
  id: string
  preferred_name: string
  given_names: string | null
  family_name: string | null
  photo_url: string | null
  bio?: string | null
  birth_date?: string | null
  death_date?: string | null
}

export interface ShareMemoryPayload {
  id: string
  memory_type: string
  title: string | null
  content: string
  media_url: string | null
  media_path?: string | null
  media_type: string | null
  duration_seconds: number | null
  contributed_by_name: string | null
  created_at: string
}

export interface ShareAccessResult {
  status: ShareAccessStatus
  entity_type?: 'memory' | 'person'
  workspace?: { name: string }
  memory?: ShareMemoryPayload
  person?: SharePersonPayload
}

const SHARE_COOKIE_PREFIX = 'whakapapa_share_'

function getShareCookieSecret(): string | null {
  const secret = process.env.SHARE_LINK_COOKIE_SECRET?.trim()
  return secret || null
}

export function canSignShareVerification(): boolean {
  return canSignShareVerificationWithSecret(getShareCookieSecret())
}

export function getShareCookieName(token: string): string {
  return `${SHARE_COOKIE_PREFIX}${token.slice(0, 16)}`
}

export function createShareVerificationCookieValue(token: string): string | null {
  return createCookieValue(token, getShareCookieSecret())
}

export function getShareCookieMaxAge(): number {
  return getCookieMaxAge()
}

export async function isShareVerified(token: string): Promise<boolean> {
  const cookieStore = await cookies()
  const value = cookieStore.get(getShareCookieName(token))?.value
  return verifyShareCookieValue(token, value, getShareCookieSecret())
}

export async function resolveShareAccess(
  token: string,
  options?: {
    password?: string
    passwordVerified?: boolean
    incrementView?: boolean
  }
): Promise<ShareAccessResult> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('resolve_share_access', {
    link_token: token,
    provided_password: options?.password ?? null,
    password_verified: options?.passwordVerified ?? false,
    increment_view: options?.incrementView ?? true,
  })

  if (error || !data || typeof data !== 'object') {
    return { status: 'not_found' }
  }

  return data as ShareAccessResult
}
