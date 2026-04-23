'use client'

import { useState } from 'react'
import { Lock, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface SharePasswordGateProps {
  token: string
  initialError?: string
}

export function SharePasswordGate({ token, initialError }: SharePasswordGateProps) {
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(initialError || null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) return

    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/share/${token}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data?.success) {
        if (response.status === 429) {
          setError('Too many attempts. Please wait a minute and try again.')
        } else if (response.status === 503) {
          setError('This share link is temporarily unavailable. Please contact the person who shared it.')
        } else {
          setError('Incorrect password. Please try again.')
        }
        return
      }

      window.location.reload()
    } catch {
      setError('Unable to verify password right now. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100 dark:bg-stone-800">
            <Lock className="h-5 w-5 text-stone-600 dark:text-stone-300" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
              Password Required
            </h1>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              Enter the share password to continue.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Share password"
            autoFocus
            disabled={submitting}
          />
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
          <Button className="w-full" type="submit" disabled={submitting || !password.trim()}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              'Unlock'
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
