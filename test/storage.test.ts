import test from 'node:test'
import assert from 'node:assert/strict'

import {
  extractStoragePath,
  isPublicPhotoPath,
  resolveStorageUrl,
} from '../src/lib/storage.ts'

test('photo paths are public only under the photos segment', () => {
  assert.equal(isPublicPhotoPath('workspace/photos/image.jpg'), true)
  assert.equal(isPublicPhotoPath('workspace/documents/file.pdf'), false)
  assert.equal(isPublicPhotoPath(null), false)
})

test('extractStoragePath handles public and signed Supabase URLs', () => {
  assert.equal(
    extractStoragePath(
      'https://example.supabase.co/storage/v1/object/public/sources/workspace/photos/image.jpg'
    ),
    'workspace/photos/image.jpg'
  )
  assert.equal(
    extractStoragePath(
      'https://example.supabase.co/storage/v1/object/sign/sources/workspace/audio/memory.webm?token=abc'
    ),
    'workspace/audio/memory.webm'
  )
  assert.equal(extractStoragePath('workspace/photos/image.jpg'), 'workspace/photos/image.jpg')
  assert.equal(extractStoragePath('https://example.com/not-storage'), null)
})

test('resolveStorageUrl uses public URLs for photos and signed URLs for private assets', async () => {
  const calls: Array<{ kind: 'public' | 'signed'; path: string; expiresIn?: number }> = []
  const supabase = {
    storage: {
      from() {
        return {
          getPublicUrl(path: string) {
            calls.push({ kind: 'public', path })
            return { data: { publicUrl: `https://public.example/${path}` } }
          },
          async createSignedUrl(path: string, expiresIn: number) {
            calls.push({ kind: 'signed', path, expiresIn })
            return { data: { signedUrl: `https://signed.example/${path}` }, error: null }
          },
        }
      },
    },
  }

  assert.equal(
    await resolveStorageUrl(
      supabase as unknown as Parameters<typeof resolveStorageUrl>[0],
      'workspace/photos/image.jpg'
    ),
    'https://public.example/workspace/photos/image.jpg'
  )
  assert.equal(
    await resolveStorageUrl(
      supabase as unknown as Parameters<typeof resolveStorageUrl>[0],
      'workspace/audio/memory.webm',
      { expiresIn: 120 }
    ),
    'https://signed.example/workspace/audio/memory.webm'
  )
  assert.deepEqual(calls, [
    { kind: 'public', path: 'workspace/photos/image.jpg' },
    { kind: 'signed', path: 'workspace/audio/memory.webm', expiresIn: 120 },
  ])
})
