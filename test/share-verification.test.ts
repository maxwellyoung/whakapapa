import test from 'node:test'
import assert from 'node:assert/strict'

import {
  canSignShareVerification,
  createShareVerificationCookieValue,
  getShareCookieMaxAge,
  verifyShareCookieValue,
} from '../src/lib/share-verification.ts'

test('share verification requires an explicit secret', () => {
  assert.equal(canSignShareVerification(null), false)
  assert.equal(createShareVerificationCookieValue('token-123', ''), null)
  assert.equal(verifyShareCookieValue('token-123', '123.invalid', undefined), false)
})

test('share verification accepts a valid cookie and rejects tampering', () => {
  const now = new Date('2026-03-06T00:00:00Z').getTime()
  const secret = 'test-secret'
  const token = 'token-123'
  const cookieValue = createShareVerificationCookieValue(token, secret, now)

  assert.ok(cookieValue)
  assert.equal(verifyShareCookieValue(token, cookieValue, secret, now), true)
  assert.equal(verifyShareCookieValue(`${token}-other`, cookieValue, secret, now), false)
  assert.equal(
    verifyShareCookieValue(token, cookieValue?.replace(/\.[^.]+$/, '.deadbeef'), secret, now),
    false
  )
})

test('share verification rejects expired cookies', () => {
  const now = new Date('2026-03-06T00:00:00Z').getTime()
  const secret = 'test-secret'
  const token = 'token-123'
  const cookieValue = createShareVerificationCookieValue(token, secret, now)

  assert.ok(cookieValue)
  assert.equal(
    verifyShareCookieValue(
      token,
      cookieValue,
      secret,
      now + (getShareCookieMaxAge() + 1) * 1000
    ),
    false
  )
})
