import { createHmac, timingSafeEqual } from 'crypto'

const SHARE_COOKIE_TTL_SECONDS = 60 * 60 * 6

function getSecret(secret?: string | null): string | null {
  const trimmed = secret?.trim()
  return trimmed || null
}

function signShareToken(token: string, exp: number, secret: string): string {
  const payload = `${token}.${exp}`
  return createHmac('sha256', secret).update(payload).digest('hex')
}

export function canSignShareVerification(secret?: string | null): boolean {
  return getSecret(secret) !== null
}

export function createShareVerificationCookieValue(
  token: string,
  secret?: string | null,
  now = Date.now()
): string | null {
  const resolvedSecret = getSecret(secret)
  if (!resolvedSecret) {
    return null
  }

  const exp = Math.floor(now / 1000) + SHARE_COOKIE_TTL_SECONDS
  const sig = signShareToken(token, exp, resolvedSecret)
  return `${exp}.${sig}`
}

export function getShareCookieMaxAge(): number {
  return SHARE_COOKIE_TTL_SECONDS
}

export function verifyShareCookieValue(
  token: string,
  cookieValue: string | null | undefined,
  secret?: string | null,
  now = Date.now()
): boolean {
  const resolvedSecret = getSecret(secret)
  if (!resolvedSecret || !cookieValue) return false

  const [expRaw, sig] = cookieValue.split('.')
  const exp = Number(expRaw)
  if (!exp || !sig) return false
  if (exp <= Math.floor(now / 1000)) return false

  const expected = signShareToken(token, exp, resolvedSecret)
  const sigBuf = Buffer.from(sig, 'hex')
  const expectedBuf = Buffer.from(expected, 'hex')
  if (sigBuf.length !== expectedBuf.length) return false

  return timingSafeEqual(sigBuf, expectedBuf)
}
