import { NextResponse } from 'next/server'
import {
  canSignShareAccessVerification,
  createShareAccessCookieValue,
  getShareAccessCookieMaxAge,
  getShareCookieName,
  resolveShareAccess,
} from '@/lib/share-access'

const ATTEMPT_WINDOW_MS = 60_000
const MAX_ATTEMPTS = 10
const attemptTracker = new Map<string, { count: number; start: number }>()

function getAttemptKey(token: string, request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  const ip = forwardedFor?.split(',')[0]?.trim() || 'unknown'
  return `${token}:${ip}`
}

function checkRateLimit(key: string): boolean {
  const now = Date.now()
  const current = attemptTracker.get(key)
  if (!current || now - current.start > ATTEMPT_WINDOW_MS) {
    attemptTracker.set(key, { count: 1, start: now })
    return true
  }

  if (current.count >= MAX_ATTEMPTS) {
    return false
  }

  current.count += 1
  attemptTracker.set(key, current)
  return true
}

export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params
  const key = getAttemptKey(token, request)

  if (!checkRateLimit(key)) {
    return NextResponse.json(
      { success: false, status: 'rate_limited' },
      { status: 429 }
    )
  }

  const body = await request.json().catch(() => ({}))
  const password = typeof body?.password === 'string' ? body.password : ''

  const result = await resolveShareAccess(token, {
    password,
    passwordVerified: false,
    incrementView: false,
  })

  if (result.status !== 'ok') {
    const statusCode = result.status === 'invalid_password' ? 401 : 400
    return NextResponse.json({ success: false, status: result.status }, { status: statusCode })
  }

  if (!canSignShareAccessVerification()) {
    return NextResponse.json(
      { success: false, status: 'misconfigured' },
      { status: 503 }
    )
  }

  const cookieValue = createShareAccessCookieValue(token)
  if (!cookieValue) {
    return NextResponse.json(
      { success: false, status: 'misconfigured' },
      { status: 503 }
    )
  }

  const response = NextResponse.json({ success: true, status: 'ok' })
  response.cookies.set({
    name: getShareCookieName(token),
    value: cookieValue,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: `/share/${token}`,
    maxAge: getShareAccessCookieMaxAge(),
  })

  return response
}
