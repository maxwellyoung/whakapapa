'use client'

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

// Sindre Sorhus-inspired: severe minimalism
// Only essential shortcuts, discoverable, consistent

type ShortcutHandler = () => void

interface Shortcut {
  key: string
  meta?: boolean
  shift?: boolean
  handler: ShortcutHandler
  description: string
}

const isInputElement = (el: Element | null): boolean => {
  if (!el) return false
  const tagName = el.tagName.toLowerCase()
  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    (el as HTMLElement).isContentEditable
  )
}

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (isInputElement(document.activeElement)) return

      for (const shortcut of shortcuts) {
        const metaMatch = shortcut.meta ? event.metaKey || event.ctrlKey : true
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase()

        if (metaMatch && shiftMatch && keyMatch) {
          event.preventDefault()
          shortcut.handler()
          return
        }
      }
    },
    [shortcuts]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

// Global app shortcuts hook
export function useAppShortcuts() {
  const router = useRouter()

  useKeyboardShortcuts([
    {
      key: 'p',
      meta: true,
      handler: () => router.push('/people'),
      description: 'Go to People',
    },
    {
      key: 't',
      meta: true,
      handler: () => router.push('/tree'),
      description: 'Go to Family Tree',
    },
    {
      key: 's',
      meta: true,
      shift: true,
      handler: () => router.push('/sources'),
      description: 'Go to Sources',
    },
    {
      key: 'n',
      meta: true,
      handler: () => router.push('/people/new'),
      description: 'Add new person',
    },
    {
      key: ',',
      meta: true,
      handler: () => router.push('/settings'),
      description: 'Settings',
    },
  ])
}

// Shortcut hint component
export function ShortcutHint({ keys }: { keys: string[] }) {
  return (
    <span className="ml-auto hidden items-center gap-0.5 text-xs text-muted-foreground sm:flex">
      {keys.map((key, i) => (
        <kbd
          key={i}
          className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]"
        >
          {key}
        </kbd>
      ))}
    </span>
  )
}
