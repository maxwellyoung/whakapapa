import test from 'node:test'
import assert from 'node:assert/strict'

import {
  ASSIGNABLE_ROLES,
  ROLE_HIERARCHY,
  canChangeRole,
  canManageMembers,
} from '../src/lib/permissions.ts'

test('only owners and admins can manage members', () => {
  assert.equal(canManageMembers('owner'), true)
  assert.equal(canManageMembers('admin'), true)
  assert.equal(canManageMembers('editor'), false)
  assert.equal(canManageMembers('contributor'), false)
  assert.equal(canManageMembers('viewer'), false)
})

test('role changes must always go to a strictly lower role', () => {
  assert.equal(canChangeRole('owner', 'admin'), true)
  assert.equal(canChangeRole('admin', 'editor'), true)
  assert.equal(canChangeRole('admin', 'admin'), false)
  assert.equal(canChangeRole('admin', 'owner'), false)
  assert.equal(canChangeRole('editor', 'contributor'), true)
  assert.equal(canChangeRole('editor', 'editor'), false)
})

test('assignable roles never exceed owner and maintain descending authority', () => {
  assert.deepEqual(ASSIGNABLE_ROLES, ['admin', 'editor', 'contributor', 'viewer'])
  for (const role of ASSIGNABLE_ROLES) {
    assert.ok(ROLE_HIERARCHY.owner > ROLE_HIERARCHY[role])
  }
})
